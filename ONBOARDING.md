# Access Hub — Developer Onboarding

> Everything a new developer needs to understand, start, and maintain the full stack: cameras → frame extraction → object detection → face recognition → AMS/VMS frontend.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Server & Access](#2-server--access)
3. [Repositories](#3-repositories)
4. [Main Platform Stack](#4-main-platform-stack)
5. [Analytics Pipeline](#5-analytics-pipeline)
6. [Cameras](#6-cameras)
7. [Starting Everything](#7-starting-everything)
8. [Stopping Everything](#8-stopping-everything)
9. [Registering Faces](#9-registering-faces)
10. [Environment Variables](#10-environment-variables)
11. [Key Endpoints](#11-key-endpoints)
12. [ArcFace Model](#12-arcface-model)
13. [Technical Decisions](#13-technical-decisions)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. System Architecture

Two independent Docker Compose stacks communicate through a shared Docker network (`core_net`) and a RabbitMQ message broker.

```
┌─── Analytics Pipeline (face_recognition_mastercode) ────────────────────┐
│                                                                          │
│  RTSP Camera (entry) → frame_extractor_entry ─┐                         │
│                                                ├→ frames_queue           │
│  RTSP Camera (exit)  → frame_extractor_exit  ─┘     │                  │
│                                                       ↓                  │
│                                               object_detector            │
│                                                       │                  │
│                                               object_detection queue     │
│                                                       │                  │
│                                               face_recognizer (GPU)      │
│                                                  │          │            │
└──────────────────────────────────────────────────┼──────────┼────────────┘
                                                   │          │
                              ┌────────────────────┘          │
                              ↓                               ↓
                      Qdrant API                    POST /api/internal/...
                   (vector search)                  access_hub backend
                                                         │
┌─── Main Platform (access_hub) ──────────────────────────┼──────────────┐
│                                                          │              │
│   Frontend (nginx) ↔ Backend (Flask+SocketIO) ↔ PostgreSQL             │
│                             ↕                    Redis    RabbitMQ      │
│                         Qdrant API                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**AMS** (Attendance Management System) handles employees. Camera position `entry` → `CHECK_IN`, `exit` → `CHECK_OUT`. Records go to `attendance_records`.

**VMS** (Visitor Management System) handles visitors. Recognized faces → `authorized`; unknown → `unauthorized`. Records go to `visitor_alerts`; frontend receives real-time SocketIO events.

---

## 2. Server & Access

| Field    | Value                         |
|----------|-------------------------------|
| IP       | `202.53.72.149`               |
| User     | `nettlinxcp`                  |
| Password | `Nettlinx@CP2026`             |
| OS       | Ubuntu 22.04                  |
| GPU      | NVIDIA RTX 2000 Ada · 16 GB VRAM |
| CUDA     | 12.8 · Driver 570.211.01      |

```bash
ssh nettlinxcp@202.53.72.149
# password: Nettlinx@CP2026
```

> ⚠️ **Do not commit credentials to any repository.** The `.env` file is gitignored. Rotate the server password after project ownership transfers.

---

## 3. Repositories

| Repo | Path on server | Purpose |
|------|---------------|---------|
| `sparquer24/face_recognition_mastercode` | `~/sparquer/face_recognition_mastercode/` | Analytics pipeline — frame extractors, object detector, face recognizer |
| `sparquer24/access_hub` | `~/sparquer/access_hub/` | Main platform — Flask backend, React frontend, Qdrant API, CDK infra |

```bash
# Pull latest
cd ~/sparquer/face_recognition_mastercode && git pull origin main
cd ~/sparquer/access_hub && git pull origin main
```

> ℹ️ The `arc.onnx` file in both repos is a Git LFS pointer that was **never uploaded** to LFS storage. The real model (167 MB) is downloaded automatically at Docker build time from InsightFace GitHub releases. Do not try `git lfs pull` it.

---

## 4. Main Platform Stack

Defined in `~/sparquer/access_hub/docker-compose.yml`.

| Container | Role | Port |
|-----------|------|------|
| `fullstack-frontend` | nginx — serves React UI | 80 |
| `fullstack-backend` | Flask + SocketIO — REST API | 5001 |
| `postgres` | PostgreSQL 15 | 5432 |
| `redis` | Redis 7 — session cache | 6379 |
| `rabbitmq` | RabbitMQ 3 + management UI | 5672 / 15672 |
| `qdrant` | Qdrant vector database | 6333 |
| `access_hub-qdrant_api-1` | FastAPI wrapper for Qdrant | 8000 |

### Qdrant Collections

| Collection | Dimensions | Metric | Used by |
|------------|-----------|--------|---------|
| `vector-embeddings` | 512 | Cosine | VMS (visitors) |
| `vector-embeddings_AMS` | 512 | Cosine | AMS (employees) |

---

## 5. Analytics Pipeline

Defined in `docker-compose.analytics.yml`. All containers share `core_net`.

| Container | Role | Base image |
|-----------|------|-----------|
| `frame_extractor_entry` | Reads entry camera RTSP via GStreamer; publishes JPEG frames to `frames_queue` at ~4 FPS | `ubuntu:24.04` ⚠️ see note |
| `frame_extractor_exit` | Same, reads exit camera | `ubuntu:24.04` |
| `object_detector` | Consumes `frames_queue`; runs YOLOv8 face detection; publishes face crops to `object_detection` queue | `nvidia/cuda:12.6.3-cudnn-runtime-ubuntu22.04` (GPU) |
| `face_recognizer` | Consumes `object_detection`; runs ArcFace (ONNX) embedding; queries Qdrant; POSTs results to backend | `nvidia/cuda:12.6.3-cudnn-runtime-ubuntu22.04` (GPU) |

> ⚠️ **ubuntu:24.04 is required** for frame extractors. GStreamer 1.20.3 (ubuntu:22.04) has a bug where RTSP Digest authentication with Dahua cameras silently times out. ubuntu:24.04 ships GStreamer 1.24.x which resolves this.

### RabbitMQ Queues

| Queue | Producer | Consumer | Content |
|-------|----------|----------|---------|
| `frames_queue` | `frame_extractor_*` | `object_detector` | JPEG frames + camera metadata |
| `object_detection` | `object_detector` | `face_recognizer` | Face crop + bounding box + image_id |

### image_id Format

Every message carries an `image_id` that encodes camera metadata:

```
PROJECT_TOWER_FLOOR_POSITION_TIMESTAMP
# e.g. AMS_A_01_entry_1751234567.123
#      │   │   │   └── entry → CHECK_IN  |  exit → CHECK_OUT
#      │   │   └── floor
#      │   └── tower
#      └── AMS or VMS (routes to different Qdrant collection)
```

---

## 6. Cameras

| Field | Value |
|-------|-------|
| Web UI | `http://202.53.77.10:8080` and `http://202.53.77.10:8081` |
| Username | `admin` |
| Password | `Admin_123` |
| Entry RTSP | `rtsp://admin:Admin_123@202.53.77.10:8080/cam/realmonitor?channel=1&subtype=0` |
| Exit RTSP | `rtsp://admin:Admin_123@202.53.77.10:8081/cam/realmonitor?channel=1&subtype=0` |

Test a stream with VLC → Media → Open Network Stream.

---

## 7. Starting Everything

> ⚠️ **Always start the main platform stack first.** The analytics pipeline depends on RabbitMQ and the backend API being available on `core_net`.

### Step 1 — Start the main platform

```bash
cd ~/sparquer/access_hub
docker compose up -d

# Verify backend and rabbitmq are healthy
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Step 2 — Start the analytics pipeline

```bash
cd ~/sparquer/face_recognition_mastercode
docker compose -f docker-compose.analytics.yml up -d
```

### Step 3 — Verify the pipeline is flowing

```bash
# Should show messages in queue and consumers attached
docker exec rabbitmq rabbitmqctl list_queues name messages consumers

# Should show ~4 FPS log lines
docker logs frame_extractor_entry --tail 10 -f

# Should show detected bounding boxes
docker logs face_recognizer --tail 10 -f
```

### After pulling new code

```bash
# Analytics pipeline
cd ~/sparquer/face_recognition_mastercode
docker compose -f docker-compose.analytics.yml build
docker compose -f docker-compose.analytics.yml up -d

# Main platform
cd ~/sparquer/access_hub
docker compose build
docker compose up -d
```

> ℹ️ First build takes several minutes — downloads CUDA base image (~3 GB) and buffalo_l model (~276 MB). Use `nohup` when building over SSH:
> ```bash
> nohup docker compose -f docker-compose.analytics.yml build > /tmp/build.log 2>&1 &
> tail -f /tmp/build.log
> ```

---

## 8. Stopping Everything

```bash
# Stop analytics first (consumers), then the platform (brokers/DB)
cd ~/sparquer/face_recognition_mastercode
docker compose -f docker-compose.analytics.yml stop

cd ~/sparquer/access_hub
docker compose stop
```

> ⚠️ Use `down -v` only if you want to wipe all data. `docker compose down -v` deletes volumes — this erases all registered faces, attendance records, and visitor alerts.

---

## 9. Registering Faces

Qdrant collections start empty. Until faces are enrolled, the recognizer will always return "unknown" / "unauthorized."

### Employee (AMS)

1. Create the employee record via the portal or `POST /api/v1/employees`
2. Enroll their face:

```
POST /api/v1/face/enroll
Content-Type: multipart/form-data

employee_id=<id>
image=<face photo>
```

The backend runs `face_enrollment_background.py`, extracts a 512-dim ArcFace embedding using `arc.onnx`, and stores it in `vector-embeddings_AMS`.

### Visitor (VMS)

Same flow through `/api/v1/visitors` and the VMS face enroll route. Embeddings go into `vector-embeddings`.

> ⚠️ **Model consistency is critical.** Both the backend enrollment and the `face_recognizer` container use `arc.onnx` (InsightFace buffalo_l `w600k_r50.onnx`). Both apply identical preprocessing: resize to 112×112, normalize to [0,1], transpose to NCHW. If either model or preprocessing diverges, registered embeddings will never match live embeddings.

---

## 10. Environment Variables

### access_hub backend — `backend/.env` (gitignored)

| Variable | Value |
|----------|-------|
| `POSTGRES_DB_URL` | `postgresql://admin:admin@postgres:5432/access_hub` |
| `QDRANT_API_URL` | `http://access_hub-qdrant_api-1:8000` |
| `FASTAPI_EMBEDDING_URL` | `http://access_hub-qdrant_api-1:8000/embedding_AMS` |
| `FASTAPI_EMBEDDING_URL_VMS` | `http://access_hub-qdrant_api-1:8000/embedding` |
| `INTERNAL_SERVICE_KEY` | `secretkey` |
| `REDIS_URL` | `redis://redis:6379` |

### Analytics pipeline — set in `docker-compose.analytics.yml`

| Container | Variable | Value |
|-----------|----------|-------|
| `frame_extractor_*` | `RTSP_STREAM` | see §6 Cameras |
| `frame_extractor_*` | `CAMERA_ID` | `AMS_A_01_entry` / `AMS_A_01_exit` |
| `frame_extractor_*` | `QUEUE_NAME` | `frames_queue` |
| `face_recognizer` | `QDRANT_API_URL` | `http://access_hub-qdrant_api-1:8000/retrieval/single` |
| `face_recognizer` | `QDRANT_API_URL_AMS` | `http://access_hub-qdrant_api-1:8000/retrieval/single_AMS` |
| `face_recognizer` | `ACCESS_HUB_URL` | `http://fullstack-backend:5001` |
| `face_recognizer` | `INTERNAL_SERVICE_KEY` | `secretkey` |

---

## 11. Key Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/v1/face/enroll` | POST | Register a face (multipart: employee_id + image) | Session |
| `/api/v1/employees` | GET / POST | List or create employees | Session |
| `/api/v1/visitors` | GET / POST | List or create visitors | Session |
| `/api/internal/attendance/event` | POST | Analytics → backend: AMS check-in/out event | `X-Service-Key` header |
| `/api/internal/visitor-alert` | POST | Analytics → backend: VMS alert + SocketIO emit | `X-Service-Key` header |
| `:8000/embedding_AMS` | POST | Qdrant API: store AMS embedding | Internal |
| `:8000/retrieval/single_AMS` | POST | Qdrant API: search AMS collection | Internal |
| `:8000/embedding` | POST | Qdrant API: store VMS embedding | Internal |
| `:8000/retrieval/single` | POST | Qdrant API: search VMS collection | Internal |
| `:15672` | — | RabbitMQ management UI (guest/guest) | — |

---

## 12. ArcFace Model

| Property | Value |
|----------|-------|
| Model | InsightFace buffalo_l — `w600k_r50.onnx` (ResNet-50) |
| Stored as | `arc.onnx` in both repos (git file is LFS pointer; real model downloaded at build) |
| Download source | InsightFace GitHub releases v0.7 → `buffalo_l.zip` |
| Input | 112×112 RGB, normalized [0,1], transposed to NCHW |
| Output | 512-dimensional float32 embedding |
| Similarity | Cosine (Qdrant collection metric) |
| VRAM at runtime | ~170 MB |
| Execution provider | CUDAExecutionProvider → CPUExecutionProvider fallback |

### Preprocessing — must be identical in both backend and face_recognizer

```python
face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
face_rgb = cv2.resize(face_rgb, (112, 112))
face_rgb = face_rgb / 255.0
input_tensor = np.transpose(face_rgb, (2, 0, 1)).astype(np.float32)  # NCHW
input_tensor = np.expand_dims(input_tensor, axis=0)
```

---

## 13. Technical Decisions

| Decision | What & Why |
|----------|-----------|
| Face recognition runtime | ONNX Runtime instead of DeepFace + TensorFlow. TensorFlow caused a segfault (exit 139) on this server; ONNX Runtime runs the same InsightFace model reliably. |
| face_recognizer base image | `nvidia/cuda:12.6.3-cudnn-runtime-ubuntu22.04`. The plain `python:3.10-slim` has no CUDA libraries, so CUDAExecutionProvider silently falls back to CPU. The CUDA base bundles cuDNN 9, which onnxruntime-gpu 1.20.x requires. |
| frame_extractor base image | `ubuntu:24.04` (GStreamer 1.24.x). GStreamer 1.20.3 (ubuntu:22.04) has a bug where RTSP Digest auth with Dahua cameras silently times out. |
| GStreamer vs. OpenCV for capture | GStreamer retained. OpenCV VideoCapture (FFmpeg backend) adds 1–2 seconds of buffering latency vs GStreamer's low-latency pipeline. |
| RTSP transport | Auto-negotiated (no `protocols=tcp` forced). Dahua cameras default to UDP for RTP. Forcing TCP caused the same timeout symptoms. |
| Model availability | `arc.onnx` LFS object was never uploaded to GitHub. Both Dockerfiles download `buffalo_l.zip` from InsightFace GitHub releases at build time. |
| Internal API bridge | `face_recognizer` HTTP-posts results to the backend via `/api/internal/*` protected by `X-Service-Key`. No direct DB access from analytics containers. |

---

## 14. Troubleshooting

### Frame extractor: "Timeout while waiting for server response"

The frame extractor image must be built on `ubuntu:24.04`. Verify:
```bash
docker exec frame_extractor_entry gst-launch-1.0 --version
# Must show 1.24.x or higher
```

### face_recognizer: libcublasLt.so.12 not found

Wrong base image. Must be `nvidia/cuda:12.6.3-cudnn-runtime-ubuntu22.04`. Rebuild after fixing the Dockerfile.

### face_recognizer: 'NoneType' object has no attribute 'get'

Qdrant returned no results — the collection is empty. Enroll faces through the portal first. Not a code error.

### Registered faces never match

Check both `backend/app/utils/arcface.py` and `face-recognizer/services/arcface.py` apply identical preprocessing — specifically the `np.transpose(face_rgb, (2, 0, 1))` NCHW step. A missing transpose produces incompatible embeddings with no error.

### Messages piling up, nothing consuming

```bash
docker exec rabbitmq rabbitmqctl list_queues name messages consumers
# If consumers = 0, that container crashed
docker logs <container> --tail 30
```

### Build disconnects over SSH

```bash
nohup docker compose -f docker-compose.analytics.yml build > /tmp/build.log 2>&1 &
tail -f /tmp/build.log
```

### pip fails: "externally-managed-environment" on ubuntu:24.04

Add `--break-system-packages` to the pip install line in the Dockerfile.

### numpy build fails: "pkgutil.ImpImporter"

`numpy==1.24.4` is incompatible with Python 3.12 (ubuntu:24.04). Use `numpy>=1.26.4` in `requirements.txt`.

---

*This document covers the state of the system as fully configured and verified running. The end-to-end pipeline (cameras → recognition → AMS/VMS records) is operational once faces are enrolled via the portal.*
