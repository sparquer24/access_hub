import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
load_dotenv('.env')
url=os.getenv('DATABASE_URL')
print('Using', url)
engine=create_engine(url)
with engine.connect() as conn:
    q = text("""
    SELECT
      tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM
      information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'roles';
    """)
    rows = conn.execute(q).fetchall()
    if not rows:
        print('No foreign keys reference roles')
    else:
        for r in rows:
            print(dict(r))
