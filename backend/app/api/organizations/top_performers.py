"""
Top performers endpoint for organizations.
Identifies employees with perfect attendance and minimal leaves.
"""

from flask import request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from ...extensions import db
from ...models import Employee, AttendanceRecord, LeaveRequest, Department
from ...middleware import require_permission
from ...utils.responses import success_response, error_response
from . import bp


@bp.route('/<string:org_id>/employees/top-performers', methods=['GET'])
@jwt_required()
@require_permission('employees:read')
def get_top_performers(org_id):
    """
    Get top performers - employees with perfect attendance and minimal leaves
    ---
    tags:
      - Organizations
      - Employees
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: month
        in: query
        type: string
        format: date
        description: Filter by month (YYYY-MM format)
      - name: limit
        in: query
        type: integer
        default: 10
        description: Number of top performers to return
    responses:
      200:
        description: Top performers list
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                punctual_employees:
                  type: array
                  items:
                    type: object
                    properties:
                      employee_id:
                        type: string
                      full_name:
                        type: string
                      employee_code:
                        type: string
                      department:
                        type: string
                      email:
                        type: string
                      present_days:
                        type: integer
                      late_arrivals:
                        type: integer
                      attendance_percentage:
                        type: number
                low_leave_employees:
                  type: array
                  items:
                    type: object
                    properties:
                      employee_id:
                        type: string
                      full_name:
                        type: string
                      employee_code:
                        type: string
                      department:
                        type: string
                      email:
                        type: string
                      leave_days:
                        type: number
                      leave_types:
                        type: object
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    try:
        month = request.args.get('month')
        limit = request.args.get('limit', 10, type=int)
        
        # Calculate date range
        if month:
            try:
                month_date = datetime.strptime(month, '%Y-%m')
                start_date = month_date.date()
                # Get last day of month
                if month_date.month == 12:
                    end_date = datetime(month_date.year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    end_date = datetime(month_date.year, month_date.month + 1, 1).date() - timedelta(days=1)
            except ValueError:
                start_date = datetime.utcnow().date().replace(day=1)
                end_date = datetime.utcnow().date()
        else:
            # Default to current month
            today = datetime.utcnow().date()
            start_date = today.replace(day=1)
            end_date = today
        
        # Get all active employees in organization
        employees = db.session.query(Employee).filter(
            Employee.organization_id == org_id,
            Employee.is_active.is_(True),
            Employee.deleted_at.is_(None)
        ).all()
        
        punctual_employees = []
        low_leave_employees = []
        
        for emp in employees:
            # Get attendance records for date range
            attendance_recs = db.session.query(AttendanceRecord).filter(
                AttendanceRecord.employee_id == emp.id,
                AttendanceRecord.date >= start_date,
                AttendanceRecord.date <= end_date
            ).all()
            
            # Count late arrivals (check-in after 9:15 AM)
            late_count = 0
            present_days = 0
            for rec in attendance_recs:
                if rec.check_in_time:
                    present_days += 1
                    check_in = rec.check_in_time
                    # Check if late (after 9:15 AM)
                    if check_in.hour > 9 or (check_in.hour == 9 and check_in.minute > 15):
                        late_count += 1
            
            # Get leave requests
            leave_reqs = db.session.query(LeaveRequest).filter(
                LeaveRequest.employee_id == emp.id,
                LeaveRequest.organization_id == org_id,
                LeaveRequest.status == 'approved',
                LeaveRequest.start_date <= end_date,
                LeaveRequest.end_date >= start_date
            ).all()
            
            # Calculate leave days in this period
            total_leave_days = 0.0
            leave_types_count = {}
            for leave_req in leave_reqs:
                # Calculate overlap with month
                overlap_start = max(leave_req.start_date, start_date)
                overlap_end = min(leave_req.end_date, end_date)
                if overlap_start <= overlap_end:
                    days = (overlap_end - overlap_start).days + 1
                    total_leave_days += leave_req.total_days if leave_req.total_days else days
                    leave_types_count[leave_req.leave_type] = leave_types_count.get(leave_req.leave_type, 0) + (leave_req.total_days if leave_req.total_days else days)
            
            total_days = (end_date - start_date).days + 1
            attendance_pct = round((present_days / total_days * 100), 1) if total_days > 0 else 0
            
            # Get department name
            department = ''
            if emp.department_id:
                dept = db.session.query(Department).filter_by(id=emp.department_id).first()
                department = dept.name if dept else ''
            
            # Get user email
            email = ''
            if emp.user:
                email = emp.user.email or ''
            
            employee_data = {
                'employee_id': emp.id,
                'full_name': emp.full_name,
                'employee_code': emp.employee_code,
                'department': department,
                'email': email,
                'joining_date': emp.joining_date.isoformat() if emp.joining_date else None,
            }
            
            # Punctual employees: Present entire month with 0 or minimal late arrivals
            if present_days >= (total_days - 1) and late_count == 0:  # Allow 1 day absence
                punctual_employees.append({
                    **employee_data,
                    'present_days': present_days,
                    'late_arrivals': late_count,
                    'attendance_percentage': attendance_pct,
                    'score': present_days - late_count  # Score for sorting
                })
            
            # Low leave employees: Took minimal leave
            if total_leave_days <= 2:  # 2 days or less
                low_leave_employees.append({
                    **employee_data,
                    'leave_days': total_leave_days,
                    'leave_types': leave_types_count,
                    'score': -total_leave_days  # Negative for ascending sort
                })
        
        # Sort and limit
        punctual_employees = sorted(punctual_employees, key=lambda x: x['score'], reverse=True)[:limit]
        low_leave_employees = sorted(low_leave_employees, key=lambda x: x['score'], reverse=True)[:limit]
        
        # Remove score field from response
        for emp in punctual_employees:
            del emp['score']
        for emp in low_leave_employees:
            del emp['score']
        
        return success_response(
            data={
                'punctual_employees': punctual_employees,
                'low_leave_employees': low_leave_employees,
                'month': start_date.strftime('%Y-%m'),
                'total_employees': len(employees)
            },
            message='Top performers retrieved successfully'
        )
    
    except Exception as e:
        import traceback
        print(f"[get_top_performers] Error: {e}")
        print(f"[get_top_performers] Traceback: {traceback.format_exc()}")
        return error_response(f'Failed to retrieve top performers: {str(e)}', 500)
