"""
Cameras API routes (v2).
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
from ...schemas.camera import (
    CameraSchema,
    CameraCreateSchema,
    CameraUpdateSchema,
    CameraListSchema,
    CameraHeartbeatSchema
)
from ...services.camera_service import CameraService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('cameras_api', __name__, url_prefix='/api/v2/cameras')


@bp.route('', methods=['POST'])
@jwt_required()
@require_permission('cameras:create')
@validate_request(CameraCreateSchema)
def create_camera():
    """
    Create a new camera
    ---
    tags:
      - Cameras
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
            - location_id
            - name
            - camera_type
            - source_type
          properties:
            organization_id:
              type: string
              example: "org-uuid-123"
            location_id:
              type: string
              example: "loc-uuid-456"
            name:
              type: string
              example: "Main Gate Camera 1"
            camera_type:
              type: string
              enum: [CHECK_IN, CHECK_OUT, CCTV]
              example: "CHECK_IN"
            source_type:
              type: string
              enum: [IP_CAMERA, USB_CAMERA, RTSP_STREAM]
              example: "RTSP_STREAM"
            source_url:
              type: string
              example: "rtsp://192.168.1.100:554/stream"
            source_config:
              type: object
            fps:
              type: integer
              example: 10
            resolution:
              type: string
              example: "640x480"
            confidence_threshold:
              type: number
              format: float
              example: 0.6
            liveness_check_enabled:
              type: boolean
              example: true
    responses:
      201:
        description: Camera created successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Camera with this name already exists
    """
    data = request.validated_data
    camera = CameraService.create_camera(data)
    
    schema = CameraSchema()
    return success_response(
        data=schema.dump(camera),
        message='Camera created successfully',
        status_code=201
    )


@bp.route('', methods=['GET'])
@jwt_required()
@require_permission('cameras:read')
@validate_query(CameraListSchema)
def list_cameras():
    """
    List all cameras with pagination and filters
    ---
    tags:
      - Cameras
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
      - name: location_id
        in: query
        type: string
        description: Filter by location ID
      - name: camera_type
        in: query
        type: string
        enum: [CHECK_IN, CHECK_OUT, CCTV]
        description: Filter by camera type
      - name: status
        in: query
        type: string
        description: Filter by status (online, offline, error)
      - name: is_active
        in: query
        type: boolean
        description: Filter by active status
    responses:
      200:
        description: List of cameras
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
    
    query = CameraService.list_cameras(filters, organization_id)
    result = paginate(query, page, per_page, CameraSchema)
    
    return success_response(data=result)


@bp.route('/<string:camera_id>', methods=['GET'])
@jwt_required()
@require_permission('cameras:read')
def get_camera(camera_id):
    """
    Get camera by ID
    ---
    tags:
      - Cameras
    security:
      - Bearer: []
    parameters:
      - name: camera_id
        in: path
        type: string
        required: true
        description: Camera ID
    responses:
      200:
        description: Camera details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    camera = CameraService.get_camera(camera_id)
    
    schema = CameraSchema()
    return success_response(data=schema.dump(camera))


@bp.route('/<string:camera_id>', methods=['PUT'])
@jwt_required()
@require_permission('cameras:update')
@validate_request(CameraUpdateSchema)
def update_camera(camera_id):
    """
    Update a camera
    ---
    tags:
      - Cameras
    security:
      - Bearer: []
    parameters:
      - name: camera_id
        in: path
        type: string
        required: true
        description: Camera ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            location_id:
              type: string
            name:
              type: string
            camera_type:
              type: string
              enum: [CHECK_IN, CHECK_OUT, CCTV]
            source_type:
              type: string
              enum: [IP_CAMERA, USB_CAMERA, RTSP_STREAM]
            source_url:
              type: string
            source_config:
              type: object
            fps:
              type: integer
            resolution:
              type: string
            confidence_threshold:
              type: number
              format: float
            liveness_check_enabled:
              type: boolean
            is_active:
              type: boolean
    responses:
      200:
        description: Camera updated successfully
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
    camera = CameraService.update_camera(camera_id, data)
    
    schema = CameraSchema()
    return success_response(
        data=schema.dump(camera),
        message='Camera updated successfully'
    )


@bp.route('/<string:camera_id>', methods=['DELETE'])
@jwt_required()
@require_permission('cameras:delete')
def delete_camera(camera_id):
    """
    Delete a camera (soft delete)
    ---
    tags:
      - Cameras
    security:
      - Bearer: []
    parameters:
      - name: camera_id
        in: path
        type: string
        required: true
        description: Camera ID
      - name: hard_delete
        in: query
        type: boolean
        default: false
        description: Perform hard delete instead of soft delete
    responses:
      200:
        description: Camera deleted successfully
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
    CameraService.delete_camera(camera_id, soft_delete=not hard_delete)
    
    return success_response(message='Camera deleted successfully')


@bp.route('/<string:camera_id>/heartbeat', methods=['POST'])
@jwt_required()
@require_permission('cameras:update')
@validate_request(CameraHeartbeatSchema)
def update_camera_heartbeat(camera_id):
    """
    Update camera heartbeat status
    ---
    tags:
      - Cameras
    security:
      - Bearer: []
    parameters:
      - name: camera_id
        in: path
        type: string
        required: true
        description: Camera ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - status
          properties:
            status:
              type: string
              enum: [online, offline, error]
              example: "online"
            error_message:
              type: string
              example: "Connection timeout"
    responses:
      200:
        description: Camera heartbeat updated successfully
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
    camera = CameraService.update_heartbeat(camera_id, data)
    
    schema = CameraSchema()
    return success_response(
        data=schema.dump(camera),
        message='Camera heartbeat updated successfully'
    )
