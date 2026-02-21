"""
Business logic for Shift management.
"""

from sqlalchemy import or_, and_
from ..extensions import db
from ..models import Shift
from ..utils.exceptions import NotFoundError, ConflictError
from datetime import datetime


class ShiftService:
    """Service class for shift operations"""
    
    @staticmethod
    def create_shift(data):
        """Create a new shift"""
        # Check if shift with same name exists in the same organization
        existing = Shift.query.filter(
            and_(
                Shift.organization_id == data['organization_id'],
                Shift.name == data['name']
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Shift with name '{data['name']}' already exists in this organization")
        
        # Create shift
        shift = Shift(**data)
        db.session.add(shift)
        db.session.commit()
        
        return shift
    
    @staticmethod
    def get_shift(shift_id):
        """Get shift by ID"""
        shift = Shift.query.filter_by(id=shift_id).first()
        
        if not shift:
            raise NotFoundError('Shift')
        
        return shift
    
    @staticmethod
    def list_shifts(filters, organization_id=None):
        """List shifts with filters and pagination"""
        query = Shift.query
        
        # Apply tenant isolation
        if organization_id:
            query = query.filter_by(organization_id=organization_id)
        
        # Apply filters
        if filters.get('search'):
            search = f"%{filters['search']}%"
            query = query.filter(Shift.name.ilike(search))
        
        if filters.get('organization_id'):
            query = query.filter_by(organization_id=filters['organization_id'])
        
        if filters.get('is_active') is not None:
            query = query.filter_by(is_active=filters['is_active'])
        
        # Order by created_at desc
        query = query.order_by(Shift.created_at.desc())
        
        return query
    
    @staticmethod
    def update_shift(shift_id, data):
        """Update a shift"""
        shift = ShiftService.get_shift(shift_id)
        
        # Check if name is being changed and conflicts with another shift
        if 'name' in data and data['name'] != shift.name:
            existing = Shift.query.filter(
                and_(
                    Shift.organization_id == shift.organization_id,
                    Shift.name == data['name'],
                    Shift.id != shift_id
                )
            ).first()
            
            if existing:
                raise ConflictError(f"Shift with name '{data['name']}' already exists in this organization")
        
        # Update fields
        for key, value in data.items():
            setattr(shift, key, value)
        
        shift.updated_at = datetime.utcnow()
        db.session.commit()
        
        return shift
    
    @staticmethod
    def delete_shift(shift_id, soft_delete=True):
        """Delete a shift (soft delete not applicable, hard delete only)"""
        shift = ShiftService.get_shift(shift_id)
        
        # Shifts don't have soft delete, so we just perform hard delete
        db.session.delete(shift)
        db.session.commit()
        
        return True
