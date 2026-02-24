"""
Marshmallow schemas for organization visitor management validation.
"""

from marshmallow import Schema, fields, validates, ValidationError, post_dump


class VisitorCreateSchema(Schema):
    """Schema for creating a new visitor and visit record"""
    # Visitor basic information
    visitor_name = fields.String(required=False, allow_none=True)
    name = fields.String(required=False, allow_none=True)  # Alternative to visitor_name
    mobile_number = fields.String(required=False, allow_none=True)
    phone = fields.String(allow_none=True)  # Alternative to mobile_number
    phone_number = fields.String(allow_none=True)  # Alternative to mobile_number
    email = fields.Email(allow_none=True)
    gender = fields.String(allow_none=True)
    
    # Company information
    company_name = fields.String(allow_none=True)
    company_address = fields.String(allow_none=True)
    
    # Visit history information
    visitor_type = fields.String(allow_none=True, load_default='guest')
    host_name = fields.String(allow_none=True)
    host_phone = fields.String(allow_none=True)  # New: host phone number
    purpose_of_visit = fields.String(allow_none=True)
    allowed_floor = fields.String(allow_none=True)
    allowed_tower = fields.String(allow_none=True)
    duration_date_from = fields.DateTime(allow_none=True)
    duration_date_to = fields.DateTime(allow_none=True)
    expected_duration_hours = fields.Float(allow_none=True)  # New: expected duration in hours
    is_recurring = fields.Boolean(allow_none=True, load_default=False)  # New: recurring visitor flag
    special_instructions = fields.String(allow_none=True)  # New: special instructions
    
    # Delivery information
    delivery_package_count = fields.Integer(allow_none=True)
    delivery_recipient_name = fields.String(allow_none=True)
    
    # Contractor/Work information
    work_description = fields.String(allow_none=True)
    
    # Profile picture
    image_base64 = fields.String(allow_none=True)  # New: base64 encoded profile picture

    class Meta:
        strict = True


class VisitorUpdateSchema(Schema):
    """Schema for updating visitor information"""
    visitor_name = fields.String(allow_none=True)
    email = fields.Email(allow_none=True)
    gender = fields.String(allow_none=True)
    mobile_number = fields.String(allow_none=True)

    class Meta:
        strict = True


class VisitorResponseSchema(Schema):
    """Schema for visitor response"""
    id = fields.String()
    organization_id = fields.String()
    visitor_name = fields.String()
    mobile_number = fields.String()
    email = fields.String()
    gender = fields.String()
    created_at = fields.DateTime()

    class Meta:
        strict = True


class VisitorListSchema(Schema):
    """Schema for visitor list response"""
    page = fields.Integer()
    limit = fields.Integer()
    total = fields.Integer()
    visitors = fields.Nested(VisitorResponseSchema, many=True)

    class Meta:
        strict = True


class VisitorMovementLogSchema(Schema):
    """Schema for visitor movement logs"""
    id = fields.String()
    visitor_id = fields.String()
    floor = fields.String()
    entry_time = fields.DateTime()
    exit_time = fields.DateTime()
    created_at = fields.DateTime()

    class Meta:
        strict = True


class VisitorAlertSchema(Schema):
    """Schema for visitor alerts"""
    id = fields.String()
    visitor_id = fields.String()
    visitor_name = fields.String()
    alert_type = fields.String()
    current_floor = fields.String()
    allowed_floor = fields.String()
    alert_time = fields.DateTime()
    acknowledged = fields.Boolean()
    acknowledged_at = fields.DateTime(allow_none=True)
    mobile_number = fields.String()

    class Meta:
        strict = True


class CheckInSchema(Schema):
    """Schema for check-in request"""
    current_floor = fields.String()

    class Meta:
        strict = True
