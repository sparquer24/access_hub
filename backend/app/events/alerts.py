"""
WebSocket Events for Real-time Alerts
"""
from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from ..extensions import socketio

# Store connected clients
connected_clients = {}
authenticated_clients = {}
ORG_ID_REQUIRED_MESSAGE = 'organization_id is required'


def _normalize_role_name(role):
    raw = str(role or '').strip().lower()
    normalized = raw.replace('-', '_').replace(' ', '_')
    compact = normalized.replace('_', '')

    if compact in {'orgadmin', 'organizationadmin'}:
        return 'org_admin'
    if compact in {'superadmin', 'superadministrator'}:
        return 'super_admin'
    return normalized


def _extract_auth_payload(auth):
    if not isinstance(auth, dict):
        return None

    token = auth.get('token')
    if not token and auth.get('Authorization'):
        token = auth.get('Authorization')

    if not token or not isinstance(token, str):
        return None

    if token.lower().startswith('bearer '):
        token = token[7:]

    if not token:
        return None

    try:
        decoded = decode_token(token)
    except Exception:
        return None

    role = _normalize_role_name(decoded.get('role'))
    organization_id = decoded.get('organization_id')
    user_id = decoded.get('user_id') or decoded.get('sub')

    return {
        'user_id': user_id,
        'role': role,
        'organization_id': organization_id,
    }


@socketio.on('connect')
def handle_connect(auth=None):
    """Handle client connection"""
    auth_payload = _extract_auth_payload(auth)
    if auth_payload:
        authenticated_clients[request.sid] = auth_payload
        print(f"Client connected: {request.sid}, role={auth_payload.get('role')}, org={auth_payload.get('organization_id')}")
    else:
        authenticated_clients[request.sid] = None
        print(f'Client connected without valid auth: {request.sid}')

    emit('connected', {'status': 'connected', 'sid': request.sid})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f'Client disconnected: {request.sid}')
    # Remove from any rooms
    for org_id in connected_clients:
        if request.sid in connected_clients[org_id]:
            connected_clients[org_id].remove(request.sid)
            leave_room(f'org_{org_id}')
    authenticated_clients.pop(request.sid, None)


def _is_org_admin_for_org(org_id):
    auth_payload = authenticated_clients.get(request.sid)
    if not auth_payload:
        emit('error', {'message': 'Authentication required for alert subscriptions'})
        return False

    if _normalize_role_name(auth_payload.get('role')) != 'org_admin':
        emit('error', {'message': 'Only org_admin users can subscribe to alert notifications'})
        return False

    token_org_id = auth_payload.get('organization_id')
    if token_org_id and str(token_org_id) != str(org_id):
        emit('error', {'message': 'Organization mismatch for alert subscription'})
        return False

    return True


@socketio.on('join_organization')
def handle_join_organization(data):
    """
    Join an organization room to receive alerts for that organization
    
    Expected data: { organization_id: 'uuid' }
    """
    payload = data if isinstance(data, dict) else {}
    org_id = payload.get('organization_id')
    if not org_id:
        emit('error', {'message': ORG_ID_REQUIRED_MESSAGE})
        return

    if not _is_org_admin_for_org(org_id):
        return
    
    # Join the organization room
    join_room(f'org_{org_id}')
    
    # Track connected clients
    if org_id not in connected_clients:
        connected_clients[org_id] = []
    connected_clients[org_id].append(request.sid)
    
    print(f'Client {request.sid} joined organization room: {org_id}')
    emit('joined', {'organization_id': org_id, 'status': 'success'})


@socketio.on('leave_organization')
def handle_leave_organization(data):
    """
    Leave an organization room
    
    Expected data: { organization_id: 'uuid' }
    """
    payload = data if isinstance(data, dict) else {}
    org_id = payload.get('organization_id')
    if not org_id:
        emit('error', {'message': ORG_ID_REQUIRED_MESSAGE})
        return
    
    # Leave the organization room
    leave_room(f'org_{org_id}')
    
    # Remove from tracking
    if org_id in connected_clients and request.sid in connected_clients[org_id]:
        connected_clients[org_id].remove(request.sid)
    
    print(f'Client {request.sid} left organization room: {org_id}')
    emit('left', {'organization_id': org_id, 'status': 'success'})


@socketio.on('subscribe_alerts')
def handle_subscribe_alerts(data):
    """
    Subscribe to real-time alerts for a specific organization
    
    Expected data: { organization_id: 'uuid' }
    """
    payload = data if isinstance(data, dict) else {}
    org_id = payload.get('organization_id')
    if not org_id:
        emit('error', {'message': ORG_ID_REQUIRED_MESSAGE})
        return

    if not _is_org_admin_for_org(org_id):
        return
    
    # Join organization room
    join_room(f'alerts_{org_id}')
    
    print(f'Client {request.sid} subscribed to alerts for organization: {org_id}')
    emit('subscribed', {'organization_id': org_id, 'status': 'success'})


def emit_new_alert(alert):
    """
    Emit a new alert to all clients subscribed to the organization's alerts
    
    Call this function when a new alert is created
    
    Args:
        alert: Alert object
    """
    org_id = alert.organization_id
    
    # Get visitor info if available
    visitor_name = None
    if hasattr(alert, 'visitor') and alert.visitor:
        visitor_name = alert.visitor.name
    
    alert_data = {
        'id': alert.id,
        'organization_id': org_id,
        'visitor_id': alert.visitor_id,
        'visitor_name': visitor_name,
        'alert_type': alert.alert_type,
        'alert_time': alert.alert_time.isoformat() if alert.alert_time else None,
        'alert_status': alert.alert_status,
        'current_floor': getattr(alert, 'current_floor', None),
        'allowed_floor': getattr(alert, 'allowed_floor', None),
        'details': getattr(alert, 'details', None)
    }
    
    # Emit to all clients in the organization's alert room
    socketio.emit('new_alert', alert_data, room=f'alerts_{org_id}')
    print(f'Emitted new alert {alert.id} to organization {org_id}')


def emit_alert_handled(alert):
    """
    Emit an alert update when an alert is handled/acknowledged
    
    Call this function when an alert is acknowledged
    
    Args:
        alert: Alert object
    """
    org_id = alert.organization_id
    
    alert_data = {
        'id': alert.id,
        'organization_id': org_id,
        'alert_status': alert.alert_status,
        'handled_by': alert.handled_by,
        'handled_at': alert.handled_at.isoformat() if alert.handled_at else None
    }
    
    # Emit to all clients in the organization's alert room
    socketio.emit('alert_handled', alert_data, room=f'alerts_{org_id}')
    print(f'Emitted alert handled {alert.id} to organization {org_id}')


def emit_visitor_checkin(organization_id, visitor_data):
    """
    Emit a visitor check-in event
    
    Args:
        organization_id: Organization ID
        visitor_data: Dict with visitor information
    """
    socketio.emit('visitor_checkin', visitor_data, room=f'alerts_{organization_id}')
    print(f'Emitted visitor checkin to organization {organization_id}')


def emit_visitor_checkout(organization_id, visitor_data):
    """
    Emit a visitor check-out event
    
    Args:
        organization_id: Organization ID
        visitor_data: Dict with visitor information
    """
    socketio.emit('visitor_checkout', visitor_data, room=f'alerts_{organization_id}')
    print(f'Emitted visitor checkout to organization {organization_id}')
