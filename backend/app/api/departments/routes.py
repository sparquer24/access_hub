"""
Departments API routes (v2).
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
from ...schemas.department import (
    DepartmentSchema,
    DepartmentCreateSchema,
    DepartmentUpdateSchema,
    DepartmentListSchema
)
from ...services.department_service import DepartmentService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('departments_api', __name__, url_prefix='/api/v2/departments')


@bp.route('', methods=['POST'])
@jwt_required()
@require_permission('departments:create')
@validate_request(DepartmentCreateSchema)
def create_department():
    """
    Create a new department
    ---
    tags:
      - Departments
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
            - code
          properties:
            organization_id:
              type: string
              example: "org-uuid-123"
            name:
              type: string
              example: "Engineering"
            code:
              type: string
              example: "ENG"
            description:
              type: string
              example: "Software Engineering Department"
            manager_id:
              type: string
              example: "emp-uuid-456"
    responses:
      201:
        description: Department created successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Department with this code already exists
    """
    data = request.validated_data
    department = DepartmentService.create_department(data)
    
    schema = DepartmentSchema()
    return success_response(
        data=schema.dump(department),
        message='Department created successfully',
        status_code=201
    )


@bp.route('', methods=['GET'])
@jwt_required()
@require_permission('departments:read')
@validate_query(DepartmentListSchema)
def list_departments():
    """
    List all departments with pagination and filters
    ---
    tags:
      - Departments
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
        description: Search by name, code, or description
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
        description: List of departments
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
    
    query = DepartmentService.list_departments(filters, organization_id)
    result = paginate(query, page, per_page, DepartmentSchema)
    
    return success_response(data=result)


@bp.route('/by-organization/<string:organization_id>', methods=['GET'])
@jwt_required()
@require_permission('departments:read')
@validate_query(DepartmentListSchema)
def get_departments_by_organization(organization_id):
    """
    Get all departments for a specific organization
    ---
    tags:
      - Departments
    security:
      - Bearer: []
    parameters:
      - name: organization_id
        in: path
        type: string
        required: true
        description: Organization ID
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
        description: Search by name, code, or description
      - name: is_active
        in: query
        type: boolean
        description: Filter by active status
    responses:
      200:
        description: List of departments for the organization
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
      404:
        description: Organization not found
    """
    filters = request.validated_query
    page = filters.pop('page', 1)
    per_page = filters.pop('per_page', 20)
    
    filters['organization_id'] = organization_id
    
    query = DepartmentService.list_departments(filters, organization_id)
    result = paginate(query, page, per_page, DepartmentSchema)
    
    return success_response(data=result)


@bp.route('/<string:department_id>', methods=['GET'])
@jwt_required()
@require_permission('departments:read')
def get_department(department_id):
    """
    Get department by ID
    ---
    tags:
      - Departments
    security:
      - Bearer: []
    parameters:
      - name: department_id
        in: path
        type: string
        required: true
        description: Department ID
    responses:
      200:
        description: Department details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    department = DepartmentService.get_department(department_id)
    
    schema = DepartmentSchema()
    return success_response(data=schema.dump(department))


@bp.route('/<string:department_id>', methods=['PUT'])
@jwt_required()
@require_permission('departments:update')
@validate_request(DepartmentUpdateSchema)
def update_department(department_id):
    """
    Update a department
    ---
    tags:
      - Departments
    security:
      - Bearer: []
    parameters:
      - name: department_id
        in: path
        type: string
        required: true
        description: Department ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            name:
              type: string
            description:
              type: string
            manager_id:
              type: string
            is_active:
              type: boolean
    responses:
      200:
        description: Department updated successfully
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
    department = DepartmentService.update_department(department_id, data)
    
    schema = DepartmentSchema()
    return success_response(
        data=schema.dump(department),
        message='Department updated successfully'
    )


@bp.route('/<string:department_id>', methods=['DELETE'])
@jwt_required()
@require_permission('departments:delete')
def delete_department(department_id):
    """
    Delete a department (soft delete)
    ---
    tags:
      - Departments
    security:
      - Bearer: []
    parameters:
      - name: department_id
        in: path
        type: string
        required: true
        description: Department ID
      - name: hard_delete
        in: query
        type: boolean
        default: false
        description: Perform hard delete instead of soft delete
    responses:
      200:
        description: Department deleted successfully
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
    DepartmentService.delete_department(department_id, soft_delete=not hard_delete)
    
    return success_response(message='Department deleted successfully')
