# # app/visitors/routes.py
# import os
# import shutil
# import time
# import uuid
# from datetime import date
# from flask import Blueprint, request, jsonify, current_app, send_from_directory
# from werkzeug.utils import secure_filename

# import cv2
# import numpy as np
# import albumentations as A
# from ultralytics import YOLO
# from deepface import DeepFace
# from qdrant_client import QdrantClient
# from qdrant_client.http import models as qmodels

# from ..extensions import db
# from ..middleware import require_csrf, require_login
# from ..models import VisitorDetails, VisitorImage
# from flask import current_app

# bp = Blueprint("visitors", __name__)

# # ========== Face Embedding Components ==========

# class FaceEmbedder:
#     """Embedding extractor using DeepFace with the required verbatim function"""
#     def __init__(self, model_name: str = "ArcFace") -> None:
#         self.model_name = model_name

#     def get_embedding(self, face_bgr):
#         # DeepFace expects RGB images
#         face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
#         face_rgb = cv2.resize(face_rgb, (112, 112))  # ArcFace expects 112x112
#         face_rgb = face_rgb / 255.0  # Optional: normalize

#         try:
#             result = DeepFace.represent(
#                 img_path=face_rgb,
#                 model_name=self.model_name,
#                 enforce_detection=False,
#                 detector_backend='skip'
#             )
#             return np.array(result[0]["embedding"], dtype=np.float32)
#         except Exception as e:
#             print(f"[ERROR] Failed to extract embedding: {e}")
#             return None


# class FacePipeline:
#     """Pipeline for face detection, augmentation, and embedding generation"""
#     def __init__(self) -> None:
#         # Load YOLO model from MODEL_PATH env (set in .env)
#         model_path = os.getenv("MODEL_PATH")
#         if not model_path or not os.path.isfile(model_path):
#             raise RuntimeError(f"YOLO model not found. Set MODEL_PATH in .env (current: {model_path})")
        
#         self.detector = YOLO(model_path)
#         self.embedder = FaceEmbedder()
#         self.augmentations = self._build_augmentations()
        
#         # Qdrant config from env
#         qdrant_url = os.getenv("QDRANT_URL", "http://qdrant:6333")
#         self.collection_name = os.getenv("COLLECTION_NAME", "faces")
#         self.qdrant = QdrantClient(url=qdrant_url)
#         self._ensure_collection()

#     def _ensure_collection(self) -> None:
#         """Create Qdrant collection if it doesn't exist"""
#         vector_params = qmodels.VectorParams(size=512, distance=qmodels.Distance.COSINE)
#         try:
#             self.qdrant.get_collection(self.collection_name)
#         except Exception:
#             try:
#                 self.qdrant.create_collection(self.collection_name, vectors_config=vector_params)
#             except Exception as exc:
#                 raise RuntimeError(f"Failed to create Qdrant collection {self.collection_name}") from exc

#     def _build_augmentations(self):
#         """Build 25 augmentation pipelines"""
#         augmenters = []
#         rotate_limits = [5, 10, 15, 20, 25]
#         shift_limits = [0.02, 0.04, 0.06, 0.08, 0.1]
#         scale_limits = [0.08, 0.12, 0.16, 0.2, 0.24]
        
#         for r_idx, rot in enumerate(rotate_limits):
#             for s_idx, shift in enumerate(shift_limits):
#                 scale = scale_limits[(r_idx + s_idx) % len(scale_limits)]
#                 augmenters.append(
#                     A.Compose([
#                         A.ShiftScaleRotate(
#                             shift_limit=shift,
#                             scale_limit=scale,
#                             rotate_limit=rot,
#                             border_mode=cv2.BORDER_REFLECT_101,
#                             p=1.0,
#                         ),
#                         A.HorizontalFlip(p=0.5),
#                         A.VerticalFlip(p=0.2),
#                         A.RandomBrightnessContrast(p=0.7),
#                         A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=15, val_shift_limit=10, p=0.6),
#                         A.GaussianBlur(blur_limit=(3, 5), p=0.5),
#                         A.GaussNoise(var_limit=(10.0, 40.0), p=0.5),
#                         A.CoarseDropout(max_holes=2, max_height=12, max_width=12, fill_value=0, p=0.3),
#                         A.Resize(112, 112),
#                     ])
#                 )
#         return augmenters  # len == 25

