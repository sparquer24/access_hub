from .extensions import db
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime

class UserDetails(db.Model):
    """
    Maps to Postgres table: "User_Details"
    Contains onboarding fields + auth fields used by Login API.
    """
    __tablename__ = "user_details"

    id           = db.Column(db.Integer, primary_key=True)

    # Auth / identity
    login_id     = db.Column(db.String(64), unique=True, nullable=False, index=True)  # "User Name"
    password_hash= db.Column(db.String(128), nullable=False)
    role         = db.Column(db.String(16), nullable=False, default="User")  # Admin|User
    is_active    = db.Column(db.Boolean, nullable=False, default=True)

    # Profile fields (from your onboarding form)
    full_name    = db.Column(db.String(120), nullable=False)
    gender       = db.Column(db.String(16))               # e.g., "Male" | "Female"
    phone_number = db.Column(db.String(32))
    email        = db.Column(db.String(120), unique=False)
    employee_id  = db.Column(db.String(64), unique=False)
    tower        = db.Column(db.String(64))
    building_name = db.Column(db.String(128))

    # Audit
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at   = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



class VisitorDetails(db.Model):
    __tablename__ = "visitor_details"

    aadhaar_id       = db.Column(db.String(12), primary_key=True)  # 12-digit unique
    full_name        = db.Column(db.String(120), nullable=False)
    gender           = db.Column(db.String(16))
    phone_number     = db.Column(db.String(20))
    location         = db.Column(db.String(120))
    purpose_of_visit = db.Column(db.String(255))
    host_to_visit    = db.Column(db.String(120))

    floors           = db.Column(ARRAY(db.String), default=[])
    towers           = db.Column(ARRAY(db.String), default=[])

    duration_from    = db.Column(db.Date)
    duration_to      = db.Column(db.Date)

    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    images = db.relationship("VisitorImage", backref="visitor", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "aadhaar_id": self.aadhaar_id,
            "full_name": self.full_name,
            "gender": self.gender,
            "phone_number": self.phone_number,
            "location": self.location,
            "purpose_of_visit": self.purpose_of_visit,
            "host_to_visit": self.host_to_visit,
            "floors": self.floors or [],
            "towers": self.towers or [],
            "duration_from": self.duration_from.isoformat() if self.duration_from else None,
            "duration_to": self.duration_to.isoformat() if self.duration_to else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

class VisitorImage(db.Model):
    __tablename__ = "visitor_images"

    id         = db.Column(db.BigInteger, primary_key=True)
    aadhaar_id = db.Column(db.String(12), db.ForeignKey("visitor_details.aadhaar_id"), nullable=False)
    angle      = db.Column(db.String(16), nullable=False)  # 'straight' | 'right' | 'left'
    file_path  = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("aadhaar_id", "angle", name="uq_visitor_angle"),
    )
