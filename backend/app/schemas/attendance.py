
"""
Attendance schemas for request/response validation.
"""

from marshmallow import Schema, fields, validate, ValidationError, post_load
from . import TimestampMixin


class AttendanceSchema(Schema, TimestampMixin):
	"""Complete attendance record schema"""
	id = fields.String(dump_only=True)
	organization_id = fields.String(required=True)
	person_id = fields.String(allow_none=True)
	visitor_id = fields.String(allow_none=True)
	camera_id = fields.String(allow_none=True)
	location_id = fields.String(allow_none=True)
	shift_id = fields.String(allow_none=True)

	check_in_time = fields.DateTime(allow_none=True)
	check_out_time = fields.DateTime(allow_none=True)

	status = fields.String(
		validate=validate.OneOf(['checked_in', 'checked_out', 'absent', 'unknown']),
		load_default='unknown'
	)

	confidence = fields.Float(allow_none=True, validate=validate.Range(min=0.0, max=1.0))
	face_id = fields.String(allow_none=True)
	image_url = fields.String(allow_none=True, validate=validate.Length(max=512))
	source = fields.String(load_default='CAMERA', validate=validate.OneOf(['CAMERA', 'MANUAL', 'MOBILE']))
	manual = fields.Boolean(load_default=False)
	note = fields.String(allow_none=True)

	is_active = fields.Boolean(load_default=True)
	deleted_at = fields.DateTime(dump_only=True)


class AttendanceCreateSchema(Schema):
	"""Schema for creating an attendance record"""
	organization_id = fields.String(required=True)
	person_id = fields.String(allow_none=True)
	visitor_id = fields.String(allow_none=True)
	camera_id = fields.String(allow_none=True)
	location_id = fields.String(allow_none=True)
	shift_id = fields.String(allow_none=True)

	# Allow clients to provide explicit times (otherwise backend sets them)
	check_in_time = fields.DateTime(allow_none=True)
	check_out_time = fields.DateTime(allow_none=True)

	confidence = fields.Float(allow_none=True, validate=validate.Range(min=0.0, max=1.0))
	face_id = fields.String(allow_none=True)
	image_url = fields.String(allow_none=True, validate=validate.Length(max=512))
	source = fields.String(load_default='CAMERA', validate=validate.OneOf(['CAMERA', 'MANUAL', 'MOBILE']))
	manual = fields.Boolean(load_default=False)
	note = fields.String(allow_none=True)


class AttendanceUpdateSchema(Schema):
	"""Schema for updating an attendance record"""
	check_in_time = fields.DateTime(allow_none=True)
	check_out_time = fields.DateTime(allow_none=True)
	status = fields.String(validate=validate.OneOf(['checked_in', 'checked_out', 'absent', 'unknown']))
	confidence = fields.Float(allow_none=True, validate=validate.Range(min=0.0, max=1.0))
	image_url = fields.String(allow_none=True, validate=validate.Length(max=512))
	manual = fields.Boolean()
	note = fields.String(allow_none=True)
	is_active = fields.Boolean()


class AttendanceListSchema(Schema):
	"""Schema for listing/filtering attendance records"""
	page = fields.Integer(load_default=1, validate=validate.Range(min=1))
	per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
	search = fields.String(load_default=None)
	organization_id = fields.String(load_default=None)
	person_id = fields.String(load_default=None)
	visitor_id = fields.String(load_default=None)
	camera_id = fields.String(load_default=None)
	location_id = fields.String(load_default=None)
	shift_id = fields.String(load_default=None)
	status = fields.String(load_default=None, validate=validate.OneOf(['checked_in', 'checked_out', 'absent', 'unknown']))
	start_date = fields.Date(load_default=None)
	end_date = fields.Date(load_default=None)
	is_active = fields.Boolean(load_default=None)


# Compatibility / request-specific schemas expected by routes


class AttendanceRecordSchema(AttendanceSchema):
	"""Full record schema used in responses"""
	# include employee summary when dumping
	employee = fields.Method('get_employee', dump_only=True)

	def get_employee(self, obj):
		if hasattr(obj, 'employee') and obj.employee:
			return {
				'id': obj.employee.id,
				'employee_code': getattr(obj.employee, 'employee_code', None),
				'full_name': getattr(obj.employee, 'full_name', None),
				'designation': getattr(obj.employee, 'designation', None),
			}
		# if obj is dict-like
		if isinstance(obj, dict) and obj.get('employee'):
			emp = obj['employee']
			return {
				'id': emp.get('id'),
				'employee_code': emp.get('employee_code'),
				'full_name': emp.get('full_name'),
				'designation': emp.get('designation'),
			}
		return None


