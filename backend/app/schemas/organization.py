"""
Organization schemas for request/response validation.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from . import TimestampMixin


class OrganizationSchema(Schema, TimestampMixin):
    """Complete organization schema"""
    class Meta:
        # Don't skip missing fields during serialization
        load_only = ()
        dump_only = ()
    
    id = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=255))
    code = fields.String(required=True, validate=validate.Length(min=2, max=50))
    address = fields.String(allow_none=True)
    contact_email = fields.Email(allow_none=True)
    contact_phone = fields.String(allow_none=True, validate=validate.Length(max=32))
    
    subscription_tier = fields.String(
        load_default='free',
        validate=validate.OneOf(['free', 'basic', 'premium', 'enterprise'])
    )
    
    subscription_plan = fields.String(
        load_default='free',
        validate=validate.OneOf(['free', 'starter', 'professional', 'enterprise'])
    )
    
    enabled_features = fields.Dict(load_default=dict)
    
    organization_type = fields.String(
        load_default='office',
        validate=validate.OneOf([
            'school', 'office', 'apartment', 'home', 'hospital', 'retail', 
            'warehouse', 'factory', 'hotel', 'restaurant', 'gym', 'other'
        ])
    )
    
    timezone = fields.String(load_default='UTC', validate=validate.Length(max=50))
    working_hours = fields.Dict(load_default=dict)
    settings = fields.Dict(load_default=dict)
    is_active = fields.Boolean(load_default=True)
    
    # Counts for related entities - these will be added manually after dump
    employees_count = fields.Integer(dump_only=True, load_default=0)
    cameras_count = fields.Integer(dump_only=True, load_default=0)
    locations_count = fields.Integer(dump_only=True, load_default=0)
    departments_count = fields.Integer(dump_only=True, load_default=0)
    
    deleted_at = fields.DateTime(dump_only=True)


class OrganizationCreateSchema(Schema):
    """Schema for creating an organization"""
    name = fields.String(required=True, validate=validate.Length(min=2, max=255))
    code = fields.String(required=True, validate=validate.Length(min=2, max=50))
    address = fields.String(allow_none=True)
    contact_email = fields.Email(allow_none=True)
    contact_phone = fields.String(allow_none=True, validate=validate.Length(max=32))
    organization_type = fields.String(
        load_default='office',
        validate=validate.OneOf([
            'school', 'office', 'apartment', 'home', 'hospital', 'retail', 
            'warehouse', 'factory', 'hotel', 'restaurant', 'gym', 'other'
        ])
    )
    timezone = fields.String(load_default='UTC')
    working_hours = fields.Dict(load_default=dict)
    settings = fields.Dict(load_default=dict)
    subscription_plan = fields.String(
        load_default='free',
        validate=validate.OneOf(['free', 'starter', 'professional', 'enterprise'])
    )
    enabled_features = fields.Dict(load_default=dict)


class OrganizationUpdateSchema(Schema):
    """Schema for updating an organization"""
    name = fields.String(validate=validate.Length(min=2, max=255))
    code = fields.String(validate=validate.Length(min=2, max=50))
    address = fields.String(allow_none=True)
    contact_email = fields.Email(allow_none=True)
    contact_phone = fields.String(allow_none=True, validate=validate.Length(max=32))
    organization_type = fields.String(
        validate=validate.OneOf([
            'school', 'office', 'apartment', 'home', 'hospital', 'retail', 
            'warehouse', 'factory', 'hotel', 'restaurant', 'gym', 'other'
        ])
    )
    timezone = fields.String()
    working_hours = fields.Dict()
    settings = fields.Dict()
    subscription_plan = fields.String(
        validate=validate.OneOf(['free', 'starter', 'professional', 'enterprise'])
    )
    enabled_features = fields.Dict()
    is_active = fields.Boolean()


class OrganizationListSchema(Schema):
    """Schema for organization list with pagination"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(load_default=None)
    organization_type = fields.String(
        load_default=None,
        validate=validate.OneOf([
            'school', 'office', 'apartment', 'home', 'hospital', 'retail', 
            'warehouse', 'factory', 'hotel', 'restaurant', 'gym', 'other'
        ])
    )
    is_active = fields.Boolean(load_default=None)