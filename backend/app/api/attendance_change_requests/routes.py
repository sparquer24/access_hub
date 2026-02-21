"""
Attendance Change Requests API routes (v2).
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...utils.helpers import (
    success_response,
    error_response,
    paginate,
    validate_request,
    validate_query,
    get_current_user
)
from ...schemas.attendance_change_request import (
    ATTENDANCE_CHANGE_REQUEST_SCHEMA,
    ATTENDANCE_CHANGE_REQUEST_UPDATE_SCHEMA,
    ATTENDANCE_CHANGE_REQUEST_APPROVAL_SCHEMA,
    ATTENDANCE_CHANGE_REQUEST_LIST_SCHEMA
)
from ...services.attendance_change_request_service import AttendanceChangeRequestService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('attendance_change_requests_api', __name__, url_prefix='/api/v2/attendance-change-requests')


@bp.route('', methods=['POST'])
@jwt_required()
def create_change_request():
    """
    Create a new attendance change request
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - request_date
            - request_type
            - requested_changes
            - reason
          properties:
            request_date:
              type: string
              format: date
              example: "2024-01-15"
            request_type:
              type: string
              enum: [manual_checkin, time_correction, status_change]
            attendance_record_id:
              type: string
            requested_changes:
              type: object
              example: {"check_in_time": "2024-01-15T09:00:00", "check_out_time": "2024-01-15T17:00:00"}
            reason:
              type: string
              example: "Forgot to check in due to urgent meeting"
    responses:
      201:
        description: Change request created successfully
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      409:
        description: Conflicting change request exists
    """
    data = validate_request(request, ATTENDANCE_CHANGE_REQUEST_SCHEMA)
    
    # Get current user and employee
    current_user = get_current_user()
    employee_id = current_user.employee.id if current_user.employee else None
    
    if not employee_id:
        return error_response('Employee profile not found', 404)
    
    data['employee_id'] = employee_id
    
    try:
        change_request = AttendanceChangeRequestService.create_change_request(data)
        return success_response(
            message='Attendance change request created successfully',
            data=change_request.to_dict(include_employee=True, include_attendance=True),
            status_code=201
        )
    except Exception as e:
        return error_response(str(e), getattr(e, 'status_code', 500))


@bp.route('', methods=['GET'])
@jwt_required()
def list_change_requests():
    """
    List all attendance change requests with pagination and filters
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 10
      - name: employee_id
        in: query
        type: string
      - name: status
        in: query
        type: string
        enum: [pending, approved, rejected, all]
        default: all
      - name: request_type
        in: query
        type: string
        enum: [manual_checkin, time_correction, status_change, all]
      - name: start_date
        in: query
        type: string
        format: date
      - name: end_date
        in: query
        type: string
        format: date
    responses:
      200:
        description: List of attendance change requests
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    filters = validate_query(request, ATTENDANCE_CHANGE_REQUEST_LIST_SCHEMA)
    
    # Get current user
    current_user = get_current_user()
    
    # Add organization filter for tenant isolation
    if current_user.organization_id:
        filters['organization_id'] = current_user.organization_id
    
    # If employee role, filter by their own requests
    if current_user.role.name == 'employee' and current_user.employee:
        filters['employee_id'] = current_user.employee.id
    
    # Get query
    query = AttendanceChangeRequestService.list_change_requests(filters)
    
    # Paginate
    page = filters.get('page', 1)
    per_page = filters.get('per_page', 10)
    pagination = paginate(query, page, per_page)
    
    # Serialize results
    results = [req.to_dict(include_employee=True, include_attendance=True) for req in pagination['items']]
    
    return success_response(
        data=results,
        pagination=pagination['meta']
    )


@bp.route('/<request_id>', methods=['GET'])
@jwt_required()
def get_change_request(request_id):
    """
    Get attendance change request by ID
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - name: request_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: Attendance change request details
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    try:
        change_request = AttendanceChangeRequestService.get_change_request(request_id)
        
        # Check access permission
        current_user = get_current_user()
        if current_user.role.name == 'employee':
            if not current_user.employee or change_request.employee_id != current_user.employee.id:
                return error_response('Forbidden', 403)
        
        return success_response(
            data=change_request.to_dict(include_employee=True, include_attendance=True)
        )
    except Exception as e:
        return error_response(str(e), getattr(e, 'status_code', 500))


@bp.route('/<request_id>', methods=['PUT'])
@jwt_required()
def update_change_request(request_id):
    """
    Update an attendance change request (only if pending)
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - name: request_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            requested_changes:
              type: object
            reason:
              type: string
    responses:
      200:
        description: Change request updated successfully
      400:
        $ref: '#/responses/BadRequestError'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    data = validate_request(request, ATTENDANCE_CHANGE_REQUEST_UPDATE_SCHEMA)
    
    try:
        change_request = AttendanceChangeRequestService.get_change_request(request_id)
        
        # Check access permission
        current_user = get_current_user()
        if current_user.role.name == 'employee':
            if not current_user.employee or change_request.employee_id != current_user.employee.id:
                return error_response('Forbidden', 403)
        
        updated_request = AttendanceChangeRequestService.update_change_request(request_id, data)
        
        return success_response(
            message='Change request updated successfully',
            data=updated_request.to_dict(include_employee=True, include_attendance=True)
        )
    except Exception as e:
        return error_response(str(e), getattr(e, 'status_code', 500))


