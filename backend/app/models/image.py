from ..extensions import db
from datetime import datetime
import uuid


class Image(db.Model):
    """
    Unified image storage for all users/entities in the system.
    Supports storing images for employees, visitors, and other entities.
    Uses a polymorphic design with entity_type to track what entity owns the image.
    """
    __tablename__ = "images"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Polymorphic reference: can belong to employee, visitor, or other entities
    entity_type = db.Column(db.String(50), nullable=False, index=True)  # 'employee', 'visitor', etc.
    entity_id = db.Column(db.String(36), nullable=False, index=True)  # References employee.id or visitor.id
    
    # Organization context
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    organization = db.relationship('Organization', backref='images')
    
    # Image data (Base64 encoded)
    image_base64 = db.Column(db.Text, nullable=False)
    
    # Image metadata
    image_type = db.Column(db.String(50), default='photo')  # 'photo', 'id_card', 'signature', etc.
    file_name = db.Column(db.String(255), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)  # Size in bytes
    mime_type = db.Column(db.String(50), default='image/jpeg')  # 'image/jpeg', 'image/png', etc.
    
    # Capture details
    captured_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)  # User who captured the image
    capture_device = db.Column(db.String(255), nullable=True)  # 'webcam', 'camera', 'mobile', etc.
    capture_location = db.Column(db.String(255), nullable=True)  # Location where image was captured
    
    # Image usage/purpose
    primary = db.Column(db.Boolean, default=True)  # Is this the primary/main image for the entity?
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    deleted = db.Column(db.Boolean, default=False)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Composite index for quick lookups
    __table_args__ = (
        db.Index('idx_image_entity', 'entity_type', 'entity_id'),
        db.Index('idx_image_org_entity', 'organization_id', 'entity_type', 'entity_id'),
    )

    def __repr__(self):
        return f"<Image {self.id} for {self.entity_type}:{self.entity_id}>"

    def to_dict(self):
        """Convert image record to dictionary"""
        return {
            'id': self.id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'organization_id': self.organization_id,
            'image_base64': self.image_base64,
            'image_type': self.image_type,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'primary': self.primary,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
