from ..extensions import db
from datetime import datetime
import uuid


class User(db.Model):
    """
    Unified authentication table for all users.
    Links to Employee for profile data.
    """
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Role relationship
    role_id = db.Column(db.String(36), db.ForeignKey("roles.id"), nullable=False, index=True)
    role = db.relationship("Role", back_populates="users")
    
    # Organization relationship (nullable for super_admin)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=True, index=True)
    organization = db.relationship("Organization", back_populates="users")
    
    # Status and metadata
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete
    
    # Relationships
    employee = db.relationship("Employee", back_populates="user", uselist=False)
    approved_attendance = db.relationship("AttendanceRecord", foreign_keys="AttendanceRecord.approved_by")
    approved_leaves = db.relationship("LeaveRequest", foreign_keys="LeaveRequest.approved_by")
    audit_logs = db.relationship("AuditLog", back_populates="user")

    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary"""
        data = {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "role": self.role.to_dict() if self.role else None,
            "organization_id": self.organization_id,
            "is_active": self.is_active,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        # Include employee data if available. Guard against missing tables
        # or lazy-load errors (e.g., migrations not applied yet).
        try:
            if self.employee:
                data["employee"] = self.employee.to_dict(include_user=False)
        except Exception:
            data["employee"] = None
        
        return data

    def has_permission(self, resource, action):
        """Check if user has specific permission"""
        return self.role.has_permission(resource, action) if self.role else False

    def __repr__(self):
        return f"<User {self.username} ({self.email})>"
