"""
Manager-specific API Routes
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
from app.models.camera import Camera
from app.models.location import Location
from app.utils.decorators import manager_required, team_access_required, tenant_required
from flask_jwt_extended import jwt_required

bp = Blueprint('manager', __name__, url_prefix='/api/v2/manager')

@bp.route('/team/members', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_team_members():
    """
    Get team members under the manager's supervision with attendance status
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    responses:
      200:
        description: List of team members with attendance status
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: object
              properties:
                team_members:
                  type: array
                  items:
                    type: object
                    properties:
                      id:
                        type: string
                      employee_code:
                        type: string
                      name:
                        type: string
                      email:
                        type: string
                      designation:
                        type: string
                      status:
                        type: string
                        enum: [active, inactive, on_leave]
                      attendance_status:
                        type: string
                        enum: [present, absent, on_leave]
                      last_seen:
                        type: string
                        format: datetime
                      profile_image:
                        type: string
                      department:
                        type: string
                total_count:
                  type: integer
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        $ref: '#/responses/ForbiddenError'
    """
    try:
        from flask_jwt_extended import get_jwt_identity, get_jwt
        manager_id = get_jwt_identity()
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        # Get employees in the manager's organization and department
        employees_query = Employee.query.filter_by(
            organization_id=organization_id,
            is_active=True
        ).join(User).filter(User.is_active == True)
        
        # If manager has department context, filter by department
        if manager_department_id:
            employees_query = employees_query.filter(Employee.department_id == manager_department_id)
        
        employees = employees_query.all()
        current_app.logger.info(f"Found {len(employees)} employees in team.")
        
        # Get today's attendance and leaves for context
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        current_app.logger.info(f"Fetching team members for Manager: {manager_id}, Org: {organization_id}, Dept: {manager_department_id}")
        
        # Get attendance records for today
        attendance_records = AttendanceRecord.query.filter(
            AttendanceRecord.check_in_time >= today_start,
            AttendanceRecord.check_in_time < today_end,
            AttendanceRecord.organization_id == organization_id
        ).all()
        attendance_map = {r.employee_id: r for r in attendance_records}
        
        # Get active leaves for today
        # Note: LeaveRequest dates are currently Date objects, so we use today (date) for comparison
        today_date = today_start.date()
        active_leaves = LeaveRequest.query.filter(
            LeaveRequest.start_date <= today_date,
            LeaveRequest.end_date >= today_date,
            LeaveRequest.status == 'approved',
            LeaveRequest.organization_id == organization_id
        ).all()
        leave_map = {l.employee_id: l for l in active_leaves}
        
        team_members = []
        for employee in employees:
            # Skip the manager themselves
            if employee.user_id == manager_id:
                continue
            
            # Determine status
            status = 'inactive'
            attendance_status = 'absent'
            last_seen = None
            
            if employee.is_active:
                status = 'active'
                
                # Check leave status first
                if employee.id in leave_map:
                    status = 'on_leave'
                    attendance_status = 'on_leave'
                # Check attendance status
                elif employee.id in attendance_map:
                    record = attendance_map[employee.id]
                    attendance_status = 'present'
                    last_seen = record.check_out_time.isoformat() if record.check_out_time else record.check_in_time.isoformat()
            
            # Format emergency contact
            emergency_contact = 'N/A'
            if employee.emergency_contact:
                if isinstance(employee.emergency_contact, dict):
                    emergency_contact = employee.emergency_contact.get('phone', 'N/A')
                else:
                    emergency_contact = str(employee.emergency_contact)

            # Get profile image URL
            profile_image = None
            try:
                primary_image = employee.get_primary_image()
                if primary_image and hasattr(primary_image, 'image_path'):
                    profile_image = f"/uploads/{primary_image.image_path}"
            except:
                pass
            
            team_members.append({
                'id': employee.id,
                'user_id': employee.user_id,
                'employee_code': employee.employee_code,
                'name': employee.full_name,
                'email': employee.user.email,
                'role': employee.user.role.name if employee.user.role else None,
                'designation': employee.designation,
                'phone': employee.phone_number,
                'joining_date': employee.joining_date.isoformat() if employee.joining_date else None,
                'status': status,
                'attendance_status': attendance_status,
                'last_seen': last_seen,
                'profile_image': profile_image,
                'department': employee.department.name if employee.department else 'N/A',
                'emergency_contact': emergency_contact
            })
        
        return jsonify({
            'status': 'success',
            'data': {
                'team_members': team_members,
                'total_count': len(team_members)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching team members: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch team members'
        }), 500

@bp.route('/dashboard/activities', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_dashboard_activities():
    """
    Get recent activities for manager dashboard
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    responses:
      200:
        description: Recent dashboard activities
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        from flask_jwt_extended import get_jwt
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        activities = []
        
        # 1. Recent Leave Requests (last 7 days)
        last_week = datetime.utcnow() - timedelta(days=7)
        leaves_query = LeaveRequest.query.join(Employee).filter(
            Employee.organization_id == organization_id,
            LeaveRequest.created_at >= last_week
        )
        if manager_department_id:
            leaves_query = leaves_query.filter(Employee.department_id == manager_department_id)
            
        recent_leaves = leaves_query.order_by(LeaveRequest.created_at.desc()).limit(5).all()
        
        for leave in recent_leaves:
            activities.append({
                'id': f"leave_{leave.id}",
                'type': 'leave_request',
                'employee': leave.employee.full_name,
                'action': 'Submitted leave request',
                'time': leave.created_at.isoformat(),
                'timestamp': leave.created_at.timestamp(),
                'status': leave.status,
                'details': f"{leave.leave_type} leave"
            })
            
        # 2. Recent Check-ins (Today)
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        attendance_query = AttendanceRecord.query.join(Employee).filter(
            Employee.organization_id == organization_id,
            AttendanceRecord.check_in_time >= today_start
        )
        if manager_department_id:
            attendance_query = attendance_query.filter(Employee.department_id == manager_department_id)
            
        recent_attendance = attendance_query.order_by(AttendanceRecord.check_in_time.desc()).limit(10).all()
        
        for record in recent_attendance:
            status = 'success'
            action = 'Checked in'
            
            # Check for late arrival (assuming 9:30 AM is late limit, ideally this should be config based)
            # Simple check: if check in is after 9:30 AM local time (UTC+5:30)
            # UTC check in + 5:30 > 9:30 => UTC > 4:00
            if record.check_in_time.time() > datetime.strptime('04:00', '%H:%M').time():
                status = 'flagged'
                action = 'Late check-in'
                
            activities.append({
                'id': f"att_{record.id}",
                'type': 'late_arrival' if status == 'flagged' else 'attendance',
                'employee': record.employee.full_name,
                'action': action,
                'time': record.check_in_time.isoformat(),
                'timestamp': record.check_in_time.timestamp(),
                'status': status,
                'details': f"at {record.check_in_time.strftime('%H:%M')}"
            })
            
        # Sort by timestamp descending
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Take top 10
        activities = activities[:10]
        
        # Format time for display (e.g., "2 hours ago")
        now = datetime.utcnow()
        for activity in activities:
            dt = datetime.fromtimestamp(activity['timestamp'])
            diff = now - dt
            
            if diff.days > 0:
                activity['time_display'] = f"{diff.days}d ago"
            elif diff.seconds > 3600:
                activity['time_display'] = f"{diff.seconds // 3600}h ago"
            elif diff.seconds > 60:
                activity['time_display'] = f"{diff.seconds // 60}m ago"
            else:
                activity['time_display'] = "Just now"
                
        return jsonify({
            'status': 'success',
            'data': {
                'activities': activities
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard activities: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch dashboard activities'
        }), 500

@bp.route('/team/stats', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_team_stats():
    """
    Get team statistics and metrics
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    responses:
      200:
        description: Team statistics
        schema:
          type: object
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        from flask_jwt_extended import get_jwt
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        # Get current date range
        today = datetime.utcnow().date()
        start_of_month = today.replace(day=1)
        
        # Count total team members in organization
        team_query = Employee.query.filter_by(
            organization_id=organization_id,
            is_active=True
        ).join(User).filter(User.is_active == True)
        
        # If manager has department context, filter by department
        if manager_department_id:
            team_query = team_query.filter(Employee.department_id == manager_department_id)
        
        total_members = team_query.count()
        
        # Get attendance stats for this month
        attendance_query = AttendanceRecord.query.join(Employee).filter(
            Employee.organization_id == organization_id,
            AttendanceRecord.check_in_time >= start_of_month
        )
        
        # If manager has department context, filter by department
        if manager_department_id:
            attendance_query = attendance_query.filter(Employee.department_id == manager_department_id)
            
        attendance_records = attendance_query.all()
        
        # Present today
        present_today_records = [a for a in attendance_records if a.check_in_time.date() == today]
        present_today = len(present_today_records)
        
        # Late arrivals today (assuming 9:30 AM cutoff)
        late_limit_time = datetime.strptime('04:00', '%H:%M').time() # 9:30 AM IST is 4:00 AM UTC
        late_arrivals = len([a for a in present_today_records if a.check_in_time.time() > late_limit_time])
        
        # Get pending leave requests
        leaves_query = LeaveRequest.query.join(Employee).filter(
            Employee.organization_id == organization_id,
            LeaveRequest.status == 'pending'
        )
        
        # If manager has department context, filter by department
        if manager_department_id:
            leaves_query = leaves_query.filter(Employee.department_id == manager_department_id)
            
        pending_leaves = leaves_query.count()
        
        # Calculate average attendance
        working_days = (today - start_of_month).days + 1
        expected_attendance = total_members * working_days
        actual_attendance = len(attendance_records)
        attendance_percentage = (actual_attendance / expected_attendance * 100) if expected_attendance > 0 else 0
        
        # Get organization-wide employee count
        org_total_employees = Employee.query.filter_by(
            organization_id=organization_id,
            is_active=True
        ).join(User).filter(User.is_active == True).count()
        
        # Get organization and department names
        organization = Organization.query.get(organization_id)
        department = Department.query.get(manager_department_id) if manager_department_id else None
        
        return jsonify({
            'status': 'success',
            'data': {
                'total_members': total_members,
                'total_organization_members': org_total_employees,
                'organization_name': organization.name if organization else 'Unknown Organization',
                'department_name': department.name if department else 'All Departments',
                'present_today': present_today,
                'pending_leaves': pending_leaves,
                'late_arrivals': late_arrivals,
                'attendance_percentage': round(attendance_percentage, 1)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching team stats: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch team statistics'
        }), 500

@bp.route('/leaves/pending', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_pending_leave_requests():
    """
    Get pending leave requests for approval
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    responses:
      200:
        description: List of pending leave requests
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        from flask_jwt_extended import get_jwt
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status_filter = request.args.get('status', 'pending')
        
        # Build query with organization filtering
        leaves_query = LeaveRequest.query.join(Employee).filter(
            Employee.organization_id == organization_id
        )
        
        # If manager has department context, filter by department
        if manager_department_id:
            leaves_query = leaves_query.filter(Employee.department_id == manager_department_id)
        
        if status_filter != 'all':
            leaves_query = leaves_query.filter(LeaveRequest.status == status_filter)
        
        leaves = leaves_query.order_by(LeaveRequest.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        leave_requests = []
        for leave in leaves.items:
            leave_requests.append({
                'id': leave.id,
                'employee_name': leave.employee.full_name,
                'employee_code': leave.employee.employee_code,
                'leave_type': leave.leave_type,
                'start_date': leave.start_date.isoformat(),
                'end_date': leave.end_date.isoformat(),
                'total_days': leave.total_days,
                'reason': leave.reason,
                'status': leave.status,
                'created_at': leave.created_at.isoformat(),
                'approval_notes': leave.approval_notes
            })
        
        return jsonify({
            'status': 'success',
            'data': {
                'leave_requests': leave_requests,
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
        current_app.logger.error(f"Error fetching leave requests: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch leave requests'
        }), 500

@bp.route('/leaves/<leave_id>/approve', methods=['POST'])
@jwt_required()
@tenant_required
@manager_required
def approve_leave_request(leave_id):
    """
    Approve a leave request
    """
    try:
        from flask_jwt_extended import get_jwt
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        # Get leave request and verify it belongs to manager's organization
        leave_query = LeaveRequest.query.join(Employee).filter(
            LeaveRequest.id == leave_id,
            Employee.organization_id == organization_id
        )
        
        # If manager has department context, also filter by department
        if manager_department_id:
            leave_query = leave_query.filter(Employee.department_id == manager_department_id)
            
        leave = leave_query.first()
        
        if not leave:
            return jsonify({
                'status': 'error',
                'message': 'Leave request not found or access denied'
            }), 404
        
        if leave.status != 'pending':
            return jsonify({
                'status': 'error',
                'message': 'Leave request is not pending approval'
            }), 400
        
        # Get manager comments if provided
        data = request.get_json() or {}
        manager_comments = data.get('comments', '')
        
        # Approve the leave
        leave.status = 'approved'
        from flask_jwt_extended import get_jwt_identity
        leave.approved_by = get_jwt_identity()
        leave.approval_notes = manager_comments
        
        from app import db
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Leave request approved successfully'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error approving leave request: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to approve leave request'
        }), 500

@bp.route('/leaves/<leave_id>/reject', methods=['POST'])
@jwt_required()
@tenant_required
@manager_required
def reject_leave_request(leave_id):
    """
    Reject a leave request
    """
    try:
        from flask_jwt_extended import get_jwt
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        # Get leave request and verify it belongs to manager's organization
        leave_query = LeaveRequest.query.join(Employee).filter(
            LeaveRequest.id == leave_id,
            Employee.organization_id == organization_id
        )
        
        # If manager has department context, also filter by department
        if manager_department_id:
            leave_query = leave_query.filter(Employee.department_id == manager_department_id)
            
        leave = leave_query.first()
        
        if not leave:
            return jsonify({
                'status': 'error',
                'message': 'Leave request not found or access denied'
            }), 404
        
        if leave.status != 'pending':
            return jsonify({
                'status': 'error',
                'message': 'Leave request is not pending approval'
            }), 400
        
        # Get manager comments (required for rejection)
        data = request.get_json() or {}
        manager_comments = data.get('comments', '')
        
        if not manager_comments:
            return jsonify({
                'status': 'error',
                'message': 'Comments are required for rejecting leave requests'
            }), 400
        
        # Reject the leave
        leave.status = 'rejected'
        from flask_jwt_extended import get_jwt_identity
        leave.approved_by = get_jwt_identity()
        leave.approval_notes = manager_comments
        
        from app import db
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Leave request rejected successfully'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error rejecting leave request: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to reject leave request'
        }), 500

@bp.route('/reports/attendance', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_attendance_report():
    """
    Get team attendance report
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    parameters:
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
        description: Attendance report
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        from flask_jwt_extended import get_jwt
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        # Get date range parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = datetime.utcnow().date().replace(day=1)  # Start of current month
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = datetime.utcnow().date()
        
        # Get team employees with organization filtering
        employees_query = Employee.query.filter_by(
            organization_id=organization_id,
            is_active=True
        ).join(User).filter(User.is_active == True)
        
        # If manager has department context, filter by department
        if manager_department_id:
            employees_query = employees_query.filter(Employee.department_id == manager_department_id)
            
        employees = employees_query.all()
        
        # Get attendance records with organization filtering
        attendance_query = AttendanceRecord.query.join(Employee).filter(
            Employee.organization_id == organization_id,
            AttendanceRecord.check_in_time >= start_date,
            AttendanceRecord.check_in_time <= end_date
        )
        
        # If manager has department context, filter by department
        if manager_department_id:
            attendance_query = attendance_query.filter(Employee.department_id == manager_department_id)
            
        attendance_records = attendance_query.all()
        
        # Process attendance data
        employee_stats = {}
        for employee in employees:
            employee_stats[employee.id] = {
                'employee_code': employee.employee_code,
                'name': employee.full_name,
                'present_days': 0,
                'total_working_days': (end_date - start_date).days + 1,
                'attendance_percentage': 0
            }
        
        for record in attendance_records:
            if record.employee_id in employee_stats:
                employee_stats[record.employee_id]['present_days'] += 1
        
        # Calculate percentages
        for emp_id, stats in employee_stats.items():
            if stats['total_working_days'] > 0:
                stats['attendance_percentage'] = round(
                    (stats['present_days'] / stats['total_working_days']) * 100, 2
                )
        
        report_data = {
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'summary': {
                'total_employees': len(employees),
                'total_attendance_records': len(attendance_records),
                'average_attendance': round(
                    sum(stats['attendance_percentage'] for stats in employee_stats.values()) / len(employee_stats)
                    if employee_stats else 0, 2
                )
            },
            'employee_stats': list(employee_stats.values())
        }
        
        return jsonify({
            'status': 'success',
            'data': report_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error generating attendance report: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate attendance report'
        }), 500

@bp.route('/reports/leaves', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_leaves_report():
    """
    Get team leave requests report
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    parameters:
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
        description: Leave requests report
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        from flask_jwt_extended import get_jwt
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        # Get date range parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = datetime.utcnow().date().replace(day=1)  # Start of current month
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = datetime.utcnow().date()
        
        # Get leave records with organization filtering
        leaves_query = LeaveRequest.query.join(Employee).filter(
            Employee.organization_id == organization_id,
            LeaveRequest.created_at >= start_date,
            LeaveRequest.created_at <= end_date
        )
        
        # If manager has department context, filter by department
        if manager_department_id:
            leaves_query = leaves_query.filter(Employee.department_id == manager_department_id)
            
        leaves = leaves_query.all()
        
        # Process leave data
        leave_stats = {
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'total_days': 0
        }
        
        leave_types = {}
        
        for leave in leaves:
            leave_stats[leave.status] += 1
            if leave.status == 'approved':
                leave_stats['total_days'] += leave.total_days
            
            if leave.leave_type in leave_types:
                leave_types[leave.leave_type]['count'] += 1
                if leave.status == 'approved':
                    leave_types[leave.leave_type]['days'] += leave.total_days
            else:
                leave_types[leave.leave_type] = {
                    'count': 1,
                    'days': leave.total_days if leave.status == 'approved' else 0
                }
        
        report_data = {
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'summary': leave_stats,
            'leave_types': leave_types
        }
        
        return jsonify({
            'status': 'success',
            'data': report_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error generating leaves report: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate leaves report'
        }), 500


@bp.route('/cameras', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_manager_cameras():
    """
    Get cameras accessible to manager
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    responses:
      200:
        description: List of accessible cameras
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        organization_id = g.organization_id
        
        # Get cameras for the organization
        cameras = Camera.query.filter_by(
            organization_id=organization_id,
            is_active=True
        ).all()
        
        cameras_data = []
        for camera in cameras:
            cameras_data.append({
                'id': camera.id,
                'name': camera.name,
                'location': camera.location.name if camera.location else 'Unknown',
                'location_id': camera.location_id,
                'camera_type': camera.camera_type,
                'status': 'active' if camera.is_active else 'inactive',
                'rtsp_url': camera.rtsp_url if hasattr(camera, 'rtsp_url') else None,
                'ip_address': camera.ip_address if hasattr(camera, 'ip_address') else None,
                'created_at': camera.created_at.isoformat() if camera.created_at else None
            })
        
        return jsonify({
            'status': 'success',
            'data': {
                'cameras': cameras_data,
                'total_count': len(cameras_data)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching cameras: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch cameras'
        }), 500


@bp.route('/locations', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_manager_locations():
    """
    Get locations accessible to manager
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    responses:
      200:
        description: List of accessible locations
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        organization_id = g.organization_id
        
        # Get locations for the organization
        locations = Location.query.filter_by(
            organization_id=organization_id,
            is_active=True
        ).all()
        
        locations_data = []
        for location in locations:
            # Count cameras at this location
            camera_count = Camera.query.filter_by(
                location_id=location.id,
                is_active=True
            ).count()
            
            locations_data.append({
                'id': location.id,
                'name': location.name,
                'description': location.description,
                'floor_number': getattr(location, 'floor_number', None),
                'building': getattr(location, 'building', None),
                'camera_count': camera_count,
                'status': 'active' if location.is_active else 'inactive',
                'created_at': location.created_at.isoformat() if location.created_at else None
            })
        
        return jsonify({
            'status': 'success',
            'data': {
                'locations': locations_data,
                'total_count': len(locations_data)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching locations: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch locations'
        }), 500


@bp.route('/reports/team-performance', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def get_team_performance_report():
    """
    Get team performance metrics and analysis
    ---
    tags:
      - Manager
    security:
      - Bearer: []
    responses:
      200:
        description: Team performance report
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        from flask_jwt_extended import get_jwt
        organization_id = g.organization_id
        claims = get_jwt()
        manager_department_id = claims.get('department_id')
        
        # Get date range parameters (default to current month)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = datetime.utcnow().date().replace(day=1)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = datetime.utcnow().date()
        
        # Get organization details
        organization = Organization.query.get(organization_id)
        
        # Base employee query
        employees_query = Employee.query.filter_by(
            organization_id=organization_id,
            is_active=True
        ).join(User).filter(User.is_active == True)
        
        # If manager has department context, filter by department
        if manager_department_id:
            employees_query = employees_query.filter(Employee.department_id == manager_department_id)
            department = Department.query.get(manager_department_id)
            department_name = department.name if department else 'Unknown'
        else:
            department_name = 'All Departments'
        
        employees = employees_query.all()
        total_team_members = len(employees)
        
        # Get organization-wide employee count for comparison
        org_total_employees = Employee.query.filter_by(
            organization_id=organization_id,
            is_active=True
        ).join(User).filter(User.is_active == True).count()
        
        # Attendance Statistics
        attendance_query = AttendanceRecord.query.join(Employee).filter(
            Employee.organization_id == organization_id,
            AttendanceRecord.check_in_time >= start_date,
            AttendanceRecord.check_in_time <= end_date
        )
        if manager_department_id:
            attendance_query = attendance_query.filter(Employee.department_id == manager_department_id)
        
        attendance_records = attendance_query.all()
        
        # Calculate working days
        working_days = (end_date - start_date).days + 1
        expected_attendance = total_team_members * working_days
        actual_attendance = len(attendance_records)
        avg_attendance_rate = (actual_attendance / expected_attendance * 100) if expected_attendance > 0 else 0
        
        # Late arrivals (after 9:30 AM IST = 4:00 AM UTC)
        late_limit_time = datetime.strptime('04:00', '%H:%M').time()
        late_arrivals = len([a for a in attendance_records if a.check_in_time.time() > late_limit_time])
        
        # Leave Statistics
        leaves_query = LeaveRequest.query.join(Employee).filter(
            Employee.organization_id == organization_id,
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date
        )
        if manager_department_id:
            leaves_query = leaves_query.filter(Employee.department_id == manager_department_id)
        
        all_leaves = leaves_query.all()
        
        leave_stats = {
            'pending': 0,
            'approved': 0,
            'rejected': 0,
            'total_leave_days': 0
        }
        
        leave_type_breakdown = {}
        
        for leave in all_leaves:
            leave_stats[leave.status] = leave_stats.get(leave.status, 0) + 1
            if leave.status == 'approved':
                leave_stats['total_leave_days'] += leave.total_days
            
            # Track leave types
            if leave.leave_type not in leave_type_breakdown:
                leave_type_breakdown[leave.leave_type] = {'count': 0, 'days': 0}
            leave_type_breakdown[leave.leave_type]['count'] += 1
            if leave.status == 'approved':
                leave_type_breakdown[leave.leave_type]['days'] += leave.total_days
        
        # Department Breakdown (if viewing all departments)
        department_breakdown = []
        if not manager_department_id:
            departments = Department.query.filter_by(organization_id=organization_id).all()
            for dept in departments:
                dept_emp_count = Employee.query.filter_by(
                    department_id=dept.id,
                    is_active=True
                ).join(User).filter(User.is_active == True).count()
                
                dept_attendance = AttendanceRecord.query.join(Employee).filter(
                    Employee.department_id == dept.id,
                    AttendanceRecord.check_in_time >= start_date,
                    AttendanceRecord.check_in_time <= end_date
                ).count()
                
                dept_expected = dept_emp_count * working_days
                dept_rate = (dept_attendance / dept_expected * 100) if dept_expected > 0 else 0
                
                department_breakdown.append({
                    'id': dept.id,
                    'name': dept.name,
                    'employee_count': dept_emp_count,
                    'attendance_rate': round(dept_rate, 2)
                })
        
        # Employee Demographics
        gender_breakdown = {}
        employment_type_breakdown = {}
        
        for emp in employees:
            # Gender
            gender = emp.gender or 'not_specified'
            gender_breakdown[gender] = gender_breakdown.get(gender, 0) + 1
            
            # Employment type
            emp_type = emp.employment_type or 'not_specified'
            employment_type_breakdown[emp_type] = employment_type_breakdown.get(emp_type, 0) + 1
        
        # Top performers (by attendance)
        employee_attendance_stats = {}
        for record in attendance_records:
            if record.employee_id not in employee_attendance_stats:
                employee_attendance_stats[record.employee_id] = {'count': 0, 'employee': record.employee}
            employee_attendance_stats[record.employee_id]['count'] += 1
        
        top_performers = []
        for emp_id, stats in sorted(employee_attendance_stats.items(), key=lambda x: x[1]['count'], reverse=True)[:5]:
            emp = stats['employee']
            attendance_rate = (stats['count'] / working_days * 100)
            top_performers.append({
                'employee_code': emp.employee_code,
                'name': emp.full_name,
                'attendance_days': stats['count'],
                'attendance_rate': round(attendance_rate, 2)
            })
        
        # Build comprehensive report
        report_data = {
            'organization': {
                'id': organization_id,
                'name': organization.name if organization else 'Unknown',
                'total_employees': org_total_employees
            },
            'report_scope': {
                'department': department_name,
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'working_days': working_days
                }
            },
            'team_summary': {
                'total_team_members': total_team_members,
                'active_employees': total_team_members,
                'department_count': len(department_breakdown) if department_breakdown else 1
            },
            'attendance_summary': {
                'total_attendance_records': actual_attendance,
                'expected_attendance': expected_attendance,
                'average_attendance_rate': round(avg_attendance_rate, 2),
                'late_arrivals': late_arrivals,
                'late_arrival_rate': round((late_arrivals / actual_attendance * 100) if actual_attendance > 0 else 0, 2)
            },
            'leave_summary': leave_stats,
            'leave_type_breakdown': leave_type_breakdown,
            'demographics': {
                'gender_breakdown': gender_breakdown,
                'employment_type_breakdown': employment_type_breakdown
            },
            'top_performers': top_performers
        }
        
        # Add department breakdown if applicable
        if department_breakdown:
            report_data['department_breakdown'] = department_breakdown
        
        return jsonify({
            'status': 'success',
            'data': report_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error generating team performance report: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate team performance report'
        }), 500

@bp.route('/reports/attendance/download', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def download_attendance_report():
    """
    Download attendance report in CSV, Excel, or PDF format
    """
    try:
        from flask_jwt_extended import get_jwt
        from app.utils.export import ReportGenerator
        organization_id = g.organization_id
        claims = get_jwt()
        
        # Get date range parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        file_format = request.args.get('format', 'pdf').lower()
        
        # Validate format
        if file_format not in ['csv', 'excel', 'pdf', 'json']:
            return jsonify({'status': 'error', 'message': 'Invalid format. Use csv, excel, pdf, or json'}), 400
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = datetime.utcnow().date().replace(day=1)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = datetime.utcnow().date()
        
        # Get attendance records
        attendance_records = AttendanceRecord.query.join(Employee).filter(
            AttendanceRecord.organization_id == organization_id,
            AttendanceRecord.date >= start_date,
            AttendanceRecord.date <= end_date
        ).all()
        
        # Generate report based on format
        if file_format == 'excel':
            return ReportGenerator.attendance_report(attendance_records, str(start_date), str(end_date), 'excel')
        elif file_format == 'json':
            return ReportGenerator.attendance_report(attendance_records, str(start_date), str(end_date), 'json')
        elif file_format == 'csv':
            return ReportGenerator.attendance_report(attendance_records, str(start_date), str(end_date), 'csv')
        else:  # pdf
            return ReportGenerator.attendance_report(attendance_records, str(start_date), str(end_date), 'pdf')
            
    except Exception as e:
        current_app.logger.error(f"Error downloading attendance report: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to download attendance report'
        }), 500


@bp.route('/reports/leaves/download', methods=['GET'])
@jwt_required()
@tenant_required
@manager_required
def download_leaves_report():
    """
    Download leaves report in CSV, Excel, or PDF format
    """
    try:
        from flask_jwt_extended import get_jwt
        from app.utils.export import ReportGenerator
        organization_id = g.organization_id
        claims = get_jwt()
        
        # Get date range parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        file_format = request.args.get('format', 'pdf').lower()
        
        # Validate format
        if file_format not in ['csv', 'excel', 'pdf', 'json']:
            return jsonify({'status': 'error', 'message': 'Invalid format. Use csv, excel, pdf, or json'}), 400
        
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = datetime.utcnow().date().replace(day=1)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = datetime.utcnow().date()
        
        # Get leave requests
        leaves = LeaveRequest.query.join(Employee).filter(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.start_date >= start_date,
            LeaveRequest.end_date <= end_date
        ).all()
        
        # Generate report based on format
        if file_format == 'excel':
            return ReportGenerator.leave_report(leaves, str(start_date), str(end_date), 'excel')
        elif file_format == 'json':
            return ReportGenerator.leave_report(leaves, str(start_date), str(end_date), 'json')
        elif file_format == 'csv':
            return ReportGenerator.leave_report(leaves, str(start_date), str(end_date), 'csv')
        else:  # pdf
            return ReportGenerator.leave_report(leaves, str(start_date), str(end_date), 'pdf')
            
    except Exception as e:
        current_app.logger.error(f"Error downloading leaves report: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': 'Failed to download leaves report'
        }), 500