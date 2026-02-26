"""
Marshmallow schemas for organization visitor management validation.
"""

from marshmallow import Schema, fields, validates, ValidationError, post_dump


class VisitorCreateSchema(Schema):
    """
    Schema for creating a new visitor (check-in flow).

    Visitor master fields  → stored in `visitors` table (OrganizationVisitor)
    Visit history fields   → stored in `visitor_history_details` (VisitorHistoryDetails)
    """
    # ── VISITOR MASTER (visitors table) ───────────────────────────────────────
    name = fields.String(required=True, validate=lambda x: len(x.strip()) > 0)
    phone = fields.String(required=True)
    email = fields.Email(allow_none=True)
    gender = fields.String(allow_none=True)          # Male | Female | Other | Prefer not to say

    # ── VISIT HISTORY (visitor_history_details table) ─────────────────────────
    purpose_of_visit = fields.String(required=True)
    allowed_floor = fields.String(required=True)
    allowed_tower = fields.String(allow_none=True)

    visitor_type = fields.String(load_default='guest')  # guest | contractor | vendor | vip | delivery

    # Host
    host_name = fields.String(allow_none=True)
    host_phone = fields.String(allow_none=True)          # maps to host_number column in DB

    # Visit duration
    from_date = fields.Date(allow_none=True)
    to_date = fields.Date(allow_none=True)

    # ── EXTRA / META (accepted but not persisted as separate columns) ──────────
    image_base64 = fields.String(allow_none=True)
    company_name = fields.String(allow_none=True)
    company_address = fields.String(allow_none=True)
    is_recurring = fields.Boolean(load_default=False)

    # Contractor
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
    """
    Schema for updating a visitor record.

    Master fields (OrganizationVisitor) and latest history fields
    (VisitorHistoryDetails) are all optional — only supplied keys are applied.
    """
    # Visitor master
    name = fields.String()
    phone = fields.String()
    email = fields.Email(allow_none=True)
    gender = fields.String(allow_none=True)

    # Visit history
    purpose_of_visit = fields.String()
    allowed_floor = fields.String()
    allowed_tower = fields.String(allow_none=True)
    current_floor = fields.String(allow_none=True)
    visitor_type = fields.String()
    host_name = fields.String(allow_none=True)
    host_phone = fields.String(allow_none=True)
    special_instructions = fields.String(allow_none=True)

    class Meta:
        strict = True


class VisitorResponseSchema(Schema):
    """
    Merged response schema: OrganizationVisitor + latest VisitorHistoryDetails.

    The service layer is expected to attach `._latest_history` on each
    OrganizationVisitor object before serialisation.
    """
    # ── VISITOR MASTER ─────────────────────────────────────────────────────────
    id = fields.String()
    organization_id = fields.String()
    name = fields.String()
    phone = fields.String()
    email = fields.String(allow_none=True)
    gender = fields.String(allow_none=True)

    # ── VISIT HISTORY (via latest record) ──────────────────────────────────────
    visitor_id = fields.Method('get_visitor_id', dump_only=True)
    visitor_type = fields.Method('get_visitor_type', dump_only=True)
    purpose_of_visit = fields.Method('get_purpose_of_visit', dump_only=True)
    allowed_floor = fields.Method('get_allowed_floor', dump_only=True)
    allowed_tower = fields.Method('get_allowed_tower', dump_only=True)
    current_floor = fields.Method('get_current_floor', dump_only=True)
    host_name = fields.Method('get_host_name', dump_only=True)
    host_number = fields.Method('get_host_number', dump_only=True)
    from_date = fields.Method('get_from_date', dump_only=True)
    to_date = fields.Method('get_to_date', dump_only=True)

    # Check-in / check-out
    is_checked_in = fields.Method('get_is_checked_in', dump_only=True)
    check_in_time = fields.Method('get_check_in_time', dump_only=True)
    check_out_time = fields.Method('get_check_out_time', dump_only=True)

    # History audit
    created_at = fields.Method('get_created_at', dump_only=True)
    updated_at = fields.Method('get_updated_at', dump_only=True)

    # Photo (from unified Image table via model method)
    photo_id = fields.Method('get_photo_id', dump_only=True)
    photo_base64 = fields.Method('get_photo_base64', dump_only=True)
    visitor_image = fields.Method('get_visitor_image', dump_only=True)   # alias for frontend

    # ── HELPERS ────────────────────────────────────────────────────────────────
    def _get_latest_history(self, obj):
        """Return the pre-attached latest history, or fall back to relationship."""
        if hasattr(obj, '_latest_history'):
            return obj._latest_history
        if hasattr(obj, 'visit_history') and obj.visit_history:
            return obj.visit_history[0]
        return None

    def get_visitor_id(self, obj):
        return obj.id if obj else None

    def get_visitor_type(self, obj):
        h = self._get_latest_history(obj)
        return h.visitor_type if h else None

    def get_purpose_of_visit(self, obj):
        h = self._get_latest_history(obj)
        return h.purpose_of_visit if h else None

    def get_allowed_floor(self, obj):
        h = self._get_latest_history(obj)
        return h.allowed_floor if h else None

    def get_allowed_tower(self, obj):
        h = self._get_latest_history(obj)
        return h.allowed_tower if h else None

    def get_current_floor(self, obj):
        h = self._get_latest_history(obj)
        return h.current_floor if h else None

    def get_host_name(self, obj):
        h = self._get_latest_history(obj)
        return h.host_name if h else None

    def get_host_number(self, obj):
        h = self._get_latest_history(obj)
        return h.host_number if h else None

    def get_from_date(self, obj):
        h = self._get_latest_history(obj)
        if h and h.from_date:
            return h.from_date.isoformat()
        return None

    def get_to_date(self, obj):
        h = self._get_latest_history(obj)
        if h and h.to_date:
            return h.to_date.isoformat()
        return None

    def get_is_checked_in(self, obj):
        h = self._get_latest_history(obj)
        return h.is_checked_in if h else False

    def get_check_in_time(self, obj):
        h = self._get_latest_history(obj)
        return h.check_in_time.isoformat() if h and h.check_in_time else None

    def get_check_out_time(self, obj):
        h = self._get_latest_history(obj)
        return h.check_out_time.isoformat() if h and h.check_out_time else None

    def get_created_at(self, obj):
        h = self._get_latest_history(obj)
        return h.created_at.isoformat() if h and h.created_at else None

    def get_updated_at(self, obj):
        h = self._get_latest_history(obj)
        return h.updated_at.isoformat() if h and h.updated_at else None

    def get_photo_id(self, obj):
        if hasattr(obj, 'get_primary_image'):
            img = obj.get_primary_image()
            return img.id if img else None
        return None

    def get_photo_base64(self, obj):
        if hasattr(obj, 'get_primary_image'):
            img = obj.get_primary_image()
            return img.image_base64 if img else None
        return None

    def get_visitor_image(self, obj):
        return self.get_photo_base64(obj)

    class Meta:
        strict = True


