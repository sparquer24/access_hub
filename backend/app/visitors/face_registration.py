# import os
# import io
# import time
# import uuid
# import logging
# from datetime import datetime, timezone
# from typing import List, Tuple, Optional

# import numpy as np
# import cv2

# try:
#     from ultralytics import YOLO
# except Exception:
#     YOLO = None

# try:
#     from deepface import DeepFace
# except Exception:
#     DeepFace = None

# try:
#     from qdrant_client import QdrantClient
#     from qdrant_client.http.models import Distance, VectorParams, PointStruct
# except Exception:
#     QdrantClient = None

# from flask import current_app

# logger = logging.getLogger("face_registration")

# # Environment variables
# # MODEL_PATH should be an env var name. Default to models/face_detector.pt relative to backend cwd.
# MODEL_PATH = os.getenv("MODEL_PATH", "models/face_detector.pt")
# QDRANT_API_URL = os.getenv("QDRANT_API_URL", "http://qdrant_api:8000/embedding")
# QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant-api-container")
# QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
# COLLECTION_NAME = os.getenv("COLLECTION_NAME", "vector-embeddings")
# VECTOR_SIZE = int(os.getenv("VECTOR_SIZE", 512))

# # Device selection
# USE_CUDA = False
# try:
#     import torch
#     USE_CUDA = torch.cuda.is_available()
# except Exception:
#     USE_CUDA = False

# DEVICE = "cuda" if USE_CUDA else "cpu"

# # Load YOLO model and DeepFace model at import time
# _yolo_model = None
# _qdrant = None

# def init_models():
#     global _yolo_model, _qdrant
#     if YOLO is None:
#         logger.warning("ultralytics.YOLO not available")
#     else:
#         try:
#             _yolo_model = YOLO(MODEL_PATH)
#             # set device
#             _yolo_model.to(DEVICE)
#             logger.info(f"Loaded YOLO model from {MODEL_PATH} on {DEVICE}")
#         except Exception as e:
#             logger.exception("Failed to load YOLO model: %s", e)

#     if DeepFace is None:
#         logger.warning("DeepFace not available")
#     else:
#         # DeepFace loads models lazily on analyze/call
#         logger.info("DeepFace available")

#     if QdrantClient is None:
#         logger.warning("qdrant-client not available")
#     else:
#         try:
#             _qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
#             # ensure collection exists
#             try:
#                 _qdrant.get_collection(COLLECTION_NAME)
#             except Exception:
#                 _qdrant.recreate_collection(collection_name=COLLECTION_NAME, vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE))
#             logger.info("Qdrant client initialized")
#         except Exception as e:
#             logger.exception("Failed to initialize Qdrant client: %s", e)


# def _read_image_bytes_from_path(path: str) -> Optional[bytes]:
#     """Read file from upload folder path (relative to UPLOAD_FOLDER). Return bytes or None"""
#     try:
#         # path is like /uploads/visitors/<aadhaar>/filename.jpg or a relative filesystem path
#         upload_root = current_app.config.get("UPLOAD_FOLDER", ".")
#         if path.startswith("/") or path.startswith("\\"):
#             # strip leading slash/backslash
#             rel = path.lstrip("/\\")
#             # stored rel is '/uploads/visitors/...'; avoid joining upload_root + 'uploads/...'
#             if rel.startswith("uploads/"):
#                 rel = rel[len("uploads/"):]
#             # Normalize separators and join with upload root
#             rel = os.path.normpath(rel)
#             fs_path = os.path.join(upload_root, rel)
#         else:
#             # If a relative path was stored without leading slash, it may already be relative to UPLOAD_FOLDER
#             # Normalize and, if it already begins with 'visitors', join with upload_root
#             rel = os.path.normpath(path)
#             if rel.startswith("visitors") or rel.startswith(os.path.join("visitors")):
#                 fs_path = os.path.join(upload_root, rel)
#             else:
#                 # otherwise treat as absolute/local path
#                 fs_path = rel
#         with open(fs_path, "rb") as f:
#             return f.read()
#     except Exception as e:
#         logger.exception("Failed to read image bytes from %s: %s", path, e)
#         return None


