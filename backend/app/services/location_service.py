"""
Business logic for Location management.
"""

from sqlalchemy import or_, and_
from ..extensions import db
from ..models import Location
from ..utils.exceptions import NotFoundError, ConflictError
from datetime import datetime


class LocationService:
    """Service class for location operations"""
    
    @staticmethod
    def create_location(data):
        """Create a new location"""
        # Check if location with same name exists in the same organization
        existing = Location.query.filter(
            and_(
                Location.organization_id == data['organization_id'],
                Location.name == data['name'],
                Location.deleted_at == None
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Location with name '{data['name']}' already exists in this organization")
        
        # Create location
        location = Location(**data)
        db.session.add(location)
        db.session.commit()
        
        return location
    
    @staticmethod
    def get_location(location_id):
        """Get location by ID"""
        location = Location.query.filter_by(
            id=location_id,
            deleted_at=None
        ).first()
        
        if not location:
            raise NotFoundError('Location')
        
        return location
    
    @staticmethod
    def list_locations(filters, organization_id=None):
        """List locations with filters and pagination"""
        query = Location.query.filter_by(deleted_at=None)
        
        # Apply tenant isolation
        if organization_id:
            query = query.filter_by(organization_id=organization_id)
        
        # Apply filters
        if filters.get('search'):
            search = f"%{filters['search']}%"
            query = query.filter(
                or_(
                    Location.name.ilike(search),
                    Location.building.ilike(search),
                    Location.area.ilike(search)
                )
            )
        
        if filters.get('organization_id'):
            query = query.filter_by(organization_id=filters['organization_id'])
        
        if filters.get('location_type'):
            query = query.filter_by(location_type=filters['location_type'])
        
        if filters.get('is_active') is not None:
            query = query.filter_by(is_active=filters['is_active'])
        
        # Order by created_at desc
        query = query.order_by(Location.created_at.desc())
        
        return query
    
    @staticmethod
    def update_location(location_id, data):
        """Update a location"""
        location = LocationService.get_location(location_id)
        
        # Check if name is being changed and conflicts with another location
        if 'name' in data and data['name'] != location.name:
            existing = Location.query.filter(
                and_(
                    Location.organization_id == location.organization_id,
                    Location.name == data['name'],
                    Location.deleted_at == None,
                    Location.id != location_id
                )
            ).first()
            
            if existing:
                raise ConflictError(f"Location with name '{data['name']}' already exists in this organization")
        
        # Update fields
        for key, value in data.items():
            setattr(location, key, value)
        
        location.updated_at = datetime.utcnow()
        db.session.commit()
        
        return location
    
    @staticmethod
    def delete_location(location_id, soft_delete=True):
        """Delete a location (soft delete by default)"""
        location = LocationService.get_location(location_id)
        
        if soft_delete:
            # Soft delete
            location.deleted_at = datetime.utcnow()
            location.is_active = False
            db.session.commit()
        else:
            # Hard delete (cascade will handle related records)
            db.session.delete(location)
            db.session.commit()
        
        return True
