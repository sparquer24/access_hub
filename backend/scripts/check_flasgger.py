import sys
import os

# Ensure backend package is on sys.path when running from workspace root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app

app = create_app()
print("APP_CREATED")
exts = getattr(app, 'extensions', {})
print("FLASGGER_IN_EXT:", 'flasgger' in exts)
print("EXT_KEYS:", list(exts.keys()))
