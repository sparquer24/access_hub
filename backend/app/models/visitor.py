from ..extensions import db
from datetime import datetime
import uuid


class OrganizationVisitor(db.Model):
    """
    Organization-level visitor management.
    Tracks visitors at the organization level with image storage via unified Image table.
    """
    __tablename__ = "visitors"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Visitor information
    visitor_name = db.Column(db.String(255), nullable=False)
    mobile_number = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    purpose_of_visit = db.Column(db.String(500), nullable=False)
    allowed_floor = db.Column(db.String(100), nullable=False)
    
    # Visitor type and classification
    visitor_type = db.Column(db.String(50), nullable=False, default='guest')  # guest, contractor, vendor, interview_candidate, delivery, service_provider, vip
    is_vip = db.Column(db.Boolean, default=False)
    is_recurring = db.Column(db.Boolean, default=False)
    visit_frequency = db.Column(db.Integer, default=0)
    last_visit_date = db.Column(db.DateTime, nullable=True)
    
    # Host contact information (no employee FK)
    host_name = db.Column(db.String(255), nullable=True)
    host_phone = db.Column(db.String(20), nullable=True)
    
    # Company information (for contractors/vendors)
    company_name = db.Column(db.String(255), nullable=True)
    company_address = db.Column(db.Text, nullable=True)
    
    # Pre-registration
    is_pre_registered = db.Column(db.Boolean, default=False)
    pre_registration_status = db.Column(db.String(50), nullable=True)  # pending, approved, rejected, cancelled
    scheduled_arrival_time = db.Column(db.DateTime, nullable=True)
    scheduled_departure_time = db.Column(db.DateTime, nullable=True)
    
    # Check-in/Check-out tracking
    check_in_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    check_out_time = db.Column(db.DateTime, nullable=True)
    is_checked_in = db.Column(db.Boolean, default=True)
    expected_duration_hours = db.Column(db.Float, nullable=True)
    actual_duration_hours = db.Column(db.Float, nullable=True)
    
    # Movement tracking
    current_floor = db.Column(db.String(100), nullable=True)
    
    # Badge management
    badge_number = db.Column(db.String(50), nullable=True, unique=True)
    badge_status = db.Column(db.String(50), nullable=True)  # issued, returned, lost, damaged
    badge_printed_at = db.Column(db.DateTime, nullable=True)
    
    # Group visit
    group_visit_id = db.Column(db.String(36), db.ForeignKey('group_visits.id'), nullable=True)
    
    # ID verification
    id_proof_type = db.Column(db.String(50), nullable=True)  # passport, drivers_license, national_id, other
    id_proof_number = db.Column(db.String(100), nullable=True)
    id_proof_image_path = db.Column(db.String(500), nullable=True)
    
    # Photo capture
    photo_path = db.Column(db.String(500), nullable=True)
    
    # Emergency contact
    emergency_contact_name = db.Column(db.String(255), nullable=True)
    emergency_contact_phone = db.Column(db.String(20), nullable=True)
    
    # Health screening
    temperature = db.Column(db.Float, nullable=True)
    health_declaration_status = db.Column(db.String(50), nullable=True)  # passed, failed, not_required
    vaccination_verified = db.Column(db.Boolean, default=False)
    
    # Document signing
    nda_signed = db.Column(db.Boolean, default=False)
    nda_signed_at = db.Column(db.DateTime, nullable=True)
    
    # Assets tracking
    assets_carried = db.Column(db.JSON, default=list)
    
    # Contractor-specific fields
    work_completed_proof = db.Column(db.String(500), nullable=True)  # path to signature/photo
    
    # Delivery-specific fields
    delivery_package_count = db.Column(db.Integer, nullable=True)
    delivery_recipient_name = db.Column(db.String(255), nullable=True)
    
    # VIP-specific fields
    special_instructions = db.Column(db.Text, nullable=True)
    
    # Vehicle Information
    vehicle_number = db.Column(db.String(20), nullable=True)
    vehicle_type = db.Column(db.String(50), nullable=True)  # car, bike, truck, van
    vehicle_model = db.Column(db.String(100), nullable=True)
    parking_slot = db.Column(db.String(50), nullable=True)
    vehicle_check_status = db.Column(db.JSON, default=dict)  # Stores checklist results
    material_declaration = db.Column(db.Text, nullable=True) # Material inward declaration
    vehicle_photos = db.Column(db.JSON, default=list) # List of image IDs or paths
    vehicle_security_check_notes = db.Column(db.Text, nullable=True) # Detailed observations
    
    # Feedback
    feedback_rating = db.Column(db.Integer, nullable=True)  # 1-5
    feedback_comments = db.Column(db.Text, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = db.relationship('Organization', backref='visitors')
    movement_logs = db.relationship('VisitorMovementLog', backref='visitor', cascade='all, delete-orphan')
    alerts = db.relationship('VisitorAlert', backref='visitor', cascade='all, delete-orphan')
    
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
        return f"<OrganizationVisitor {self.visitor_name} at {self.organization_id}>"


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


class VisitorBlacklist(db.Model):
    """
    Tracks blacklisted visitors to prevent unauthorized entry.
    """
    __tablename__ = "visitor_blacklist"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Blacklist criteria
    phone_number = db.Column(db.String(20), nullable=True, index=True)
    email = db.Column(db.String(255), nullable=True, index=True)
    id_proof_number = db.Column(db.String(100), nullable=True, index=True)
    visitor_name = db.Column(db.String(255), nullable=True)
    
    # Blacklist details
    reason = db.Column(db.String(100), nullable=False)  # security_threat, policy_violation, previous_incident, other
    severity = db.Column(db.String(50), nullable=False, default='warning')  # warning, restricted, banned
    notes = db.Column(db.Text, nullable=True)
    watchlist_type = db.Column(db.String(50), default='internal')  # internal, external_integration
    
    # Blacklist period
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)  # null = permanent
    
    # Audit
    added_by = db.Column(db.String(36), nullable=True)  # user_id who added to blacklist
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref='blacklist_entries')

    def __repr__(self):
        return f"<VisitorBlacklist {self.visitor_name or self.phone_number} - {self.severity}>"