# def _detect_faces(image_bgr: np.ndarray) -> List[dict]:
#     """Run YOLO detection and return list of detections with bbox (x1,y1,x2,y2) and conf."""
#     if _yolo_model is None:
#         raise RuntimeError("YOLO model not loaded")

#     # ultralytics YOLO accepts BGR or RGB depending; convert to RGB
#     img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
#     results = _yolo_model.predict(source=img_rgb, imgsz=640, conf=0.4, device=DEVICE, verbose=False)
#     dets = []
#     for res in results:
#         boxes = getattr(res, 'boxes', None)
#         if boxes is None:
#             continue
#         for box in boxes:
#             try:
#                 xyxy = box.xyxy[0].cpu().numpy() if hasattr(box.xyxy, 'cpu') else box.xyxy[0].numpy()
#                 conf = float(box.conf[0]) if hasattr(box, 'conf') else float(box.conf)
#             except Exception:
#                 # fallback
#                 data = box.xyxy
#                 xyxy = np.array([float(x) for x in data])
#                 conf = float(box.conf)
#             x1, y1, x2, y2 = [int(round(float(v))) for v in xyxy]
#             dets.append({"bbox": (x1, y1, x2, y2), "conf": conf})
#     return dets


# def _crop_with_margin(img: np.ndarray, bbox: Tuple[int, int, int, int], margin: float = 0.12) -> np.ndarray:
#     h, w = img.shape[:2]
#     x1, y1, x2, y2 = bbox
#     bw = x2 - x1
#     bh = y2 - y1
#     dx = int(round(bw * margin))
#     dy = int(round(bh * margin))
#     x1c = max(0, x1 - dx)
#     y1c = max(0, y1 - dy)
#     x2c = min(w, x2 + dx)
#     y2c = min(h, y2 + dy)
#     if x2c <= x1c or y2c <= y1c:
#         return img[y1:y2, x1:x2]
#     return img[y1c:y2c, x1c:x2c]


# def _augmentations(face_bgr: np.ndarray) -> List[Tuple[str, np.ndarray]]:
#     """Produce deterministic augmentations: original, hflip, rot+10, rot-10, bright_up, gauss_noise"""
#     out = []
#     out.append(("original", face_bgr.copy()))
#     # horizontal flip
#     out.append(("hflip", cv2.flip(face_bgr, 1)))
#     # rotations
#     def rotate(img, angle):
#         h, w = img.shape[:2]
#         M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1.0)
#         return cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
#     out.append(("rotate_p10", rotate(face_bgr, 10)))
#     out.append(("rotate_m10", rotate(face_bgr, -10)))
#     # brightness up
#     hsv = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
#     hsv[:,:,2] = np.clip(hsv[:,:,2] * 1.15, 0, 255)
#     bright = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
#     out.append(("brightness_up", bright))
#     # gaussian noise
#     noise = face_bgr.copy().astype(np.float32)
#     noise += np.random.normal(0, 5, noise.shape)
#     noise = np.clip(noise, 0, 255).astype(np.uint8)
#     out.append(("gauss_noise", noise))
#     return out


# def _compute_embedding(face_bgr: np.ndarray) -> np.ndarray:
#     # DeepFace expects RGB and will resize, but we will do explicit resize to 112x112
#     if DeepFace is None:
#         raise RuntimeError("DeepFace not available")
#     face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
#     face_rgb = cv2.resize(face_rgb, (112, 112))
#     face_rgb = face_rgb.astype("float32") / 255.0
#     # DeepFace.represent returns list or np.array; use model_name ArcFace, detector_backend skip
#     rep = DeepFace.represent(img_path = face_rgb, model_name = "ArcFace", detector_backend = "skip", enforce_detection = False)
#     # DeepFace.represent may return nested structure; try to get vector
#     if isinstance(rep, list) and len(rep) > 0:
#         emb = np.asarray(rep[0], dtype=np.float32)
#     else:
#         emb = np.asarray(rep, dtype=np.float32)
#     if emb.ndim != 1:
#         emb = emb.flatten()
#     if emb.shape[0] != VECTOR_SIZE:
#         raise ValueError(f"Embedding size {emb.shape[0]} != expected {VECTOR_SIZE}")
#     # L2 normalize
#     norm = np.linalg.norm(emb)
#     if norm > 0:
#         emb = emb / norm
#     return emb


