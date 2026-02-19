# app/utils/face_enrollment_background.py

import os
import io
import base64
import requests
import numpy as np
import cv2
from PIL import Image
import albumentations as A


from app.utils.detector import ObjectDetector
from app.utils.arcface import FaceEmbedder
from app.utils.logger import setup_logger

logger = setup_logger("face_enrollment_background")

# Directories for saving annotated + best faces
ANNOTATED_DIR = os.environ.get("ANNOTATED_DIR", "annotated_images")
BEST_FACE_DIR = os.environ.get("BEST_FACE_DIR", "best_faces")
os.makedirs(ANNOTATED_DIR, exist_ok=True)
os.makedirs(BEST_FACE_DIR, exist_ok=True)

# Qdrant ingestion API
FASTAPI_EMBEDDING_URL = os.environ.get("FASTAPI_EMBEDDING_URL", "http://qdrant_api:8000/embedding_AMS")

# Heavy models (lazy load on first use)
_detector = None
_embedder = None

def get_detector():
    """Lazy load detector on first use"""
    global _detector
    if _detector is None:
        logger.info("Initializing ObjectDetector...")
        _detector = ObjectDetector()
    return _detector

def get_embedder():
    """Lazy load embedder on first use"""
    global _embedder
    if _embedder is None:
        logger.info("Initializing FaceEmbedder...")
        _embedder = FaceEmbedder()
    return _embedder


# --------------------------- Utility Functions ---------------------------

def calculate_brightness_bgr(image_bgr):
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray))

def calculate_sharpness_bgr(image_bgr):
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

def l2_normalize(x, eps=1e-12):
    n = np.linalg.norm(x)
    return x / max(n, eps)

def build_augmentor():
    return A.Compose([
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.20, contrast_limit=0.20, p=0.7),
        A.ShiftScaleRotate(shift_limit=0.02, scale_limit=0.05, rotate_limit=8,
                           border_mode=cv2.BORDER_REFLECT_101, p=0.5),
    ], p=1.0)

AUGMENTOR = build_augmentor()

def generate_augmented_faces(image_bgr, num_variants=25):
    return [AUGMENTOR(image=image_bgr)["image"] for _ in range(num_variants)]


def aggregate_image_to_prototype(face_bgr, num_variants=25, min_keep=5, hard_sim_floor=0.55):
    aug_imgs = generate_augmented_faces(face_bgr, num_variants=num_variants)

    embs, brightness, sharpness = [], [], []

    for img_bgr in aug_imgs:
        emb = get_embedder().get_embedding(img_bgr)
        if emb is None or isinstance(emb, (list, tuple)):
            continue
        emb = emb.astype(np.float32).reshape(-1)
        if emb.shape[0] != 512:
            continue

        embs.append(l2_normalize(emb))
        brightness.append(calculate_brightness_bgr(img_bgr))
        sharpness.append(calculate_sharpness_bgr(img_bgr))

    if not embs:
        return None

    embs = np.vstack(embs)
    c0 = l2_normalize(np.mean(embs, axis=0))
    sims = embs @ c0
    mu, sigma = float(np.mean(sims)), float(np.std(sims))
    thr = max(mu - 2 * sigma, hard_sim_floor)

    keep_idx = np.where(sims >= thr)[0].tolist() or np.argsort(sims)[-min_keep:].tolist()
    embs_kept = embs[keep_idx]

    b = np.array(brightness)[keep_idx]
    s = np.array(sharpness)[keep_idx]

    def norm(x):
        lo, hi = np.percentile(x, 5), np.percentile(x, 95)
        if hi <= lo:
            return np.ones_like(x)
        y = (x - lo) / (hi - lo)
        return np.clip(y, 0, 1)

    q = 0.5 * norm(b) + 0.5 * norm(s)
    q_sum = float(np.sum(q))
    q = np.ones_like(q) / len(q) if q_sum <= 1e-9 else q / q_sum

    return l2_normalize(np.sum(embs_kept * q[:, None], axis=0))


# --------------------------- Background Task Entry ---------------------------

