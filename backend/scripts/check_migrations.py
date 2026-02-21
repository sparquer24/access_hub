import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('.env')
url = os.getenv('DATABASE_URL')
print('Using DATABASE_URL=', url)
engine = create_engine(url)
with engine.connect() as conn:
    print('\n-- alembic_version table --')
    try:
        rows = conn.execute(text("SELECT * FROM alembic_version")).fetchall()
        if not rows:
            print('alembic_version is empty')
        else:
            for r in rows:
                print(r)
    except Exception as e:
        print('alembic_version not found or error:', e)

    print('\n-- migrations table (migrations.history) --')
    try:
        rows = conn.execute(text("SELECT version_num FROM alembic_version"))
        for r in rows:
            print('version_num:', r[0])
    except Exception:
        pass

    print('\n-- Listing public tables (first 50) --')
    rows = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename LIMIT 50")).fetchall()
    for r in rows:
        print(r[0])

    print('\n-- Migration files in migrations/versions --')
    versions_dir = os.path.join(os.path.dirname(__file__), '..', 'migrations', 'versions')
    if os.path.exists(versions_dir):
        files = sorted(os.listdir(versions_dir))
        for f in files:
            print(f)
    else:
        print('migrations/versions directory not found:', versions_dir)
