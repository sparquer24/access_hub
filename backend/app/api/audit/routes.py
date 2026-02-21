"""
Audit Log API routes (v2).
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
from ...schemas.audit import (
    AuditLogSchema,
    AuditLogListSchema,
    UserAuditLogListSchema,
    EntityAuditLogListSchema
)
from ...services.audit_service import AuditService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('audit_api', __name__, url_prefix='/api/v2/audit')


@bp.route('', methods=['GET'])
@jwt_required()
@require_permission('audit:read')
@validate_query(AuditLogListSchema)
def list_audit_logs():
    """
    List all audit logs with pagination and filters
    ---
    tags:
      - Audit Logs
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
      - name: user_id
        in: query
        type: string
        description: Filter by user ID
      - name: organization_id
        in: query
        type: string
        description: Filter by organization ID
      - name: action
        in: query
        type: string
        description: Filter by action (create, update, delete, login, etc.)
      - name: entity_type
        in: query
        type: string
        description: Filter by entity type (model name)
      - name: entity_id
        in: query
        type: string
        description: Filter by entity ID
      - name: search
        in: query
        type: string
        description: Search in action or entity type
      - name: start_date
        in: query
        type: string
        format: date-time
        description: Filter logs from this date
      - name: end_date
        in: query
        type: string
        format: date-time
        description: Filter logs until this date
    responses:
      200:
        description: List of audit logs
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
    
    query = AuditService.list_audit_logs(filters)
    result = paginate(query, page, per_page, AuditLogSchema)
    
    return success_response(data=result)


@bp.route('/<string:log_id>', methods=['GET'])
@jwt_required()
@require_permission('audit:read')
def get_audit_log(log_id):
    """
    Get audit log by ID
    ---
    tags:
      - Audit Logs
    security:
      - Bearer: []
    parameters:
      - name: log_id
        in: path
        type: string
        required: true
        description: Audit log ID
    responses:
      200:
        description: Audit log details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    log = AuditService.get_audit_log(log_id)
    
    schema = AuditLogSchema()
    return success_response(data=schema.dump(log))


@bp.route('/user/<string:user_id>', methods=['GET'])
@jwt_required()
@require_permission('audit:read')
@validate_query(UserAuditLogListSchema)
def get_user_audit_logs(user_id):
    """
    Get audit logs for a specific user
    ---
    tags:
      - Audit Logs
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: path
        type: string
        required: true
        description: User ID
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
      - name: action
        in: query
        type: string
        description: Filter by action
      - name: entity_type
        in: query
        type: string
        description: Filter by entity type
      - name: start_date
        in: query
        type: string
        format: date-time
        description: Filter logs from this date
      - name: end_date
        in: query
        type: string
        format: date-time
        description: Filter logs until this date
    responses:
      200:
        description: List of user audit logs
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
    
    query = AuditService.get_user_audit_logs(user_id, filters)
    result = paginate(query, page, per_page, AuditLogSchema)
    
    return success_response(data=result)


@bp.route('/entity/<string:entity_type>/<string:entity_id>', methods=['GET'])
@jwt_required()
@require_permission('audit:read')
@validate_query(EntityAuditLogListSchema)
def get_entity_audit_logs(entity_type, entity_id):
    """
    Get audit logs for a specific entity
    ---
    tags:
      - Audit Logs
    security:
      - Bearer: []
    parameters:
      - name: entity_type
        in: path
        type: string
        required: true
        description: Entity type (model name, e.g., User, Organization)
      - name: entity_id
        in: path
        type: string
        required: true
        description: Entity ID
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
      - name: action
        in: query
        type: string
        description: Filter by action
      - name: user_id
        in: query
        type: string
        description: Filter by user who performed the action
      - name: start_date
        in: query
        type: string
        format: date-time
        description: Filter logs from this date
      - name: end_date
        in: query
        type: string
        format: date-time
        description: Filter logs until this date
    responses:
      200:
        description: List of entity audit logs
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
    
    query = AuditService.get_entity_audit_logs(entity_type, entity_id, filters)
    result = paginate(query, page, per_page, AuditLogSchema)
    
    return success_response(data=result)


@bp.route('/stats', methods=['GET'])
@jwt_required()
@require_permission('audit:read')
def get_audit_statistics():
    """
    Get audit log statistics
    ---
    tags:
      - Audit Logs
    security:
      - Bearer: []
    parameters:
      - name: organization_id
        in: query
        type: string
        description: Filter by organization ID
    responses:
      200:
        description: Audit log statistics
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
                action_stats:
                  type: object
                  description: Count of each action type
                  example: {"create": 150, "update": 89, "delete": 23, "login": 456}
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    organization_id = request.args.get('organization_id')
    
    stats = AuditService.get_action_statistics(organization_id)
    
    return success_response(data={'action_stats': stats})


@bp.route('/recent', methods=['GET'])
@jwt_required()
@require_permission('audit:read')
def get_recent_activity():
    """
    Get recent activity logs
    ---
    tags:
      - Audit Logs
    security:
      - Bearer: []
    parameters:
      - name: limit
        in: query
        type: integer
        default: 10
        description: Number of recent logs to return (max 50)
      - name: organization_id
        in: query
        type: string
        description: Filter by organization ID
    responses:
      200:
        description: Recent activity logs
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
              type: array
              items:
                type: object
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    limit = min(int(request.args.get('limit', 10)), 50)  # Max 50
    organization_id = request.args.get('organization_id')
    
    recent_logs = AuditService.get_recent_activity(limit, organization_id)
    
    schema = AuditLogSchema(many=True)
    return success_response(data=schema.dump(recent_logs))
