"""
Location schemas for request/response validation.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from . import TimestampMixin


class LocationSchema(Schema, TimestampMixin):
    """Complete location schema"""
    id = fields.String(dump_only=True)
    organization_id = fields.String(required=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    location_type = fields.String(
        load_default='BOTH',
        validate=validate.OneOf(['ENTRY', 'EXIT', 'BOTH'])
    )
    description = fields.String(allow_none=True)
    building = fields.String(allow_none=True, validate=validate.Length(max=128))
    floor = fields.String(allow_none=True, validate=validate.Length(max=50))
    area = fields.String(allow_none=True, validate=validate.Length(max=128))
    latitude = fields.Float(allow_none=True)
    longitude = fields.Float(allow_none=True)
    is_active = fields.Boolean(load_default=True)
    camera_count = fields.Integer(dump_only=True)
    deleted_at = fields.DateTime(dump_only=True)


class LocationCreateSchema(Schema):
    """Schema for creating a location"""
    organization_id = fields.String(required=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    location_type = fields.String(
        load_default='BOTH',
        validate=validate.OneOf(['ENTRY', 'EXIT', 'BOTH'])
    )
    description = fields.String(allow_none=True)
    building = fields.String(allow_none=True, validate=validate.Length(max=128))
    floor = fields.String(allow_none=True, validate=validate.Length(max=50))
    area = fields.String(allow_none=True, validate=validate.Length(max=128))
    latitude = fields.Float(allow_none=True, validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(allow_none=True, validate=validate.Range(min=-180, max=180))


class LocationUpdateSchema(Schema):
    """Schema for updating a location"""
    name = fields.String(validate=validate.Length(min=1, max=255))
    location_type = fields.String(validate=validate.OneOf(['ENTRY', 'EXIT', 'BOTH']))
    description = fields.String(allow_none=True)
    building = fields.String(allow_none=True, validate=validate.Length(max=128))
    floor = fields.String(allow_none=True, validate=validate.Length(max=50))
    area = fields.String(allow_none=True, validate=validate.Length(max=128))
    latitude = fields.Float(allow_none=True, validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(allow_none=True, validate=validate.Range(min=-180, max=180))
    is_active = fields.Boolean()


class LocationListSchema(Schema):
    """Schema for location list with filters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(load_default=None)
    organization_id = fields.String(load_default=None)
    location_type = fields.String(
        load_default=None,
        validate=validate.OneOf(['ENTRY', 'EXIT', 'BOTH'])
    )
    is_active = fields.Boolean(load_default=None)
