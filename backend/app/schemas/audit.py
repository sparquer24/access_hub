"""
Audit log schemas for validation and serialization.
"""
from marshmallow import Schema, fields, validate


class AuditLogSchema(Schema):
    """Schema for audit log serialization"""
    id = fields.String(dump_only=True)
    user_id = fields.String(required=True)
    organization_id = fields.String(allow_none=True)
    action = fields.String(required=True)
    entity_type = fields.String(required=True)
    entity_id = fields.String(required=True)
    old_values = fields.Dict(allow_none=True)
    new_values = fields.Dict(allow_none=True)
    ip_address = fields.String(allow_none=True)
    user_agent = fields.String(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    
    # Nested user details (if needed for display)
    user = fields.Nested(
        'UserSchema',
        only=('id', 'email', 'username'),
        dump_only=True
    )


class AuditLogListSchema(Schema):
    """Schema for audit log list query parameters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    
    # Filters
    user_id = fields.String(allow_none=True)
    organization_id = fields.String(allow_none=True)
    action = fields.String(allow_none=True)
    entity_type = fields.String(allow_none=True)
    entity_id = fields.String(allow_none=True)
    search = fields.String(allow_none=True)
    
    # Date range filters
    start_date = fields.DateTime(allow_none=True)
    end_date = fields.DateTime(allow_none=True)


class UserAuditLogListSchema(Schema):
    """Schema for user-specific audit log list query parameters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    action = fields.String(allow_none=True)
    entity_type = fields.String(allow_none=True)
    start_date = fields.DateTime(allow_none=True)
    end_date = fields.DateTime(allow_none=True)


class EntityAuditLogListSchema(Schema):
    """Schema for entity-specific audit log list query parameters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    action = fields.String(allow_none=True)
    user_id = fields.String(allow_none=True)
    start_date = fields.DateTime(allow_none=True)
    end_date = fields.DateTime(allow_none=True)
