import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('.env')
url = os.getenv('DATABASE_URL')
print('Using DATABASE_URL=', url)
engine = create_engine(url)
with engine.connect() as conn:
    rows = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='roles' ORDER BY ordinal_position")).fetchall()
    if not rows:
        print('roles table not found')
    else:
        for r in rows:
            print(r[0], r[1])
