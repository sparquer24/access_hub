"""
WebSocket Events Module
"""
from flask import Blueprint

# Create a blueprint for events (needed for proper registration)
bp = Blueprint('events', __name__)

# Import and register alert event handlers
from .alerts import (
    handle_connect,
    handle_disconnect,
    handle_join_organization,
    handle_leave_organization,
    handle_subscribe_alerts,
    emit_new_alert,
    emit_alert_handled,
    emit_visitor_checkin,
    emit_visitor_checkout
)

__all__ = [
    'bp',
    'handle_connect',
    'handle_disconnect',
    'handle_join_organization',
    'handle_leave_organization',
    'handle_subscribe_alerts',
    'emit_new_alert',
    'emit_alert_handled',
    'emit_visitor_checkin',
    'emit_visitor_checkout'
]
