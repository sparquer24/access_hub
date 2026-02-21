from app import create_app
from app.extensions import db
from app.models import LeaveRequest
from datetime import datetime

app = create_app()

with app.app_context():
    # List all pending requests
    pending = LeaveRequest.query.filter_by(status='pending').all()
    
    print(f"Found {len(pending)} pending leave requests.")
    
    for req in pending:
        print(f" - ID: {req.id}")
        print(f"   Dates: {req.start_date} to {req.end_date}")
        print(f"   Employee: {req.employee_id}")
        print(f"   Reason: {req.reason}")
        
        # Delete it
        db.session.delete(req)
        print("   -> DELETED")
        
    db.session.commit()
    print("All pending leave requests have been cleared.")
