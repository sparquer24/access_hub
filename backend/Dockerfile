FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl unzip \
    libglib2.0-0 libgl1 libsm6 libxext6 libxrender1 libxcb1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir --force-reinstall -r requirements.txt

COPY . .

# Download the ArcFace recognition model (InsightFace buffalo_l pack, w600k_r50.onnx).
# This model produces 512-dim embeddings and must be the same model used by face_recognizer
# (face_recognition_mastercode/face-recognizer/Dockerfile) so that registration and
# recognition embeddings match.
# The file arc.onnx in the repo is a git-lfs pointer that was never uploaded to LFS storage,
# so we download the real model here at build time.
RUN curl -L "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" \
    -o /tmp/buffalo_l.zip && \
    unzip /tmp/buffalo_l.zip w600k_r50.onnx -d /tmp/ && \
    mv /tmp/w600k_r50.onnx /app/app/utils/arc.onnx && \
    rm /tmp/buffalo_l.zip

ENV HOST=0.0.0.0
ENV PORT=5001
EXPOSE 5001

CMD ["python", "wsgi.py"]