#     def _detect_faces(self, image_bgr):
#         """Detect faces using YOLO and return cropped face regions"""
#         detections = self.detector(image_bgr, verbose=False)
#         faces = []
#         for result in detections:
#             if not getattr(result, "boxes", None):
#                 continue
#             for box in result.boxes.xyxy.cpu().numpy().astype(int):
#                 x1, y1, x2, y2 = box.tolist()
#                 x1, y1 = max(0, x1), max(0, y1)
#                 x2, y2 = min(image_bgr.shape[1], x2), min(image_bgr.shape[0], y2)
#                 if x2 <= x1 or y2 <= y1:
#                     continue
#                 crop = image_bgr[y1:y2, x1:x2]
#                 if crop.size:
#                     faces.append(crop)
#         return faces

#     def _augment_face(self, face_bgr):
#         """Generate 25 augmented variants + original"""
#         augmented = [cv2.resize(face_bgr, (112, 112))]
#         for aug in self.augmentations:
#             transformed = aug(image=face_bgr)["image"]
#             augmented.append(transformed)
#         return augmented  # 26 total (original + 25 variants)

#     def process_image(self, aadhaar: str, image_bgr):
#         """Detect faces, augment, extract embeddings, and store in Qdrant"""
#         faces = self._detect_faces(image_bgr)
#         if not faces:
#             return {"status": "no_faces", "added_vectors": 0}, 422

#         points = []
#         # If multiple faces are detected in the frame, process each one.
#         # Each face will yield 25 augmented variants -> 25 embeddings per face.
#         # All embeddings are stored with the same `aadhaar` but include a
#         # `face_index` so they can be distinguished later if needed.
#         for face_idx, face in enumerate(faces):
#             for idx, variant in enumerate(self._augment_face(face)):
#                 embedding = self.embedder.get_embedding(variant)
#                 if embedding is None:
#                     continue
#                 points.append(
#                     qmodels.PointStruct(
#                         id=str(uuid.uuid4()),
#                         vector=embedding.tolist(),
#                         payload={
#                             "aadhaar": aadhaar,
#                             "face_index": face_idx,
#                             "variant": idx,
#                             "source": "registration",
#                         },
#                     )
#                 )
        
#         if not points:
#             return {"status": "no_embeddings", "added_vectors": 0}, 500

#         self.qdrant.upsert(collection_name=self.collection_name, points=points)
#         return {"status": "ok", "added_vectors": len(points), "aadhaar": aadhaar}, 200


# # Initialize pipeline once (lazy-loaded on first request)
# _pipeline = None

# def get_pipeline():
#     global _pipeline
#     if _pipeline is None:
#         _pipeline = FacePipeline()
#     return _pipeline

# # ========== End Face Embedding Components ==========

# # ---------- Helpers

# def _allowed(filename: str) -> bool:
#     ext = (filename.rsplit(".", 1)[-1] or "").lower()
#     return ext in current_app.config.get("ALLOWED_IMAGE_EXTS", {"jpg", "jpeg", "png"})

# def _visitor_dir(aadhaar: str) -> str:
#     """
#     Filesystem path where this visitor's images are stored:
#       <UPLOAD_FOLDER>/visitors/<aadhaar>/
#     """
#     root = current_app.config["UPLOAD_FOLDER"]
#     path = os.path.join(root, "visitors", aadhaar)
#     os.makedirs(path, exist_ok=True)
#     return path

# def _to_date(s):
#     try:
#         return date.fromisoformat(s) if s else None
#     except Exception:
#         return None

# # ---------- Suggest by Aadhaar prefix

# @bp.get("/api/visitors/suggest")
# @require_login
# def suggest_visitors():
#     q = (request.args.get("q") or "").strip()
#     if not q:
#         return jsonify([]), 200
#     rows = (
#         VisitorDetails.query
#         .filter(VisitorDetails.aadhaar_id.like(f"{q}%"))
#         .order_by(VisitorDetails.aadhaar_id.asc())
#         .limit(10)
#         .all()
#     )
#     return jsonify(
#         [{"aadhaar_id": r.aadhaar_id, "full_name": r.full_name} for r in rows]
#     ), 200

# # ---------- Fetch full visitor (metadata + image map)

# @bp.get("/api/visitors/<string:aadhaar_id>")
# @require_login
# def get_visitor(aadhaar_id):
#     v = VisitorDetails.query.get(aadhaar_id)
#     if not v:
#         return jsonify({"exists": False}), 200

#     # InstrumentedList is iterable; don't call .all()
#     images = {img.angle: img.file_path for img in v.images}

#     return jsonify({
#         "exists": True,
#         "visitor": {
#             "aadhaar_id": v.aadhaar_id,
#             "full_name": v.full_name,
#             "gender": v.gender,
#             "phone_number": v.phone_number,
#             "location": v.location,
#             "purpose_of_visit": v.purpose_of_visit,
#             "host_to_visit": v.host_to_visit,
#             "floors": v.floors or [],
#             "towers": v.towers or [],
#             "duration_from": v.duration_from.isoformat() if v.duration_from else None,
#             "duration_to": v.duration_to.isoformat() if v.duration_to else None,
#         },
#         "images": images,
#     }), 200

