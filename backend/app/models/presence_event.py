from ..extensions import db
from datetime import datetime
import uuid


class PresenceEvent(db.Model):
    """
    Raw presence detection events from cameras.
    Every face detection creates a presence event that can be reviewed and approved.
    """
    __tablename__ = "presence_events"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Organization relationship (for tenant isolation)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="presence_events")
    
    # Employee relationship (can be null for unknown faces)
    employee_id = db.Column(db.String(36), db.ForeignKey("employees.id"), nullable=True, index=True)
    employee = db.relationship("Employee", back_populates="presence_events")
    
    # Camera relationship
    camera_id = db.Column(db.String(36), db.ForeignKey("cameras.id"), nullable=False, index=True)
    camera = db.relationship("Camera", back_populates="presence_events")
    
    # Location relationship
    location_id = db.Column(db.String(36), db.ForeignKey("locations.id"), nullable=False, index=True)
    location = db.relationship("Location", back_populates="presence_events")
    
    # Event details
    event_type = db.Column(db.String(20), nullable=False)  # CHECK_IN, CHECK_OUT (from camera_type)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Face recognition details
    confidence_score = db.Column(db.Float)  # Face match confidence (0-1)
    liveness_verified = db.Column(db.Boolean, default=False)  # Liveness check passed
    liveness_score = db.Column(db.Float)  # Liveness confidence
    
    # Face detection metadata
    face_bbox = db.Column(db.JSON)  # Bounding box coordinates
    face_quality_score = db.Column(db.Float)  # Face image quality
    
    # Image reference (optional, for review)
    image_url = db.Column(db.String(512))  # Cloud storage URL (encrypted/anonymized)
    
    # Review workflow
    review_status = db.Column(
        db.String(20), 
        nullable=False, 
        default="pending"
    )  # pending, approved, rejected, auto_approved
    
    reviewed_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    reviewer = db.relationship("User")
    reviewed_at = db.Column(db.DateTime, nullable=True)
    review_notes = db.Column(db.Text)
    
    # Linked attendance record (after approval)
    attendance_record_id = db.Column(db.String(36), db.ForeignKey("attendance_records.id"), nullable=True)
    attendance_record = db.relationship("AttendanceRecord")
    
    # Device/system info
    device_info = db.Column(db.JSON)  # Camera device details
    processing_time_ms = db.Column(db.Integer)  # Time taken for face recognition
    
    # Flags
    is_unknown_face = db.Column(db.Boolean, default=False)  # Face detected but not recognized
    is_anomaly = db.Column(db.Boolean, default=False)  # Flagged for manual review
    anomaly_reason = db.Column(db.String(255))  # Why flagged (low confidence, no check-in, etc.)
    
    # Audit timestamp
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes for common queries
    __table_args__ = (
        db.Index("idx_org_timestamp", "organization_id", "timestamp"),
        db.Index("idx_emp_timestamp", "employee_id", "timestamp"),
        db.Index("idx_camera_timestamp", "camera_id", "timestamp"),
        db.Index("idx_review_status", "review_status", "organization_id"),
    )

    def to_dict(self, include_employee=True, include_camera=True):
        """Convert presence event to dictionary"""
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "employee_id": self.employee_id,
            "camera_id": self.camera_id,
            "location_id": self.location_id,
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "confidence_score": self.confidence_score,
            "liveness_verified": self.liveness_verified,
            "liveness_score": self.liveness_score,
            "face_quality_score": self.face_quality_score,
            "review_status": self.review_status,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "review_notes": self.review_notes,
            "is_unknown_face": self.is_unknown_face,
            "is_anomaly": self.is_anomaly,
            "anomaly_reason": self.anomaly_reason,
            "processing_time_ms": self.processing_time_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        
        if include_employee and self.employee:
            data["employee"] = {
                "id": self.employee.id,
                "employee_code": self.employee.employee_code,
                "full_name": self.employee.full_name,
            }
        
        if include_camera and self.camera:
            data["camera"] = {
                "id": self.camera.id,
                "name": self.camera.name,
                "camera_type": self.camera.camera_type,
            }
        
        if self.location:
            data["location"] = {
                "id": self.location.id,
                "name": self.location.name,
                "location_type": self.location.location_type,
            }
        
        return data

    def approve(self, reviewer_id, notes=None):
        """Approve presence event"""
        self.review_status = "approved"
        self.reviewed_by = reviewer_id
        self.reviewed_at = datetime.utcnow()
        self.review_notes = notes

    def reject(self, reviewer_id, notes=None):
        """Reject presence event"""
        self.review_status = "rejected"
        self.reviewed_by = reviewer_id
        self.reviewed_at = datetime.utcnow()
        self.review_notes = notes

    def __repr__(self):
        return f"<PresenceEvent {self.event_type} at {self.timestamp}>"