@bp.route('/<request_id>', methods=['DELETE'])
@jwt_required()
def delete_change_request(request_id):
    """
    Delete an attendance change request (only if pending)
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - name: request_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: Change request deleted successfully
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    try:
        change_request = AttendanceChangeRequestService.get_change_request(request_id)
        
        # Check access permission
        current_user = get_current_user()
        if current_user.role.name == 'employee':
            if not current_user.employee or change_request.employee_id != current_user.employee.id:
                return error_response('Forbidden', 403)
        
        AttendanceChangeRequestService.delete_change_request(request_id)
        
        return success_response(message='Change request deleted successfully')
    except Exception as e:
        return error_response(str(e), getattr(e, 'status_code', 500))


@bp.route('/<request_id>/approve', methods=['POST'])
@jwt_required()
@require_permission(['manager', 'org_admin', 'super_admin'])
def approve_change_request(request_id):
    """
    Approve an attendance change request
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - name: request_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            approval_notes:
              type: string
    responses:
      200:
        description: Change request approved successfully
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    data = request.get_json() or {}
    approval_notes = data.get('approval_notes')
    
    try:
        current_user = get_current_user()
        approver_id = current_user.id
        
        change_request = AttendanceChangeRequestService.approve_change_request(
            request_id,
            approver_id,
            approval_notes
        )
        
        return success_response(
            message='Change request approved successfully',
            data=change_request.to_dict(include_employee=True, include_attendance=True)
        )
    except Exception as e:
        return error_response(str(e), getattr(e, 'status_code', 500))


@bp.route('/<request_id>/reject', methods=['POST'])
@jwt_required()
@require_permission(['manager', 'org_admin', 'super_admin'])
def reject_change_request(request_id):
    """
    Reject an attendance change request
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - name: request_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - approval_notes
          properties:
            approval_notes:
              type: string
    responses:
      200:
        description: Change request rejected successfully
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    data = validate_request(request, ATTENDANCE_CHANGE_REQUEST_APPROVAL_SCHEMA)
    approval_notes = data.get('approval_notes', 'Request rejected')
    
    try:
        current_user = get_current_user()
        approver_id = current_user.id
        
        change_request = AttendanceChangeRequestService.reject_change_request(
            request_id,
            approver_id,
            approval_notes
        )
        
        return success_response(
            message='Change request rejected',
            data=change_request.to_dict(include_employee=True, include_attendance=True)
        )
    except Exception as e:
        return error_response(str(e), getattr(e, 'status_code', 500))


@bp.route('/my-requests', methods=['GET'])
@jwt_required()
def get_my_change_requests():
    """
    Get current employee's attendance change requests
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - name: status
        in: query
        type: string
        enum: [pending, approved, rejected, all]
        default: all
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 10
    responses:
      200:
        description: List of employee's change requests
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    current_user = get_current_user()
    
    if not current_user.employee:
        return error_response('Employee profile not found', 404)
    
    filters = validate_query(request, ATTENDANCE_CHANGE_REQUEST_LIST_SCHEMA)
    filters['employee_id'] = current_user.employee.id
    filters['organization_id'] = current_user.organization_id
    
    query = AttendanceChangeRequestService.list_change_requests(filters)
    
    page = filters.get('page', 1)
    per_page = filters.get('per_page', 10)
    pagination = paginate(query, page, per_page)
    
    results = [req.to_dict(include_attendance=True) for req in pagination['items']]
    
    return success_response(
        data=results,
        pagination=pagination['meta']
    )


@bp.route('/pending', methods=['GET'])
@jwt_required()
@require_permission(['manager', 'org_admin', 'super_admin'])
def get_pending_change_requests():
    """
    Get pending attendance change requests for approval
    ---
    tags:
      - Attendance Change Requests
    security:
      - Bearer: []
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 10
    responses:
      200:
        description: List of pending change requests
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    current_user = get_current_user()
    
    filters = {
        'status': 'pending',
        'organization_id': current_user.organization_id,
        'page': request.args.get('page', 1, type=int),
        'per_page': request.args.get('per_page', 10, type=int)
    }
    
    query = AttendanceChangeRequestService.list_change_requests(filters)
    
    pagination = paginate(query, filters['page'], filters['per_page'])
    
    results = [req.to_dict(include_employee=True, include_attendance=True) for req in pagination['items']]
    
    return success_response(
        data=results,
        pagination=pagination['meta']
    )