class VisitorPreRegistration(db.Model):
    """
    Pre-registration requests for scheduled visits.
    """
    __tablename__ = "visitor_pre_registrations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Visitor details
    visitor_name = db.Column(db.String(255), nullable=False)
    mobile_number = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    company_name = db.Column(db.String(255), nullable=True)
    purpose_of_visit = db.Column(db.String(500), nullable=False)
    
    # Host information
    host_name = db.Column(db.String(255), nullable=True)
    host_phone = db.Column(db.String(20), nullable=True)
    
    # Schedule
    scheduled_arrival_time = db.Column(db.DateTime, nullable=False)
    scheduled_departure_time = db.Column(db.DateTime, nullable=True)
    
    # Approval workflow
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, approved, rejected, cancelled, expired
    approved_by = db.Column(db.String(36), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # QR code for quick check-in
    qr_code = db.Column(db.String(500), nullable=True)
    
    # Link to actual visitor record once checked in
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref='pre_registrations')

    def __repr__(self):
        return f"<VisitorPreRegistration {self.visitor_name} - {self.status}>"


class VisitorBadge(db.Model):
    """
    Visitor badge tracking and management.
    """
    __tablename__ = "visitor_badges"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Badge details
    badge_number = db.Column(db.String(50), nullable=False, unique=True)
    badge_type = db.Column(db.String(50), default='standard')  # standard, contractor, vendor, vip
    qr_code_data = db.Column(db.Text, nullable=True)
    
    # Badge status
    status = db.Column(db.String(50), default='issued')  # issued, returned, lost, damaged
    issued_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    returned_at = db.Column(db.DateTime, nullable=True)
    
    # Access permissions
    access_permissions = db.Column(db.JSON, default=dict)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    visitor = db.relationship('OrganizationVisitor', backref='badges')

    def __repr__(self):
        return f"<VisitorBadge {self.badge_number} - {self.status}>"


class GroupVisit(db.Model):
    """
    Group visit management for multiple visitors.
    """
    __tablename__ = "group_visits"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Group details
    group_name = db.Column(db.String(255), nullable=False)
    group_leader_name = db.Column(db.String(255), nullable=True)
    group_leader_phone = db.Column(db.String(20), nullable=True)
    purpose = db.Column(db.String(500), nullable=False)
    
    # Schedule
    scheduled_arrival = db.Column(db.DateTime, nullable=True)
    expected_duration_hours = db.Column(db.Float, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref='group_visits')
    visitors = db.relationship('OrganizationVisitor', backref='group')

    def __repr__(self):
        return f"<GroupVisit {self.group_name}>"


