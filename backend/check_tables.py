#!/usr/bin/env python
"""
Check what tables exist in the database
"""
from app import db, create_app

app = create_app()
with app.app_context():
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()
    print(f'Total tables: {len(tables)}')
    print('\nTables in database:')
    for table in sorted(tables):
        print(f'  - {table}')
