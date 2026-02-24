"""
Visitor Management API routes (v2).
Simplified visitor tracking with registration checking and visit history.
"""

from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required
from ...utils.helpers import (
    success_response,
    error_response,
    validate_request,
    get_current_user
)
from ...utils.exceptions import NotFoundError, ForbiddenError, ValidationError
from ...schemas.visitor import (
    VisitorCreateSchema,
    VisitorUpdateSchema,
    VisitorResponseSchema
)
from ...services.visitor_service import VisitorService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('visitors_api', __name__, url_prefix='/api/v2/organizations')


# ==================== CORE VISITOR MANAGEMENT ====================

@bp.route('/<org_id>/visitors', methods=['POST'])
@jwt_required()
@require_permission('visitors:create')
@validate_request(VisitorCreateSchema)
def create_visitor(org_id):
    """
    Create a new visitor for an organization
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - visitor_name
            - mobile_number
            - purpose_of_visit
            - allowed_floor
          properties:
            visitor_name:
              type: string
              example: "Nisha Yadav"
            name:
              type: string
              example: "Nisha Yadav"
              description: Alternative field name for visitor_name
            mobile_number:
              type: string
              example: "8130567970"
            email:
              type: string
              example: "nisha@sparquer.ai"
            gender:
              type: string
              enum: ["M", "F", "Other"]
              example: "F"
            company_name:
              type: string
              example: "Sparquer"
            company_address:
              type: string
              example: "Bangalore"
            visitor_type:
              type: string
              enum: ["guest", "contractor", "vendor", "delivery"]
              example: "guest"
            host_name:
              type: string
              example: "nisha"
            host_phone:
              type: string
              example: "9087654321"
            purpose_of_visit:
              type: string
              example: "meeting"
            allowed_floor:
              type: string
              example: "Floor 2"
            allowed_tower:
              type: string
              example: "Tower A"
            is_recurring:
              type: boolean
              example: true
            special_instructions:
              type: string
            expected_duration_hours:
              type: integer
            work_description:
              type: string
            delivery_package_count:
              type: integer
            delivery_recipient_name:
              type: string
            image_base64:
              type: string
              description: Base64 encoded profile image (with or without data URI prefix)
            duration_date_from:
              type: string
              format: date-time
              example: "2026-02-24T09:00:00"
            duration_date_to:
              type: string
              format: date-time
              example: "2026-02-24T17:00:00"
    responses:
      201:
        description: Visitor created successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor created successfully"
            data:
              type: object
              properties:
                visitor:
                  type: object
                  properties:
                    id:
                      type: string
                    visitor_name:
                      type: string
                    email:
                      type: string
                    mobile_number:
                      type: string
                    gender:
                      type: string
                history_record:
                  type: object
                  properties:
                    id:
                      type: string
                    visitor_type:
                      type: string
                    host_name:
                      type: string
                    purpose_of_visit:
                      type: string
                    allowed_floor:
                      type: string
                    created_at:
                      type: string
                      format: date-time
      400:
        description: Bad request - Missing required fields or invalid data
        schema:
          $ref: "#/definitions/Error"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Normalize visitor name (handle 'name' and 'visitor_name')
        visitor_name = data.get('visitor_name') or data.get('name')
        if not visitor_name:
            return error_response('visitor_name or name is required', 400)
        
        # Normalize phone number (handle multiple field names)
        mobile_number = data.get('mobile_number') or data.get('phone') or data.get('phone_number')
        if not mobile_number:
            return error_response('mobile_number is required', 400)
        
        # Create visitor with basic info
        visitor_data = {
            'visitor_name': visitor_name,
            'mobile_number': mobile_number,
            'email': data.get('email'),
            'gender': data.get('gender')
        }
        
        visitor = VisitorService.create_visitor(org_id, visitor_data)
        
        # Prepare history record data with all available fields
        history_data = {
            'visitor_type': data.get('visitor_type', 'guest'),
            'host_name': data.get('host_name'),
            'host_number': data.get('host_phone') or data.get('host_number'),  # Support both field names
            'purpose_of_visit': data.get('purpose_of_visit'),
            'allowed_floor': data.get('allowed_floor'),
            'allowed_tower': data.get('allowed_tower'),
            'duration_date_from': data.get('duration_date_from'),
            'duration_date_to': data.get('duration_date_to'),
            # Additional metadata stored in history
            'special_instructions': data.get('special_instructions'),
            'company_name': data.get('company_name'),
            'company_address': data.get('company_address'),
            'is_recurring': data.get('is_recurring', False),
            'expected_duration_hours': data.get('expected_duration_hours'),
            'work_description': data.get('work_description'),
            'delivery_package_count': data.get('delivery_package_count'),
            'delivery_recipient_name': data.get('delivery_recipient_name')
        }
        
        rec = VisitorService.create_visitor_history_record(
            organization_id=org_id,
            visitor_id=visitor.id,
            data=history_data
        )
        
        # Handle profile picture upload if provided
        profile_pic = None
        if data.get('image_base64'):
            try:
                image_base64 = data.get('image_base64')
                if image_base64.startswith('data:'):
                    image_base64 = image_base64.split(',', 1)[1]
                
                profile_pic = VisitorService.save_visitor_profile_picture(
                    organization_id=org_id,
                    visitor_id=visitor.id,
                    image_base64=image_base64,
                    file_name=f'{visitor_name}_profile.jpg',
                    mime_type='image/jpeg',
                    captured_by=user.get('id') if user else None
                )
            except Exception as pic_error:
                # Log but don't fail the entire request if picture upload fails
                current_app.logger.warning(f'Failed to upload profile picture: {str(pic_error)}')
        
        response_schema = VisitorResponseSchema()
        response_data = {
            "visitor": response_schema.dump(visitor),
            "history_record": {
                'id': rec.id,
                'visitor_type': rec.visitor_type,
                'host_name': rec.host_name,
                'host_number': rec.host_number,
                'purpose_of_visit': rec.purpose_of_visit,
                'allowed_floor': rec.allowed_floor,
                'allowed_tower': rec.allowed_tower,
                'duration_date_from': rec.duration_date_from.isoformat() if rec.duration_date_from else None,
                'duration_date_to': rec.duration_date_to.isoformat() if rec.duration_date_to else None,
                'created_at': rec.created_at.isoformat()
            }
        }
        
        # Add profile picture info if uploaded
        if profile_pic:
            response_data['profile_picture'] = {
                'image_id': profile_pic.id,
                'file_name': profile_pic.file_name
            }
        
        return success_response(
            data=response_data,
            message='Visitor created successfully',
            status_code=201
        )
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f'Failed to create visitor: {str(e)}', 500)


@bp.route('/<org_id>/visitors', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def list_visitors(org_id):
    """
    Get all visitors for an organization with pagination
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: page
        in: query
        type: integer
        default: 1
        description: Page number (1-indexed)
      - name: limit
        in: query
        type: integer
        default: 10
        description: Number of records per page
      - name: from_date
        in: query
        type: string
        format: date
        description: Filter from date (YYYY-MM-DD)
      - name: to_date
        in: query
        type: string
        format: date
        description: Filter to date (YYYY-MM-DD)
    responses:
      200:
        description: Visitors retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitors retrieved successfully"
            data:
              type: object
              properties:
                visitors:
                  type: array
                  items:
                    type: object
                    properties:
                      id:
                        type: string
                      visitor_name:
                        type: string
                      email:
                        type: string
                      mobile_number:
                        type: string
                      gender:
                        type: string
                pagination:
                  type: object
                  properties:
                    page:
                      type: integer
                      example: 1
                    limit:
                      type: integer
                      example: 10
                    total:
                      type: integer
                      example: 100
                    pages:
                      type: integer
                      example: 10
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Organization not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        user = get_current_user()
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        from_date = request.args.get('from_date', None, type=str)
        to_date = request.args.get('to_date', None, type=str)
        
        total, visitors = VisitorService.get_visitors_by_organization(org_id, page, limit, from_date, to_date)
        
        response_schema = VisitorResponseSchema(many=True)
        
        response_data = {
            'visitors': response_schema.dump(visitors),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }
        
        return success_response(
            data=response_data,
            message='Visitors retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve visitors: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor(org_id, visitor_id):
    """
    Get a specific visitor by ID
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
    responses:
      200:
        description: Visitor retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor retrieved successfully"
            data:
              type: object
              properties:
                id:
                  type: string
                visitor_name:
                  type: string
                email:
                  type: string
                mobile_number:
                  type: string
                gender:
                  type: string
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Visitor not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        user = get_current_user()
        visitor = VisitorService.get_visitor(org_id, visitor_id)
        
        response_schema = VisitorResponseSchema()
        return success_response(
            data=response_schema.dump(visitor),
            message='Visitor retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve visitor: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>', methods=['PUT'])
@jwt_required()
@require_permission('visitors:update')
@validate_request(VisitorUpdateSchema)
def update_visitor(org_id, visitor_id):
    """
    Update visitor information
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
      - name: body
        in: body
        schema:
          type: object
          properties:
            visitor_name:
              type: string
            email:
              type: string
            mobile_number:
              type: string
            gender:
              type: string
              enum: ["M", "F", "Other"]
    responses:
      200:
        description: Visitor record updated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor record updated successfully"
            data:
              type: object
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Visitor not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        visitor = VisitorService.update_visitor(org_id, visitor_id, data)
        
        response_schema = VisitorResponseSchema()
        return success_response(
            data=response_schema.dump(visitor),
            message='Visitor record updated successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to update visitor: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>', methods=['DELETE'])
@jwt_required()
@require_permission('visitors:delete')
def delete_visitor(org_id, visitor_id):
    """
    Delete a visitor record
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
    responses:
      200:
        description: Visitor record deleted successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor record deleted successfully"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Visitor not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        user = get_current_user()
        VisitorService.delete_visitor(org_id, visitor_id)
        
        return success_response(
            data=None,
            message='Visitor record deleted successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to delete visitor: {str(e)}', 500)


# ==================== VISITOR PROFILE PICTURES ====================

@bp.route('/<org_id>/visitors/<visitor_id>/profile-picture', methods=['POST'])
@jwt_required()
@require_permission('visitors:update')
def upload_visitor_profile_picture(org_id, visitor_id):
    """
    Upload visitor profile picture
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - image_base64
          properties:
            image_base64:
              type: string
              description: Base64 encoded image (with or without data URI prefix)
              example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
            file_name:
              type: string
              example: "profile.jpg"
            mime_type:
              type: string
              example: "image/jpeg"
    responses:
      201:
        description: Profile picture uploaded successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Profile picture uploaded successfully"
            data:
              type: object
              properties:
                image_id:
                  type: string
                entity_type:
                  type: string
                entity_id:
                  type: string
                file_name:
                  type: string
      400:
        description: Bad request - Missing image_base64
        schema:
          $ref: "#/definitions/Error"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Visitor not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('image_base64'):
            return error_response('Missing image_base64 in request body', 400)
        
        image_base64 = data.get('image_base64')
        if image_base64.startswith('data:'):
            image_base64 = image_base64.split(',', 1)[1]
        
        file_name = data.get('file_name', 'profile.jpg')
        mime_type = data.get('mime_type', 'image/jpeg')
        current_user = get_current_user()
        
        image = VisitorService.save_visitor_profile_picture(
            organization_id=org_id,
            visitor_id=visitor_id,
            image_base64=image_base64,
            file_name=file_name,
            mime_type=mime_type,
            captured_by=current_user.get('id') if current_user else None
        )
        
        return success_response(
            data={
                'image_id': image.id,
                'entity_type': image.entity_type,
                'entity_id': image.entity_id,
                'file_name': image.file_name
            },
            message='Profile picture uploaded successfully',
            status_code=201
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to upload profile picture: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/profile-picture', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor_profile_picture(org_id, visitor_id):
    """
    Get visitor profile picture
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
    responses:
      200:
        description: Profile picture retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Profile picture retrieved successfully"
            data:
              type: object
              properties:
                image_id:
                  type: string
                image_base64:
                  type: string
                file_name:
                  type: string
                mime_type:
                  type: string
                captured_at:
                  type: string
                  format: date-time
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Profile picture not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        image = VisitorService.get_visitor_profile_picture(org_id, visitor_id)
        
        if not image:
            return error_response('Profile picture not found', 404)
        
        return success_response(
            data={
                'image_id': image.id,
                'image_base64': image.image_base64,
                'file_name': image.file_name,
                'mime_type': image.mime_type,
                'captured_at': image.created_at.isoformat() if image.created_at else None
            },
            message='Profile picture retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve profile picture: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/profile-picture', methods=['DELETE'])
@jwt_required()
@require_permission('visitors:delete')
def delete_visitor_profile_picture(org_id, visitor_id):
    """
    Delete visitor profile picture
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
    responses:
      200:
        description: Profile picture deleted successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Profile picture deleted successfully"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        VisitorService.delete_visitor_profile_picture(org_id, visitor_id)
        
        return success_response(
            message='Profile picture deleted successfully'
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to delete profile picture: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/images', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor_all_images(org_id, visitor_id):
    """
    Get all images for a visitor
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
    responses:
      200:
        description: Images retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Images retrieved successfully"
            data:
              type: array
              items:
                type: object
                properties:
                  image_id:
                    type: string
                  image_type:
                    type: string
                  file_name:
                    type: string
                  primary:
                    type: boolean
                  created_at:
                    type: string
                    format: date-time
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        images = VisitorService.get_all_visitor_images(org_id, visitor_id)
        
        images_data = [
            {
                'image_id': img.id,
                'image_type': img.image_type,
                'file_name': img.file_name,
                'primary': img.primary,
                'created_at': img.created_at.isoformat() if img.created_at else None
            }
            for img in images
        ]
        
        return success_response(
            data=images_data,
            message='Images retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve images: {str(e)}', 500)


# ==================== VISITOR REGISTRATION & HISTORY LOOKUP ====================

@bp.route('/<org_id>/visitors/check-registration', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def check_visitor_registration(org_id):
    """
    Check if visitor is registered by phone number
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: phone_number
        in: query
        type: string
        required: true
        description: Visitor phone number
    responses:
      200:
        description: Registration check successful
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor found"
            data:
              type: object
              properties:
                registered:
                  type: boolean
                  example: true
                visitor:
                  type: object
                  properties:
                    id:
                      type: string
                    visitor_name:
                      type: string
                    email:
                      type: string
                    mobile_number:
                      type: string
                    gender:
                      type: string
                    profile_picture:
                      type: object
      400:
        description: Bad request - Missing phone_number parameter
        schema:
          $ref: "#/definitions/Error"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        phone_number = request.args.get('phone_number')
        
        if not phone_number:
            return error_response('phone_number parameter is required', 400)
        
        visitor = VisitorService.get_visitor_by_phone(org_id, phone_number)
        
        if not visitor:
            return success_response(
                data={'registered': False},
                message='Visitor not found'
            )
        
        profile_pic = VisitorService.get_visitor_profile_picture(org_id, visitor.id)
        
        visitor_data = {
            'id': visitor.id,
            'visitor_name': visitor.visitor_name,
            'email': visitor.email,
            'mobile_number': visitor.mobile_number,
            'gender': visitor.gender,
            'profile_picture': {
                'image_id': profile_pic.id,
                'file_name': profile_pic.file_name,
                'captured_at': profile_pic.created_at.isoformat() if profile_pic.created_at else None
            } if profile_pic else None
        }
        
        return success_response(
            data={
                'registered': True,
                'visitor': visitor_data
            },
            message='Visitor found'
        )
    except Exception as e:
        return error_response(f'Failed to check visitor registration: {str(e)}', 500)


@bp.route('/<org_id>/visitors/by-phone', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor_by_phone(org_id):
    """
    Get complete visitor profile and recent visit history by phone number
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: phone_number
        in: query
        type: string
        required: true
        description: Visitor phone number
    responses:
      200:
        description: Visitor profile and history retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor profile and history retrieved successfully"
            data:
              type: object
              properties:
                visitor:
                  type: object
                  properties:
                    id:
                      type: string
                    visitor_name:
                      type: string
                    email:
                      type: string
                    mobile_number:
                      type: string
                    gender:
                      type: string
                recent_history:
                  type: array
                  items:
                    type: object
                    properties:
                      id:
                        type: string
                      visitor_type:
                        type: string
                      host_name:
                        type: string
                      purpose_of_visit:
                        type: string
                      allowed_floor:
                        type: string
                      created_at:
                        type: string
                        format: date-time
      400:
        description: Bad request - Missing phone_number parameter
        schema:
          $ref: "#/definitions/Error"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Visitor not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        phone_number = request.args.get('phone_number')
        
        if not phone_number:
            return error_response('phone_number parameter is required', 400)
        
        data = VisitorService.get_visitor_with_history(org_id, phone_number)
        
        if not data:
            return error_response('Visitor not found', 404)
        
        visitor = data['visitor']
        history_records = data['history_records'][:5]
        
        visitor_data = {
            'id': visitor.id,
            'visitor_name': visitor.visitor_name,
            'email': visitor.email,
            'mobile_number': visitor.mobile_number,
            'gender': visitor.gender
        }
        
        history_data = [
            {
                'id': rec.id,
                'visitor_type': rec.visitor_type,
                'host_name': rec.host_name,
                'host_number': rec.host_number,
                'purpose_of_visit': rec.purpose_of_visit,
                'allowed_floor': rec.allowed_floor,
                'allowed_tower': rec.allowed_tower,
                'duration_date_from': rec.duration_date_from.isoformat() if rec.duration_date_from else None,
                'duration_date_to': rec.duration_date_to.isoformat() if rec.duration_date_to else None,
                'created_at': rec.created_at.isoformat() if rec.created_at else None
            }
            for rec in history_records
        ]
        
        return success_response(
            data={
                'visitor': visitor_data,
                'recent_history': history_data
            },
            message='Visitor profile and history retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve visitor data: {str(e)}', 500)


# ==================== VISITOR HISTORY MANAGEMENT ====================

@bp.route('/<org_id>/visitor-history', methods=['POST'])
@jwt_required()
@require_permission('visitors:create')
def create_visitor_history(org_id):
    """
    Create new visitor history/visit record
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - visitor_id
            - purpose_of_visit
            - allowed_floor
          properties:
            visitor_id:
              type: string
              description: ID of an existing visitor
            visitor_type:
              type: string
              enum: ["guest", "contractor", "vendor", "delivery"]
              example: "guest"
            host_name:
              type: string
              description: Name of the host/employee being visited
            host_number:
              type: string
              description: Phone number of the host
            purpose_of_visit:
              type: string
              example: "meeting"
            allowed_floor:
              type: string
              example: "Floor 2"
            allowed_tower:
              type: string
              example: "Tower A"
            duration_date_from:
              type: string
              format: date-time
            duration_date_to:
              type: string
              format: date-time
    responses:
      201:
        description: Visitor history record created successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor history record created successfully"
            data:
              type: object
              properties:
                id:
                  type: string
                visitor_id:
                  type: string
                purpose_of_visit:
                  type: string
                allowed_floor:
                  type: string
                created_at:
                  type: string
                  format: date-time
      400:
        description: Bad request - Missing required fields
        schema:
          $ref: "#/definitions/Error"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response('Request body is required', 400)
        
        visitor_id = data.get('visitor_id')
        if not visitor_id:
            return error_response('visitor_id is required', 400)
        
        if not data.get('purpose_of_visit'):
            return error_response('purpose_of_visit is required', 400)
        
        if not data.get('allowed_floor'):
            return error_response('allowed_floor is required', 400)
        
        history_record = VisitorService.create_visitor_history_record(
            org_id, 
            visitor_id, 
            data
        )
        
        return success_response(
            data={
                'id': history_record.id,
                'visitor_id': history_record.visitor_id,
                'purpose_of_visit': history_record.purpose_of_visit,
                'allowed_floor': history_record.allowed_floor,
                'created_at': history_record.created_at.isoformat() if history_record.created_at else None
            },
            message='Visitor history record created successfully',
            status_code=201
        )
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f'Failed to create visitor history: {str(e)}', 500)


@bp.route('/<org_id>/visitor-history/search', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def search_visitor_history(org_id):
    """
    Search visitor history by phone number
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: phone_number
        in: query
        type: string
        required: true
        description: Visitor phone number
      - name: limit
        in: query
        type: integer
        default: 10
        maximum: 100
        description: Maximum number of records to return
    responses:
      200:
        description: Visitor history search successful
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Found 5 visitor history records"
            data:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                  visitor:
                    type: object
                    properties:
                      id:
                        type: string
                      visitor_name:
                        type: string
                      mobile_number:
                        type: string
                      email:
                        type: string
                      gender:
                        type: string
                  visitor_type:
                    type: string
                  host_name:
                    type: string
                  purpose_of_visit:
                    type: string
                  allowed_floor:
                    type: string
                  duration_date_from:
                    type: string
                    format: date-time
                  duration_date_to:
                    type: string
                    format: date-time
                  created_at:
                    type: string
                    format: date-time
      400:
        description: Bad request - Missing phone_number parameter
        schema:
          $ref: "#/definitions/Error"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        phone_number = request.args.get('phone_number')
        limit = request.args.get('limit', 10, type=int)
        
        if not phone_number:
            return error_response('phone_number parameter is required', 400)
        
        if limit > 100:
            limit = 100
        
        records = VisitorService.get_visitor_history_search(org_id, phone_number, limit)
        
        if not records:
            return success_response(
                data=[],
                message='No history found for this visitor'
            )
        
        history_data = [
            {
                'id': rec[0].id,
                'visitor': {
                    'id': rec[1].id,
                    'visitor_name': rec[1].visitor_name,
                    'mobile_number': rec[1].mobile_number,
                    'email': rec[1].email,
                    'gender': rec[1].gender
                },
                'visitor_type': rec[0].visitor_type,
                'host_name': rec[0].host_name,
                'host_number': rec[0].host_number,
                'purpose_of_visit': rec[0].purpose_of_visit,
                'allowed_floor': rec[0].allowed_floor,
                'allowed_tower': rec[0].allowed_tower,
                'duration_date_from': rec[0].duration_date_from.isoformat() if rec[0].duration_date_from else None,
                'duration_date_to': rec[0].duration_date_to.isoformat() if rec[0].duration_date_to else None,
                'created_at': rec[0].created_at.isoformat() if rec[0].created_at else None
            }
            for rec in records
        ]
        
        return success_response(
            data=history_data,
            message=f'Found {len(history_data)} visitor history records'
        )
    except Exception as e:
        return error_response(f'Failed to search visitor history: {str(e)}', 500)