class VisitorDocument(db.Model):
    """
    Signed documents (NDAs, waivers, etc.) for visitors.
    """
    __tablename__ = "visitor_documents"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Document details
    document_type = db.Column(db.String(50), nullable=False)  # nda, liability_waiver, safety_briefing, photo_consent, data_privacy
    document_template_id = db.Column(db.String(36), nullable=True)
    
    # Signature
    signature_data = db.Column(db.Text, nullable=True)  # base64 encoded signature
    signed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Storage
    pdf_path = db.Column(db.String(500), nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    visitor = db.relationship('OrganizationVisitor', backref='signed_documents')

    def __repr__(self):
        return f"<VisitorDocument {self.document_type} for {self.visitor_id}>"


class VisitorHealthScreening(db.Model):
    """
    Health screening records for visitors.
    """
    __tablename__ = "visitor_health_screenings"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Health screening data
    temperature = db.Column(db.Float, nullable=True)
    questionnaire_responses = db.Column(db.JSON, default=dict)
    vaccination_verified = db.Column(db.Boolean, default=False)
    vaccination_type = db.Column(db.String(100), nullable=True)
    
    # Result
    result = db.Column(db.String(50), nullable=False)  # passed, failed
    screener_notes = db.Column(db.Text, nullable=True)
    
    # Audit
    screened_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    screened_by = db.Column(db.String(36), nullable=True)
    
    # Relationships
    visitor = db.relationship('OrganizationVisitor', backref='health_screenings')

    def __repr__(self):
        return f"<VisitorHealthScreening {self.visitor_id} - {self.result}>"


class VisitorAsset(db.Model):
    """
    Track assets carried by visitors (laptops, bags, equipment).
    """
    __tablename__ = "visitor_assets"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    
    # Asset details
    asset_type = db.Column(db.String(100), nullable=False)  # laptop, bag, tools, equipment, other
    description = db.Column(db.String(500), nullable=True)
    serial_number = db.Column(db.String(100), nullable=True)
    security_seal_number = db.Column(db.String(100), nullable=True)
    
    # Verification
    entry_verified = db.Column(db.Boolean, default=True)
    exit_verified = db.Column(db.Boolean, default=False)
    entry_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    exit_time = db.Column(db.DateTime, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    visitor = db.relationship('OrganizationVisitor', backref='assets')

    def __repr__(self):
        return f"<VisitorAsset {self.asset_type} for {self.visitor_id}>"


class ContractorTimeLog(db.Model):
    """
    Track contractor work hours for billing.
    """
    __tablename__ = "contractor_time_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Time tracking
    clock_in_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    clock_out_time = db.Column(db.DateTime, nullable=True)
    billable_hours = db.Column(db.Float, nullable=True)
    
    # Work details
    work_description = db.Column(db.Text, nullable=True)
    work_location = db.Column(db.String(255), nullable=True)
    proof_of_work = db.Column(db.String(500), nullable=True)  # path to signature/photo
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    visitor = db.relationship('OrganizationVisitor', backref='time_logs')

    def __repr__(self):
        return f"<ContractorTimeLog {self.visitor_id} - {self.billable_hours}h>"


class DeliveryLog(db.Model):
    """
    Track delivery personnel and packages.
    """
    __tablename__ = "delivery_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # Delivery details
    package_count = db.Column(db.Integer, nullable=False, default=1)
    package_description = db.Column(db.Text, nullable=True)
    delivery_photo_path = db.Column(db.String(500), nullable=True)
    
    # Recipient
    recipient_name = db.Column(db.String(255), nullable=True)
    recipient_signature = db.Column(db.Text, nullable=True)  # base64 encoded signature
    
    # Status
    status = db.Column(db.String(50), default='pending')  # pending, delivered, rejected
    delivered_at = db.Column(db.DateTime, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    visitor = db.relationship('OrganizationVisitor', backref='deliveries')

    def __repr__(self):
        return f"<DeliveryLog {self.visitor_id} - {self.status}>"


class VIPVisitorPreference(db.Model):
    """
    Store VIP visitor preferences for personalized experience.
    """
    __tablename__ = "vip_visitor_preferences"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'), nullable=False, index=True)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False, index=True)
    
    # VIP details
    vip_tier = db.Column(db.String(50), default='silver')  # platinum, gold, silver
    preferred_greeting = db.Column(db.String(500), nullable=True)
    
    # Special requirements
    dietary_requirements = db.Column(db.Text, nullable=True)
    accessibility_requirements = db.Column(db.Text, nullable=True)
    other_preferences = db.Column(db.JSON, default=dict)
    
    # Facility preparation
    room_preparation_settings = db.Column(db.JSON, default=dict)
    
    # Visit history notes
    previous_visit_notes = db.Column(db.Text, nullable=True)
    
    # Audit
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    visitor = db.relationship('OrganizationVisitor', backref='vip_preferences')

    def __repr__(self):
        return f"<VIPVisitorPreference {self.visitor_id} - {self.vip_tier}>"
