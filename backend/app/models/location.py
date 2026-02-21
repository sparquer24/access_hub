from ..extensions import db
from datetime import datetime
import uuid


class Location(db.Model):
    """
    Physical locations/entry points within an organization.
    Each location can have multiple cameras for check-in/check-out.
    """
    __tablename__ = "locations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Organization relationship
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="locations")
    
    # Location details
    name = db.Column(db.String(255), nullable=False)  # e.g., "Main Gate", "Floor-1 Entry"
    location_type = db.Column(
        db.String(20), 
        nullable=False, 
        default="BOTH"
    )  # ENTRY, EXIT, BOTH
    
    description = db.Column(db.Text)
    
    # Physical address/floor/building info
    building = db.Column(db.String(128))
    floor = db.Column(db.String(50))
    area = db.Column(db.String(128))
    
    # GPS coordinates (optional)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Status
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete
    
    # Relationships
    cameras = db.relationship("Camera", back_populates="location", cascade="all, delete-orphan")
    presence_events = db.relationship("PresenceEvent", back_populates="location")
    
    # Unique constraint: org_id + name
    __table_args__ = (
        db.UniqueConstraint("organization_id", "name", name="uq_org_location_name"),
    )

    def to_dict(self, include_cameras=False):
        """Convert location to dictionary"""
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "location_type": self.location_type,
            "description": self.description,
            "building": self.building,
            "floor": self.floor,
            "area": self.area,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_cameras:
            data["cameras"] = [cam.to_dict() for cam in self.cameras]
        else:
            data["camera_count"] = len(self.cameras)
        
        return data

    def __repr__(self):
        return f"<Location {self.name} ({self.location_type})>"
