from ..extensions import db
from datetime import datetime
import uuid


class Camera(db.Model):
    """
    Camera configuration for face detection and attendance tracking.
    Each camera is assigned to a location and has a specific type (CHECK_IN/CHECK_OUT).
    """
    __tablename__ = "cameras"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Organization relationship
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="cameras")
    
    # Location relationship
    location_id = db.Column(db.String(36), db.ForeignKey("locations.id"), nullable=False, index=True)
    location = db.relationship("Location", back_populates="cameras")
    
    # Camera details
    name = db.Column(db.String(255), nullable=False)  # e.g., "Gate Cam 1", "Floor-2 Exit Cam"
    
    camera_type = db.Column(
        db.String(20), 
        nullable=False
    )  # CHECK_IN, CHECK_OUT, CCTV
    
    # Camera source configuration
    source_type = db.Column(
        db.String(20), 
        nullable=False
    )  # IP_CAMERA, USB_CAMERA, RTSP_STREAM
    
    source_url = db.Column(db.String(512))  # RTSP URL or IP address
    source_config = db.Column(db.JSON)  # Additional camera configuration
    
    # Camera settings
    fps = db.Column(db.Integer, default=10)  # Frames per second for processing
    resolution = db.Column(db.String(20), default="640x480")  # Camera resolution
    
    # Detection settings
    confidence_threshold = db.Column(db.Float, default=0.6)  # Minimum confidence for face match
    liveness_check_enabled = db.Column(db.Boolean, default=True)
    
    # Attendance Management Features
    attendance_enabled = db.Column(db.Boolean, default=True)  # Enable attendance tracking
    visitor_tracking_enabled = db.Column(db.Boolean, default=False)  # Enable visitor management
    people_logs_enabled = db.Column(db.Boolean, default=True)  # Enable people coming/going logs
    
    # Attendance Management Type - defines primary purpose
    management_type = db.Column(
        db.String(20), 
        default="ATTENDANCE"
    )  # ATTENDANCE, VISITORS, PEOPLE_LOGS, MIXED
    
    # Additional settings for attendance management
    auto_check_out_hours = db.Column(db.Integer, default=12)  # Auto check-out after X hours
    require_manual_approval = db.Column(db.Boolean, default=False)  # Require manual approval for entries
    notification_enabled = db.Column(db.Boolean, default=True)  # Send notifications for events
    
    # Status and monitoring
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    last_heartbeat = db.Column(db.DateTime)  # Last time camera was active
    status = db.Column(db.String(20), default="offline")  # online, offline, error
    error_message = db.Column(db.Text)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete
    
    # Relationships
    presence_events = db.relationship("PresenceEvent", back_populates="camera")
    
    # Unique constraint: org_id + name
    __table_args__ = (
        db.UniqueConstraint("organization_id", "name", name="uq_org_camera_name"),
    )

    def to_dict(self, include_location=True):
        """Convert camera to dictionary"""
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "location_id": self.location_id,
            "name": self.name,
            "camera_type": self.camera_type,
            "source_type": self.source_type,
            "source_url": self.source_url,
            "source_config": self.source_config,
            "fps": self.fps,
            "resolution": self.resolution,
            "confidence_threshold": self.confidence_threshold,
            "liveness_check_enabled": self.liveness_check_enabled,
            "attendance_enabled": self.attendance_enabled,
            "visitor_tracking_enabled": self.visitor_tracking_enabled,
            "people_logs_enabled": self.people_logs_enabled,
            "management_type": self.management_type,
            "auto_check_out_hours": self.auto_check_out_hours,
            "require_manual_approval": self.require_manual_approval,
            "notification_enabled": self.notification_enabled,
            "liveness_check_enabled": self.liveness_check_enabled,
            "is_active": self.is_active,
            "status": self.status,
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_location and self.location:
            data["location"] = {
                "id": self.location.id,
                "name": self.location.name,
                "location_type": self.location.location_type,
            }
        
        return data

    def update_heartbeat(self):
        """Update last heartbeat timestamp"""
        self.last_heartbeat = datetime.utcnow()
        self.status = "online"
        db.session.commit()

    def set_error(self, error_message):
        """Set camera error status"""
        self.status = "error"
        self.error_message = error_message
        db.session.commit()

    def __repr__(self):
        return f"<Camera {self.name} ({self.camera_type})>"
