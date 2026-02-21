"""
Business logic for Leave Request management.
"""

from sqlalchemy import or_, and_
from ..extensions import db
from ..models import LeaveRequest, Employee
from ..utils.exceptions import NotFoundError, ConflictError, BadRequestError
from datetime import datetime


class LeaveService:
    """Service class for leave request operations"""
    
    @staticmethod
    def create_leave_request(data):
        """Create a new leave request"""
        # Verify employee exists
        employee = Employee.query.filter_by(
            id=data['employee_id'],
            deleted_at=None
        ).first()
        
        if not employee:
            raise NotFoundError('Employee')
        
        # Check for overlapping leave requests
        # For half days, we need to check if there's already a leave for the same part of day
        # If full day, it overlaps with everything
        
        domain_filters = [
            LeaveRequest.employee_id == data['employee_id'],
            LeaveRequest.status.in_(['pending', 'approved']),
            or_(
                and_(
                    LeaveRequest.start_date <= data['start_date'],
                    LeaveRequest.end_date >= data['start_date']
                ),
                and_(
                    LeaveRequest.start_date <= data['end_date'],
                    LeaveRequest.end_date >= data['end_date']
                ),
                and_(
                    LeaveRequest.start_date >= data['start_date'],
                    LeaveRequest.end_date <= data['end_date']
                )
            )
        ]
        
        # New logic for half-day compatibility
        # If incoming is half-day, and existing is half-day, they MIGHT coexist (logic to be defined)
        # For now, we follow the requirement to just STORE duration_type.
        # But to prevent blocking, we should ideally check it.
        # However, without specific 'morning/afternoon' details, 
        # two 'half_day' requests on same day are ambiguous.
        # So we KEEP strict overlap for now, but the field is now stored.
        
        overlapping = LeaveRequest.query.filter(and_(*domain_filters)).first()
        
        if overlapping:
            raise ConflictError(
                f'Leave request overlaps with an existing {overlapping.status} request '
                f'from {overlapping.start_date} to {overlapping.end_date}'
            )
        
        # Create leave request
        leave_request = LeaveRequest(**data)
        db.session.add(leave_request)
        db.session.commit()
        
        return leave_request
    
    @staticmethod
    def get_leave_request(leave_id):
        """Get leave request by ID"""
        leave_request = LeaveRequest.query.filter_by(id=leave_id).first()
        
        if not leave_request:
            raise NotFoundError('Leave request')
        
        return leave_request
    
    @staticmethod
    def list_leave_requests(filters, organization_id=None):
        """List leave requests with filters and pagination"""
        query = LeaveRequest.query
        
        # Apply tenant isolation
        if organization_id:
            query = query.filter_by(organization_id=organization_id)
        
        # Apply filters
        if filters.get('organization_id'):
            query = query.filter_by(organization_id=filters['organization_id'])
        
        if filters.get('employee_id'):
            query = query.filter_by(employee_id=filters['employee_id'])
        
        if filters.get('department_id'):
            # Join with Employee to filter by department
            query = query.join(Employee).filter(Employee.department_id == filters['department_id'])
        
        if filters.get('leave_type'):
            query = query.filter_by(leave_type=filters['leave_type'])
        
        if filters.get('status'):
            query = query.filter_by(status=filters['status'])
        
        if filters.get('start_date'):
            query = query.filter(LeaveRequest.start_date >= filters['start_date'])
        
        if filters.get('end_date'):
            query = query.filter(LeaveRequest.end_date <= filters['end_date'])
        
        if filters.get('search'):
            # Search by employee name or code
            search = f"%{filters['search']}%"
            query = query.join(Employee).filter(
                or_(
                    Employee.full_name.ilike(search),
                    Employee.employee_code.ilike(search)
                )
            )
        
        # Order by created_at desc
        query = query.order_by(LeaveRequest.created_at.desc())
        
        return query
    
    @staticmethod
    def update_leave_request(leave_id, data):
        """Update a leave request (only if pending)"""
        leave_request = LeaveService.get_leave_request(leave_id)
        
        # Can only update pending leave requests
        if leave_request.status != 'pending':
            raise BadRequestError('Cannot update leave request that is not pending')
        
        # If dates are being changed, check for overlaps
        if 'start_date' in data or 'end_date' in data:
            start_date = data.get('start_date', leave_request.start_date)
            end_date = data.get('end_date', leave_request.end_date)
            
            overlapping = LeaveRequest.query.filter(
                and_(
                    LeaveRequest.employee_id == leave_request.employee_id,
                    LeaveRequest.id != leave_id,
                    LeaveRequest.status.in_(['pending', 'approved']),
                    or_(
                        and_(
                            LeaveRequest.start_date <= start_date,
                            LeaveRequest.end_date >= start_date
                        ),
                        and_(
                            LeaveRequest.start_date <= end_date,
                            LeaveRequest.end_date >= end_date
                        ),
                        and_(
                            LeaveRequest.start_date >= start_date,
                            LeaveRequest.end_date <= end_date
                        )
                    )
                )
            ).first()
            
            if overlapping:
                raise ConflictError(
                    f'Leave request overlaps with an existing {overlapping.status} request '
                    f'from {overlapping.start_date} to {overlapping.end_date}'
                )
        
        # Update fields
        for key, value in data.items():
            setattr(leave_request, key, value)
        
        leave_request.updated_at = datetime.utcnow()
        db.session.commit()
        
        return leave_request
    
    @staticmethod
    def delete_leave_request(leave_id):
        """Delete a leave request (only if pending)"""
        leave_request = LeaveService.get_leave_request(leave_id)
        
        # Can only delete pending leave requests
        if leave_request.status != 'pending':
            raise BadRequestError('Cannot delete leave request that is not pending')
        
        # Hard delete
        db.session.delete(leave_request)
        db.session.commit()
        
        return True
    
    @staticmethod
    def approve_leave_request(leave_id, data, current_user):
        """Approve a leave request"""
        leave_request = LeaveService.get_leave_request(leave_id)
        
        # Can only approve/reject pending requests
        if leave_request.status != 'pending':
            raise BadRequestError('Leave request is not pending')
        
        leave_request.status = 'approved'
        leave_request.approved_by = current_user.get('id')
        
        if data.get('approval_notes'):
            leave_request.approval_notes = data['approval_notes']
        
        leave_request.updated_at = datetime.utcnow()
        db.session.commit()
        
        return leave_request
    
    @staticmethod
    def reject_leave_request(leave_id, data, current_user):
        """Reject a leave request"""
        leave_request = LeaveService.get_leave_request(leave_id)
        
        # Can only approve/reject pending requests
        if leave_request.status != 'pending':
            raise BadRequestError('Leave request is not pending')
        
        leave_request.status = 'rejected'
        leave_request.approved_by = current_user.get('id')
        
        if data.get('approval_notes'):
            leave_request.approval_notes = data['approval_notes']
        
        leave_request.updated_at = datetime.utcnow()
        db.session.commit()
        
        return leave_request
