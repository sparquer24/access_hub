#!/usr/bin/env python
"""
Check database tables directly
"""
import psycopg2
from urllib.parse import urlparse
import os

# Get database connection details from DATABASE_URL
db_url = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/visitor_db')

# Parse the URL
parsed = urlparse(db_url.replace('postgresql+psycopg2://', 'postgresql://'))

db_host = parsed.hostname or 'localhost'
db_port = parsed.port or 5432
db_name = parsed.path.lstrip('/')
db_user = parsed.username or 'postgres'
db_password = parsed.password or ''

try:
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password
    )
    cur = conn.cursor()
    
    # Query to get all tables
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema='public' AND table_type='BASE TABLE' 
        ORDER BY table_name
    """)
    
    tables = cur.fetchall()
    print(f'Total tables found: {len(tables)}\n')
    
    if tables:
        print('Tables in database:')
        for table in tables:
            print(f'  ✓ {table[0]}')
    else:
        print('❌ No tables found in the database!')
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f'Error connecting to database: {e}')
    import traceback
    traceback.print_exc()
