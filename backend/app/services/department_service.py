"""
Business logic for Department management.
"""

from sqlalchemy import or_, and_
from sqlalchemy.orm import selectinload, joinedload
from ..extensions import db
from ..models import Department
from ..utils.exceptions import NotFoundError, ConflictError
from datetime import datetime


class DepartmentService:
    """Service class for department operations"""
    
    @staticmethod
    def create_department(data):
        """Create a new department"""
        # Check if department with same code exists in the same organization
        existing = Department.query.filter(
            and_(
                Department.organization_id == data['organization_id'],
                Department.code == data['code'],
                Department.deleted_at == None
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Department with code '{data['code']}' already exists in this organization")
        
        # Create department
        department = Department(**data)
        db.session.add(department)
        db.session.commit()
        
        return department
    
    @staticmethod
    def get_department(department_id):
        """Get department by ID"""
        department = Department.query.filter_by(
            id=department_id,
            deleted_at=None
        ).first()
        
        if not department:
            raise NotFoundError('Department')
        
        return department
    
    @staticmethod
    def list_departments(filters):
        """List departments with filters and pagination - optimized with eager loading"""
        # Use eager loading to avoid N+1 queries for employee counting
        query = Department.query.options(
            selectinload(Department.employees)
        ).filter_by(deleted_at=None)
        
        # Apply organization_id filter from filters dict
        if filters.get('organization_id'):
            query = query.filter_by(organization_id=filters['organization_id'])
        
        # Apply search filter
        if filters.get('search'):
            search = f"%{filters['search']}%"
            query = query.filter(
                or_(
                    Department.name.ilike(search),
                    Department.code.ilike(search),
                    Department.description.ilike(search)
                )
            )
        
        # Apply is_active filter
        if filters.get('is_active') is not None:
            query = query.filter_by(is_active=filters['is_active'])
        
        # Order by created_at desc
        query = query.order_by(Department.created_at.desc())
        
        return query
    
    @staticmethod
    def update_department(department_id, data):
        """Update a department"""
        department = DepartmentService.get_department(department_id)
        
        # Code cannot be changed (it's unique identifier within org)
        if 'code' in data:
            del data['code']
        
        # Update fields
        for key, value in data.items():
            setattr(department, key, value)
        
        department.updated_at = datetime.utcnow()
        db.session.commit()
        
        return department
    
    @staticmethod
    def delete_department(department_id, soft_delete=True):
        """Delete a department (soft delete by default)"""
        department = DepartmentService.get_department(department_id)
        
        if soft_delete:
            # Soft delete
            department.deleted_at = datetime.utcnow()
            department.is_active = False
            db.session.commit()
        else:
            # Hard delete (cascade will handle related records)
            db.session.delete(department)
            db.session.commit()
        
        return True
