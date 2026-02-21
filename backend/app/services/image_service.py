"""
Service for managing images in the unified image storage table.
Handles creation, retrieval, and management of images for employees and visitors.
"""

from ..extensions import db
from ..models.image import Image
from datetime import datetime
import uuid


class ImageService:
    """Service for image storage and retrieval"""

    @staticmethod
    def create_image(
        entity_type: str,
        entity_id: str,
        organization_id: str,
        image_base64: str,
        image_type: str = 'photo',
        file_name: str = None,
        mime_type: str = 'image/jpeg',
        captured_by: str = None,
        capture_device: str = 'webcam',
        capture_location: str = None,
        primary: bool = True
    ) -> Image:
        """
        Create a new image record in the unified image storage.
        
        Args:
            entity_type: Type of entity ('employee', 'visitor', etc.)
            entity_id: ID of the entity that owns the image
            organization_id: Organization ID for multi-tenancy
            image_base64: Base64 encoded image data
            image_type: Type of image ('photo', 'id_card', 'signature', etc.)
            file_name: Original file name
            mime_type: MIME type of the image
            captured_by: User ID of who captured the image
            capture_device: Device used to capture ('webcam', 'camera', 'mobile', etc.)
            capture_location: Location where image was captured
            primary: Whether this is the primary image for the entity
            
        Returns:
            Image: Created image record
        """
        # If this is being set as primary, deactivate other primary images
        if primary:
            db.session.query(Image).filter_by(
                entity_type=entity_type,
                entity_id=entity_id,
                organization_id=organization_id,
                primary=True,
                deleted=False
            ).update({'primary': False})
        
        # Calculate file size
        file_size = len(image_base64.encode('utf-8')) if image_base64 else 0
        
        image = Image(
            id=str(uuid.uuid4()),
            entity_type=entity_type,
            entity_id=entity_id,
            organization_id=organization_id,
            image_base64=image_base64,
            image_type=image_type,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            captured_by=captured_by,
            capture_device=capture_device,
            capture_location=capture_location,
            primary=primary,
            is_active=True,
            deleted=False
        )
        
        db.session.add(image)
        db.session.commit()
        return image

    @staticmethod
    def get_image(image_id: str) -> Image:
        """Get a specific image by ID"""
        return Image.query.filter_by(id=image_id, deleted=False).first()

    @staticmethod
    def get_entity_images(
        entity_type: str,
        entity_id: str,
        organization_id: str,
        image_type: str = None
    ) -> list:
        """
        Get all images for a specific entity.
        
        Args:
            entity_type: Type of entity
            entity_id: ID of the entity
            organization_id: Organization ID
            image_type: Optional filter by image type
            
        Returns:
            List of Image records
        """
        query = Image.query.filter_by(
            entity_type=entity_type,
            entity_id=entity_id,
            organization_id=organization_id,
            deleted=False,
            is_active=True
        )
        
        if image_type:
            query = query.filter_by(image_type=image_type)
        
        return query.order_by(Image.created_at.desc()).all()

    @staticmethod
    def get_primary_image(
        entity_type: str,
        entity_id: str,
        organization_id: str
    ) -> Image:
        """Get the primary/main image for an entity"""
        return Image.query.filter_by(
            entity_type=entity_type,
            entity_id=entity_id,
            organization_id=organization_id,
            primary=True,
            deleted=False,
            is_active=True
        ).first()

    @staticmethod
    def update_image(
        image_id: str,
        image_type: str = None,
        primary: bool = None,
        is_active: bool = None
    ) -> Image:
        """Update an image record"""
        image = Image.query.filter_by(id=image_id, deleted=False).first()
        if not image:
            return None
        
        if image_type:
            image.image_type = image_type
        
        if primary is not None:
            if primary:
                # Deactivate other primary images for the same entity
                db.session.query(Image).filter_by(
                    entity_type=image.entity_type,
                    entity_id=image.entity_id,
                    organization_id=image.organization_id,
                    primary=True,
                    deleted=False
                ).update({'primary': False})
            image.primary = primary
        
        if is_active is not None:
            image.is_active = is_active
        
        image.updated_at = datetime.utcnow()
        db.session.commit()
        return image

    @staticmethod
    def delete_image(image_id: str) -> bool:
        """Soft delete an image"""
        image = Image.query.filter_by(id=image_id, deleted=False).first()
        if not image:
            return False
        
        image.deleted = True
        image.is_active = False
        image.updated_at = datetime.utcnow()
        db.session.commit()
        return True

    @staticmethod
    def get_organization_images(
        organization_id: str,
        entity_type: str = None,
        limit: int = None,
        offset: int = 0
    ) -> list:
        """
        Get all images for an organization (with optional entity type filter).
        Useful for admin dashboards and reports.
        """
        query = Image.query.filter_by(
            organization_id=organization_id,
            deleted=False
        )
        
        if entity_type:
            query = query.filter_by(entity_type=entity_type)
        
        total = query.count()
        
        query = query.order_by(Image.created_at.desc())
        if limit:
            query = query.limit(limit).offset(offset)
        
        return {
            'total': total,
            'items': query.all()
        }
