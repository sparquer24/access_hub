"""
Department schemas for request/response validation.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from . import TimestampMixin


class DepartmentSchema(Schema, TimestampMixin):
    """Complete department schema"""
    id = fields.String(dump_only=True)
    organization_id = fields.String(required=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    code = fields.String(required=True, validate=validate.Length(min=1, max=50))
    description = fields.String(allow_none=True)
    manager_id = fields.String(allow_none=True)
    is_active = fields.Boolean(load_default=True)
    employee_count = fields.Integer(dump_only=True)
    deleted_at = fields.DateTime(dump_only=True)


class DepartmentCreateSchema(Schema):
    """Schema for creating a department"""
    organization_id = fields.String(required=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    code = fields.String(required=True, validate=validate.Length(min=1, max=50))
    description = fields.String(allow_none=True)
    manager_id = fields.String(allow_none=True)


class DepartmentUpdateSchema(Schema):
    """Schema for updating a department"""
    name = fields.String(validate=validate.Length(min=1, max=255))
    description = fields.String(allow_none=True)
    manager_id = fields.String(allow_none=True)
    is_active = fields.Boolean()


class DepartmentListSchema(Schema):
    """Schema for department list with filters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(load_default=None)
    organization_id = fields.String(load_default=None)
    is_active = fields.Boolean(load_default=None)
