import os
from flask import Blueprint, request, jsonify
from ...models.camera import Camera

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
