"""
Role schemas for validation and serialization.
"""
from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class RoleSchema(Schema):
    """Schema for role serialization"""
    id = fields.String(dump_only=True)
    name = fields.String(required=True)
    description = fields.String(allow_none=True)
    permissions = fields.Dict(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class RoleCreateSchema(Schema):
    """Schema for creating a role"""
    name = fields.String(
        required=True,
        validate=[
            validate.Length(min=2, max=50, error="Name must be between 2 and 50 characters"),
            validate.Regexp(
                r'^[a-zA-Z0-9_-]+$',
                error="Name can only contain letters, numbers, underscores, and hyphens"
            )
        ]
    )
    description = fields.String(
        allow_none=True,
        validate=validate.Length(max=500, error="Description must not exceed 500 characters")
    )
    permissions = fields.Dict(
        allow_none=True,
        load_default={}
    )


class RoleUpdateSchema(Schema):
    """Schema for updating a role"""
    name = fields.String(
        validate=[
            validate.Length(min=2, max=50, error="Name must be between 2 and 50 characters"),
            validate.Regexp(
                r'^[a-zA-Z0-9_-]+$',
                error="Name can only contain letters, numbers, underscores, and hyphens"
            )
        ]
    )
    description = fields.String(
        allow_none=True,
        validate=validate.Length(max=500, error="Description must not exceed 500 characters")
    )
    permissions = fields.Dict(allow_none=True)


class RoleListSchema(Schema):
    """Schema for role list query parameters"""
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))
    search = fields.String(allow_none=True)


class RolePermissionsSchema(Schema):
    """Schema for updating role permissions"""
    permissions = fields.Dict(
        required=True,
        validate=validate.Length(min=0, error="Permissions must be a valid dictionary")
    )
    
    @validates_schema
    def validate_permissions_structure(self, data, **kwargs):
        """
        Validate permissions structure.
        Expected format:
        {
            "resource": ["action1", "action2"],
            "users": ["create", "read", "update", "delete"],
            "organizations": ["read", "update"]
        }
        """
        permissions = data.get('permissions', {})
        
        if not isinstance(permissions, dict):
            raise ValidationError("Permissions must be a dictionary")
        
        for resource, actions in permissions.items():
            if not isinstance(resource, str):
                raise ValidationError(f"Resource key must be a string: {resource}")
            
            if not isinstance(actions, list):
                raise ValidationError(f"Actions for resource '{resource}' must be a list")
            
            for action in actions:
                if not isinstance(action, str):
                    raise ValidationError(
                        f"Action in resource '{resource}' must be a string: {action}"
                    )
