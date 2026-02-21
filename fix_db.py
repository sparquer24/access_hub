import sys
import os

# Add backend directory to python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Add backend directory to python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Set env vars from .env (hardcoded for simplicity/safety)
os.environ['DATABASE_URL'] = 'postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/access_hub'
os.environ['JWT_SECRET_KEY'] = 'dummy'
os.environ['SECRET_KEY'] = 'dummy'

from flask import Flask
from app.extensions import db
from sqlalchemy import text

def fix_database():
    # create generic app to access db
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    # Import all models so that they are registered with SQLAlchemy
    from app.models import (
        User, Role, Organization, OrganizationVisitor, VisitorMovementLog, 
        VisitorAlert, VisitorBlacklist, VisitorPreRegistration, VisitorBadge, GroupVisit,
        VisitorDocument, VisitorHealthScreening, VisitorAsset, ContractorTimeLog,
        DeliveryLog, VIPVisitorPreference, Image, LPRLog, LPRHotlist, LPRWhitelist
    )
    
    with app.app_context():
        print(f"Connecting to database: {app.config['SQLALCHEMY_DATABASE_URI']}...")
        
        print("Creating missing tables...")
        db.create_all()
        print("Tables created (if they didn't exist).")

        print("Checking 'visitors' table schema...")
        
        # Check if columns exist
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('visitors')]
        print(f"Existing columns: {columns}")
        
        # Postgres types - Comprehensive list based on OrganizationVisitor model
        missing_columns = {
            'email': 'VARCHAR(255)',
            'mobile_number': 'VARCHAR(20)', 
            'visitor_type': 'VARCHAR(50) DEFAULT \'guest\'',
            'is_vip': 'BOOLEAN DEFAULT FALSE',
            'is_recurring': 'BOOLEAN DEFAULT FALSE',
            'visit_frequency': 'INTEGER DEFAULT 0',
            'last_visit_date': 'TIMESTAMP',
            
            'host_name': 'VARCHAR(255)',
            'host_phone': 'VARCHAR(20)',
            'company_name': 'VARCHAR(255)',
            'company_address': 'TEXT',
            
            'is_pre_registered': 'BOOLEAN DEFAULT FALSE',
            'pre_registration_status': 'VARCHAR(50)',
            'scheduled_arrival_time': 'TIMESTAMP',
            'scheduled_departure_time': 'TIMESTAMP',
            
            'check_out_time': 'TIMESTAMP',
            'is_checked_in': 'BOOLEAN DEFAULT TRUE',
            'expected_duration_hours': 'FLOAT',
            'actual_duration_hours': 'FLOAT',
            'current_floor': 'VARCHAR(100)',
            
            'badge_number': 'VARCHAR(50)',
            'badge_status': 'VARCHAR(50)',
            'badge_printed_at': 'TIMESTAMP',
            'group_visit_id': 'VARCHAR(36)',
            
            'id_proof_type': 'VARCHAR(50)',
            'id_proof_number': 'VARCHAR(100)',
            'id_proof_image_path': 'VARCHAR(500)',
            'photo_path': 'VARCHAR(500)',
            
            'emergency_contact_name': 'VARCHAR(255)',
            'emergency_contact_phone': 'VARCHAR(20)',
            
            'temperature': 'FLOAT',
            'health_declaration_status': 'VARCHAR(50)',
            'vaccination_verified': 'BOOLEAN DEFAULT FALSE',
            
            'nda_signed': 'BOOLEAN DEFAULT FALSE',
            'nda_signed_at': 'TIMESTAMP',
            
            'assets_carried': 'JSON',
            'work_completed_proof': 'VARCHAR(500)',
            
            'delivery_package_count': 'INTEGER',
            'delivery_recipient_name': 'VARCHAR(255)',            
            'special_instructions': 'TEXT',
            
            'vehicle_number': 'VARCHAR(20)',
            'vehicle_type': 'VARCHAR(50)',
            'vehicle_model': 'VARCHAR(100)',
            'parking_slot': 'VARCHAR(50)',
            'vehicle_check_status': 'JSON',
            'material_declaration': 'TEXT',
            'vehicle_photos': 'JSON',
            'vehicle_security_check_notes': 'TEXT',
            
            'feedback_rating': 'INTEGER',
            'feedback_comments': 'TEXT'
        }
        
        with db.engine.connect() as conn:
            # Begin transaction
            trans = conn.begin()
            try:
                for col, type_ in missing_columns.items():
                    if col not in columns:
                        print(f"Adding missing column: {col}...")
                        try:
                            # Postgres supports IF NOT EXISTS for columns in newer versions, else catch error
                            conn.execute(text(f"ALTER TABLE visitors ADD COLUMN IF NOT EXISTS {col} {type_}"))
                            print(f"Successfully added {col}")
                        except Exception as e:
                            print(f"Error adding {col}: {e}")
                trans.commit()
                print("Database repair complete for VISITORS table.")
            except Exception as e:
                trans.rollback()
                print(f"Transaction failed for visitors: {e}")

        # ==========================================
        # LPR LOGS MIGRATION
        # ==========================================
        print("\nChecking 'lpr_logs' table schema...")
        inspector = db.inspect(db.engine)
        lpr_columns = [col['name'] for col in inspector.get_columns('lpr_logs')]
        print(f"Existing columns: {lpr_columns}")

        lpr_missing_columns = {
            'driver_name': 'VARCHAR(100)',
            'driver_phone': 'VARCHAR(20)',
            'driver_license_id': 'VARCHAR(50)',
            'checklist_status': 'JSON',
            'vehicle_photos': 'JSON',
            'material_declaration': 'TEXT',
            'vehicle_security_check_notes': 'TEXT',
            'gate_pass_id': 'VARCHAR(50)',
            'gate_name': 'VARCHAR(100)',
            'category': 'VARCHAR(20) DEFAULT \'visitor\'',
            'status': 'VARCHAR(20) DEFAULT \'allowed\'',
            'confidence_score': 'FLOAT DEFAULT 0.0',
            'processing_time_ms': 'INTEGER DEFAULT 0',
            'exit_time': 'TIMESTAMP',
            'duration_minutes': 'INTEGER',
            'is_overstay': 'BOOLEAN DEFAULT FALSE',
            'vehicle_image_url': 'VARCHAR(512)',
            'plate_image_url': 'VARCHAR(512)',
            'camera_id': 'VARCHAR(36)'
        }
        
        with db.engine.connect() as conn:
            trans = conn.begin()
            try:
                for col, type_ in lpr_missing_columns.items():
                    if col not in lpr_columns:
                        print(f"Adding missing column to lpr_logs: {col}...")
                        try:
                            conn.execute(text(f"ALTER TABLE lpr_logs ADD COLUMN IF NOT EXISTS {col} {type_}"))
                            print(f"Successfully added {col}")
                        except Exception as e:
                            print(f"Error adding {col}: {e}")
                trans.commit()
                print("Database repair complete for LPR_LOGS table.")
            except Exception as e:
                trans.rollback()
                print(f"Transaction failed for lpr_logs: {e}")

        # ==========================================
        # LPR HOTLIST MIGRATION
        # ==========================================
        print("\nChecking 'lpr_hotlist' table schema...")
        hotlist_columns = [col['name'] for col in inspector.get_columns('lpr_hotlist')]
        
        hotlist_missing = {
            'fir_number': 'VARCHAR(100)',
            'reporting_officer': 'VARCHAR(100)',
            'severity': 'VARCHAR(20) DEFAULT \'warning\''
        }
        
        with db.engine.connect() as conn:
            trans = conn.begin()
            try:
                for col, type_ in hotlist_missing.items():
                    if col not in hotlist_columns:
                        print(f"Adding missing column to lpr_hotlist: {col}...")
                        try:
                            conn.execute(text(f"ALTER TABLE lpr_hotlist ADD COLUMN IF NOT EXISTS {col} {type_}"))
                            print(f"Successfully added {col}")
                        except Exception as e:
                            print(f"Error adding {col}: {e}")
                trans.commit()
            except Exception as e:
                trans.rollback()
                print(f"Transaction failed for lpr_hotlist: {e}")

        # ==========================================
        # LPR WHITELIST MIGRATION
        # ==========================================
        print("\nChecking 'lpr_whitelist' table schema...")
        whitelist_columns = [col['name'] for col in inspector.get_columns('lpr_whitelist')]
        
        whitelist_missing = {
            'designation': 'VARCHAR(100)',
            'department': 'VARCHAR(100)',
            'priority': 'VARCHAR(20) DEFAULT \'medium\'',
            'access_zones': 'VARCHAR(255) DEFAULT \'all\'',
            'valid_until': 'TIMESTAMP'
        }
        
        with db.engine.connect() as conn:
            trans = conn.begin()
            try:
                for col, type_ in whitelist_missing.items():
                    if col not in whitelist_columns:
                        print(f"Adding missing column to lpr_whitelist: {col}...")
                        try:
                            conn.execute(text(f"ALTER TABLE lpr_whitelist ADD COLUMN IF NOT EXISTS {col} {type_}"))
                            print(f"Successfully added {col}")
                        except Exception as e:
                            print(f"Error adding {col}: {e}")
                trans.commit()
            except Exception as e:
                trans.rollback()
                print(f"Transaction failed for lpr_whitelist: {e}")

if __name__ == '__main__':
    fix_database()