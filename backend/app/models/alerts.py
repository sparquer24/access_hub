from ..extensions import db
from datetime import datetime
import uuid


class Alert(db.Model):
    """
    Unified platform alert table (VMS/AMS/ANPR/analytics).
    DS inserts alerts here. Backend/frontend later updates handling fields.
    """
    __tablename__ = "alerts"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Relationships (FKs)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    visitor_id = db.Column(db.String(36), db.ForeignKey("visitors.id"), nullable=False, index=True)
    camera_id = db.Column(db.String(36), db.ForeignKey("cameras.id"), nullable=False, index=True)

    # Alert payload
    alert_type = db.Column(db.String(50), nullable=False)   # e.g., unauthorized, blacklist_hit, overstay, etc.
    alert_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    annotated_image_base64 = db.Column(db.Text, nullable=True)

    # Handling fields (filled AFTER alert is handled)
    alert_status = db.Column(
        db.String(50),
        nullable=False,
        default="yet_to_handle",  # values: yet_to_handle, handled
        index=True,
    )
    handled_by = db.Column(db.String(36), nullable=True, index=True)  # user id
    handled_at = db.Column(db.DateTime, nullable=True)

    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = db.relationship("Organization", backref="alerts")

    # IMPORTANT: avoid clashing with OrganizationVisitor.alerts (already used for visitor_alerts).
    visitor = db.relationship("OrganizationVisitor", backref="platform_alerts")

    camera = db.relationship("Camera", backref="alerts")

    def __repr__(self):
        return f"<Alert {self.id} type={self.alert_type} status={self.alert_status}>"
