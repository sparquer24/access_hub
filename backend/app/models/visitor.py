from ..extensions import db
from datetime import datetime
import uuid


class OrganizationVisitor(db.Model):
    """
    Organization-level visitor management.
    Tracks basic visitor information (name, email, phone, gender).
    Detailed visit information stored in VisitorHistoryDetail.
    """
    __tablename__ = "visitors"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Visitor information
    visitor_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    mobile_number = db.Column(db.String(20), nullable=False)
    gender = db.Column(db.String(50), nullable=True)

    # Relationships
    organization = db.relationship('Organization', backref='visitors')
    
    # Profile picture relationship via Image table
    @property
    def profile_picture(self):
        """Get primary profile picture for this visitor."""
        from . import Image
        return db.session.query(Image).filter(
            Image.entity_type == 'visitor',
            Image.entity_id == self.id,
            Image.primary == True,
            Image.is_active == True
        ).first()

    def __repr__(self):
        return f"<OrganizationVisitor {self.visitor_name} at {self.organization_id}>"


class VisitorHistoryDetail(db.Model):
    """
    Visit history and details for visitors.
    Stores detailed visit information including host, purpose, floor access, and duration.
    """
    __tablename__ = "visitor_history_details"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    
    # Visit details
    visitor_type = db.Column(db.String(50), nullable=True)  # guest, contractor, vendor, etc.
    host_name = db.Column(db.String(255), nullable=True)
    host_number = db.Column(db.String(20), nullable=True)
    purpose_of_visit = db.Column(db.String(500), nullable=False)
    
    # Access information
    allowed_floor = db.Column(db.String(100), nullable=False)
    allowed_tower = db.Column(db.String(100), nullable=True)
    
    # Duration
    duration_date_from = db.Column(db.DateTime, nullable=True)
    duration_date_to = db.Column(db.DateTime, nullable=True)
    
    # Additional metadata (stored as JSON for flexibility)
    visit_metadata = db.Column(db.JSON, default=dict, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    organization = db.relationship('Organization', backref='visitor_history_details')
    visitor = db.relationship('OrganizationVisitor', backref='history_records', foreign_keys=[visitor_id])

    def __repr__(self):
        return f"<VisitorHistoryDetail {self.id} - {self.organization_id}>"

