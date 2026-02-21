"""
Logging configuration for the application — rotated + gzip compression
"""

import logging
import logging.config
import os
import sys
import gzip
import shutil
from datetime import datetime
from logging.handlers import RotatingFileHandler


LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)


def _gzip_rotator(source, dest):
    with open(source, "rb") as sf, gzip.open(dest, "wb") as df:
        shutil.copyfileobj(sf, df)
    try:
        os.remove(source)
    except OSError:
        pass


def _gz_namer(name):
    return name + ".gz"


def _make_rotating_handler(filename, level, fmt, max_bytes=10 * 1024 * 1024, backup_count=7):
    path = os.path.join(LOG_DIR, filename)
    handler = RotatingFileHandler(path, maxBytes=max_bytes, backupCount=backup_count)
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(fmt))
    # compress rotated files
    handler.rotator = _gzip_rotator
    handler.namer = _gz_namer
    return handler


def setup_logging(app=None, log_level="INFO"):
    """
    Programmatic logging setup with rotating file handlers (size-based)
    - INFO -> app_info.log (rotates at 10MB, keep 7, compressed)
    - ERROR -> app_error.log (rotates at 10MB, keep 7, compressed)
    - audit -> audit.log (rotates at 10MB, keep 10, compressed)
    """

    # Base formatters
    detailed_fmt = "[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
    simple_fmt = "%(levelname)s - %(message)s"
    json_fmt = '{"timestamp":"%(asctime)s","level":"%(levelname)s","module":"%(module)s","message":"%(message)s"}'

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    # remove existing handlers to avoid duplicates
    for h in list(root_logger.handlers):
        root_logger.removeHandler(h)

    # Console
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.DEBUG)
    console.setFormatter(logging.Formatter(simple_fmt))
    root_logger.addHandler(console)

    # Info file
    info_handler = _make_rotating_handler("app_info.log", logging.INFO, detailed_fmt, max_bytes=10 * 1024 * 1024, backup_count=7)
    root_logger.addHandler(info_handler)

    # Error file (separate handler so it's easy to tail)
    error_handler = _make_rotating_handler("app_error.log", logging.ERROR, detailed_fmt, max_bytes=10 * 1024 * 1024, backup_count=7)
    root_logger.addHandler(error_handler)

    # Audit logger
    audit_logger = logging.getLogger("audit")
    audit_logger.setLevel(logging.INFO)
    if not audit_logger.handlers:
        a_handler = _make_rotating_handler("audit.log", logging.INFO, json_fmt, max_bytes=10 * 1024 * 1024, backup_count=10)
        audit_logger.addHandler(a_handler)
        audit_logger.propagate = False

    # Security logger config (keeps console + error + audit)
    sec_logger = logging.getLogger("security")
    sec_logger.setLevel(logging.WARNING)
    if not any(isinstance(h, RotatingFileHandler) and getattr(h, "baseFilename", "").endswith("app_error.log") for h in sec_logger.handlers):
        sec_logger.addHandler(error_handler)
    sec_logger.propagate = False

    # Werkzeug (Flask) logger - keep to file_info but at WARNING level
    werkzeug_logger = logging.getLogger("werkzeug")
    werkzeug_logger.setLevel(logging.WARNING)
    if not any(getattr(h, "baseFilename", "").endswith("app_info.log") for h in werkzeug_logger.handlers):
        werkzeug_logger.addHandler(info_handler)
    werkzeug_logger.propagate = False

    # Flask integration hooks (same as before)
    if app:
        app.logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

        @app.before_request
        def log_request():
            from flask import request, g
            import time
            g.start_time = time.time()
            security = logging.getLogger("security")
            if request.endpoint and any(e in request.endpoint for e in ("login", "logout", "register", "reset")):
                security.info(f"Security request: {request.method} {request.url} from {request.remote_addr}")

        @app.after_request
        def log_response(response):
            from flask import request, g
            import time
            duration = None
            if hasattr(g, "start_time"):
                duration = time.time() - g.start_time
            if duration is not None:
                app.logger.info(f"{request.method} {request.url} - {response.status_code} ({duration:.3f}s)")
            else:
                app.logger.info(f"{request.method} {request.url} - {response.status_code}")
            return response

    return logging.getLogger(__name__)