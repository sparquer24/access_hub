from marshmallow import Schema, fields, validate

class LPRLogSchema(Schema):
    """Schema for LPR Logs (The Register)"""
    id = fields.String(dump_only=True)
    organization_id = fields.String(dump_only=True)
    vehicle_number = fields.String(dump_only=True)
    vehicle_image_url = fields.String(dump_only=True)
    plate_image_url = fields.String(dump_only=True)
    
    timestamp = fields.DateTime(dump_only=True)
    direction = fields.String(dump_only=True)
    gate_name = fields.String(dump_only=True)
    
    status = fields.String(dump_only=True)
    category = fields.String(dump_only=True)
    
    confidence_score = fields.Float(dump_only=True)


class LPRHotlistSchema(Schema):
    """Schema for Hotlist/Blacklist management"""
    id = fields.String(dump_only=True)
    organization_id = fields.String(dump_only=True)
    
    vehicle_number = fields.String(required=True, validate=validate.Length(min=2, max=20))
    reason = fields.String(required=True, validate=validate.Length(min=5, max=255))
    fir_number = fields.String(allow_none=True, validate=validate.Length(max=100))
    reporting_officer = fields.String(allow_none=True, validate=validate.Length(max=100))
    severity = fields.String(
        load_default='warning',
        validate=validate.OneOf(['critical', 'warning', 'info'])
    )
    
    created_at = fields.DateTime(dump_only=True)
    is_active = fields.Boolean(load_default=True)


class LPRWhitelistSchema(Schema):
    """Schema for Whitelist/VIP management"""
    id = fields.String(dump_only=True)
    organization_id = fields.String(dump_only=True)
    
    vehicle_number = fields.String(required=True, validate=validate.Length(min=2, max=20))
    owner_name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    designation = fields.String(allow_none=True, validate=validate.Length(max=100))
    department = fields.String(allow_none=True, validate=validate.Length(max=100))
    
    priority = fields.String(
        load_default='medium',
        validate=validate.OneOf(['high', 'medium', 'low'])
    )
    access_zones = fields.String(load_default='all', validate=validate.Length(max=255))
    
    created_at = fields.DateTime(dump_only=True)
    valid_until = fields.DateTime(allow_none=True)
    is_active = fields.Boolean(load_default=True)
