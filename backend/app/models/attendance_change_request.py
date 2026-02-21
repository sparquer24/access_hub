from ..extensions import db
from datetime import datetime
import uuid


class AttendanceChangeRequest(db.Model):
    """
    Attendance change requests from employees.
    Allows employees to request corrections to their attendance records.
    """
    __tablename__ = "attendance_change_requests"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Employee relationship
    employee_id = db.Column(db.String(36), db.ForeignKey("employees.id"), nullable=False, index=True)
    employee = db.relationship("Employee", back_populates="attendance_change_requests")
    
    # Organization relationship (for tenant isolation)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="attendance_change_requests")
    
    # Attendance record relationship (nullable for new check-ins)
    attendance_record_id = db.Column(db.String(36), db.ForeignKey("attendance_records.id"), nullable=True)
    attendance_record = db.relationship("AttendanceRecord", foreign_keys=[attendance_record_id])
    
    # Request details
    request_date = db.Column(db.Date, nullable=False, index=True)
    request_type = db.Column(
        db.String(20), 
        nullable=False
    )  # manual_checkin, time_correction, status_change
    
    # Requested changes stored as JSON for flexibility
    # Example: {"check_in_time": "2024-01-15T09:00:00", "check_out_time": "2024-01-15T17:00:00"}
    requested_changes = db.Column(db.JSON, nullable=False)
    
    # Employee's explanation
    reason = db.Column(db.Text, nullable=False)
    
    # Approval workflow
    status = db.Column(
        db.String(20), 
        nullable=False, 
        default="pending"
    )  # pending, approved, rejected
    
    approved_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    approver = db.relationship("User", foreign_keys=[approved_by])
    approval_notes = db.Column(db.Text)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_employee=False, include_attendance=False):
        """Convert attendance change request to dictionary"""
        data = {
            "id": self.id,
            "employee_id": self.employee_id,
            "organization_id": self.organization_id,
            "attendance_record_id": self.attendance_record_id,
            "request_date": self.request_date.isoformat() if self.request_date else None,
            "request_type": self.request_type,
            "requested_changes": self.requested_changes,
            "reason": self.reason,
            "status": self.status,
            "approved_by": self.approved_by,
            "approval_notes": self.approval_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_employee and self.employee:
            data["employee"] = {
                "id": self.employee.id,
                "employee_code": self.employee.employee_code,
                "full_name": self.employee.full_name,
                "department": self.employee.department.name if self.employee.department else None,
            }
        
        if include_attendance and self.attendance_record:
            data["current_attendance"] = {
                "check_in_time": self.attendance_record.check_in_time.isoformat() if self.attendance_record.check_in_time else None,
                "check_out_time": self.attendance_record.check_out_time.isoformat() if self.attendance_record.check_out_time else None,
                "status": self.attendance_record.status,
                "work_hours": self.attendance_record.work_hours,
            }
        
        return data

    def __repr__(self):
        return f"<AttendanceChangeRequest {self.id} - {self.employee_id} ({self.status})>"
