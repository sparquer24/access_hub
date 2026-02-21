"""
Employee schemas for request/response validation.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from . import TimestampMixin


class EmployeeSchema(Schema, TimestampMixin):
    """Complete employee schema"""
    id = fields.String(dump_only=True)
    user_id = fields.String(required=True)
    organization_id = fields.String(required=True)
    department_id = fields.String(required=True)
    employee_code = fields.String(required=True, validate=validate.Length(min=1, max=64))
    full_name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    gender = fields.String(
        allow_none=True,
        validate=validate.OneOf(['male', 'female', 'other'])
    )
    date_of_birth = fields.Date(allow_none=True)
    phone_number = fields.String(allow_none=True, validate=validate.Length(max=32))
    emergency_contact = fields.Dict(allow_none=True)
    address = fields.String(allow_none=True)
    joining_date = fields.Date(allow_none=True)
    designation = fields.String(allow_none=True, validate=validate.Length(max=128))
    employment_type = fields.String(
        allow_none=True,
        validate=validate.OneOf(['full_time', 'part_time', 'contract', 'intern'])
    )
    shift_id = fields.String(allow_none=True)
    is_active = fields.Boolean(load_default=True)
    has_face_registered = fields.Boolean(dump_only=True)
    deleted_at = fields.DateTime(dump_only=True)
    
    # Photo fields
    photo_id = fields.Method('get_photo_id', dump_only=True)
    photo_base64 = fields.Method('get_photo_base64', dump_only=True)
    images = fields.Method('get_images', dump_only=True)
    
    # Nested objects (dump_only) - using Method to convert SQLAlchemy objects to dicts
    user = fields.Method('get_user', dump_only=True)
    department = fields.Method('get_department', dump_only=True)
    shift = fields.Method('get_shift', dump_only=True)
    
    def get_photo_id(self, obj):
        """Get the primary photo ID for this employee"""
        if hasattr(obj, 'get_primary_image'):
            primary_image = obj.get_primary_image()
            return primary_image.id if primary_image else None
        return None
    
    def get_photo_base64(self, obj):
        """Get the primary photo Base64 for this employee"""
        if hasattr(obj, 'get_primary_image'):
            primary_image = obj.get_primary_image()
            return primary_image.image_base64 if primary_image else None
        return None
    
    def get_images(self, obj):
        """Get all images for this employee"""
        if hasattr(obj, 'get_images'):
            images = obj.get_images()
            return [{
                'id': img.id,
                'image_type': img.image_type,
                'file_name': img.file_name,
                'mime_type': img.mime_type,
                'primary': img.primary,
                'is_active': img.is_active,
                'image_base64': img.image_base64,
                'created_at': img.created_at.isoformat() if img.created_at else None
            } for img in images]
        return []
    
    def get_user(self, obj):
        """Convert User object to dict"""
        if hasattr(obj, 'user') and obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'full_name': getattr(obj.user, 'full_name', None),
            }
        return None
    
    def get_department(self, obj):
        """Convert Department object to dict"""
        if hasattr(obj, 'department') and obj.department:
            return {
                'id': obj.department.id,
                'name': obj.department.name,
                'code': getattr(obj.department, 'code', None),
            }
        return None
    
    def get_shift(self, obj):
        """Convert Shift object to dict"""
        if hasattr(obj, 'shift') and obj.shift:
            return {
                'id': obj.shift.id,
                'name': obj.shift.name,
                'start_time': obj.shift.start_time.isoformat() if hasattr(obj.shift, 'start_time') and obj.shift.start_time else None,
                'end_time': obj.shift.end_time.isoformat() if hasattr(obj.shift, 'end_time') and obj.shift.end_time else None,
            }
        return None


class EmployeeCreateSchema(Schema):
    """Schema for creating an employee"""
    user_id = fields.String(required=True)
    organization_id = fields.String(required=True)
    department_id = fields.String(required=True)
    employee_code = fields.String(required=True, validate=validate.Length(min=1, max=64))
    full_name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    gender = fields.String(
        allow_none=True,
        validate=validate.OneOf(['male', 'female', 'other'])
    )
    date_of_birth = fields.Date(allow_none=True)
    phone_number = fields.String(allow_none=True, validate=validate.Length(max=32))
    emergency_contact = fields.Dict(allow_none=True)
    address = fields.String(allow_none=True)
    joining_date = fields.Date(allow_none=True)
    designation = fields.String(allow_none=True, validate=validate.Length(max=128))
    employment_type = fields.String(
        allow_none=True,
        validate=validate.OneOf(['full_time', 'part_time', 'contract', 'intern'])
    )
    shift_id = fields.String(allow_none=True)
    photo_base64 = fields.String(allow_none=True)


class EmployeeUpdateSchema(Schema):
    """Schema for updating an employee"""
    department_id = fields.String()
    full_name = fields.String(validate=validate.Length(min=1, max=255))
    gender = fields.String(validate=validate.OneOf(['male', 'female', 'other']))
    date_of_birth = fields.Date(allow_none=True)
    phone_number = fields.String(allow_none=True, validate=validate.Length(max=32))
    emergency_contact = fields.Dict(allow_none=True)
    address = fields.String(allow_none=True)
    joining_date = fields.Date(allow_none=True)
    designation = fields.String(allow_none=True, validate=validate.Length(max=128))
    employment_type = fields.String(
        validate=validate.OneOf(['full_time', 'part_time', 'contract', 'intern'])
    )
    shift_id = fields.String(allow_none=True)
    is_active = fields.Boolean()
    photo_base64 = fields.String(allow_none=True)


class EmployeeListSchema(Schema):
    """Schema for employee list with filters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(load_default=None)
    organization_id = fields.String(load_default=None)
    department_id = fields.String(load_default=None)
    employment_type = fields.String(
        load_default=None,
        validate=validate.OneOf(['full_time', 'part_time', 'contract', 'intern'])
    )
    is_active = fields.Boolean(load_default=None)