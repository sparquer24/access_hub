"""
Camera schemas for request/response validation.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from . import TimestampMixin


class CameraSchema(Schema, TimestampMixin):
    """Complete camera schema"""
    id = fields.String(dump_only=True)
    organization_id = fields.String(required=True)
    location_id = fields.String(required=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    camera_type = fields.String(
        required=True,
        validate=validate.OneOf(['CHECK_IN', 'CHECK_OUT', 'CCTV'])
    )
    source_type = fields.String(
        required=True,
        validate=validate.OneOf(['IP_CAMERA', 'USB_CAMERA', 'RTSP_STREAM'])
    )
    source_url = fields.String(allow_none=True, validate=validate.Length(max=512))
    source_config = fields.Dict(load_default=dict)
    fps = fields.Integer(load_default=10, validate=validate.Range(min=1, max=60))
    resolution = fields.String(load_default='640x480', validate=validate.Length(max=20))
    confidence_threshold = fields.Float(load_default=0.6, validate=validate.Range(min=0.0, max=1.0))
    liveness_check_enabled = fields.Boolean(load_default=True)
    
    # Attendance Management Features
    attendance_enabled = fields.Boolean(load_default=True)
    visitor_tracking_enabled = fields.Boolean(load_default=False)
    people_logs_enabled = fields.Boolean(load_default=True)
    management_type = fields.String(
        load_default='ATTENDANCE',
        validate=validate.OneOf(['ATTENDANCE', 'VISITORS', 'PEOPLE_LOGS', 'MIXED'])
    )
    auto_check_out_hours = fields.Integer(load_default=12, validate=validate.Range(min=1, max=24))
    require_manual_approval = fields.Boolean(load_default=False)
    notification_enabled = fields.Boolean(load_default=True)
    
    is_active = fields.Boolean(load_default=True)
    last_heartbeat = fields.DateTime(dump_only=True)
    status = fields.String(dump_only=True)
    error_message = fields.String(dump_only=True)
    deleted_at = fields.DateTime(dump_only=True)
    
    # Nested location (dump_only) - using Method to convert SQLAlchemy object to dict
    location = fields.Method('get_location', dump_only=True)
    
    def get_location(self, obj):
        """Convert Location object to dict"""
        if hasattr(obj, 'location') and obj.location:
            return {
                'id': obj.location.id,
                'name': obj.location.name,
                'location_type': getattr(obj.location, 'location_type', None),
                'building': getattr(obj.location, 'building', None),
                'floor': getattr(obj.location, 'floor', None),
            }
        return None


class CameraCreateSchema(Schema):
    """Schema for creating a camera"""
    organization_id = fields.String(required=True)
    location_id = fields.String(required=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    camera_type = fields.String(
        required=True,
        validate=validate.OneOf(['CHECK_IN', 'CHECK_OUT', 'CCTV'])
    )
    source_type = fields.String(
        required=True,
        validate=validate.OneOf(['IP_CAMERA', 'USB_CAMERA', 'RTSP_STREAM'])
    )
    source_url = fields.String(allow_none=True, validate=validate.Length(max=512))
    source_config = fields.Dict(load_default=dict)
    fps = fields.Integer(load_default=10, validate=validate.Range(min=1, max=60))
    resolution = fields.String(load_default='640x480', validate=validate.Length(max=20))
    confidence_threshold = fields.Float(load_default=0.6, validate=validate.Range(min=0.0, max=1.0))
    liveness_check_enabled = fields.Boolean(load_default=True)
    
    # Attendance Management Features
    attendance_enabled = fields.Boolean(load_default=True)
    visitor_tracking_enabled = fields.Boolean(load_default=False)
    people_logs_enabled = fields.Boolean(load_default=True)
    management_type = fields.String(
        load_default='ATTENDANCE',
        validate=validate.OneOf(['ATTENDANCE', 'VISITORS', 'PEOPLE_LOGS', 'MIXED'])
    )
    auto_check_out_hours = fields.Integer(load_default=12, validate=validate.Range(min=1, max=24))
    require_manual_approval = fields.Boolean(load_default=False)
    notification_enabled = fields.Boolean(load_default=True)


class CameraUpdateSchema(Schema):
    """Schema for updating a camera"""
    location_id = fields.String()
    name = fields.String(validate=validate.Length(min=1, max=255))
    camera_type = fields.String(validate=validate.OneOf(['CHECK_IN', 'CHECK_OUT', 'CCTV']))
    source_type = fields.String(validate=validate.OneOf(['IP_CAMERA', 'USB_CAMERA', 'RTSP_STREAM']))
    source_url = fields.String(allow_none=True, validate=validate.Length(max=512))
    source_config = fields.Dict()
    fps = fields.Integer(validate=validate.Range(min=1, max=60))
    resolution = fields.String(validate=validate.Length(max=20))
    confidence_threshold = fields.Float(validate=validate.Range(min=0.0, max=1.0))
    liveness_check_enabled = fields.Boolean()
    
    # Attendance Management Features
    attendance_enabled = fields.Boolean()
    visitor_tracking_enabled = fields.Boolean()
    people_logs_enabled = fields.Boolean()
    management_type = fields.String(
        validate=validate.OneOf(['ATTENDANCE', 'VISITORS', 'PEOPLE_LOGS', 'MIXED'])
    )
    auto_check_out_hours = fields.Integer(validate=validate.Range(min=1, max=24))
    require_manual_approval = fields.Boolean()
    notification_enabled = fields.Boolean()
    
    is_active = fields.Boolean()
    
    is_active = fields.Boolean()


class CameraListSchema(Schema):
    """Schema for camera list with filters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(load_default=None)
    organization_id = fields.String(load_default=None)
    location_id = fields.String(load_default=None)
    camera_type = fields.String(
        load_default=None,
        validate=validate.OneOf(['CHECK_IN', 'CHECK_OUT', 'CCTV'])
    )
    status = fields.String(load_default=None)
    is_active = fields.Boolean(load_default=None)


class CameraHeartbeatSchema(Schema):
    """Schema for camera heartbeat update"""
    status = fields.String(
        required=True,
        validate=validate.OneOf(['online', 'offline', 'error'])
    )
    error_message = fields.String(allow_none=True)