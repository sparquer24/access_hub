from ..extensions import db
from datetime import datetime
import uuid


class LeaveRequest(db.Model):
    """
    Leave request management for employees.
    Handles leave applications and approvals.
    """
    __tablename__ = "leave_requests"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Employee relationship
    employee_id = db.Column(db.String(36), db.ForeignKey("employees.id"), nullable=False, index=True)
    employee = db.relationship("Employee", back_populates="leave_requests")
    
    # Organization relationship (for tenant isolation)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="leave_requests")
    
    # Leave type
    leave_type = db.Column(
        db.String(20), 
        nullable=False
    )  # sick, casual, earned, unpaid
    
    duration_type = db.Column(
        db.String(20),
        default='full_day'
    ) # full_day, half_day

    
    # Leave dates
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Float, nullable=False)  # Can be fractional for half days
    
    # Leave details
    reason = db.Column(db.Text, nullable=False)
    
    # Approval workflow
    status = db.Column(
        db.String(20), 
        nullable=False, 
        default="pending"
    )  # pending, approved, rejected
    
    approved_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    approver = db.relationship("User", foreign_keys=[approved_by], overlaps="approved_leaves")
    approval_notes = db.Column(db.Text)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_employee=False):
        """Convert leave request to dictionary"""
        data = {
            "id": self.id,
            "employee_id": self.employee_id,
            "organization_id": self.organization_id,
            "leave_type": self.leave_type,
            "duration_type": self.duration_type,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "total_days": self.total_days,
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
        
        return data

    def __repr__(self):
        return f"<LeaveRequest {self.id} - {self.employee_id} ({self.status})>"
