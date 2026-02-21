from ..extensions import db
from datetime import datetime
import uuid


class Department(db.Model):
    """
    Department within an organization.
    Each department can have multiple employees.
    """
    __tablename__ = "departments"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Organization relationship
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="departments")
    
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    
    # Manager relationship (self-referential through employee)
    # Note: FK constraint removed to avoid circular dependency with employees table
    # This is enforced at application level instead
    manager_id = db.Column(db.String(36), nullable=True)
    
    # Status
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete
    
    # Relationships
    employees = db.relationship("Employee", back_populates="department", foreign_keys="Employee.department_id")
    
    # Unique constraint: org_id + code
    __table_args__ = (
        db.UniqueConstraint("organization_id", "code", name="uq_org_dept_code"),
    )

    def to_dict(self, include_employees=False):
        """Convert department to dictionary"""
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "manager_id": self.manager_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_employees:
            data["employees"] = [emp.to_dict() for emp in self.employees]
        else:
            data["employee_count"] = len(self.employees)
        
        return data

    def __repr__(self):
        return f"<Department {self.name} ({self.code})>"