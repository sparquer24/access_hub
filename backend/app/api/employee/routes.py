"""
Employee-specific API Routes
"""

from flask import Blueprint, request, jsonify, current_app, g
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
import traceback

from app.models.user import User
from app.models.employee import Employee
from app.models.department import Department
from app.models.organization import Organization
from app.models.attendance import AttendanceRecord
from app.models.leave_request import LeaveRequest
from app.utils.decorators import role_required, tenant_isolation
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

bp = Blueprint('employee', __name__)


def _get_current_user_id():
    """Retrieve current user id from available contexts: g, JWT, or RBAC middleware."""
    # Prefer g.current_user_id if set by middleware
    try:
        if hasattr(g, 'current_user_id') and g.current_user_id:
            return g.current_user_id
    except Exception:
        pass

    # If RBAC middleware set g.current_user as a dict
    try:
        if hasattr(g, 'current_user') and isinstance(g.current_user, dict):
            return g.current_user.get('id')
    except Exception:
        pass

    # Fallback to JWT identity
    try:
        return get_jwt_identity()
    except Exception:
        return None

@bp.route('/api/employee/profile', methods=['GET'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def get_employee_profile():
    """
    Get current employee's profile information
    """
    try:
        # Debug: log JWT identity, claims and g context to help trace errors
        try:
            jwt_id = get_jwt_identity()
        except Exception:
            jwt_id = None

        try:
            jwt_claims = get_jwt()
        except Exception:
            jwt_claims = None

        try:
            g_debug = {
                'has_current_user': hasattr(g, 'current_user'),
                'current_user': getattr(g, 'current_user', None),
                'current_user_id': getattr(g, 'current_user_id', None),
                'current_user_role': getattr(g, 'current_user_role', None),
                'current_user_claims': getattr(g, 'current_user_claims', None),
            }
        except Exception:
            g_debug = str(g)

        current_app.logger.debug(f"EMP_PROFILE DEBUG: jwt_identity={jwt_id}, jwt_claims={jwt_claims}, g={g_debug}")

        user_id = _get_current_user_id()
        current_app.logger.debug(f"EMP_PROFILE DEBUG: resolved user_id={user_id}")
        
        # Get employee record
        employee = Employee.query.filter_by(user_id=user_id, is_active=True).first()
        current_app.logger.debug(f"EMP_PROFILE DEBUG: employee found={bool(employee)} id={(employee.id if employee else None)}")
        
        if not employee:
            return jsonify({
                'status': 'error',
                'message': 'Employee record not found'
            }), 404
        
        # Map fields from Employee and User models safely
        user_obj = getattr(employee, 'user', None)
        user_id_val = user_obj.id if user_obj and hasattr(user_obj, 'id') else None
        username_val = user_obj.username if user_obj and hasattr(user_obj, 'username') else None
        email_val = user_obj.email if user_obj and hasattr(user_obj, 'email') else None
        role_val = user_obj.role.name if user_obj and getattr(user_obj, 'role', None) else None
        created_at_val = user_obj.created_at.isoformat() if user_obj and getattr(user_obj, 'created_at', None) else None

        full_name = getattr(employee, 'full_name', None)
        # Attempt to split full_name into first/last for compatibility
        first_name = None
        last_name = None
        if full_name:
            parts = full_name.split()
            first_name = parts[0] if parts else None
            last_name = ' '.join(parts[1:]) if len(parts) > 1 else None

        profile_data = {
            'user_info': {
                'id': user_id_val,
                'username': username_val,
                'email': email_val,
                'first_name': first_name,
                'last_name': last_name,
                'full_name': full_name,
                'role': role_val,
                'is_active': user_obj.is_active if user_obj and hasattr(user_obj, 'is_active') else None,
                'created_at': created_at_val
            },
            'employee_info': {
                'id': employee.id,
                'employee_code': getattr(employee, 'employee_code', None),
                'position': getattr(employee, 'designation', None),
                'phone': getattr(employee, 'phone_number', None),
                'hire_date': getattr(employee, 'joining_date').isoformat() if getattr(employee, 'joining_date', None) else None,
                'salary': getattr(employee, 'salary', None) if hasattr(employee, 'salary') else None,
                'is_active': employee.is_active,
                'profile_image_url': None,
                'department': {
                    'id': employee.department.id if employee.department else None,
                    'name': employee.department.name if employee.department else None,
                    'description': employee.department.description if employee.department else None
                } if employee.department else None,
                'organization': {
                    'id': employee.organization.id if employee.organization else None,
                    'name': employee.organization.name if employee.organization else None
                } if employee.organization else None
            }
        }

        # Try to get primary image URL if Image model available
        try:
            primary = employee.get_primary_image()
            if primary and hasattr(primary, 'url'):
                profile_data['employee_info']['profile_image_url'] = primary.url
        except Exception:
            pass
        
        return jsonify({
            'status': 'success',
            'data': profile_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching employee profile: {str(e)}")
        tb = traceback.format_exc()
        current_app.logger.error(tb)
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch employee profile'
        }), 500

@bp.route('/api/employee/attendance/today', methods=['GET'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def get_today_attendance():
    """
    Get current employee's attendance status for today
    """
    try:
        user_id = _get_current_user_id()
        today = datetime.utcnow().date()
        
        # Get employee record
        employee = Employee.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not employee:
            return jsonify({
                'status': 'error',
                'message': 'Employee record not found'
            }), 404
        
        # Get today's attendance record
        attendance = AttendanceRecord.query.filter(
            AttendanceRecord.employee_id == employee.id,
            func.date(AttendanceRecord.check_in_time) == today
        ).first()
        
        attendance_data = {
            'date': today.isoformat(),
            'status': 'absent',  # Default status
            'check_in_time': None,
            'check_out_time': None,
            'total_hours': 0,
            'is_late': False,
            'break_duration': 0
        }
        
        if attendance:
            check_in_time = attendance.check_in_time
            check_out_time = attendance.check_out_time
            
            attendance_data.update({
                'status': 'present',
                'check_in_time': check_in_time.isoformat() if check_in_time else None,
                'check_out_time': check_out_time.isoformat() if check_out_time else None,
                'is_late': attendance.is_late if hasattr(attendance, 'is_late') else False,
                'break_duration': attendance.break_duration if hasattr(attendance, 'break_duration') else 0
            })
            
            # Calculate total hours if both check-in and check-out exist
            if check_in_time and check_out_time:
                duration = check_out_time - check_in_time
                attendance_data['total_hours'] = round(duration.total_seconds() / 3600, 2)
            elif check_in_time:
                # Calculate current duration if only checked in
                current_duration = datetime.utcnow() - check_in_time
                attendance_data['total_hours'] = round(current_duration.total_seconds() / 3600, 2)
        
        return jsonify({
            'status': 'success',
            'data': attendance_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching today's attendance: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch attendance information'
        }), 500

@bp.route('/api/employee/attendance/history', methods=['GET'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def get_attendance_history():
    """
    Get employee's attendance history
    """
    try:
        user_id = _get_current_user_id()
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        days = int(request.args.get('days', 30))  # Default to last 30 days
        
        # Get employee record
        employee = Employee.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not employee:
            return jsonify({
                'status': 'error',
                'message': 'Employee record not found'
            }), 404
        
        # Calculate date range
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # Get attendance records
        attendance_query = AttendanceRecord.query.filter(
            AttendanceRecord.employee_id == employee.id,
            func.date(AttendanceRecord.check_in_time) >= start_date,
            func.date(AttendanceRecord.check_in_time) <= end_date
        ).order_by(AttendanceRecord.check_in_time.desc())
        
        attendance_records = attendance_query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        history_data = []
        for record in attendance_records.items:
            check_in_time = record.check_in_time
            check_out_time = record.check_out_time
            
            # Calculate duration
            duration_hours = 0
            if check_in_time and check_out_time:
                duration = check_out_time - check_in_time
                duration_hours = round(duration.total_seconds() / 3600, 2)
            
            history_data.append({
                'id': record.id,
                'date': check_in_time.date().isoformat() if check_in_time else None,
                'check_in_time': check_in_time.isoformat() if check_in_time else None,
                'check_out_time': check_out_time.isoformat() if check_out_time else None,
                'duration_hours': duration_hours,
                'status': 'present' if check_in_time else 'absent',
                'is_late': getattr(record, 'is_late', False),
                'break_duration': getattr(record, 'break_duration', 0)
            })
        
        return jsonify({
            'status': 'success',
            'data': {
                'attendance_history': history_data,
                'pagination': {
                    'page': attendance_records.page,
                    'pages': attendance_records.pages,
                    'per_page': attendance_records.per_page,
                    'total': attendance_records.total,
                    'has_next': attendance_records.has_next,
                    'has_prev': attendance_records.has_prev
                },
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching attendance history: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch attendance history'
        }), 500

@bp.route('/api/employee/leaves', methods=['GET'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def get_employee_leaves():
    """
    Get employee's leave requests
    """
    try:
        user_id = _get_current_user_id()
        
        # Get pagination and filter parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status_filter = request.args.get('status', 'all')
        
        # Get employee record
        employee = Employee.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not employee:
            return jsonify({
                'status': 'error',
                'message': 'Employee record not found'
            }), 404
        
        # Build query
        leaves_query = LeaveRequest.query.filter(LeaveRequest.employee_id == employee.id)
        
        if status_filter != 'all':
            leaves_query = leaves_query.filter(LeaveRequest.status == status_filter)
        
        leaves = leaves_query.order_by(LeaveRequest.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        leave_requests = []
        for leave in leaves.items:
            leave_requests.append({
                'id': leave.id,
                'leave_type': leave.leave_type,
                'start_date': leave.start_date.isoformat(),
                'end_date': leave.end_date.isoformat(),
                'days_requested': leave.total_days,
                'reason': leave.reason,
                'status': leave.status,
                'created_at': leave.created_at.isoformat(),
                'manager_comments': leave.manager_comments,
                'approved_at': leave.approved_at.isoformat() if leave.approved_at else None,
                'approved_by_name': None  # This would need a join to get manager name
            })
        
        # Get leave balance summary (this would typically come from a separate leave balance table)
        leave_balance = {
            'annual_leave': {
                'total': 21,  # Default annual leave days
                'used': len([l for l in leave_requests if l['leave_type'] == 'Annual Leave' and l['status'] == 'approved']),
                'remaining': 21 - len([l for l in leave_requests if l['leave_type'] == 'Annual Leave' and l['status'] == 'approved'])
            },
            'sick_leave': {
                'total': 10,  # Default sick leave days
                'used': len([l for l in leave_requests if l['leave_type'] == 'Sick Leave' and l['status'] == 'approved']),
                'remaining': 10 - len([l for l in leave_requests if l['leave_type'] == 'Sick Leave' and l['status'] == 'approved'])
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': {
                'leave_requests': leave_requests,
                'leave_balance': leave_balance,
                'pagination': {
                    'page': leaves.page,
                    'pages': leaves.pages,
                    'per_page': leaves.per_page,
                    'total': leaves.total,
                    'has_next': leaves.has_next,
                    'has_prev': leaves.has_prev
                }
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching employee leaves: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch leave requests'
        }), 500

@bp.route('/api/employee/leaves', methods=['POST'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def apply_for_leave():
    """
    Apply for a new leave request
    """
    try:
        user_id = _get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Invalid JSON data'
            }), 400
        
        # Validate required fields
        required_fields = ['leave_type', 'start_date', 'end_date', 'reason']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Get employee record
        employee = Employee.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not employee:
            return jsonify({
                'status': 'error',
                'message': 'Employee record not found'
            }), 404
        
        # Parse dates
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'status': 'error',
                'message': 'Invalid date format. Use YYYY-MM-DD'
            }), 400
        
        # Validate date logic
        if start_date >= end_date:
            return jsonify({
                'status': 'error',
                'message': 'End date must be after start date'
            }), 400
        
        if start_date < datetime.utcnow().date():
            return jsonify({
                'status': 'error',
                'message': 'Cannot apply for leave in the past'
            }), 400
        
        # Calculate days requested
        days_requested = (end_date - start_date).days + 1
        
        # Create new leave request
        new_leave = LeaveRequest(
            employee_id=employee.id,
            leave_type=data['leave_type'],
            start_date=start_date,
            end_date=end_date,
            total_days=days_requested,
            reason=data['reason'],
            status='pending',
            created_at=datetime.utcnow()
        )
        
        from app import db
        db.session.add(new_leave)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Leave request submitted successfully',
            'data': {
                'leave_id': new_leave.id,
                'status': 'pending'
            }
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Error applying for leave: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to submit leave request'
        }), 500

@bp.route('/api/employee/stats/summary', methods=['GET'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def get_employee_stats_summary():
    """
    Get employee's statistics summary for dashboard
    """
    try:
        user_id = _get_current_user_id()
        
        # Get employee record
        employee = Employee.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not employee:
            return jsonify({
                'status': 'error',
                'message': 'Employee record not found'
            }), 404
        
        # Get current month and year
        today = datetime.utcnow().date()
        current_month_start = today.replace(day=1)
        
        # Get attendance stats for current month
        attendance_records = AttendanceRecord.query.filter(
            AttendanceRecord.employee_id == employee.id,
            func.date(AttendanceRecord.check_in_time) >= current_month_start
        ).all()
        
        present_days = len(attendance_records)
        working_days_this_month = (today - current_month_start).days + 1
        
        # Get leave stats
        pending_leaves = LeaveRequest.query.filter_by(
            employee_id=employee.id,
            status='pending'
        ).count()
        
        approved_leaves_this_year = LeaveRequest.query.filter(
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status == 'approved',
            func.extract('year', LeaveRequest.start_date) == today.year
        ).all()
        
        total_leave_days_used = sum(leave.total_days for leave in approved_leaves_this_year)
        
        # Calculate total hours this month
        total_hours_this_month = 0
        for record in attendance_records:
            if record.check_in_time and record.check_out_time:
                duration = record.check_out_time - record.check_in_time
                total_hours_this_month += duration.total_seconds() / 3600
        
        stats_summary = {
            'attendance': {
                'present_days_this_month': present_days,
                'working_days_this_month': working_days_this_month,
                'attendance_percentage': round((present_days / working_days_this_month * 100), 1) if working_days_this_month > 0 else 0,
                'total_hours_this_month': round(total_hours_this_month, 1)
            },
            'leaves': {
                'pending_requests': pending_leaves,
                'approved_days_this_year': total_leave_days_used,
                'remaining_annual_leave': max(0, 21 - total_leave_days_used)  # Assuming 21 days annual leave
            },
            'profile': {
                'employee_code': employee.employee_code,
                'designation': employee.designation,
                'department': employee.department.name if employee.department else 'N/A',
                'joining_date': employee.joining_date.isoformat() if employee.joining_date else None
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': stats_summary
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching employee stats: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch employee statistics'
        }), 500