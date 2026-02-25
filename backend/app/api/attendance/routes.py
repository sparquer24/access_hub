"""
Attendance API routes (v2).
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
from ...schemas.attendance import (
    AttendanceRecordSchema,
    AttendanceCheckInSchema,
    AttendanceCheckOutSchema,
    AttendanceUpdateSchema,
    AttendanceListSchema,
    AttendanceApprovalSchema
)
from ...services.attendance_service import AttendanceService
from ...middleware import require_permission

bp = Blueprint('attendance_api', __name__, url_prefix='/api/v2/attendance')


@bp.route('/check-in', methods=['POST'])
@jwt_required()
@require_permission('attendance:create')
@validate_request(AttendanceCheckInSchema)
def check_in():
    """
    Check-in an employee
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - employee_id
          properties:
            employee_id:
              type: string
              example: "emp-uuid-123"
            camera_id:
              type: string
              example: "cam-uuid-456"
            location:
              type: object
              properties:
                latitude:
                  type: number
                longitude:
                  type: number
            device_info:
              type: object
            face_match_confidence:
              type: number
              format: float
              example: 0.95
            liveness_verified:
              type: boolean
              example: true
    responses:
      201:
        description: Check-in successful
        schema:
          $ref: '#/definitions/Success'
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Employee already checked in today
    """
    data = request.validated_data
    current_user = get_current_user()
    
    attendance = AttendanceService.check_in(data, current_user)
    
    schema = AttendanceRecordSchema()
    return success_response(
        data=schema.dump(attendance),
        message='Check-in successful',
        status_code=201
    )


@bp.route('/check-out', methods=['POST'])
@jwt_required()
@require_permission('attendance:create')
@validate_request(AttendanceCheckOutSchema)
def check_out():
    """
    Check-out an employee
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - employee_id
          properties:
            employee_id:
              type: string
              example: "emp-uuid-123"
            camera_id:
              type: string
              example: "cam-uuid-456"
            location:
              type: object
              properties:
                latitude:
                  type: number
                longitude:
                  type: number
            device_info:
              type: object
    responses:
      200:
        description: Check-out successful
        schema:
          $ref: '#/definitions/Success'
      400:
        description: No check-in record found or employee not checked in
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Employee already checked out today
    """
    data = request.validated_data
    current_user = get_current_user()
    
    attendance = AttendanceService.check_out(data, current_user)
    
    schema = AttendanceRecordSchema()
    return success_response(
        data=schema.dump(attendance),
        message='Check-out successful'
    )


@bp.route('', methods=['GET'])
@jwt_required()
@require_permission('attendance:read')
@validate_query(AttendanceListSchema)
def list_attendance():
    """
    List all attendance records with pagination and filters
    ---
    tags:
      - Attendance
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
        description: Search by employee name or code
      - name: organization_id
        in: query
        type: string
        description: Filter by organization ID
      - name: employee_id
        in: query
        type: string
        description: Filter by employee ID
      - name: department_id
        in: query
        type: string
        description: Filter by department ID
      - name: start_date
        in: query
        type: string
        format: date
        description: Filter by start date
      - name: end_date
        in: query
        type: string
        format: date
        description: Filter by end date
      - name: status
        in: query
        type: string
        enum: [present, absent, half_day, on_leave, holiday]
        description: Filter by attendance status
      - name: review_status
        in: query
        type: string
        enum: [auto_approved, pending, approved, rejected]
        description: Filter by review status
    responses:
      200:
        description: List of attendance records
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
    
    # Get organization_id from either query params or JWT claims
    organization_id = filters.get('organization_id')
    
    # If not in query params, try to get from JWT claims
    if not organization_id:
        current_user = get_current_user()
        organization_id = current_user.get('organization_id') if current_user else None
    
    query = AttendanceService.list_attendance(filters, organization_id)
    result = paginate(query, page, per_page, AttendanceRecordSchema)
    
    return success_response(data=result)


@bp.route('/<string:attendance_id>', methods=['GET'])
@jwt_required()
@require_permission('attendance:read')
def get_attendance(attendance_id):
    """
    Get attendance record by ID
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    parameters:
      - name: attendance_id
        in: path
        type: string
        required: true
        description: Attendance record ID
    responses:
      200:
        description: Attendance record details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    attendance = AttendanceService.get_attendance(attendance_id)
    
    schema = AttendanceRecordSchema()
    return success_response(data=schema.dump(attendance))


@bp.route('/<string:attendance_id>', methods=['PUT'])
@jwt_required()
@require_permission('attendance:update')
@validate_request(AttendanceUpdateSchema)
def update_attendance(attendance_id):
    """
    Update an attendance record
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    parameters:
      - name: attendance_id
        in: path
        type: string
        required: true
        description: Attendance record ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            check_in_time:
              type: string
              format: date-time
            check_out_time:
              type: string
              format: date-time
            status:
              type: string
              enum: [present, absent, half_day, on_leave, holiday]
            notes:
              type: string
            review_status:
              type: string
              enum: [auto_approved, pending, approved, rejected]
    responses:
      200:
        description: Attendance record updated successfully
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
    attendance = AttendanceService.update_attendance(attendance_id, data)
    
    schema = AttendanceRecordSchema()
    return success_response(
        data=schema.dump(attendance),
        message='Attendance record updated successfully'
    )


@bp.route('/<string:attendance_id>', methods=['DELETE'])
@jwt_required()
@require_permission('attendance:delete')
def delete_attendance(attendance_id):
    """
    Delete an attendance record
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    parameters:
      - name: attendance_id
        in: path
        type: string
        required: true
        description: Attendance record ID
    responses:
      200:
        description: Attendance record deleted successfully
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    AttendanceService.delete_attendance(attendance_id)
    
    return success_response(message='Attendance record deleted successfully')


@bp.route('/<string:attendance_id>/approve', methods=['POST'])
@jwt_required()
@require_permission('attendance:approve')
@validate_request(AttendanceApprovalSchema)
def approve_attendance(attendance_id):
    """
    Approve or reject an attendance record
    ---
    tags:
      - Attendance
    security:
      - Bearer: []
    parameters:
      - name: attendance_id
        in: path
        type: string
        required: true
        description: Attendance record ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - review_status
          properties:
            review_status:
              type: string
              enum: [approved, rejected]
              example: "approved"
            notes:
              type: string
              example: "Approved by manager"
    responses:
      200:
        description: Attendance record review updated successfully
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
    current_user = get_current_user()
    
    attendance = AttendanceService.approve_attendance(attendance_id, data, current_user)
    
    schema = AttendanceRecordSchema()
    return success_response(
        data=schema.dump(attendance),
        message='Attendance record review updated successfully'
    )
