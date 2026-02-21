from ..extensions import db
from datetime import datetime
import uuid

class LPRLog(db.Model):
    """
    Log of all License Plate Recognition events (entries and exits).
    "The Register"
    """
    __tablename__ = "lpr_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    
    # Vehicle Details
    vehicle_number = db.Column(db.String(20), nullable=False, index=True)
    vehicle_image_url = db.Column(db.String(512), nullable=True) # Full car
    plate_image_url = db.Column(db.String(512), nullable=True)   # Crop
    
    # Driver Details (New)
    driver_name = db.Column(db.String(100), nullable=True)
    driver_phone = db.Column(db.String(20), nullable=True)
    driver_license_id = db.Column(db.String(50), nullable=True)

    # Event Details
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    direction = db.Column(db.String(10), nullable=False) # 'entry', 'exit'
    gate_name = db.Column(db.String(100), nullable=True) # e.g., "Main Gate", "Gate 2"
    camera_id = db.Column(db.String(36), db.ForeignKey("cameras.id"), nullable=True)
    
    # Access Status
    status = db.Column(db.String(20), default="allowed") # allowed, denied, flagged
    category = db.Column(db.String(20), default="visitor") # staff, vip, visitor, blacklisted
    
    # Metadata
    confidence_score = db.Column(db.Float, default=0.0)
    processing_time_ms = db.Column(db.Integer, default=0)

    # Exit & Duration Tracking
    exit_time = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True) # Calculated on exit
    is_overstay = db.Column(db.Boolean, default=False)      # Flag for > N hours

    # Inspection / Security (Manual Entry)
    checklist_status = db.Column(db.JSON, default=dict)   # PUC, Insurance, etc.
    vehicle_photos = db.Column(db.JSON, default=list)     # List of manual inspection photos
    material_declaration = db.Column(db.Text, nullable=True) # Material details
    vehicle_security_check_notes = db.Column(db.Text, nullable=True) # Security observations
    gate_pass_id = db.Column(db.String(50), nullable=True)   # Generated Pass ID
    
    # Relationships
    organization = db.relationship("Organization", backref="lpr_logs")
    camera = db.relationship("Camera")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_number": self.vehicle_number,
            "driver_name": self.driver_name,
            "driver_phone": self.driver_phone,
            "driver_license_id": self.driver_license_id,
            "timestamp": self.timestamp.isoformat(),
            "direction": self.direction,
            "gate_name": self.gate_name,
            "status": self.status,
            "category": self.category,
            "vehicle_image_url": self.vehicle_image_url,
            "plate_image_url": self.plate_image_url,
            "checklist_status": self.checklist_status, # Include checklist in dict
            "gate_pass_id": self.gate_pass_id,         # Include gate pass in dict
            "exit_time": self.exit_time.isoformat() if self.exit_time else None,
            "duration_minutes": self.duration_minutes,
            "is_overstay": self.is_overstay
        }


class LPRHotlist(db.Model):
    """
    Blacklist/Hotlist for restricted vehicles.
    """
    __tablename__ = "lpr_hotlist"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    
    # Vehicle Info
    vehicle_number = db.Column(db.String(20), nullable=False, index=True)
    
    # Incident Details (Govt Style)
    reason = db.Column(db.String(255), nullable=False)
    fir_number = db.Column(db.String(100), nullable=True) # First Information Report
    reporting_officer = db.Column(db.String(100), nullable=True)
    severity = db.Column(db.String(20), default="warning") # critical, warning, info
    
    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    organization = db.relationship("Organization", backref="hotlist_vehicles")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_number": self.vehicle_number,
            "reason": self.reason,
            "fir_number": self.fir_number,
            "reporting_officer": self.reporting_officer,
            "severity": self.severity,
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active
        }


class LPRWhitelist(db.Model):
    """
    Whitelist/VIP list for authorized vehicles.
    """
    __tablename__ = "lpr_whitelist"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    
    # Vehicle Info
    vehicle_number = db.Column(db.String(20), nullable=False, index=True)
    
    # Official Details (Govt Style)
    owner_name = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(100), nullable=True) # e.g., "Director General"
    department = db.Column(db.String(100), nullable=True)
    
    # Access Control
    priority = db.Column(db.String(20), default="medium") # high (red beacon), medium, low
    access_zones = db.Column(db.String(255), default="all") # "Gate 1, Gate 2"
    
    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    valid_until = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    organization = db.relationship("Organization", backref="whitelist_vehicles")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_number": self.vehicle_number,
            "owner_name": self.owner_name,
            "designation": self.designation,
            "department": self.department,
            "priority": self.priority,
            "access_zones": self.access_zones,
            "created_at": self.created_at.isoformat(),
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "is_active": self.is_active
        }
