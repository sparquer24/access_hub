"""
Leave Requests API routes (v2).
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
from ...schemas.leave_request import (
    LeaveRequestSchema,
    LeaveRequestCreateSchema,
    LeaveRequestUpdateSchema,
    LeaveRequestApprovalSchema,
    LeaveRequestListSchema
)
from ...services.leave_service import LeaveService
from ...middlewares.rbac_middleware import require_permission
from ...utils.decorators import role_required

bp = Blueprint('leaves_api', __name__, url_prefix='/api/v2/leaves')


@bp.route('', methods=['POST'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
@validate_request(LeaveRequestCreateSchema)
def create_leave_request():
    """
    Create a new leave request
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        data = request.validated_data
        logger.info(f"Validated Data: {data}")
        
        current_user = get_current_user()
        
        if current_user:
            user_id = current_user['id']
        else:
            from flask_jwt_extended import get_jwt_identity
            user_id = get_jwt_identity()

        # Fetch Employee profile linked to this user
        from ...models.employee import Employee
        employee = Employee.query.filter_by(user_id=user_id).first()
        
        if not employee:
            return error_response(message="Employee profile not found", status_code=404)
            
        # Inject backend-controlled fields
        data['employee_id'] = employee.id
        # Use organization_id from the employee record as it is more reliable
        data['organization_id'] = employee.organization_id
        
        # Remove fields not in model
        # duration_type is now supported

        
        leave_request = LeaveService.create_leave_request(data)
        
        schema = LeaveRequestSchema()
        return success_response(
            data=schema.dump(leave_request),
            message='Leave request created successfully',
            status_code=201
        )
    except Exception as e:
        logger.error(f"Error in create_leave_request: {str(e)}")
        raise e


@bp.route('', methods=['GET'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
@validate_query(LeaveRequestListSchema)
def list_leave_requests():
    """
    List all leave requests with pagination and filters
    ---
    tags:
      - Leave Requests
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
      - name: leave_type
        in: query
        type: string
        enum: [sick, casual, earned, unpaid]
        description: Filter by leave type
      - name: status
        in: query
        type: string
        enum: [pending, approved, rejected]
        description: Filter by status
      - name: start_date
        in: query
        type: string
        format: date
        description: Filter by start date (requests starting from this date)
      - name: end_date
        in: query
        type: string
        format: date
        description: Filter by end date (requests ending before this date)
    responses:
      200:
        description: List of leave requests
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
    
    query = LeaveService.list_leave_requests(filters, organization_id)
    result = paginate(query, page, per_page, LeaveRequestSchema)
    
    return success_response(data=result)


@bp.route('/<string:leave_id>', methods=['GET'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def get_leave_request(leave_id):
    """
    Get leave request by ID
    ---
    tags:
      - Leave Requests
    security:
      - Bearer: []
    parameters:
      - name: leave_id
        in: path
        type: string
        required: true
        description: Leave request ID
    responses:
      200:
        description: Leave request details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    leave_request = LeaveService.get_leave_request(leave_id)
    
    schema = LeaveRequestSchema()
    return success_response(data=schema.dump(leave_request))


@bp.route('/<string:leave_id>', methods=['PUT'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
@validate_request(LeaveRequestUpdateSchema)
def update_leave_request(leave_id):
    """
    Update a leave request (only if pending)
    ---
    tags:
      - Leave Requests
    security:
      - Bearer: []
    parameters:
      - name: leave_id
        in: path
        type: string
        required: true
        description: Leave request ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            leave_type:
              type: string
              enum: [sick, casual, earned, unpaid]
            start_date:
              type: string
              format: date
            end_date:
              type: string
              format: date
            total_days:
              type: number
              format: float
            reason:
              type: string
    responses:
      200:
        description: Leave request updated successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        description: Cannot update non-pending leave request
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Leave request overlaps with existing request
    """
    data = request.validated_data
    leave_request = LeaveService.update_leave_request(leave_id, data)
    
    schema = LeaveRequestSchema()
    return success_response(
        data=schema.dump(leave_request),
        message='Leave request updated successfully'
    )


@bp.route('/<string:leave_id>', methods=['DELETE'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def delete_leave_request(leave_id):
    """
    Delete a leave request (only if pending)
    ---
    tags:
      - Leave Requests
    security:
      - Bearer: []
    parameters:
      - name: leave_id
        in: path
        type: string
        required: true
        description: Leave request ID
    responses:
      200:
        description: Leave request deleted successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        description: Cannot delete non-pending leave request
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    LeaveService.delete_leave_request(leave_id)
    
    return success_response(message='Leave request deleted successfully')


@bp.route('/<string:leave_id>/approve', methods=['POST'])
@jwt_required()
@role_required('manager', 'org_admin', 'super_admin')
@validate_request(LeaveRequestApprovalSchema)
def approve_leave_request(leave_id):
    """
    Approve a leave request
    ---
    tags:
      - Leave Requests
    security:
      - Bearer: []
    parameters:
      - name: leave_id
        in: path
        type: string
        required: true
        description: Leave request ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            approval_notes:
              type: string
              example: "Approved by manager"
    responses:
      200:
        description: Leave request approved successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        description: Leave request is not pending
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    data = request.validated_data
    current_user = get_current_user()
    
    if not current_user:
        from flask_jwt_extended import get_jwt_identity
        # Construct a minimal user dict for the service
        current_user = {'id': get_jwt_identity()}
    
    leave_request = LeaveService.approve_leave_request(leave_id, data, current_user)
    
    schema = LeaveRequestSchema()
    return success_response(
        data=schema.dump(leave_request),
        message='Leave request approved successfully'
    )


@bp.route('/<string:leave_id>/reject', methods=['POST'])
@jwt_required()
@role_required('manager', 'org_admin', 'super_admin')
@validate_request(LeaveRequestApprovalSchema)
def reject_leave_request(leave_id):
    """
    Reject a leave request
    ---
    tags:
      - Leave Requests
    security:
      - Bearer: []
    parameters:
      - name: leave_id
        in: path
        type: string
        required: true
        description: Leave request ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            approval_notes:
              type: string
              example: "Not enough leave balance"
    responses:
      200:
        description: Leave request rejected successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        description: Leave request is not pending
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    data = request.validated_data
    current_user = get_current_user()

    if not current_user:
        from flask_jwt_extended import get_jwt_identity
        # Construct a minimal user dict for the service
        current_user = {'id': get_jwt_identity()}
    
    leave_request = LeaveService.reject_leave_request(leave_id, data, current_user)
    
    schema = LeaveRequestSchema()
    return success_response(
        data=schema.dump(leave_request),
        message='Leave request rejected successfully'
    )
