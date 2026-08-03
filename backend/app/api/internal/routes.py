import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from ...models.camera import Camera
from ...models.employee import Employee
from ...models.attendance import AttendanceRecord
from ...models.visitor import OrganizationVisitor
from ...extensions import db, socketio

bp = Blueprint('internal', __name__, url_prefix='/api/internal')


def _require_service_key():
    expected = os.getenv('INTERNAL_SERVICE_KEY', '')
    return expected and request.headers.get('X-Service-Key') == expected


@bp.route('/cameras/by-name', methods=['GET'])
def get_camera_by_name():
    if not _require_service_key():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    name   = request.args.get('name')
    org_id = request.args.get('organization_id')

    if not name or not org_id:
        return jsonify({'success': False, 'message': 'name and organization_id required'}), 400

    camera = Camera.query.filter(
        Camera.name == name,
        Camera.organization_id == org_id,
        Camera.deleted_at == None,
        Camera.is_active == True,
    ).first()

    if not camera:
        return jsonify({'success': False, 'message': f"Camera '{name}' not found"}), 404

    return jsonify({
        'success': True,
        'data': {
            'id':         camera.id,
            'source_url': camera.source_url,
            'name':       camera.name,
            'is_active':  camera.is_active,
        }
    }), 200


@bp.route('/attendance/event', methods=['POST'])
def record_attendance_event():
    if not _require_service_key():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data        = request.get_json(silent=True) or {}
    employee_id = data.get('employee_id')
    event_type  = data.get('event_type')   # CHECK_IN or CHECK_OUT
    ts_str      = data.get('timestamp')
    confidence  = data.get('confidence')

    if not employee_id or event_type not in ('CHECK_IN', 'CHECK_OUT'):
        return jsonify({'success': False, 'message': 'employee_id and event_type (CHECK_IN|CHECK_OUT) required'}), 400

    try:
        event_time = datetime.fromisoformat(ts_str) if ts_str else datetime.utcnow()
    except Exception:
        event_time = datetime.utcnow()

    today    = event_time.date()
    employee = Employee.query.filter_by(id=employee_id, deleted_at=None).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404

    record = AttendanceRecord.query.filter_by(employee_id=employee_id, date=today).first()

    if event_type == 'CHECK_IN':
        if record is None:
            record = AttendanceRecord(
                id=str(uuid.uuid4()),
                employee_id=employee_id,
                organization_id=employee.organization_id,
                date=today,
                check_in_time=event_time,
                status='present',
                review_status='auto_approved',
                face_match_confidence=confidence,
            )
            db.session.add(record)
        elif record.check_in_time is None:
            record.check_in_time = event_time
            if confidence:
                record.face_match_confidence = confidence

    else:  # CHECK_OUT
        if record is None:
            record = AttendanceRecord(
                id=str(uuid.uuid4()),
                employee_id=employee_id,
                organization_id=employee.organization_id,
                date=today,
                check_out_time=event_time,
                status='present',
                review_status='auto_approved',
            )
            db.session.add(record)
        else:
            if record.check_out_time is None or event_time > record.check_out_time:
                record.check_out_time = event_time
                if record.check_in_time:
                    diff = event_time - record.check_in_time
                    record.work_hours = round(diff.total_seconds() / 3600, 2)

    try:
        db.session.commit()
        return jsonify({'success': True, 'message': f'{event_type} recorded for {employee_id}'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/visitor-alert', methods=['POST'])
def record_visitor_alert():
    if not _require_service_key():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data         = request.get_json(silent=True) or {}
    visitor_id   = data.get('visitor_id')
    event_type   = data.get('event_type')   # authorized / unauthorized
    camera_floor = data.get('camera_floor', 'N/A')
    ts_str       = data.get('timestamp')

    if not visitor_id or not event_type:
        return jsonify({'success': False, 'message': 'visitor_id and event_type required'}), 400

    try:
        event_time = datetime.fromisoformat(ts_str) if ts_str else datetime.utcnow()
    except Exception:
        event_time = datetime.utcnow()

    visitor = OrganizationVisitor.query.filter_by(id=visitor_id).first()
    if not visitor:
        return jsonify({'success': False, 'message': 'Visitor not found'}), 404

    org_id        = visitor.organization_id
    allowed_floor = camera_floor if event_type == 'authorized' else 'Restricted'
    alert_id      = str(uuid.uuid4())

    try:
        from sqlalchemy import text
        db.session.execute(text("""
            INSERT INTO visitor_alerts
                (id, visitor_id, organization_id, alert_type, current_floor, allowed_floor, alert_time, acknowledged, created_at)
            VALUES
                (:id, :visitor_id, :org_id, :alert_type, :current_floor, :allowed_floor, :alert_time, false, :created_at)
        """), {
            'id': alert_id, 'visitor_id': visitor_id, 'org_id': org_id,
            'alert_type': event_type, 'current_floor': camera_floor,
            'allowed_floor': allowed_floor, 'alert_time': event_time,
            'created_at': datetime.utcnow(),
        })
        db.session.commit()

        alert_payload = {
            'id': alert_id, 'organization_id': org_id,
            'visitor_id': visitor_id, 'visitor_name': visitor.name,
            'alert_type': event_type, 'alert_time': event_time.isoformat(),
            'alert_status': 'yet_to_handle', 'current_floor': camera_floor,
            'allowed_floor': allowed_floor,
        }
        socketio.emit('new_alert', alert_payload, room=f'alerts_{org_id}')
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
