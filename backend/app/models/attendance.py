from ..extensions import db
from datetime import datetime
import uuid


class AttendanceRecord(db.Model):
    """
    Daily attendance record for employees.
    Tracks check-in, check-out, and work hours.
    """
    __tablename__ = "attendance_records"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Employee relationship
    employee_id = db.Column(db.String(36), db.ForeignKey("employees.id"), nullable=False, index=True)
    employee = db.relationship("Employee", back_populates="attendance_records")
    
    # Organization relationship (for tenant isolation)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="attendance_records")
    
    # Camera relationship (which camera detected this attendance)
    camera_id = db.Column(db.String(36), db.ForeignKey("cameras.id"), nullable=True, index=True)
    camera = db.relationship("Camera")
    
    # Attendance date
    date = db.Column(db.Date, nullable=False, index=True)
    
    # Check-in/out times
    check_in_time = db.Column(db.DateTime, nullable=True)
    check_out_time = db.Column(db.DateTime, nullable=True)
    
    # Attendance status
    status = db.Column(
        db.String(20), 
        nullable=False, 
        default="present"
    )  # present, absent, half_day, on_leave, holiday
    
    # Computed work hours
    work_hours = db.Column(db.Float, default=0.0)
    
    # Location data (GPS coordinates stored as JSON)
    # Example: {"latitude": 12.345, "longitude": 67.890}
    location_check_in = db.Column(db.JSON)
    location_check_out = db.Column(db.JSON)
    
    # Device information (JSON)
    # Example: {"type": "mobile", "os": "Android", "browser": "Chrome"}
    device_info = db.Column(db.JSON)
    
    # Face recognition confidence score
    face_match_confidence = db.Column(db.Float)
    
    # Liveness verification
    liveness_verified = db.Column(db.Boolean, default=False)
    
    # Review status for manual approval
    review_status = db.Column(
        db.String(20),
        nullable=False,
        default="auto_approved"
    )  # auto_approved, pending, approved, rejected
    
    # Track manual modifications
    is_modified = db.Column(db.Boolean, default=False)
    modified_by_request_id = db.Column(db.String(36), db.ForeignKey("attendance_change_requests.id"), nullable=True)
    
    # Additional notes
    notes = db.Column(db.Text)
    
    # Approval workflow
    approved_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    approver = db.relationship("User", foreign_keys=[approved_by], overlaps="approved_attendance")
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint: one record per employee per date
    __table_args__ = (
        db.UniqueConstraint("employee_id", "date", name="uq_employee_date"),
        db.Index("idx_org_date", "organization_id", "date"),
        db.Index("idx_emp_date", "employee_id", "date"),
    )

    def to_dict(self, include_employee=False):
        """Convert attendance record to dictionary"""
        data = {
            "id": self.id,
            "employee_id": self.employee_id,
            "organization_id": self.organization_id,
            "camera_id": self.camera_id,
            "date": self.date.isoformat() if self.date else None,
            "check_in_time": self.check_in_time.isoformat() if self.check_in_time else None,
            "check_out_time": self.check_out_time.isoformat() if self.check_out_time else None,
            "status": self.status,
            "work_hours": self.work_hours,
            "location_check_in": self.location_check_in,
            "location_check_out": self.location_check_out,
            "device_info": self.device_info,
            "face_match_confidence": self.face_match_confidence,
            "liveness_verified": self.liveness_verified,
            "review_status": self.review_status,
            "is_modified": self.is_modified,
            "modified_by_request_id": self.modified_by_request_id,
            "notes": self.notes,
            "approved_by": self.approved_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_employee and self.employee:
            data["employee"] = {
                "id": self.employee.id,
                "employee_code": self.employee.employee_code,
                "full_name": self.employee.full_name,
                "designation": self.employee.designation,
            }
        
        return data

    def __repr__(self):
        return f"<AttendanceRecord {self.employee_id} on {self.date}>"