class AttendanceCheckInSchema(Schema):
	"""Payload schema for check-in endpoint"""
	employee_id = fields.String(required=True)
	camera_id = fields.String(allow_none=True)
	location = fields.Dict(allow_none=True)
	device_info = fields.Dict(allow_none=True)
	face_match_confidence = fields.Float(allow_none=True, validate=validate.Range(min=0.0, max=1.0))
	liveness_verified = fields.Boolean(allow_none=True)


class AttendanceCheckOutSchema(Schema):
	"""Payload schema for check-out endpoint"""
	employee_id = fields.String(required=True)
	camera_id = fields.String(allow_none=True)
	location = fields.Dict(allow_none=True)
	device_info = fields.Dict(allow_none=True)


class AttendanceApprovalSchema(Schema):
	"""Schema for approving/rejecting attendance records"""
	review_status = fields.String(required=True, validate=validate.OneOf(['auto_approved', 'pending', 'approved', 'rejected']))
	notes = fields.String(allow_none=True)

from marshmallow import Schema, fields, validate
from .employee import EmployeeSchema

class AttendanceRecordSchema(Schema):
    """Schema for Attendance Record"""
    id = fields.String(dump_only=True)
    employee_id = fields.String(required=True)
    organization_id = fields.String(dump_only=True)
    camera_id = fields.String(allow_none=True)
    date = fields.Date(required=True)
    check_in_time = fields.DateTime(allow_none=True)
    check_out_time = fields.DateTime(allow_none=True)
    status = fields.String(validate=validate.OneOf(['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday']))
    work_hours = fields.Float()
    location_check_in = fields.Raw(allow_none=True)
    location_check_out = fields.Raw(allow_none=True)
    device_info = fields.Raw(allow_none=True)
    face_match_confidence = fields.Float(allow_none=True)
    liveness_verified = fields.Boolean()
    review_status = fields.String()
    notes = fields.String(allow_none=True)
    approved_by = fields.String(allow_none=True)
    
    # Nested objects (dump_only)
    employee = fields.Method('get_employee', dump_only=True)
    
    def get_employee(self, obj):
        """Get employee details with image_base64 for attendance response"""
        if not hasattr(obj, 'employee') or not obj.employee:
            return None
        
        emp = obj.employee
        employee_data = {
            'id': emp.id,
            'employee_code': getattr(emp, 'employee_code', None),
            'full_name': getattr(emp, 'full_name', None),
            'designation': getattr(emp, 'designation', None),
        }
        
        # Get primary image and add as image_base64
        if hasattr(emp, 'get_primary_image'):
            primary_image = emp.get_primary_image()
            employee_data['image_base64'] = primary_image.image_base64 if primary_image else None
        
        return employee_data


class AttendanceCheckInSchema(Schema):
    """Schema for attendance check-in"""
    employee_id = fields.String(required=True)
    camera_id = fields.String(allow_none=True)
    location = fields.Dict(allow_none=True)
    device_info = fields.Dict(allow_none=True)
    face_match_confidence = fields.Float(allow_none=True)
    liveness_verified = fields.Boolean(load_default=False)


class AttendanceCheckOutSchema(Schema):
    """Schema for attendance check-out"""
    employee_id = fields.String(required=True)
    camera_id = fields.String(allow_none=True)
    location = fields.Dict(allow_none=True)
    device_info = fields.Dict(allow_none=True)


class AttendanceUpdateSchema(Schema):
    """Schema for updating attendance record"""
    check_in_time = fields.DateTime(allow_none=True)
    check_out_time = fields.DateTime(allow_none=True)
    status = fields.String(
        validate=validate.OneOf(['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday'])
    )
    notes = fields.String(allow_none=True)
    review_status = fields.String(
        validate=validate.OneOf(['auto_approved', 'pending', 'approved', 'rejected'])
    )


class AttendanceListSchema(Schema):
    """Schema for listing attendance records with filters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(load_default=None)
    organization_id = fields.String(load_default=None)
    employee_id = fields.String(load_default=None)
    department_id = fields.String(load_default=None)
    start_date = fields.Date(load_default=None)
    end_date = fields.Date(load_default=None)
    status = fields.String(
        load_default=None,
        validate=validate.OneOf(['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday'])
    )
    review_status = fields.String(
        load_default=None,
        validate=validate.OneOf(['auto_approved', 'pending', 'approved', 'rejected'])
    )

    @post_load
    def validate_date_range(self, data, **kwargs):
        """Validate that start_date is not after end_date"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise ValidationError({'date_range': 'start_date must be before or equal to end_date'})
        
        return data


class AttendanceApprovalSchema(Schema):
    """Schema for approving/rejecting attendance"""
    review_status = fields.String(
        required=True,
        validate=validate.OneOf(['approved', 'rejected'])
    )
    notes = fields.String(allow_none=True)


# Alias for backward compatibility or alternative naming usage
AttendanceSchema = AttendanceRecordSchema
