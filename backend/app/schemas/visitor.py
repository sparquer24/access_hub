"""
Marshmallow schemas for organization visitor management validation.
"""

from marshmallow import Schema, fields, validates, ValidationError, post_dump


class VisitorCreateSchema(Schema):
    """Schema for creating a new visitor"""
    name = fields.String(required=True, validate=lambda x: len(x) > 0)
    mobile_number = fields.String(required=True)
    email = fields.Email(allow_none=True)
    purpose_of_visit = fields.String(required=True)
    allowed_floor = fields.String(required=True)
    image_base64 = fields.String(allow_none=True)
    
    # New Fields
    visitor_type = fields.String(required=False, load_default='guest')
    host_name = fields.String(allow_none=True)
    host_phone = fields.String(allow_none=True)
    company_name = fields.String(allow_none=True)
    company_address = fields.String(allow_none=True)
    is_recurring = fields.Boolean(load_default=False)
    
    # Contractor / Work
    work_description = fields.String(allow_none=True)
    expected_duration_hours = fields.Integer(allow_none=True)
    
    # Delivery
    delivery_package_count = fields.Integer(allow_none=True)
    delivery_recipient_name = fields.String(allow_none=True)
    
    # VIP
    special_instructions = fields.String(allow_none=True)
    
    # Assets
    assets_carried = fields.List(fields.Dict(), allow_none=True)
    
    # Vehicle
    vehicle_number = fields.String(allow_none=True)
    vehicle_type = fields.String(allow_none=True)
    parking_slot = fields.String(allow_none=True)
    vehicle_photos = fields.List(fields.Dict(), allow_none=True)

    class Meta:
        strict = True


class VisitorUpdateSchema(Schema):
    """Schema for updating visitor information"""
    purpose_of_visit = fields.String()
    allowed_floor = fields.String()
    current_floor = fields.String()
    visitor_type = fields.String()
    special_instructions = fields.String()

    class Meta:
        strict = True


class VisitorResponseSchema(Schema):
    """Schema for visitor response"""
    id = fields.String()
    organization_id = fields.String()
    visitor_name = fields.String()
    mobile_number = fields.String()
    email = fields.String()
    visitor_type = fields.String()
    company_name = fields.String()
    purpose_of_visit = fields.String()
    allowed_floor = fields.String()
    current_floor = fields.String()
    host_name = fields.String()
    
    is_checked_in = fields.Boolean()
    check_in_time = fields.DateTime()
    check_out_time = fields.DateTime()
    
    photo_id = fields.Method('get_photo_id', dump_only=True)
    photo_base64 = fields.Method('get_photo_base64', dump_only=True)
    visitor_image = fields.Method('get_visitor_image', dump_only=True)  # Alias for frontend compatibility
    
    # New Fields Response
    vehicle_number = fields.String()
    assets_carried = fields.Raw()
    delivery_package_count = fields.Integer()
    
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    def get_photo_id(self, obj):
        """Get primary image ID for visitor"""
        if hasattr(obj, 'get_primary_image'):
            primary_image = obj.get_primary_image()
            return primary_image.id if primary_image else None
        return None

    def get_photo_base64(self, obj):
        """Get primary image base64 for visitor"""
        if hasattr(obj, 'get_primary_image'):
            primary_image = obj.get_primary_image()
            return primary_image.image_base64 if primary_image else None
        return None

    def get_visitor_image(self, obj):
        """Get visitor image as base64 (alias for photo_base64 for frontend compatibility)"""
        return self.get_photo_base64(obj)

    @post_dump
    def add_name_alias(self, data, **kwargs):
        """Add 'name' as an alias for 'visitor_name' for frontend compatibility"""
        if 'visitor_name' in data:
            data['name'] = data['visitor_name']
        return data

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
