from ..extensions import db
from datetime import datetime
import uuid


class OrganizationVisitor(db.Model):
    """
    Visitor master data - stores basic visitor information.
    Each visitor can have multiple visit records in VisitorHistoryDetails.
    """
    __tablename__ = "visitors"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Visitor basic information
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=True, index=True)
    phone = db.Column(db.String(20), nullable=False, index=True)
    gender = db.Column(db.String(50), nullable=True)  # Male, Female, Other, Prefer not to say
    
    # Relationships
    organization = db.relationship('Organization', backref='visitors')
    visit_history = db.relationship('VisitorHistoryDetails', backref='visitor', cascade='all, delete-orphan')
    movement_logs = db.relationship('VisitorMovementLog', backref='visitor', cascade='all, delete-orphan')
    alerts = db.relationship('VisitorAlert', backref='visitor', cascade='all, delete-orphan')
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Methods to work with unified Image table
    def get_images(self):
        """Get all images associated with this visitor"""
        from .image import Image
        return Image.query.filter_by(
            entity_type='visitor',
            entity_id=self.id,
            organization_id=self.organization_id,
            deleted=False
        ).all()
    
    def get_primary_image(self):
        """Get the primary/main photo of this visitor"""
        from .image import Image
        return Image.query.filter_by(
            entity_type='visitor',
            entity_id=self.id,
            organization_id=self.organization_id,
            primary=True,
            deleted=False,
            is_active=True
        ).first()

    def __repr__(self):
        return f"<OrganizationVisitor {self.name} - {self.phone} at {self.organization_id}>"


class VisitorHistoryDetails(db.Model):
    """
    Visitor visit history - stores details of each visit.
    Each visitor can have multiple visits tracked here.
    """
    __tablename__ = "visitor_history_details"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Visit details
    visitor_type = db.Column(db.String(50), nullable=False, default='guest')  # guest, contractor, vendor, etc
    host_name = db.Column(db.String(255), nullable=True)
    host_number = db.Column(db.String(20), nullable=True)
    purpose_of_visit = db.Column(db.String(500), nullable=False)
    allowed_floor = db.Column(db.String(100), nullable=False)
    allowed_tower = db.Column(db.String(100), nullable=True)
    
    # Duration
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=True)
    
    # Check-in/Check-out tracking
    check_in_time = db.Column(db.DateTime, nullable=True)
    check_out_time = db.Column(db.DateTime, nullable=True)
    is_checked_in = db.Column(db.Boolean, default=False)
    
    # Current location
    current_floor = db.Column(db.String(100), nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref='visitor_history')

    def __repr__(self):
        return f"<VisitorHistoryDetails {self.visitor_id} - {self.purpose_of_visit}>"


class VisitorMovementLog(db.Model):
    """
    Tracks visitor movement between floors.
    """
    __tablename__ = "visitor_movement_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    
    # Floor information
    floor = db.Column(db.String(100), nullable=False)
    entry_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    exit_time = db.Column(db.DateTime, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f"<VisitorMovementLog {self.visitor_id} -> {self.floor}>"


class VisitorAlert(db.Model):
    """
    Tracks alerts triggered when visitor enters unauthorized floor.
    """
    __tablename__ = "visitor_alerts"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Alert details
    alert_type = db.Column(db.String(50), nullable=False, default='floor_violation')  # floor_violation, overstay, etc.
    current_floor = db.Column(db.String(100), nullable=False)
    allowed_floor = db.Column(db.String(100), nullable=False)
    
    # Alert timing
    alert_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    acknowledged = db.Column(db.Boolean, default=False)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    
    # Additional details
    details = db.Column(db.JSON, default={})
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    organization = db.relationship('Organization', backref='visitor_alerts')

    def __repr__(self):
        return f"<VisitorAlert {self.visitor_id} - {self.alert_type}>"



