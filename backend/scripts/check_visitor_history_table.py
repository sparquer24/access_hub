import os
import sys

# Ensure backend package directory is on sys.path so 'app' can be imported
basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if basedir not in sys.path:
    sys.path.insert(0, basedir)

from app import create_app
from app.extensions import db
import sqlalchemy as sa

app = create_app()

with app.app_context():
    # Check using Postgres-specific to_regclass (returns None if missing)
    try:
        res = db.session.execute(sa.text("SELECT to_regclass('public.visitor_history_details')")).scalar()
        exists = bool(res)
        print(f"visitor_history_details exists: {exists}")
        if not exists:
            rows = db.session.execute(sa.text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%visitor_history%'")).fetchall()
            print('Similar tables found:', [r[0] for r in rows])
    except Exception as e:
        # Fallback: try generic information_schema check
        try:
            exists = db.session.execute(sa.text("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='visitor_history_details')")).scalar()
            print(f"visitor_history_details exists (info_schema): {exists}")
        except Exception as e2:
            print('Error checking table:', e)
