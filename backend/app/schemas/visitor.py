"""
Marshmallow schemas for organization visitor management validation.
"""

from marshmallow import Schema, fields, validates, ValidationError, post_dump


class VisitorCreateSchema(Schema):
    """
    Schema for creating a new visitor.
    
    This schema handles both visitor master data and visit history details.
    - Visitor fields: name, phone, email, gender
    - Visit history fields: purpose_of_visit, allowed_floor, allowed_tower, 
                           visitor_type, host_name, host_number, etc.
    """
    # VISITOR BASIC INFO (goes to visitors table)
    name = fields.String(required=True, validate=lambda x: len(x) > 0)
    phone = fields.String(required=True)  # Mapped to phone column in visitors table
    email = fields.Email(allow_none=True)
    gender = fields.String(allow_none=True)  # Male, Female, Other, Prefer not to say
    
    # VISIT HISTORY DETAILS (goes to visitor_history_details table)
    purpose_of_visit = fields.String(required=True)
    allowed_floor = fields.String(required=True)
    allowed_tower = fields.String(allow_none=True)  # Tower or zone for visitor access
    
    # Visitor type
    visitor_type = fields.String(required=False, load_default='guest')  # guest, contractor, vendor, etc.
    
    # Host information
    host_name = fields.String(allow_none=True)
    host_number = fields.String(allow_none=True)  # Host phone number
    
    # Duration dates (mapped to duration_date_from and duration_date_to in DB)
    from_date = fields.Date(allow_none=True)  # Visit start date
    to_date = fields.Date(allow_none=True)    # Visit end date
    
    # Image/Photo
    image_base64 = fields.String(allow_none=True)
    
    # Additional fields
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
    """
    Schema for visitor response.
    This merges both OrganizationVisitor and VisitorHistoryDetails data.
    """
    # VISITOR INFO (from visitors table - OrganizationVisitor)
    id = fields.String()
    organization_id = fields.String()
    name = fields.String()
    phone = fields.String()
    email = fields.String()
    gender = fields.String()
    
    # VISIT HISTORY INFO (from visitor_history_details table - will be fetched from latest visit)
    visitor_id = fields.Method('get_visitor_id', dump_only=True)  # Same as 'id' but for reference
    visitor_type = fields.Method('get_visitor_type', dump_only=True)
    purpose_of_visit = fields.Method('get_purpose_of_visit', dump_only=True)
    allowed_floor = fields.Method('get_allowed_floor', dump_only=True)
    allowed_tower = fields.Method('get_allowed_tower', dump_only=True)
    host_name = fields.Method('get_host_name', dump_only=True)
    host_number = fields.Method('get_host_number', dump_only=True)
    from_date = fields.Method('get_from_date', dump_only=True)  # duration_date_from mapped to from_date
    to_date = fields.Method('get_to_date', dump_only=True)      # duration_date_to mapped to to_date
    
    # Check-in/Check-out status (from visitor_history_details)
    is_checked_in = fields.Method('get_is_checked_in', dump_only=True)
    check_in_time = fields.Method('get_check_in_time', dump_only=True)
    check_out_time = fields.Method('get_check_out_time', dump_only=True)
    
    # Photo/Image
    photo_id = fields.Method('get_photo_id', dump_only=True)
    photo_base64 = fields.Method('get_photo_base64', dump_only=True)
    visitor_image = fields.Method('get_visitor_image', dump_only=True)  # Alias for frontend compatibility
    
    # Additional fields
    company_name = fields.String()
    vehicle_number = fields.String()
    assets_carried = fields.Raw()
    delivery_package_count = fields.Integer()
    
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    def _get_latest_history(self, obj):
        """Helper to get the latest visit history"""
        if hasattr(obj, '_latest_history'):
            return obj._latest_history
        # Fallback: get latest from relationship if available
        if hasattr(obj, 'visit_history') and obj.visit_history:
            return obj.visit_history[0] if obj.visit_history else None
        return None

    def get_visitor_id(self, obj):
        return obj.id if obj else None

    def get_visitor_type(self, obj):
        history = self._get_latest_history(obj)
        return history.visitor_type if history else None

    def get_purpose_of_visit(self, obj):
        history = self._get_latest_history(obj)
        return history.purpose_of_visit if history else None

    def get_allowed_floor(self, obj):
        history = self._get_latest_history(obj)
        return history.allowed_floor if history else None

    def get_allowed_tower(self, obj):
        history = self._get_latest_history(obj)
        return history.allowed_tower if history else None

    def get_host_name(self, obj):
        history = self._get_latest_history(obj)
        return history.host_name if history else None

    def get_host_number(self, obj):
        history = self._get_latest_history(obj)
        return history.host_number if history else None

    def get_from_date(self, obj):
        history = self._get_latest_history(obj)
        return history.from_date if history else None

    def get_to_date(self, obj):
        history = self._get_latest_history(obj)
        return history.to_date if history else None

    def get_is_checked_in(self, obj):
        history = self._get_latest_history(obj)
        return history.is_checked_in if history else False

    def get_check_in_time(self, obj):
        history = self._get_latest_history(obj)
        return history.check_in_time if history else None

    def get_check_out_time(self, obj):
        history = self._get_latest_history(obj)
        return history.check_out_time if history else None

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

class CheckInSchema(Schema):
    """Schema for check-in request"""
    current_floor = fields.String()

    class Meta:
        strict = True