class VisitorListSchema(Schema):
    """Paginated visitor list response."""
    page = fields.Integer()
    limit = fields.Integer()
    total = fields.Integer()
    visitors = fields.Nested(VisitorResponseSchema, many=True)

    class Meta:
        strict = True


class VisitorHistoryResponseSchema(Schema):
    """Schema for a single VisitorHistoryDetails record."""
    id = fields.String()
    visitor_id = fields.String()
    organization_id = fields.String()
    visitor_type = fields.String()
    host_name = fields.String(allow_none=True)
    host_number = fields.String(allow_none=True)
    purpose_of_visit = fields.String()
    allowed_floor = fields.String()
    allowed_tower = fields.String(allow_none=True)
    current_floor = fields.String(allow_none=True)
    from_date = fields.Date(allow_none=True)
    to_date = fields.Date(allow_none=True)
    check_in_time = fields.DateTime(allow_none=True)
    check_out_time = fields.DateTime(allow_none=True)
    is_checked_in = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    class Meta:
        strict = True


class VisitorMovementLogSchema(Schema):
    """Schema for visitor movement log records."""
    id = fields.String()
    visitor_id = fields.String()
    floor = fields.String()
    entry_time = fields.DateTime()
    exit_time = fields.DateTime(allow_none=True)
    created_at = fields.DateTime()

    class Meta:
        strict = True


class VisitorAlertSchema(Schema):
    """
    Schema for visitor alert records.

    `visitor_name` and `mobile_number` are NOT columns on VisitorAlert —
    they must be joined/populated by the service or route before serialisation.
    Use `fields.Method` so they can safely return None when absent.
    """
    id = fields.String()
    visitor_id = fields.String()
    organization_id = fields.String()
    alert_type = fields.String()
    current_floor = fields.String()
    allowed_floor = fields.String()
    alert_time = fields.DateTime()
    acknowledged = fields.Boolean()
    acknowledged_at = fields.DateTime(allow_none=True)
    details = fields.Raw(allow_none=True)

    # Populated via join in the service layer (not native model columns)
    visitor_name = fields.Method('get_visitor_name', dump_only=True)
    mobile_number = fields.Method('get_mobile_number', dump_only=True)

    created_at = fields.DateTime()

    def get_visitor_name(self, obj):
        # Expects obj.visitor (backref from OrganizationVisitor)
        if hasattr(obj, 'visitor') and obj.visitor:
            return obj.visitor.name
        return None

    def get_mobile_number(self, obj):
        if hasattr(obj, 'visitor') and obj.visitor:
            return obj.visitor.phone
        return None

    class Meta:
        strict = True


class CheckInSchema(Schema):
    """Schema for check-in floor update request."""
    current_floor = fields.String()

    class Meta:
        strict = True
