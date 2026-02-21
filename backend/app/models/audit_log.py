from ..extensions import db
from datetime import datetime
import uuid


class AuditLog(db.Model):
    """
    Audit trail for all system actions.
    Tracks who did what and when.
    """
    __tablename__ = "audit_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # User who performed the action
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    user = db.relationship("User", back_populates="audit_logs")
    
    # Organization context (for tenant isolation)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=True, index=True)
    organization = db.relationship("Organization", back_populates="audit_logs")
    
    # Action details
    action = db.Column(db.String(50), nullable=False, index=True)  # create, update, delete, login, etc.
    entity_type = db.Column(db.String(50), nullable=False)  # table/model name
    entity_id = db.Column(db.String(36), nullable=False)  # record id
    
    # Change tracking (JSON)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    
    # Request metadata
    ip_address = db.Column(db.String(45))  # IPv4 or IPv6
    user_agent = db.Column(db.Text)
    
    # Timestamp
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Indexes for common queries
    __table_args__ = (
        db.Index("idx_user_created", "user_id", "created_at"),
        db.Index("idx_org_created", "organization_id", "created_at"),
        db.Index("idx_entity", "entity_type", "entity_id"),
    )

    def to_dict(self):
        """Convert audit log to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "organization_id": self.organization_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "old_values": self.old_values,
            "new_values": self.new_values,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<AuditLog {self.action} on {self.entity_type}:{self.entity_id}>"
