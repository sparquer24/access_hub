"""
Shifts API routes (v2).
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
from ...schemas.shift import (
    ShiftSchema,
    ShiftCreateSchema,
    ShiftUpdateSchema,
    ShiftListSchema
)
from ...services.shift_service import ShiftService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('shifts_api', __name__, url_prefix='/api/v2/shifts')


@bp.route('', methods=['POST'])
@jwt_required()
@require_permission('shifts:create')
@validate_request(ShiftCreateSchema)
def create_shift():
    """
    Create a new shift
    ---
    tags:
      - Shifts
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
            - start_time
            - end_time
          properties:
            organization_id:
              type: string
              example: "org-uuid-123"
            name:
              type: string
              example: "Morning Shift"
            start_time:
              type: string
              format: time
              example: "09:00:00"
            end_time:
              type: string
              format: time
              example: "18:00:00"
            grace_period_minutes:
              type: integer
              example: 15
            working_days:
              type: array
              items:
                type: integer
              example: [1, 2, 3, 4, 5]
    responses:
      201:
        description: Shift created successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Shift with this name already exists
    """
    data = request.validated_data
    shift = ShiftService.create_shift(data)
    
    schema = ShiftSchema()
    return success_response(
        data=schema.dump(shift),
        message='Shift created successfully',
        status_code=201
    )


@bp.route('', methods=['GET'])
@jwt_required()
@require_permission('shifts:read')
@validate_query(ShiftListSchema)
def list_shifts():
    """
    List all shifts with pagination and filters
    ---
    tags:
      - Shifts
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
        description: Search by name
      - name: organization_id
        in: query
        type: string
        description: Filter by organization ID
      - name: is_active
        in: query
        type: boolean
        description: Filter by active status
    responses:
      200:
        description: List of shifts
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
    
    query = ShiftService.list_shifts(filters, organization_id)
    result = paginate(query, page, per_page, ShiftSchema)
    
    return success_response(data=result)


@bp.route('/<string:shift_id>', methods=['GET'])
@jwt_required()
@require_permission('shifts:read')
def get_shift(shift_id):
    """
    Get shift by ID
    ---
    tags:
      - Shifts
    security:
      - Bearer: []
    parameters:
      - name: shift_id
        in: path
        type: string
        required: true
        description: Shift ID
    responses:
      200:
        description: Shift details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    shift = ShiftService.get_shift(shift_id)
    
    schema = ShiftSchema()
    return success_response(data=schema.dump(shift))


@bp.route('/<string:shift_id>', methods=['PUT'])
@jwt_required()
@require_permission('shifts:update')
@validate_request(ShiftUpdateSchema)
def update_shift(shift_id):
    """
    Update a shift
    ---
    tags:
      - Shifts
    security:
      - Bearer: []
    parameters:
      - name: shift_id
        in: path
        type: string
        required: true
        description: Shift ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            name:
              type: string
            start_time:
              type: string
              format: time
            end_time:
              type: string
              format: time
            grace_period_minutes:
              type: integer
            working_days:
              type: array
              items:
                type: integer
            is_active:
              type: boolean
    responses:
      200:
        description: Shift updated successfully
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
    shift = ShiftService.update_shift(shift_id, data)
    
    schema = ShiftSchema()
    return success_response(
        data=schema.dump(shift),
        message='Shift updated successfully'
    )


@bp.route('/<string:shift_id>', methods=['DELETE'])
@jwt_required()
@require_permission('shifts:delete')
def delete_shift(shift_id):
    """
    Delete a shift
    ---
    tags:
      - Shifts
    security:
      - Bearer: []
    parameters:
      - name: shift_id
        in: path
        type: string
        required: true
        description: Shift ID
    responses:
      200:
        description: Shift deleted successfully
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    ShiftService.delete_shift(shift_id)
    
    return success_response(message='Shift deleted successfully')
