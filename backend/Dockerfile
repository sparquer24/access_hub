FROM python:3.10-slim

WORKDIR /app

# System deps (psycopg2 + builds)
RUN apt-get update && apt-get install -y --no-install-recommends \                                                                                                                                        
    build-essential \
    libpq-dev \                                                                                                                                                                                           
    libxcb1 libgl1 libglib2.0-0 \                                                                                                                                                                         
    && rm -rf /var/lib/apt/lists/*


# Install python deps first (cache-friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt && pip uninstall -y opencv-python && pip install opencv-python-headless


# Copy app code
COPY . .

ENV HOST=0.0.0.0
ENV PORT=5001

EXPOSE 5001

# Run your app the same way as locally
CMD ["python", "wsgi.py"]
