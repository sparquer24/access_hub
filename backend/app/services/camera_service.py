"""
Business logic for Camera management.
"""

from sqlalchemy import or_, and_
from ..extensions import db
from ..models import Camera
from ..utils.exceptions import NotFoundError, ConflictError
from datetime import datetime


class CameraService:
    """Service class for camera operations"""
    
    @staticmethod
    def create_camera(data):
        """Create a new camera"""
        # Check if camera with same name exists in the same organization
        existing = Camera.query.filter(
            and_(
                Camera.organization_id == data['organization_id'],
                Camera.name == data['name'],
                Camera.deleted_at == None
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Camera with name '{data['name']}' already exists in this organization")
        
        # Create camera
        camera = Camera(**data)
        db.session.add(camera)
        db.session.commit()
        
        return camera
    
    @staticmethod
    def get_camera(camera_id):
        """Get camera by ID"""
        camera = Camera.query.filter_by(
            id=camera_id,
            deleted_at=None
        ).first()
        
        if not camera:
            raise NotFoundError('Camera')
        
        return camera
    
    @staticmethod
    def list_cameras(filters, organization_id=None):
        """List cameras with filters and pagination"""
        query = Camera.query.filter_by(deleted_at=None)
        
        # Apply tenant isolation
        if organization_id:
            query = query.filter_by(organization_id=organization_id)
        
        # Apply filters
        if filters.get('search'):
            search = f"%{filters['search']}%"
            query = query.filter(Camera.name.ilike(search))
        
        if filters.get('organization_id'):
            query = query.filter_by(organization_id=filters['organization_id'])
        
        if filters.get('location_id'):
            query = query.filter_by(location_id=filters['location_id'])
        
        if filters.get('camera_type'):
            query = query.filter_by(camera_type=filters['camera_type'])
        
        if filters.get('status'):
            query = query.filter_by(status=filters['status'])
        
        if filters.get('is_active') is not None:
            query = query.filter_by(is_active=filters['is_active'])
        
        # Order by created_at desc
        query = query.order_by(Camera.created_at.desc())
        
        return query
    
    @staticmethod
    def update_camera(camera_id, data):
        """Update a camera"""
        camera = CameraService.get_camera(camera_id)
        
        # Check if name is being changed and conflicts with another camera
        if 'name' in data and data['name'] != camera.name:
            existing = Camera.query.filter(
                and_(
                    Camera.organization_id == camera.organization_id,
                    Camera.name == data['name'],
                    Camera.deleted_at == None,
                    Camera.id != camera_id
                )
            ).first()
            
            if existing:
                raise ConflictError(f"Camera with name '{data['name']}' already exists in this organization")
        
        # Update fields
        for key, value in data.items():
            setattr(camera, key, value)
        
        camera.updated_at = datetime.utcnow()
        db.session.commit()
        
        return camera
    
    @staticmethod
    def delete_camera(camera_id, soft_delete=True):
        """Delete a camera (soft delete by default)"""
        camera = CameraService.get_camera(camera_id)
        
        if soft_delete:
            # Soft delete
            camera.deleted_at = datetime.utcnow()
            camera.is_active = False
            camera.status = "offline"
            db.session.commit()
        else:
            # Hard delete (cascade will handle related records)
            db.session.delete(camera)
            db.session.commit()
        
        return True
    
    @staticmethod
    def update_heartbeat(camera_id, data):
        """Update camera heartbeat"""
        camera = CameraService.get_camera(camera_id)
        
        camera.last_heartbeat = datetime.utcnow()
        camera.status = data['status']
        
        if data.get('error_message'):
            camera.error_message = data['error_message']
        else:
            camera.error_message = None
        
        db.session.commit()
        
        return camera