# def _ensure_qdrant_collection():
#     if _qdrant is None:
#         raise RuntimeError("Qdrant client not initialized")
#     try:
#         _qdrant.get_collection(COLLECTION_NAME)
#     except Exception:
#         _qdrant.recreate_collection(collection_name=COLLECTION_NAME, vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE))


# def upsert_embeddings(aadhaar_no: str, visitor_id: str, image_id: Optional[str], image_bytes: bytes):
#     """Main flow: detect -> crop -> augment -> embed -> upsert. Returns list of point_ids."""
#     t0 = time.time()
#     # load image bytes into BGR numpy
#     nparr = np.frombuffer(image_bytes, np.uint8)
#     img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#     if img_bgr is None:
#         raise ValueError("Failed to decode image bytes")

#     detect_t0 = time.time()
#     dets = _detect_faces(img_bgr)
#     detect_t1 = time.time()
#     logger.info("Detect time: %.3f s, dets: %d", detect_t1-detect_t0, len(dets))

#     if not dets:
#         return []

#     # choose best by confidence
#     best = max(dets, key=lambda d: d.get("conf", 0.0))
#     bbox = best["bbox"]
#     # crop with margin
#     crop_t0 = time.time()
#     face = _crop_with_margin(img_bgr, bbox, margin=0.12)
#     crop_t1 = time.time()
#     logger.info("Crop time: %.3f s", crop_t1-crop_t0)

#     # augment
#     aug_t0 = time.time()
#     aug_list = _augmentations(face)
#     aug_t1 = time.time()
#     logger.info("Augment time: %.3f s, augs: %d", aug_t1-aug_t0, len(aug_list))

#     # embeddings
#     embed_t0 = time.time()
#     embs = []
#     names = []
#     for name, img in aug_list:
#         try:
#             emb = _compute_embedding(img)
#         except Exception as e:
#             logger.exception("Embedding failed for %s: %s", name, e)
#             continue
#         embs.append(emb)
#         names.append(name)
#     embed_t1 = time.time()
#     logger.info("Embed time: %.3f s, valid: %d", embed_t1-embed_t0, len(embs))

#     if len(embs) == 0:
#         return []

#     # prepare points
#     point_ids = []
#     points = []
#     for emb, src in zip(embs, names):
#         pid = str(uuid.uuid4())
#         payload = {
#             "aadhaar_no": aadhaar_no,
#             "visitor_id": visitor_id,
#             "image_id": image_id,
#             "embedding_source": src,
#             "bbox_xyxy": bbox,
#             "created_at": datetime.now(timezone.utc).isoformat(),
#         }
#         points.append(PointStruct(id=pid, vector=emb.tolist(), payload=payload))
#         point_ids.append(pid)

#     # upsert
#     upsert_t0 = time.time()
#     if _qdrant is None:
#         raise RuntimeError("Qdrant client not initialized")
#     try:
#         _qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
#     except Exception as e:
#         logger.exception("Qdrant upsert failed: %s", e)
#         raise
#     upsert_t1 = time.time()
#     logger.info("Upsert time: %.3f s", upsert_t1-upsert_t0)

#     total_time = time.time()-t0
#     logger.info("Total time: %.3f s", total_time)

#     # Success log for audit: show which aadhaar/image got what point ids
#     try:
#         logger.info("Embeddings upserted for aadhaar=%s visitor_id=%s image_id=%s point_count=%d point_ids=%s",
#                     aadhaar_no, visitor_id, image_id, len(point_ids), ",".join(point_ids))
#     except Exception:
#         # avoid any logging errors from breaking flow
#         logger.info("Embeddings upserted (failed to format point ids)")
#     return point_ids


# # initialize on import
# try:
#     init_models()
# except Exception:
#     logger.exception("Model initialization failed")