def process_face_enrollment_background(employee_id: str, img_b64: str):
    """
    Simplified 8-step face enrollment pipeline:
    1. Decode image
    2. Detect face
    3. Normalize bounding box
    4. Crop face region
    5. Augment face (25 variations)
    6. Generate embeddings & filter best ones
    7. Build prototype embedding (weighted average)
    8. Push embedding to Qdrant & update DB
    """

    logger.info(f"Starting face enrollment (async) for {employee_id}")

    try:
        # --------------------- Step 1: Decode Image ----------------------
        img_bytes = base64.b64decode(img_b64)
        pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        frame_rgb = np.array(pil)

        # --------------------- Step 2: Detect Faces ----------------------
        bboxes = get_detector().detect(frame_rgb)
        if not bboxes:
            logger.warning(f"No faces detected for {employee_id}")
            return

        # --------------------- Step 3: Normalize Box ---------------------
        # Use the FIRST detected bounding box
        bbox = bboxes[0]

        if not bbox or len(bbox) != 4:
            return

        x_center, y_center, w, h = map(int, bbox)
        x1 = max(0, int(x_center - w / 2))
        y1 = max(0, int(y_center - h / 2))
        x2 = int(x_center + w / 2)
        y2 = int(y_center + h / 2)

        # # Validate bounding box
        # if x1 <= x0 or y1 <= y0:
        #     logger.warning(f"Invalid bounding box for {employee_id}: {x0, y0, x1, y1}")
        #     return


        # --------------------- Step 4: Crop Face -------------------------
        face_rgb = frame_rgb[y1:y2, x1:x2]
        if face_rgb.size == 0:
            logger.warning(f"Invalid face crop for {employee_id}")
            return

        face_bgr = cv2.cvtColor(face_rgb, cv2.COLOR_RGB2BGR)

        # --------------------- Step 5: Augment Face -----------------------
        aug_imgs = generate_augmented_faces(face_bgr, num_variants=25)

        # --------------------- Step 6: Embeddings + Filtering -------------
        embs, br_list, sh_list = [], [], []

        for img_bgr in aug_imgs:
            emb = get_embedder().get_embedding(img_bgr)
            if emb is None or not isinstance(emb, np.ndarray):
                continue

            emb = emb.astype(np.float32).reshape(-1)
            if emb.shape[0] != 512:
                continue

            emb = l2_normalize(emb)
            embs.append(emb)
            br_list.append(calculate_brightness_bgr(img_bgr))
            sh_list.append(calculate_sharpness_bgr(img_bgr))

        if not embs:
            logger.warning(f"No valid embeddings for {employee_id}")
            return

        embs = np.vstack(embs)
        c0 = l2_normalize(np.mean(embs, axis=0))
        sims = embs @ c0

        # simple consistency filter
        mu, sigma = float(np.mean(sims)), float(np.std(sims))
        thr = max(mu - 2 * sigma, 0.55)
        keep_idx = np.where(sims >= thr)[0]
        embs_kept = embs[keep_idx]

        b = np.array(br_list)[keep_idx]
        s = np.array(sh_list)[keep_idx]

        # normalize scores between 0-1
        def norm(x):
            lo, hi = np.percentile(x, 5), np.percentile(x, 95)
            if hi <= lo:
                return np.ones_like(x)
            return np.clip((x - lo) / (hi - lo), 0, 1)

        # --------------------- Step 7: Prototype Embedding ----------------
        q = 0.5 * norm(b) + 0.5 * norm(s)
        q_sum = float(np.sum(q))
        q = q / q_sum if q_sum > 1e-9 else np.ones_like(q) / len(q)

        proto = l2_normalize(np.sum(embs_kept * q[:, None], axis=0))

        # --------------------- Step 8: Push to Qdrant ----------------------
        try:
            r = requests.post(
                FASTAPI_EMBEDDING_URL,
                json={"employee_id": employee_id, "embedding": proto.tolist()},
                timeout=5
            )
            r.raise_for_status()
        except Exception:
            logger.exception(f"Failed to push embedding for {employee_id}")
            return

        # # Update DB inside app context
        # emp = EmployeeMaster.query.get(employee_id)
        # if emp:
        #     emp.face_registered = True
        #     db.session.add(emp)
        #     db.session.commit()

        # logger.info(f"Enrollment complete for {employee_id}")

    except Exception as e:
        logger.exception(f"Unhandled exception during face enrolllment for {employee_id}: {e}")

        
