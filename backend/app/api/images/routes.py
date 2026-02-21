"""
Image Management API routes (v2).
Handles image upload, retrieval, and management for employees and visitors.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...utils.helpers import (
    success_response,
    error_response,
    paginate,
    validate_request,
    get_current_user
)
from ...utils.exceptions import NotFoundError, ForbiddenError
from ...services.image_service import ImageService
from ...models import Image
from ...extensions import db

bp = Blueprint('images_api', __name__, url_prefix='/api/v2/images')


@bp.route('', methods=['POST'])
@jwt_required()
def create_image():
    """
    Create a new image in the unified image storage.
    
    Request body:
    {
        "entity_type": "employee|visitor",
        "entity_id": "uuid",
        "organization_id": "uuid",
        "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
        "image_type": "photo",  // optional
        "file_name": "employee.jpg",  // optional
        "capture_device": "webcam",  // optional
        "primary": true  // optional
    }
    """
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        # Validation
        required_fields = ['entity_type', 'entity_id', 'organization_id', 'image_base64']
        for field in required_fields:
            if field not in data:
                return error_response(f"Missing required field: {field}", 400)
        
        # Check if user has access to this organization
        # This is a simplified check; in production, verify user's org access
        
        image = ImageService.create_image(
            entity_type=data.get('entity_type'),
            entity_id=data.get('entity_id'),
            organization_id=data.get('organization_id'),
            image_base64=data.get('image_base64'),
            image_type=data.get('image_type', 'photo'),
            file_name=data.get('file_name'),
            mime_type=data.get('mime_type', 'image/jpeg'),
            captured_by=current_user.id,
            capture_device=data.get('capture_device', 'webcam'),
            capture_location=data.get('capture_location'),
            primary=data.get('primary', True)
        )
        
        return success_response(image.to_dict(), 'Image created successfully')
    
    except Exception as e:
        return error_response(str(e), 500)


@bp.route('/<image_id>', methods=['GET'])
@jwt_required()
def get_image(image_id):
    """Get a specific image by ID"""
    try:
        image = ImageService.get_image(image_id)
        if not image:
            return error_response('Image not found', 404)
        
        return success_response(image.to_dict())
    
    except Exception as e:
        return error_response(str(e), 500)


@bp.route('/entity/<entity_type>/<entity_id>', methods=['GET'])
@jwt_required()
def get_entity_images(entity_type, entity_id):
    """
    Get all images for a specific entity.
    
    Query params:
    - organization_id: required
    - image_type: optional filter
    """
    try:
        organization_id = request.args.get('organization_id')
        image_type = request.args.get('image_type')
        
        if not organization_id:
            return error_response('Missing organization_id parameter', 400)
        
        images = ImageService.get_entity_images(
            entity_type=entity_type,
            entity_id=entity_id,
            organization_id=organization_id,
            image_type=image_type
        )
        
        return success_response({
            'total': len(images),
            'items': [img.to_dict() for img in images]
        })
    
    except Exception as e:
        return error_response(str(e), 500)


@bp.route('/entity/<entity_type>/<entity_id>/primary', methods=['GET'])
@jwt_required()
def get_primary_image(entity_type, entity_id):
    """
    Get the primary/main image for an entity.
    
    Query params:
    - organization_id: required
    """
    try:
        organization_id = request.args.get('organization_id')
        
        if not organization_id:
            return error_response('Missing organization_id parameter', 400)
        
        image = ImageService.get_primary_image(
            entity_type=entity_type,
            entity_id=entity_id,
            organization_id=organization_id
        )
        
        if not image:
            return error_response('No primary image found', 404)
        
        return success_response(image.to_dict())
    
    except Exception as e:
        return error_response(str(e), 500)


@bp.route('/<image_id>', methods=['PUT'])
@jwt_required()
def update_image(image_id):
    """
    Update an image record.
    
    Request body:
    {
        "image_type": "photo",  // optional
        "primary": true,  // optional
        "is_active": true  // optional
    }
    """
    try:
        data = request.get_json()
        
        image = ImageService.update_image(
            image_id=image_id,
            image_type=data.get('image_type'),
            primary=data.get('primary'),
            is_active=data.get('is_active')
        )
        
        if not image:
            return error_response('Image not found', 404)
        
        return success_response(image.to_dict(), 'Image updated successfully')
    
    except Exception as e:
        return error_response(str(e), 500)


@bp.route('/<image_id>', methods=['DELETE'])
@jwt_required()
def delete_image(image_id):
    """Delete (soft delete) an image"""
    try:
        success = ImageService.delete_image(image_id)
        if not success:
            return error_response('Image not found', 404)
        
        return success_response(None, 'Image deleted successfully')
    
    except Exception as e:
        return error_response(str(e), 500)


@bp.route('/organization/<organization_id>', methods=['GET'])
@jwt_required()
def get_organization_images(organization_id):
    """
    Get all images for an organization.
    
    Query params:
    - entity_type: optional filter (e.g., 'employee', 'visitor')
    - limit: optional pagination limit
    - offset: optional pagination offset
    """
    try:
        entity_type = request.args.get('entity_type')
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', default=0, type=int)
        
        result = ImageService.get_organization_images(
            organization_id=organization_id,
            entity_type=entity_type,
            limit=limit,
            offset=offset
        )
        
        return success_response({
            'total': result['total'],
            'items': [img.to_dict() for img in result['items']]
        })
    
    except Exception as e:
        return error_response(str(e), 500)
