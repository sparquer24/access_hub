"""
Business logic for Attendance Change Request management.
"""

from datetime import datetime, date
from ..extensions import db
from ..models import AttendanceChangeRequest, Employee, AttendanceRecord
from ..utils.exceptions import NotFoundError, ValidationError, ForbiddenError, ConflictError


class AttendanceChangeRequestService:
    """Service class for attendance change request operations"""

    @staticmethod
    def create_change_request(data):
        """Create a new attendance change request"""
        # Validate employee_id
        employee_id = data.get('employee_id')
        employee = Employee.query.filter_by(id=employee_id).first()
        if not employee:
            raise NotFoundError('Employee not found')
        
        # Parse request_date
        request_date_str = data.get('request_date')
        try:
            request_date = datetime.strptime(request_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            raise ValidationError('request_date must be in YYYY-MM-DD format')
        
        # Validate request_date is not in the future
        if request_date > date.today():
            raise ValidationError('Cannot request changes for future dates')
        
        # Check if there's already a pending request for this date
        existing_pending = AttendanceChangeRequest.query.filter(
            AttendanceChangeRequest.employee_id == employee_id,
            AttendanceChangeRequest.request_date == request_date,
            AttendanceChangeRequest.status == 'pending'
        ).first()
        
        if existing_pending:
            raise ConflictError('There is already a pending change request for this date')
        
        # Get attendance record if exists
        attendance_record = AttendanceRecord.query.filter_by(
            employee_id=employee_id,
            date=request_date
        ).first()
        
        # Create change request
        change_request = AttendanceChangeRequest(
            employee_id=employee_id,
            organization_id=employee.organization_id,
            attendance_record_id=attendance_record.id if attendance_record else None,
            request_date=request_date,
            request_type=data.get('request_type'),
            requested_changes=data.get('requested_changes'),
            reason=data.get('reason'),
            status='pending'
        )
        
        db.session.add(change_request)
        db.session.commit()
        
        return change_request

    @staticmethod
    def get_change_request(request_id):
        """Get attendance change request by ID"""
        change_request = AttendanceChangeRequest.query.filter_by(id=request_id).first()
        if not change_request:
            raise NotFoundError('Attendance change request not found')
        return change_request

    @staticmethod
    def list_change_requests(filters):
        """List attendance change requests with filters"""
        query = AttendanceChangeRequest.query
        
        # Filter by employee_id
        if filters.get('employee_id'):
            query = query.filter(AttendanceChangeRequest.employee_id == filters['employee_id'])
        
        # Filter by status
        if filters.get('status') and filters['status'] != 'all':
            query = query.filter(AttendanceChangeRequest.status == filters['status'])
        
        # Filter by request_type
        if filters.get('request_type') and filters['request_type'] != 'all':
            query = query.filter(AttendanceChangeRequest.request_type == filters['request_type'])
        
        # Filter by request_date range
        if filters.get('start_date'):
            try:
                start_date = datetime.strptime(filters['start_date'], '%Y-%m-%d').date()
                query = query.filter(AttendanceChangeRequest.request_date >= start_date)
            except ValueError:
                pass
        
        if filters.get('end_date'):
            try:
                end_date = datetime.strptime(filters['end_date'], '%Y-%m-%d').date()
                query = query.filter(AttendanceChangeRequest.request_date <= end_date)
            except ValueError:
                pass
        
        # Filter by organization_id (for tenant isolation)
        if filters.get('organization_id'):
            query = query.filter(AttendanceChangeRequest.organization_id == filters['organization_id'])
        
        # Order by created_at descending
        query = query.order_by(AttendanceChangeRequest.created_at.desc())
        
        return query

    @staticmethod
    def update_change_request(request_id, data):
        """Update an attendance change request (only if pending)"""
        change_request = AttendanceChangeRequestService.get_change_request(request_id)
        
        if change_request.status != 'pending':
            raise ForbiddenError(f'Cannot update a {change_request.status} request')
        
        # Update allowed fields
        if 'requested_changes' in data:
            change_request.requested_changes = data['requested_changes']
        if 'reason' in data:
            change_request.reason = data['reason']
        
        change_request.updated_at = datetime.utcnow()
        db.session.commit()
        
        return change_request

    @staticmethod
    def delete_change_request(request_id):
        """Delete an attendance change request (only if pending)"""
        change_request = AttendanceChangeRequestService.get_change_request(request_id)
        
        if change_request.status != 'pending':
            raise ForbiddenError(f'Cannot delete a {change_request.status} request')
        
        db.session.delete(change_request)
        db.session.commit()

    @staticmethod
    def approve_change_request(request_id, approver_id, approval_notes=None):
        """Approve an attendance change request and apply changes"""
        change_request = AttendanceChangeRequestService.get_change_request(request_id)
        
        if change_request.status != 'pending':
            raise ForbiddenError(f'Cannot approve a {change_request.status} request')
        
        # Update request status
        change_request.status = 'approved'
        change_request.approved_by = approver_id
        change_request.approval_notes = approval_notes
        change_request.updated_at = datetime.utcnow()
        
        # Apply changes to attendance record
        requested_changes = change_request.requested_changes
        request_date = change_request.request_date
        employee_id = change_request.employee_id
        
        # Get or create attendance record
        attendance = AttendanceRecord.query.filter_by(
            employee_id=employee_id,
            date=request_date
        ).first()
        
        if not attendance:
            # Create new attendance record for manual check-in
            employee = Employee.query.get(employee_id)
            attendance = AttendanceRecord(
                employee_id=employee_id,
                organization_id=employee.organization_id,
                date=request_date,
                status='present',
                review_status='approved',
                approved_by=approver_id,
                is_modified=True,
                modified_by_request_id=change_request.id
            )
            db.session.add(attendance)
        
        # Apply requested changes
        if 'check_in_time' in requested_changes:
            try:
                attendance.check_in_time = datetime.fromisoformat(requested_changes['check_in_time'])
            except (ValueError, TypeError):
                pass
        
        if 'check_out_time' in requested_changes:
            try:
                attendance.check_out_time = datetime.fromisoformat(requested_changes['check_out_time'])
            except (ValueError, TypeError):
                pass
        
        if 'status' in requested_changes:
            attendance.status = requested_changes['status']
        
        # Calculate work hours if both times are set
        if attendance.check_in_time and attendance.check_out_time:
            delta = attendance.check_out_time - attendance.check_in_time
            attendance.work_hours = delta.total_seconds() / 3600.0  # Convert to hours
        
        attendance.notes = f"Modified via change request {change_request.id}"
        attendance.approved_by = approver_id
        attendance.review_status = 'approved'
        
        # Set modification flags
        attendance.is_modified = True
        attendance.modified_by_request_id = change_request.id
        
        db.session.commit()
        
        return change_request

    @staticmethod
    def reject_change_request(request_id, approver_id, approval_notes=None):
        """Reject an attendance change request"""
        change_request = AttendanceChangeRequestService.get_change_request(request_id)
        
        if change_request.status != 'pending':
            raise ForbiddenError(f'Cannot reject a {change_request.status} request')
        
        # Update request status
        change_request.status = 'rejected'
        change_request.approved_by = approver_id
        change_request.approval_notes = approval_notes or 'Request rejected'
        change_request.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return change_request
