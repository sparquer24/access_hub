"""
Leave Request schemas for request/response validation.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError, validates_schema
from . import TimestampMixin


class LeaveRequestSchema(Schema, TimestampMixin):
    """Complete leave request schema"""
    id = fields.String(dump_only=True)
    employee_id = fields.String(required=True)
    organization_id = fields.String(required=True)
    leave_type = fields.String(
        required=True,
        validate=validate.OneOf(['sick', 'casual', 'earned', 'unpaid'])
    )
    duration_type = fields.String(
        load_default='full_day',
        validate=validate.OneOf(['full_day', 'half_day'])
    )
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    total_days = fields.Float(required=True, validate=validate.Range(min=0.5))
    reason = fields.String(required=True, validate=validate.Length(min=10))
    status = fields.String(
        load_default='pending',
        validate=validate.OneOf(['pending', 'approved', 'rejected'])
    )
    approved_by = fields.String(allow_none=True)
    approval_notes = fields.String(allow_none=True)
    
    # Nested employee (dump_only)
    employee = fields.Function(lambda obj: {
        'id': obj.employee.id,
        'full_name': obj.employee.full_name,
        'employee_code': obj.employee.employee_code
    } if obj.employee else None, dump_only=True)
    
    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Validate that end_date is after start_date"""
        if 'start_date' in data and 'end_date' in data:
            if data['end_date'] < data['start_date']:
                raise ValidationError('End date must be after start date', 'end_date')


class LeaveRequestCreateSchema(Schema):
    """Schema for creating a leave request"""
    class Meta:
        unknown = 'exclude'

    leave_type = fields.String(
        required=True,
        validate=validate.OneOf(['sick', 'casual', 'earned', 'unpaid'])
    )
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    total_days = fields.Float(required=True, validate=validate.Range(min=0.5))
    reason = fields.String(required=True, validate=validate.Length(min=10))
    duration_type = fields.String(
        load_default='full_day',
        validate=validate.OneOf(['full_day', 'half_day'])
    )
    
    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Validate that end_date is after start_date and total_days is logical"""
        if 'start_date' in data and 'end_date' in data:
            if data['end_date'] < data['start_date']:
                raise ValidationError('End date must be after start date', 'end_date')
            
            # Helper to calculate total calendar days difference
            delta = (data['end_date'] - data['start_date']).days + 1
            max_days = float(delta)

            # Adjust max for half_day if single day
            if data.get('duration_type') == 'half_day' and delta == 1:
                max_days = 0.5
            
            # Validate total_days does not exceed calendar days
            if 'total_days' in data:
                if data['total_days'] > max_days:
                    raise ValidationError(
                        f'Total days ({data["total_days"]}) cannot exceed calendar days ({max_days}) for the selected period.',
                        'total_days'
                    )


class LeaveRequestUpdateSchema(Schema):
    """Schema for updating a leave request (before approval)"""
    leave_type = fields.String(validate=validate.OneOf(['sick', 'casual', 'earned', 'unpaid']))
    start_date = fields.Date()
    end_date = fields.Date()
    total_days = fields.Float(validate=validate.Range(min=0.5))
    reason = fields.String(validate=validate.Length(min=10))


class LeaveRequestApprovalSchema(Schema):
    """Schema for approving/rejecting leave request"""
    status = fields.String(
        required=True,
        validate=validate.OneOf(['approved', 'rejected'])
    )
    approval_notes = fields.String(allow_none=True)


class LeaveRequestListSchema(Schema):
    """Schema for leave request list with filters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(load_default=None)
    organization_id = fields.String(load_default=None)
    employee_id = fields.String(load_default=None)
    department_id = fields.String(load_default=None)
    leave_type = fields.String(
        load_default=None,
        validate=validate.OneOf(['sick', 'casual', 'earned', 'unpaid'])
    )
    status = fields.String(
        load_default=None,
        validate=validate.OneOf(['pending', 'approved', 'rejected'])
    )
    start_date = fields.Date(load_default=None)
    end_date = fields.Date(load_default=None)
