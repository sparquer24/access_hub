#!/usr/bin/env python
"""
Create all database tables from models
"""
from app import create_app, db

app = create_app()
with app.app_context():
    try:
        db.create_all()
        print("All tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {e}")
        import traceback
        traceback.print_exc()
