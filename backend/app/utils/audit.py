from flask import request, g
from ..models.audit_log import AuditLog
from ..extensions import db
import json

def log_audit(action, entity_type, entity_id, old_values=None, new_values=None):
    """
    Write an audit log entry for security events.
    """
    user_id = getattr(g, 'current_user_id', None)
    org_id = getattr(g, 'current_organization_id', None)
    ip = request.remote_addr if request else None
    ua = request.user_agent.string if request and request.user_agent else None
    entry = AuditLog(
        user_id=user_id,
        organization_id=org_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip,
        user_agent=ua
    )
    db.session.add(entry)
    db.session.commit()
    return entry
