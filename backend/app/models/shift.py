from ..extensions import db
from datetime import datetime
import uuid


class Shift(db.Model):
    """
    Work shift definition for employees.
    Defines working hours and days.
    """
    __tablename__ = "shifts"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Organization relationship
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="shifts")
    
    name = db.Column(db.String(128), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    
    # Grace period in minutes for late check-in
    grace_period_minutes = db.Column(db.Integer, default=15)
    
    # Working days (array of integers: 0=Sunday, 1=Monday, ..., 6=Saturday)
    # Example: [1,2,3,4,5] for Monday to Friday
    working_days = db.Column(db.JSON, default=[1, 2, 3, 4, 5])
    
    # Status
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employees = db.relationship("Employee", back_populates="shift")

    def to_dict(self):
        """Convert shift to dictionary"""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "grace_period_minutes": self.grace_period_minutes,
            "working_days": self.working_days,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Shift {self.name}>"
