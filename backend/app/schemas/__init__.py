"""
Marshmallow schemas for request/response validation and serialization.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError, post_load
from datetime import datetime, date

# Base schemas with common patterns
class TimestampMixin:
    """Mixin for created_at and updated_at fields"""
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class PaginationSchema(Schema):
    """Schema for pagination parameters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(load_default=None)
    sort_by = fields.String(load_default=None)
    sort_order = fields.String(load_default='desc', validate=validate.OneOf(['asc', 'desc']))


class FilterSchema(Schema):
    """Base schema for filtering"""
    is_active = fields.Boolean(load_default=None)
    start_date = fields.Date(load_default=None)
    end_date = fields.Date(load_default=None)


__all__ = [
    'TimestampMixin',
    'PaginationSchema',
    'FilterSchema',
]
