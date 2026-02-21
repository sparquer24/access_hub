"""
Locations API routes (v2).
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from ...utils.helpers import (
    success_response,
    error_response,
    paginate,
    validate_request,
    validate_query,
    get_current_user
)
from ...utils.exceptions import NotFoundError, ForbiddenError
from ...schemas.location import (
    LocationSchema,
    LocationCreateSchema,
    LocationUpdateSchema,
    LocationListSchema
)
from ...services.location_service import LocationService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('locations_api', __name__, url_prefix='/api/v2/locations')


@bp.route('', methods=['POST'])
@jwt_required()
@require_permission('locations:create')
@validate_request(LocationCreateSchema)
def create_location():
    """
    Create a new location
    ---
    tags:
      - Locations
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - organization_id
            - name
          properties:
            organization_id:
              type: string
              example: "org-uuid-123"
            name:
              type: string
              example: "Main Gate"
            location_type:
              type: string
              enum: [ENTRY, EXIT, BOTH]
              example: "ENTRY"
            description:
              type: string
              example: "Main entrance to building"
            building:
              type: string
              example: "Building A"
            floor:
              type: string
              example: "Ground Floor"
            area:
              type: string
              example: "Reception"
            latitude:
              type: number
              format: float
              example: 28.7041
            longitude:
              type: number
              format: float
              example: 77.1025
    responses:
      201:
        description: Location created successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Location with this name already exists
    """
    data = request.validated_data
    location = LocationService.create_location(data)
    
    schema = LocationSchema()
    return success_response(
        data=schema.dump(location),
        message='Location created successfully',
        status_code=201
    )


@bp.route('', methods=['GET'])
@jwt_required()
@require_permission('locations:read')
@validate_query(LocationListSchema)
def list_locations():
    """
    List all locations with pagination and filters
    ---
    tags:
      - Locations
    security:
      - Bearer: []
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
        description: Page number
      - name: per_page
        in: query
        type: integer
        default: 20
        description: Items per page
      - name: search
        in: query
        type: string
        description: Search by name, building, or area
      - name: organization_id
        in: query
        type: string
        description: Filter by organization ID
      - name: location_type
        in: query
        type: string
        enum: [ENTRY, EXIT, BOTH]
        description: Filter by location type
      - name: is_active
        in: query
        type: boolean
        description: Filter by active status
    responses:
      200:
        description: List of locations
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Success"
            data:
              type: object
              properties:
                items:
                  type: array
                  items:
                    type: object
                pagination:
                  type: object
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    filters = request.validated_query
    page = filters.pop('page', 1)
    per_page = filters.pop('per_page', 20)
    
    # Get current user for tenant isolation
    current_user = get_current_user()
    organization_id = current_user.get('organization_id') if current_user else None
    
    query = LocationService.list_locations(filters, organization_id)
    result = paginate(query, page, per_page, LocationSchema)
    
    return success_response(data=result)


@bp.route('/<string:location_id>', methods=['GET'])
@jwt_required()
@require_permission('locations:read')
def get_location(location_id):
    """
    Get location by ID
    ---
    tags:
      - Locations
    security:
      - Bearer: []
    parameters:
      - name: location_id
        in: path
        type: string
        required: true
        description: Location ID
    responses:
      200:
        description: Location details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    location = LocationService.get_location(location_id)
    
    schema = LocationSchema()
    return success_response(data=schema.dump(location))


@bp.route('/<string:location_id>', methods=['PUT'])
@jwt_required()
@require_permission('locations:update')
@validate_request(LocationUpdateSchema)
def update_location(location_id):
    """
    Update a location
    ---
    tags:
      - Locations
    security:
      - Bearer: []
    parameters:
      - name: location_id
        in: path
        type: string
        required: true
        description: Location ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            name:
              type: string
            location_type:
              type: string
              enum: [ENTRY, EXIT, BOTH]
            description:
              type: string
            building:
              type: string
            floor:
              type: string
            area:
              type: string
            latitude:
              type: number
              format: float
            longitude:
              type: number
              format: float
            is_active:
              type: boolean
    responses:
      200:
        description: Location updated successfully
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    data = request.validated_data
    location = LocationService.update_location(location_id, data)
    
    schema = LocationSchema()
    return success_response(
        data=schema.dump(location),
        message='Location updated successfully'
    )


@bp.route('/<string:location_id>', methods=['DELETE'])
@jwt_required()
@require_permission('locations:delete')
def delete_location(location_id):
    """
    Delete a location (soft delete)
    ---
    tags:
      - Locations
    security:
      - Bearer: []
    parameters:
      - name: location_id
        in: path
        type: string
        required: true
        description: Location ID
      - name: hard_delete
        in: query
        type: boolean
        default: false
        description: Perform hard delete instead of soft delete
    responses:
      200:
        description: Location deleted successfully
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    hard_delete = request.args.get('hard_delete', 'false').lower() == 'true'
    LocationService.delete_location(location_id, soft_delete=not hard_delete)
    
    return success_response(message='Location deleted successfully')