# --------------------------- Old Implementation (Commented Out) ---------------------------

# def process_face_enrollment_background(employee_id: str, img_b64: str):
#     """
#     Runs entirely in background worker thread.
#     Does:
#     - decode image
#     - detect face
#     - crop
#     - save annotated
#     - create best face
#     - augment, embed, prototype
#     - push to Qdrant
#     - update EmployeeMaster
#     """

#     logger.info(f"Starting face enrollment (async) for {employee_id}")

#     try:
#         # Decode
#         img_bytes = base64.b64decode(img_b64)
#         pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
#         frame_rgb = np.array(pil)

#         H, W, _ = frame_rgb.shape
#         bboxes = detector.detect(frame_rgb)

#         if not bboxes:
#             logger.warning(f"No faces detected for {employee_id}")
#             return

#         processed_bboxes = []
#         for bbox in bboxes:
#             if len(bbox) == 4:
#                 x0, y0, x1, y1 = bbox
#                 if x1 > x0 and y1 > y0:
#                     processed_bboxes.append([int(x0), int(y0), int(x1), int(y1)])
#                 else:
#                     xc, yc, w, h = bbox
#                     x1 = int(xc + w / 2)
#                     y1 = int(yc + h / 2)
#                     x0 = int(xc - w / 2)
#                     y0 = int(yc - h / 2)
#                     processed_bboxes.append([
#                         max(0, x0), max(0, y0),
#                         min(W - 1, x1), min(H - 1, y1)
#                     ])

#         if not processed_bboxes:
#             logger.warning(f"No valid face boxes for {employee_id}")
#             return

#         areas = [((x1 - x0) * (y1 - y0), (x0, y0, x1, y1)) for (x0, y0, x1, y1) in processed_bboxes]
#         areas.sort(key=lambda x: x[0], reverse=True)
#         x0, y0, x1, y1 = areas[0][1]

#         face_rgb = frame_rgb[y0:y1, x0:x1]
#         if face_rgb.size == 0:
#             logger.warning(f"Zero area face crop for {employee_id}")
#             return

#         # Save annotated image
#         annotated = frame_rgb.copy()
#         cv2.rectangle(annotated, (x0, y0), (x1, y1), (0,255,0), 2)
#         annotated_bgr = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)
#         ann_path = os.path.join(ANNOTATED_DIR, f"{employee_id}.jpg")
#         cv2.imwrite(ann_path, annotated_bgr)

#         # Save best face
#         face_bgr = cv2.cvtColor(face_rgb, cv2.COLOR_RGB2BGR)
#         best_face_path = os.path.join(BEST_FACE_DIR, f"{employee_id}.jpg")
#         cv2.imwrite(best_face_path, face_bgr)

#         proto = aggregate_image_to_prototype(face_bgr)
#         if proto is None:
#             logger.warning(f"Embedding failed for {employee_id}")
#             return

#         # Push to Qdrant
#         try:
#             r = requests.post(
#                 FASTAPI_EMBEDDING_URL,
#                 json={"employee_id": employee_id, "embedding": proto.tolist()},
#                 timeout=5
#             )
#             r.raise_for_status()
#         except Exception:
#             logger.exception(f"Failed to push embedding for {employee_id}")
#             return

#         # Update DB
#         emp = EmployeeMaster.query.get(employee_id)
#         if emp:
#             emp.face_registered = True
#             emp.best_face_path = best_face_path
#             db.session.add(emp)
#             db.session.commit()

#         logger.info(f"Enrollment complete for {employee_id}")

#     except Exception as e:
#         logger.exception(f"Unhandled exception during face enrollment for {employee_id}: {e}")