# # ---------- Upload single image (straight)

# ALLOWED_ANGLES = {"straight"}

# @bp.post("/api/visitors/<string:aadhaar_id>/photos/<string:angle>")
# @require_login
# @require_csrf
# def upload_photo(aadhaar_id, angle):
#     angle = angle.lower()
#     if angle not in ALLOWED_ANGLES:
#         return jsonify({"message": "Invalid angle"}), 400

#     file = request.files.get("file")
#     if not file:
#         return jsonify({"message": "No file"}), 400
#     if not _allowed(file.filename):
#         return jsonify({"message": "Unsupported file type"}), 400

#     # Make sure visitor exists (create stub if not yet saved)
#     v = VisitorDetails.query.get(aadhaar_id)
#     if not v:
#         # DB enforces non-null full_name; create a placeholder name so insert succeeds.
#         v = VisitorDetails(aadhaar_id=aadhaar_id, full_name=aadhaar_id)
#         db.session.add(v)

#     # Save to <UPLOAD_FOLDER>/visitors/<aadhaar>/<angle>_<ts>.jpg
#     subdir = _visitor_dir(aadhaar_id)
#     ts = int(time.time())
#     fname = secure_filename(f"{angle}_{ts}.jpg")
#     fpath = os.path.join(subdir, fname)
#     file.save(fpath)

#     # Browser URL must match the serving route below
#     rel_url = f"/uploads/visitors/{aadhaar_id}/{fname}"

#     # Upsert image record
#     img = VisitorImage.query.filter_by(aadhaar_id=aadhaar_id, angle=angle).first()
#     if img:
#         img.file_path = rel_url
#     else:
#         img = VisitorImage(aadhaar_id=aadhaar_id, angle=angle, file_path=rel_url)
#         db.session.add(img)

#     db.session.commit()
#     return jsonify({"url": rel_url}), 201

# # ---------- Generate face embeddings and store in Qdrant

# @bp.post("/api/visitors/<string:aadhaar_id>/embeddings")
# @require_login
# @require_csrf
# def generate_embeddings(aadhaar_id):
#     """
#     Generate face embeddings from uploaded image and store in Qdrant.
#     Accepts multipart/form-data with 'file' field.
#     Returns JSON: {"status": "ok", "added_vectors": N, "aadhaar": "<aadhaar>"}
#     """
#     file = request.files.get("file")
#     if not file:
#         return jsonify({"status": "no_file", "message": "No file provided"}), 400
    
#     # Read image bytes
#     try:
#         img_bytes = file.read()
#         arr = np.frombuffer(img_bytes, np.uint8)
#         image_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
#         if image_bgr is None:
#             return jsonify({"status": "invalid_image", "message": "Could not decode image"}), 400
#     except Exception as e:
#         print(f"Error reading image: {e}")
#         return jsonify({"status": "error", "message": "Failed to read image"}), 400
    
#     # Process image through pipeline
#     try:
#         pipeline = get_pipeline()
#         result, status_code = pipeline.process_image(aadhaar_id, image_bgr)
#         return jsonify(result), status_code
#     except Exception as e:
#         print(f"Error processing embeddings: {e}")
#         return jsonify({"status": "error", "message": str(e)}), 500

# # ---------- Dev/static serving of uploaded files
# # NOTE: this route path MUST match the `rel_url` we return from upload_photo.

# @bp.get("/uploads/visitors/<string:aadhaar>/<path:filename>")
# def serve_upload(aadhaar, filename):
#     return send_from_directory(_visitor_dir(aadhaar), filename)

# # ---------- Create/Update visitor metadata (upsert)

# @bp.post("/api/visitors")
# @require_login
# @require_csrf
# def upsert_visitor():
#     data = request.get_json() or {}
#     aadhaar = (data.get("aadhaar_id") or "").strip()
#     if not aadhaar or len(aadhaar) != 12 or not aadhaar.isdigit():
#         return jsonify({"message": "Invalid aadhaar_id"}), 400

#     name = (data.get("full_name") or "").strip()
#     if not name:
#         return jsonify({"message": "Full name is required"}), 400

#     v = VisitorDetails.query.get(aadhaar)
#     creating = False
#     if not v:
#         v = VisitorDetails(aadhaar_id=aadhaar, full_name=name)
#         db.session.add(v)
#         creating = True

