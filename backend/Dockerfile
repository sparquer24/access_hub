FROM python:3.10-slim

WORKDIR /app

# System deps (psycopg2 + builds)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

# Fix OpenCV libGL.so.1 error (Debian trixie)
RUN apt-get update && apt-get install -y libgl1 && rm -rf /var/lib/apt/lists/*

# Install python deps first (cache-friendly)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy app code
COPY . .

ENV HOST=0.0.0.0
ENV PORT=5001

EXPOSE 5001

# Run your app the same way as locally
CMD ["python", "wsgi.py"]
