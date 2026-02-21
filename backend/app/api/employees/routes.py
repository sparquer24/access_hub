"""
Employees API routes (v2).
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from marshmallow import Schema, fields, validate
from ...utils.helpers import (
    success_response,
    error_response,
    paginate,
    validate_request,
    validate_query,
    get_current_user
)
from ...utils.exceptions import NotFoundError, ForbiddenError
from ...schemas.employee import (
    EmployeeSchema,
    EmployeeCreateSchema,
    EmployeeUpdateSchema,
    EmployeeListSchema
)
from ...schemas.attendance import AttendanceRecordSchema
from ...services.employee_service import EmployeeService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('employees_api', __name__, url_prefix='/api/v2/employees')


class EmployeeAttendanceListSchema(Schema):
    """Schema for employee attendance list filters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    start_date = fields.Date(load_default=None)
    end_date = fields.Date(load_default=None)
    status = fields.String(
        load_default=None,
        validate=validate.OneOf(['present', 'absent', 'late', 'half_day', 'on_leave'])
    )


@bp.route('', methods=['POST'])
@jwt_required()
@require_permission('employees:create')
@validate_request(EmployeeCreateSchema)
def create_employee():
    """
    Create a new employee
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - user_id
            - organization_id
            - department_id
            - employee_code
            - full_name
          properties:
            user_id:
              type: string
              example: "user-uuid-123"
            organization_id:
              type: string
              example: "org-uuid-123"
            department_id:
              type: string
              example: "dept-uuid-456"
            employee_code:
              type: string
              example: "EMP001"
            full_name:
              type: string
              example: "John Doe"
            gender:
              type: string
              enum: [male, female, other]
            date_of_birth:
              type: string
              format: date
            phone_number:
              type: string
            emergency_contact:
              type: object
            address:
              type: string
            joining_date:
              type: string
              format: date
            designation:
              type: string
            employment_type:
              type: string
              enum: [full_time, part_time, contract, intern]
            shift_id:
              type: string
    responses:
      201:
        description: Employee created successfully
        schema:
          $ref: '#/definitions/Success'
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
      409:
        description: Employee with this code already exists
    """
    data = request.validated_data
    employee = EmployeeService.create_employee(data)
    
    schema = EmployeeSchema()
    return success_response(
        data=schema.dump(employee),
        message='Employee created successfully',
        status_code=201
    )


@bp.route('', methods=['GET'])
@jwt_required()
@require_permission('employees:read')
@validate_query(EmployeeListSchema)
def list_employees():
    """
    List all employees with pagination and filters
    ---
    tags:
      - Employees
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
        description: Search by name, employee code, or phone
      - name: organization_id
        in: query
        type: string
        description: Filter by organization ID
      - name: department_id
        in: query
        type: string
        description: Filter by department ID
      - name: employment_type
        in: query
        type: string
        enum: [full_time, part_time, contract, intern]
        description: Filter by employment type
      - name: is_active
        in: query
        type: boolean
        description: Filter by active status
    responses:
      200:
        description: List of employees
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
    
    query = EmployeeService.list_employees(filters, organization_id)
    result = paginate(query, page, per_page, EmployeeSchema)
    
    return success_response(data=result)


@bp.route('/<string:employee_id>', methods=['GET'])
@jwt_required()
@require_permission('employees:read')
def get_employee(employee_id):
    """
    Get employee by ID
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    parameters:
      - name: employee_id
        in: path
        type: string
        required: true
        description: Employee ID
    responses:
      200:
        description: Employee details
        schema:
          $ref: '#/definitions/Success'
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    employee = EmployeeService.get_employee(employee_id)
    
    schema = EmployeeSchema()
    return success_response(data=schema.dump(employee))


@bp.route('/<string:employee_id>', methods=['PUT'])
@jwt_required()
@require_permission('employees:update')
@validate_request(EmployeeUpdateSchema)
def update_employee(employee_id):
    """
    Update an employee
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    parameters:
      - name: employee_id
        in: path
        type: string
        required: true
        description: Employee ID
      - in: body
        name: body
        schema:
          type: object
          properties:
            department_id:
              type: string
            full_name:
              type: string
            gender:
              type: string
              enum: [male, female, other]
            date_of_birth:
              type: string
              format: date
            phone_number:
              type: string
            emergency_contact:
              type: object
            address:
              type: string
            joining_date:
              type: string
              format: date
            designation:
              type: string
            employment_type:
              type: string
              enum: [full_time, part_time, contract, intern]
            shift_id:
              type: string
            is_active:
              type: boolean
    responses:
      200:
        description: Employee updated successfully
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
    employee = EmployeeService.update_employee(employee_id, data)
    
    schema = EmployeeSchema()
    return success_response(
        data=schema.dump(employee),
        message='Employee updated successfully'
    )


@bp.route('/<string:employee_id>', methods=['DELETE'])
@jwt_required()
@require_permission('employees:delete')
def delete_employee(employee_id):
    """
    Delete an employee (soft delete)
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    parameters:
      - name: employee_id
        in: path
        type: string
        required: true
        description: Employee ID
      - name: hard_delete
        in: query
        type: boolean
        default: false
        description: Perform hard delete instead of soft delete
    responses:
      200:
        description: Employee deleted successfully
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
    EmployeeService.delete_employee(employee_id, soft_delete=not hard_delete)
    
    return success_response(message='Employee deleted successfully')


@bp.route('/<string:employee_id>/attendance', methods=['GET'])
@jwt_required()
@require_permission('employees:read')
@validate_query(EmployeeAttendanceListSchema)
def get_employee_attendance(employee_id):
    """
    Get attendance records for an employee
    ---
    tags:
      - Employees
    security:
      - Bearer: []
    parameters:
      - name: employee_id
        in: path
        type: string
        required: true
        description: Employee ID
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
        enum: [present, absent, late, half_day, on_leave]
        description: Filter by attendance status
    responses:
      200:
        description: List of attendance records
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
            data:
              type: object
              properties:
                items:
                  type: array
                  items:
                    type: object
                pagination:
                  type: object
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    filters = request.validated_query
    page = filters.pop('page', 1)
    per_page = filters.pop('per_page', 20)
    
    query = EmployeeService.get_employee_attendance(employee_id, filters)
    result = paginate(query, page, per_page, AttendanceRecordSchema)
    
    return success_response(data=result)