#     v.full_name        = name
#     v.gender           = data.get("gender")
#     v.phone_number     = data.get("phone_number")
#     v.location         = data.get("location")
#     v.purpose_of_visit = data.get("purpose_of_visit")
#     v.host_to_visit    = data.get("host_to_visit")
#     v.floors           = data.get("floors") or []
#     v.towers           = data.get("towers") or []
#     v.duration_from    = _to_date(data.get("duration_from"))
#     v.duration_to      = _to_date(data.get("duration_to"))

#     db.session.commit()
#     _emit_visitor_count()
#     return jsonify(v.to_dict()), (201 if creating else 200)

# # ---------- Get latest image for a visitor

# @bp.get("/api/visitors/<string:visitor_id>/latest-image")
# @require_login
# def get_latest_image(visitor_id):
#     """Get the latest image URL for a visitor"""
#     try:
#         # Get the latest image for this visitor
#         latest_image = (
#             VisitorImage.query
#             .filter_by(aadhaar_id=visitor_id)
#             .order_by(VisitorImage.created_at.desc())
#             .first()
#         )
        
#         if not latest_image:
#             return jsonify({"image_url": None}), 404
            
#         return jsonify({"image_url": latest_image.file_path}), 200
        
#     except Exception as e:
#         print(f"Error fetching latest image for visitor {visitor_id}: {e}")
#         return jsonify({"message": "Failed to fetch image"}), 500

# # ---------- Delete visitor

# @bp.delete("/api/visitors/<string:visitor_id>")
# @require_login
# @require_csrf
# def delete_visitor(visitor_id):
#     """Delete a visitor and all associated images"""
#     try:
#         # Find the visitor by aadhaar_id (since that's what we use as ID)
#         visitor = VisitorDetails.query.get(visitor_id)
#         if not visitor:
#             return jsonify({"message": "Visitor not found"}), 404
        
#         # Delete associated image files from filesystem
#         visitor_dir_path = _visitor_dir(visitor_id)
#         if os.path.exists(visitor_dir_path):
#             import shutil
#             try:
#                 shutil.rmtree(visitor_dir_path)
#             except Exception as e:
#                 print(f"Failed to delete visitor directory {visitor_dir_path}: {e}")
        
#         # Delete from database (cascade will handle visitor_images)
#         db.session.delete(visitor)
#         db.session.commit()
        
#         # Emit updated count
#         _emit_visitor_count()
        
#         return jsonify({"message": "Visitor deleted successfully"}), 200
        
#     except Exception as e:
#         print(f"Error deleting visitor {visitor_id}: {e}")
#         db.session.rollback()
#         return jsonify({"message": "Failed to delete visitor"}), 500

# # ---------- Meta lists (for dropdowns)

# @bp.get("/api/meta/floors")
# @require_login
# def list_floors():
#     # G + 1..15
#     return jsonify(["G"] + [str(i) for i in range(1, 16)]), 200

# @bp.get("/api/meta/towers")
# @require_login
# def list_towers():
#     return jsonify(["A", "B", "C", "D"]), 200

# # ---------- Preview payload (for print slip)

# @bp.get("/api/visitors/<string:aadhaar_id>/preview")
# @require_login
# def preview(aadhaar_id):
#     v = VisitorDetails.query.get_or_404(aadhaar_id)
#     straight = VisitorImage.query.filter_by(aadhaar_id=aadhaar_id, angle="straight").first()
#     return jsonify({
#         "aadhaar_id": v.aadhaar_id,
#         "full_name": v.full_name,
#         "phone_number": v.phone_number,
#         "location": v.location,
#         "host_to_visit": v.host_to_visit,
#         "floors": v.floors or [],
#         "towers": v.towers or [],
#         "purpose_of_visit": v.purpose_of_visit,
#         "valid_till": v.duration_to.isoformat() if v.duration_to else None,
#         "image_straight": straight.file_path if straight else None
#     }), 200

# # def _emit_visitor_count():
# #     total = db.session.query(VisitorDetails).count()
# #     # ❌ broadcast kwarg was removed in recent socketio versions
# #     # Emitting to the namespace sends to all clients in that namespace
# #     socketio.emit("visitor_count", {"total": total}, namespace="/stats")

# def _emit_visitor_count():
#     total = db.session.query(VisitorDetails).count()

#     # Use the instance registered on the app if present
#     sio = current_app.extensions.get("socketio")
#     if not sio:                            # Socket.IO not running → skip
#         current_app.logger.debug("SocketIO not initialized; skipping visitor_count emit")
#         return

#     try:
#         sio.emit("visitor_count", {"total": total}, namespace="/stats")
#     except Exception as e:
#         print(f"SocketIO emit failed: {e}")


# # Note: face registration endpoints and imports removed per revert request

# # (No generic list endpoint in original code.)

# Create a dummy blueprint for compatibility
from flask import Blueprint
bp = Blueprint("visitors", __name__)
