# VMS Deployment Guide

Complete guide for deploying VMS backend and frontend to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Configuration](#environment-configuration)
5. [HTTPS & Domain Setup](#https--domain-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Backend Requirements
- Python 3.8+
- PostgreSQL 12+
- Redis (optional, recommended for production)
- Nginx or Apache (for reverse proxy)
- SSL certificate (Let's Encrypt or commercial)

### Frontend Requirements
- Node.js 16+
- npm or yarn
- Static file server (Nginx, Apache, or CDN)

---

## Backend Deployment

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and PostgreSQL
sudo apt install python3 python3-pip python3-venv postgresql postgresql-contrib redis-server -y

# Install Nginx
sudo apt install nginx -y
```

### Step 2: Setup Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE vms_production;
CREATE USER vms_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE vms_production TO vms_user;
\q
```

### Step 3: Clone and Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/vms
sudo chown -R $USER:$USER /var/www/vms

# Clone repository
cd /var/www/vms
git clone <your-repo-url> .

# Create virtual environment
cd vms_backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Configure Environment

```bash
# Copy production environment file
cp .env.production .env

# Edit .env with secure values
nano .env
```

**Update these critical values**:
```bash
DATABASE_URL=postgresql+psycopg2://vms_user:secure_password@localhost:5432/vms_production

# Generate secure random keys (use Python)
# python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET_KEY=<your-secure-random-key>
SECRET_KEY=<your-secure-random-key>

ENVIRONMENT=prod
CORS_ORIGIN=https://vms.gov.in

SESSION_COOKIE_SECURE=True
UPLOAD_FOLDER=/var/www/vms/uploads

REDIS_URL=redis://localhost:6379/0
```

### Step 5: Initialize Database

```bash
# Run migrations
flask db upgrade

# Seed initial data (if needed)
python seed.py
```

### Step 6: Setup Gunicorn Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/vms-backend.service
```

**Add this content**:
```ini
[Unit]
Description=VMS Backend API
After=network.target postgresql.service redis.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/vms/vms_backend
Environment="PATH=/var/www/vms/vms_backend/venv/bin"
ExecStart=/var/www/vms/vms_backend/venv/bin/gunicorn --workers 4 --bind unix:/var/www/vms/vms_backend.sock -m 007 "run:app"
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable vms-backend
sudo systemctl start vms-backend
sudo systemctl status vms-backend
```

### Step 7: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/vms-backend
```

**Add this content**:
```nginx
server {
    listen 80;
    server_name api.vms.gov.in;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.vms.gov.in;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/api.vms.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vms.gov.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://unix:/var/www/vms/vms_backend.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (already set by Flask-CORS, but can be added here as backup)
        add_header Access-Control-Allow-Origin "https://vms.gov.in" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://vms.gov.in";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Max-Age 3600;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 200;
        }
    }

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/vms/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Max upload size
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vms-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Frontend Deployment

### Step 1: Build Frontend

```bash
# On your development machine
cd vms_frontend

# Install dependencies
npm install

# Build for production
npm run build
# This creates an optimized build in the 'build' folder
```

### Step 2: Upload Build to Server

```bash
# Create frontend directory on server
ssh user@your-server
sudo mkdir -p /var/www/vms-frontend
sudo chown -R $USER:$USER /var/www/vms-frontend

# From your local machine, copy build files
cd vms_frontend
scp -r build/* user@your-server:/var/www/vms-frontend/
```

### Step 3: Configure Nginx for Frontend

```bash
# On server
sudo nano /etc/nginx/sites-available/vms-frontend
```

**Add this content**:
```nginx
server {
    listen 80;
    server_name vms.gov.in www.vms.gov.in;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vms.gov.in www.vms.gov.in;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/vms.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vms.gov.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root /var/www/vms-frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;

    # Serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vms-frontend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Environment Configuration

### Backend Production Environment

Create `/var/www/vms/vms_backend/.env`:

```bash
# Database
DATABASE_URL=postgresql+psycopg2://vms_user:SECURE_PASSWORD@localhost:5432/vms_production

# JWT (Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET_KEY=CHANGE_THIS_TO_SECURE_RANDOM_KEY_IN_PRODUCTION
JWT_ACCESS_TOKEN_EXPIRES_HOURS=1
JWT_REFRESH_TOKEN_EXPIRES_DAYS=7

# Server
SECRET_KEY=CHANGE_THIS_TO_SECURE_RANDOM_KEY_IN_PRODUCTION
ENVIRONMENT=prod

# CORS - Only allow your frontend domain
CORS_ORIGIN=https://vms.gov.in

# Session
SESSION_COOKIE_NAME=vms_session
SESSION_COOKIE_SAMESITE=Strict
SESSION_COOKIE_SECURE=True

# Upload
UPLOAD_FOLDER=/var/www/vms/uploads

# Redis
REDIS_URL=redis://localhost:6379/0

# Swagger
SWAGGER_HOST=api.vms.gov.in
```

### Frontend Production Environment

Before building, update `vms_frontend/.env.production`:

```bash
REACT_APP_API_BASE_URL=https://api.vms.gov.in
REACT_APP_ENV=production
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=error
```

---

## HTTPS & Domain Setup

### Step 1: Install Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Obtain SSL Certificate

```bash
# For backend
sudo certbot --nginx -d api.vms.gov.in

# For frontend
sudo certbot --nginx -d vms.gov.in -d www.vms.gov.in
```

### Step 3: Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot will automatically renew certificates via cron
```

### Step 4: DNS Configuration

Point your domains to your server IP:

```
A Record: vms.gov.in → <your-server-ip>
A Record: www.vms.gov.in → <your-server-ip>
A Record: api.vms.gov.in → <your-server-ip>
```

---

## Monitoring & Maintenance

### Check Service Status

```bash
# Backend
sudo systemctl status vms-backend
sudo journalctl -u vms-backend -f

# Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Database
sudo systemctl status postgresql

# Redis
sudo systemctl status redis-server
```

### Restart Services

```bash
# Backend
sudo systemctl restart vms-backend

# Nginx
sudo systemctl restart nginx

# Database
sudo systemctl restart postgresql

# Redis
sudo systemctl restart redis-server
```

### Update Application

```bash
# Pull latest changes
cd /var/www/vms
git pull origin main

# Backend
cd vms_backend
source venv/bin/activate
pip install -r requirements.txt
flask db upgrade
sudo systemctl restart vms-backend

# Frontend (build on local machine, then upload)
cd vms_frontend
npm install
npm run build
scp -r build/* user@your-server:/var/www/vms-frontend/
```

### Database Backup

```bash
# Create backup directory
sudo mkdir -p /var/backups/vms

# Create backup script
sudo nano /usr/local/bin/backup-vms-db.sh
```

**Add this content**:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/vms"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vms_backup_$DATE.sql"

# Create backup
pg_dump -U vms_user vms_production > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "vms_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-vms-db.sh

# Schedule daily backup (cron)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-vms-db.sh
```

### Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/vms-backend
```

**Add this content**:
```
/var/www/vms/vms_backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload vms-backend
    endscript
}
```

### Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Check system resources
htop

# Check disk space
df -h

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('vms_production'));"
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong random keys for JWT_SECRET_KEY and SECRET_KEY
- [ ] Enable firewall (ufw)
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Disable SSH password authentication (use SSH keys only)
- [ ] Enable automatic security updates
  ```bash
  sudo apt install unattended-upgrades -y
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```
- [ ] Setup fail2ban
  ```bash
  sudo apt install fail2ban -y
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Keep all software up to date

---

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: Backend service not running or socket file missing

**Solution**:
```bash
# Check service status
sudo systemctl status vms-backend

# Restart service
sudo systemctl restart vms-backend

# Check logs
sudo journalctl -u vms-backend -n 50
```

### Issue: CORS Errors in Production

**Cause**: Incorrect CORS_ORIGIN in backend .env

**Solution**:
```bash
# Update .env
nano /var/www/vms/vms_backend/.env
# Set: CORS_ORIGIN=https://vms.gov.in

# Restart backend
sudo systemctl restart vms-backend
```

### Issue: Database Connection Failed

**Cause**: Wrong credentials or PostgreSQL not running

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U vms_user -d vms_production -h localhost

# Check DATABASE_URL in .env
```

### Issue: SSL Certificate Expired

**Cause**: Let's Encrypt certificate not renewed

**Solution**:
```bash
# Manually renew
sudo certbot renew

# Check auto-renewal timer
sudo systemctl status certbot.timer
```

---

## Performance Optimization

### Enable Redis Caching

```python
# In backend config
CACHE_TYPE = "redis"
CACHE_REDIS_URL = "redis://localhost:6379/0"
CACHE_DEFAULT_TIMEOUT = 300
```

### Database Connection Pooling

```python
# In config
SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_size": 10,
    "pool_recycle": 3600,
    "pool_pre_ping": True,
}
```

### Nginx Caching

```nginx
# In Nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/stats {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_pass http://unix:/var/www/vms/vms_backend.sock;
}
```

---

## Summary

You now have:
- ✅ Backend deployed with Gunicorn + Nginx
- ✅ Frontend deployed as static files
- ✅ HTTPS enabled with Let's Encrypt
- ✅ Environment-specific configuration
- ✅ Database backups scheduled
- ✅ Security measures in place
- ✅ Monitoring and logging configured

For issues, check logs and refer to the troubleshooting section.
