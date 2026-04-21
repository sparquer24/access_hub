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

logger = setup_logger("face_enrollment_background_vms")

ANNOTATED_DIR = os.environ.get("ANNOTATED_DIR", "annotated_images")
BEST_FACE_DIR = os.environ.get("BEST_FACE_DIR", "best_faces")
os.makedirs(ANNOTATED_DIR, exist_ok=True)
os.makedirs(BEST_FACE_DIR, exist_ok=True)


FASTAPI_EMBEDDING_URL_VMS = os.environ.get(
    "FASTAPI_EMBEDDING_URL_VMS",
    "http://localhost:8000/embedding",
)

_detector = None
_embedder = None


def get_detector():
    global _detector
    if _detector is None:
        logger.info("Initializing ObjectDetector...")
        _detector = ObjectDetector()
    return _detector


def get_embedder():
    global _embedder
    if _embedder is None:
        logger.info("Initializing FaceEmbedder...")
        _embedder = FaceEmbedder()
    return _embedder


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
    return A.Compose(
        [
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(
                brightness_limit=0.20, contrast_limit=0.20, p=0.7
            ),
            A.ShiftScaleRotate(
                shift_limit=0.02,
                scale_limit=0.05,
                rotate_limit=8,
                border_mode=cv2.BORDER_REFLECT_101,
                p=0.5,
            ),
        ],
        p=1.0,
    )


AUGMENTOR = build_augmentor()


def generate_augmented_faces(image_bgr, num_variants=25):
    return [AUGMENTOR(image=image_bgr)["image"] for _ in range(num_variants)]


def process_face_enrollment_background_vms(entity_id: str, img_b64: str):
    logger.info(f"[ENROLL_VMS] Starting enrollment for visitor_id={entity_id}")
    logger.info(f"[ENROLL_VMS] FASTAPI_EMBEDDING_URL_VMS = {FASTAPI_EMBEDDING_URL_VMS}")

    try:
        if img_b64.startswith("data:"):
            img_b64 = img_b64.split(",", 1)[1]

        img_bytes = base64.b64decode(img_b64)
        pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        frame_rgb = np.array(pil)
        logger.info(f"[ENROLL_VMS] Step 1 OK - Decoded image. shape={frame_rgb.shape}")

        bboxes = get_detector().detect(frame_rgb)
        logger.info(f"[ENROLL_VMS] Step 2 OK - Detected {len(bboxes)} face(s)")
        if not bboxes:
            logger.warning(f"[ENROLL_VMS] ABORT - No faces detected for {entity_id}")
            return

        bbox = bboxes[0]
        if not bbox or len(bbox) != 4:
            logger.warning(f"[ENROLL_VMS] ABORT - Invalid bbox format: {bbox}")
            return

        x_center, y_center, w, h = map(int, bbox)
        x1 = max(0, int(x_center - w / 2))
        y1 = max(0, int(y_center - h / 2))
        x2 = int(x_center + w / 2)
        y2 = int(y_center + h / 2)

        face_rgb = frame_rgb[y1:y2, x1:x2]
        if face_rgb.size == 0:
            logger.warning(f"[ENROLL_VMS] ABORT - Invalid face crop for {entity_id}")
            return

        face_bgr = cv2.cvtColor(face_rgb, cv2.COLOR_RGB2BGR)
        aug_imgs = generate_augmented_faces(face_bgr, num_variants=25)

        embs, br_list, sh_list = [], [], []
        for i, img_bgr in enumerate(aug_imgs):
            emb = get_embedder().get_embedding(img_bgr)
            if emb is None or not isinstance(emb, np.ndarray):
                continue

            emb = emb.astype(np.float32).reshape(-1)
            if emb.shape[0] != 512:
                logger.warning(f"[ENROLL_VMS] Embedding {i} has wrong shape: {emb.shape[0]}")
                continue

            emb = l2_normalize(emb)
            embs.append(emb)
            br_list.append(calculate_brightness_bgr(img_bgr))
            sh_list.append(calculate_sharpness_bgr(img_bgr))

        if not embs:
            logger.warning(f"[ENROLL_VMS] ABORT - No valid embeddings for {entity_id}")
            return

        embs = np.vstack(embs)
        c0 = l2_normalize(np.mean(embs, axis=0))
        sims = embs @ c0
        mu, sigma = float(np.mean(sims)), float(np.std(sims))
        thr = max(mu - 2 * sigma, 0.55)
        keep_idx = np.where(sims >= thr)[0]
        embs_kept = embs[keep_idx]

        b = np.array(br_list)[keep_idx]
        s = np.array(sh_list)[keep_idx]

        def norm(x):
            lo, hi = np.percentile(x, 5), np.percentile(x, 95)
            if hi <= lo:
                return np.ones_like(x)
            return np.clip((x - lo) / (hi - lo), 0, 1)

        q = 0.5 * norm(b) + 0.5 * norm(s)
        q_sum = float(np.sum(q))
        q = q / q_sum if q_sum > 1e-9 else np.ones_like(q) / len(q)
        proto = l2_normalize(np.sum(embs_kept * q[:, None], axis=0))

        logger.info(
            f"[ENROLL_VMS] Step 7 OK - Prototype embedding shape={proto.shape}, norm={np.linalg.norm(proto):.4f}"
        )

        try:
            logger.info(f"[ENROLL_VMS] Step 8 - Pushing to {FASTAPI_EMBEDDING_URL_VMS}")
            r = requests.post(
                FASTAPI_EMBEDDING_URL_VMS,
                json={"visitor_id": entity_id, "embedding": proto.tolist()},
                timeout=10,
            )
            logger.info(
                f"[ENROLL_VMS] Step 8 - Response: status={r.status_code}, body={r.text[:200]}"
            )
            r.raise_for_status()
        except Exception:
            logger.exception(
                f"[ENROLL_VMS] FAILED - Could not push embedding for visitor_id={entity_id}"
            )
            return

        logger.info(f"[ENROLL_VMS] SUCCESS - Enrollment complete for visitor_id={entity_id}")

    except Exception as e:
        logger.exception(
            f"[ENROLL_VMS] UNHANDLED ERROR during face enrollment for visitor_id={entity_id}: {e}"
        )
