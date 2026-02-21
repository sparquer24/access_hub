from ..extensions import db
from datetime import datetime
import uuid


class Organization(db.Model):
    """
    Organization/Company entity for multi-tenant support.
    Each organization can have multiple departments and employees.
    """
    __tablename__ = "organizations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), unique=True, nullable=False, index=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    address = db.Column(db.Text)
    contact_email = db.Column(db.String(120))
    contact_phone = db.Column(db.String(32))
    
    # Subscription management
    subscription_tier = db.Column(
        db.String(20), 
        nullable=False, 
        default="free"
    )  # free, basic, premium, enterprise
    
    # New subscription plan field (maps to subscription_tier)
    subscription_plan = db.Column(
        db.String(20),
        nullable=False,
        default="free"
    )  # free, starter, professional, enterprise
    
    # Feature configuration (JSON)
    # Example: {"visitor_management": true, "employee_attendance": true}
    enabled_features = db.Column(db.JSON, default={})
    
    # Organization type (Phase-1 requirement)
    organization_type = db.Column(
        db.String(50),
        nullable=False,
        default="office"
    )  # school, office, apartment, home, hospital, retail, warehouse, factory, hotel, restaurant, gym, other
    
    # Timezone for attendance calculations
    timezone = db.Column(db.String(50), default="UTC")  # e.g., "Asia/Kolkata", "America/New_York"
    
    # Working hours configuration (JSON)
    # Example: {"start": "09:00", "end": "18:00", "days": [1,2,3,4,5]}
    working_hours = db.Column(db.JSON, default={})
    
    # Organization-specific settings (JSON)
    settings = db.Column(db.JSON, default={})
    
    # Status
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete
    
    # Relationships
    departments = db.relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    employees = db.relationship("Employee", back_populates="organization", cascade="all, delete-orphan")
    users = db.relationship("User", back_populates="organization")
    shifts = db.relationship("Shift", back_populates="organization", cascade="all, delete-orphan")
    attendance_records = db.relationship("AttendanceRecord", back_populates="organization")
    face_embeddings = db.relationship("FaceEmbedding", back_populates="organization")
    leave_requests = db.relationship("LeaveRequest", back_populates="organization")
    attendance_change_requests = db.relationship("AttendanceChangeRequest", back_populates="organization")
    audit_logs = db.relationship("AuditLog", back_populates="organization")
    locations = db.relationship("Location", back_populates="organization", cascade="all, delete-orphan")
    cameras = db.relationship("Camera", back_populates="organization", cascade="all, delete-orphan")
    presence_events = db.relationship("PresenceEvent", back_populates="organization")

    def to_dict(self):
        """Convert organization to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "address": self.address,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "organization_type": self.organization_type,
            "timezone": self.timezone,
            "working_hours": self.working_hours,
            "subscription_tier": self.subscription_tier,
            "subscription_plan": self.subscription_plan,
            "enabled_features": self.enabled_features or {},
            "settings": self.settings,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Organization {self.name} ({self.code})>"