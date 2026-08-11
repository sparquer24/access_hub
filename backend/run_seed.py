#!/usr/bin/env python
"""
Wrapper script to run seed_master_data with proper environment configuration.
This ensures environment variables are set BEFORE any app modules are imported.
"""

import os
import sys

# Set environment variables if not already set
if 'DATABASE_URL' not in os.environ:
    os.environ['DATABASE_URL'] = 'postgresql+psycopg2://admin:admin@postgres:5432/access_hub'
if 'JWT_SECRET_KEY' not in os.environ:
    os.environ['JWT_SECRET_KEY'] = 'dummy-seeding-key'
if 'SECRET_KEY' not in os.environ:
    os.environ['SECRET_KEY'] = 'dummy-seeding-secret'
if 'ENVIRONMENT' not in os.environ:
    os.environ['ENVIRONMENT'] = 'dev'

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    from flask import Flask
    from app.extensions import db
    from datetime import datetime, date, time, timedelta
    import uuid
    
    # Import models
    from app.models import (
        Role, Organization, Department, Employee, User, Shift, AttendanceRecord
    )
    
    # Import the seed functions from the module itself
    import importlib.util
    spec = importlib.util.spec_from_file_location("seed_master_data", 
                                                   os.path.join(os.path.dirname(__file__), "app/seeds/seed_master_data.py"))
    seed_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(seed_module)
    
    app = Flask(__name__)
    
    # Set Flask config with database from environment
    # Replace 'postgresql://' with 'postgresql+psycopg2://' to ensure driver compatibility
    db_url = os.environ.get('DATABASE_URL', 'postgresql+psycopg2://admin:admin@postgres:5432/access_hub')
    if db_url.startswith('postgresql://'):
        db_url = db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dummy-seeding-key')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dummy-seeding-secret')
    
    db.init_app(app)
    
    with app.app_context():
        seed_module.seed_all_master_data()
