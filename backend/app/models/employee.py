from ..extensions import db
from datetime import datetime
import uuid


class Employee(db.Model):
    """
    Employee profile linked to User for authentication.
    Contains all employee-specific information.
    """
    __tablename__ = "employees"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # User relationship (one-to-one)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), unique=True, nullable=False, index=True)
    user = db.relationship("User", back_populates="employee")
    
    # Organization relationship
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="employees")
    
    # Department relationship
    department_id = db.Column(db.String(36), db.ForeignKey("departments.id"), nullable=False, index=True)
    department = db.relationship("Department", back_populates="employees", foreign_keys=[department_id])
    
    # Employee basic info
    employee_code = db.Column(db.String(64), nullable=False)
    full_name = db.Column(db.String(255), nullable=False, index=True)
    gender = db.Column(db.String(20))  # male, female, other
    date_of_birth = db.Column(db.Date)
    phone_number = db.Column(db.String(32))
    
    # Emergency contact (JSON)
    # Example: {"name": "John Doe", "relation": "Father", "phone": "+1234567890"}
    emergency_contact = db.Column(db.JSON)
    
    address = db.Column(db.Text)
    
    # Employment details
    joining_date = db.Column(db.Date)
    designation = db.Column(db.String(128))
    employment_type = db.Column(db.String(20))  # full_time, part_time, contract, intern
    
    # Shift relationship
    shift_id = db.Column(db.String(36), db.ForeignKey("shifts.id"), nullable=True)
    shift = db.relationship("Shift", back_populates="employees")
    
    # Status
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete
    
    # Relationships
    face_embeddings = db.relationship("FaceEmbedding", back_populates="employee", cascade="all, delete-orphan")
    attendance_records = db.relationship("AttendanceRecord", back_populates="employee")
    leave_requests = db.relationship("LeaveRequest", back_populates="employee")
    attendance_change_requests = db.relationship("AttendanceChangeRequest", back_populates="employee")
    # Note: Since Department.manager_id has no FK constraint, we need to specify the join explicitly
    managed_departments = db.relationship(
        "Department",
        primaryjoin="Employee.id==foreign(Department.manager_id)",
        viewonly=True
    )
    presence_events = db.relationship("PresenceEvent", back_populates="employee")
    
    # Images relationship - references the unified Image table
    # Images with entity_type='employee' and entity_id=this.id
    def get_images(self):
        """Get all images associated with this employee"""
        from .image import Image
        return Image.query.filter_by(
            entity_type='employee',
            entity_id=self.id,
            organization_id=self.organization_id,
            deleted=False
        ).all()
    
    def get_primary_image(self):
        """Get the primary/profile photo of this employee"""
        from .image import Image
        return Image.query.filter_by(
            entity_type='employee',
            entity_id=self.id,
            organization_id=self.organization_id,
            primary=True,
            deleted=False,
            is_active=True
        ).first()
    
    # Unique constraint: org_id + employee_code
    __table_args__ = (
        db.UniqueConstraint("organization_id", "employee_code", name="uq_org_emp_code"),
    )

    def to_dict(self, include_user=True, include_face=False, include_photo=False):
        """Convert employee to dictionary"""
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "department_id": self.department_id,
            "employee_code": self.employee_code,
            "full_name": self.full_name,
            "gender": self.gender,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "phone_number": self.phone_number,
            "emergency_contact": self.emergency_contact,
            "address": self.address,
            "joining_date": self.joining_date.isoformat() if self.joining_date else None,
            "designation": self.designation,
            "employment_type": self.employment_type,
            "shift_id": self.shift_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_user and self.user:
            data["user"] = {
                "id": self.user.id,
                "email": self.user.email,
                "username": self.user.username,
                "is_active": self.user.is_active,
            }
        
        if self.department:
            data["department"] = {
                "id": self.department.id,
                "name": self.department.name,
                "code": self.department.code,
            }
        
        if self.shift:
            data["shift"] = {
                "id": self.shift.id,
                "name": self.shift.name,
            }
        
        if include_face:
            data["has_face_registered"] = len(self.face_embeddings) > 0
        
        if include_photo:
            primary_image = self.get_primary_image()
            data["photo_base64"] = primary_image.image_base64 if primary_image else None
            data["photo_id"] = primary_image.id if primary_image else None
        
        return data

    def __repr__(self):
        return f"<Employee {self.employee_code} - {self.full_name}>"