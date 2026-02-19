"""
Marshmallow schemas for unified platform alerts.
"""

from marshmallow import Schema, fields


class AlertCreateSchema(Schema):
    """
    Create schema used at insertion time (DS/Backend).
    NOTE: handling fields are intentionally excluded.
    """
    organization_id = fields.String(required=True)
    visitor_id = fields.String(required=True)
    camera_id = fields.String(required=True)

    alert_type = fields.String(required=True)
    alert_time = fields.DateTime(allow_none=True)  # optional; DB default will be used if absent
    annotated_image_base64 = fields.String(allow_none=True)

    class Meta:
        strict = True


class AlertHandleSchema(Schema):
    """
    Update schema used after alert is handled by a user from the UI.
    """
    alert_status = fields.String(required=True)   # "handled" or "yet_to_handle"
    handled_by = fields.String(required=True)     # user id
    handled_at = fields.DateTime(allow_none=True) # optional; server can set now()

    class Meta:
        strict = True


class AlertResponseSchema(Schema):
    """Response schema"""
    id = fields.String()
    organization_id = fields.String()
    visitor_id = fields.String()
    camera_id = fields.String()

    alert_type = fields.String()
    alert_time = fields.DateTime()
    annotated_image_base64 = fields.String(allow_none=True)

    alert_status = fields.String()
    handled_by = fields.String(allow_none=True)
    handled_at = fields.DateTime(allow_none=True)

    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    class Meta:
        strict = True


class AlertListSchema(Schema):
    """Paginated list response"""
    page = fields.Integer()
    limit = fields.Integer()
    total = fields.Integer()
    alerts = fields.Nested(AlertResponseSchema, many=True)

    class Meta:
        strict = True
