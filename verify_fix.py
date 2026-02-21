import sys
import os

# Add backend directory to python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Set env vars
os.environ['DATABASE_URL'] = 'postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/access_hub'
os.environ['JWT_SECRET_KEY'] = 'dummy'
os.environ['SECRET_KEY'] = 'dummy'

from flask import Flask
from app.extensions import db
from app.services.visitor_service import VisitorService

def verify_fix():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    # Org ID from the user's error report
    org_id = '304e5f19-d792-4b9a-b7a0-34c567a7c54b'
    
    with app.app_context():
        print(f"Testing VisitorService methods for Org: {org_id}")
        
        try:
            print("\n1. Testing get_pre_registrations...")
            preregs = VisitorService.get_pre_registrations(org_id)
            print(f"[OK] Success! Found {len(preregs)} pre-registrations.")
        except Exception as e:
            print(f"[FAIL] Failed get_pre_registrations: {e}")
            
        try:
            print("\n2. Testing get_blacklist...")
            blacklist = VisitorService.get_blacklist(org_id)
            print(f"[OK] Success! Found {len(blacklist)} blacklist entries.")
        except Exception as e:
            print(f"[FAIL] Failed get_blacklist: {e}")

if __name__ == '__main__':
    verify_fix()
