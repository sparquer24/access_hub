from ..extensions import db
from datetime import datetime
import uuid


class Role(db.Model):
    """
    Roles for RBAC (Role-Based Access Control).
    Predefined roles: super_admin, org_admin, employee
    """
    __tablename__ = "roles"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    
    # Permissions stored as JSON
    # Example: {"users": ["create", "read", "update", "delete"], "attendance": ["read", "update"]}
    permissions = db.Column(db.JSON, default={})
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = db.relationship("User", back_populates="role")

    def to_dict(self):
        """Convert role to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "permissions": self.permissions,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def has_permission(self, resource, action):
        """Check if role has specific permission"""
        if not self.permissions:
            return False
        resource_perms = self.permissions.get(resource, [])
        return action in resource_perms or "*" in resource_perms

    def __repr__(self):
        return f"<Role {self.name}>"
