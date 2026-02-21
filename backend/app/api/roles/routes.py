"""
Roles API routes (v2).
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
from ...schemas.role import (
    RoleSchema,
    RoleCreateSchema,
    RoleUpdateSchema,
    RoleListSchema,
    RolePermissionsSchema
)
from ...services.role_service import RoleService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('roles_api', __name__, url_prefix='/api/v2/roles')


@bp.route('', methods=['POST'])
@jwt_required()
@require_permission('roles:create')
@validate_request(RoleCreateSchema)
def create_role():
    """
    Create a new role
    ---
    tags:
      - Roles
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              example: "department_manager"
            description:
              type: string
              example: "Department Manager Role"
            permissions:
              type: object
              example: {"users": ["read", "update"], "departments": ["read", "update"]}
    responses:
      201:
        description: Role created successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Role with this name already exists
    """
    data = request.validated_data
    role = RoleService.create_role(data)
    
    schema = RoleSchema()
    return success_response(
        data=schema.dump(role),
        message='Role created successfully',
        status_code=201
    )


@bp.route('', methods=['GET'])
@jwt_required()
@require_permission('roles:read')
@validate_query(RoleListSchema)
def list_roles():
    """
    List all roles with pagination and filters
    ---
    tags:
      - Roles
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
        description: Search by name or description
    responses:
      200:
        description: List of roles
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
    
    query = RoleService.list_roles(filters)
    result = paginate(query, page, per_page, RoleSchema)
    
    return success_response(data=result)


@bp.route('/<string:role_id>', methods=['GET'])
@jwt_required()
@require_permission('roles:read')
def get_role(role_id):
    """
    Get role by ID
    ---
    tags:
      - Roles
    security:
      - Bearer: []
    parameters:
      - name: role_id
        in: path
        type: string
        required: true
        description: Role ID
    responses:
      200:
        description: Role details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    role = RoleService.get_role(role_id)
    
    schema = RoleSchema()
    return success_response(data=schema.dump(role))


@bp.route('/<string:role_id>', methods=['PUT'])
@jwt_required()
@require_permission('roles:update')
@validate_request(RoleUpdateSchema)
def update_role(role_id):
    """
    Update a role
    ---
    tags:
      - Roles
    security:
      - Bearer: []
    parameters:
      - name: role_id
        in: path
        type: string
        required: true
        description: Role ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            name:
              type: string
            description:
              type: string
            permissions:
              type: object
    responses:
      200:
        description: Role updated successfully
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
    role = RoleService.update_role(role_id, data)
    
    schema = RoleSchema()
    return success_response(
        data=schema.dump(role),
        message='Role updated successfully'
    )


@bp.route('/<string:role_id>', methods=['DELETE'])
@jwt_required()
@require_permission('roles:delete')
def delete_role(role_id):
    """
    Delete a role
    ---
    tags:
      - Roles
    security:
      - Bearer: []
    parameters:
      - name: role_id
        in: path
        type: string
        required: true
        description: Role ID
    responses:
      200:
        description: Role deleted successfully
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      400:
        description: Role has associated users
    """
    RoleService.delete_role(role_id)
    
    return success_response(message='Role deleted successfully')


@bp.route('/<string:role_id>/permissions', methods=['PUT'])
@jwt_required()
@require_permission('roles:update')
@validate_request(RolePermissionsSchema)
def update_role_permissions(role_id):
    """
    Update role permissions
    ---
    tags:
      - Roles
    security:
      - Bearer: []
    parameters:
      - name: role_id
        in: path
        type: string
        required: true
        description: Role ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - permissions
          properties:
            permissions:
              type: object
              example: {"users": ["create", "read", "update"], "departments": ["read"]}
              description: Permissions dictionary with resources as keys and action arrays as values
    responses:
      200:
        description: Role permissions updated successfully
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      400:
        $ref: '#/responses/BadRequestError'
    """
    data = request.validated_data
    role = RoleService.update_role_permissions(role_id, data['permissions'])
    
    schema = RoleSchema()
    return success_response(
        data=schema.dump(role),
        message='Role permissions updated successfully'
    )
