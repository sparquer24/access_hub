from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...services.lpr_service import lpr_service
from ...schemas.lpr import LPRLogSchema, LPRHotlistSchema, LPRWhitelistSchema
from marshmallow import ValidationError

bp = Blueprint('lpr_bp', __name__)

# Schemas
log_schema = LPRLogSchema()
logs_schema = LPRLogSchema(many=True)
hotlist_schema = LPRHotlistSchema()
hotlist_list_schema = LPRHotlistSchema(many=True)
whitelist_schema = LPRWhitelistSchema()
whitelist_list_schema = LPRWhitelistSchema(many=True)

# --- THE REGISTER (LOGS) ---

@bp.route('/<organization_id>/lpr/logs', methods=['GET'])
@jwt_required()
def get_lpr_logs(organization_id):
    """
    Get LPR logs (Vehicle Register) with pagination and search
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
      - in: query
        name: page
        type: integer
        default: 1
        description: Page number for pagination
      - in: query
        name: per_page
        type: integer
        default: 20
        description: Records per page
      - in: query
        name: search
        type: string
        description: Search by vehicle number/plate
      - in: query
        name: vehicle_number
        type: string
        description: Filter by vehicle number
      - in: query
        name: date
        type: string
        format: date
        description: Filter by date (YYYY-MM-DD)
    responses:
      200:
        description: LPR logs retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: array
              items:
                type: object
            pagination:
              type: object
              properties:
                page:
                  type: integer
                per_page:
                  type: integer
                total:
                  type: integer
                pages:
                  type: integer
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    # Support both 'search' (legacy/generic) and 'vehicle_number' (specific)
    vehicle_number = request.args.get('search', None) or request.args.get('vehicle_number', None)
    date = request.args.get('date', None)
    
    pagination = lpr_service.get_logs(organization_id, page, per_page, vehicle_number, date)
    
    return jsonify({
        'success': True,
        'data': logs_schema.dump(pagination.items),
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200

@bp.route('/<organization_id>/lpr/manual-entry', methods=['POST'])
@jwt_required()
def create_manual_entry(organization_id):
    """
    Create manual vehicle entry log
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - vehicle_number
          properties:
            vehicle_number:
              type: string
              description: Vehicle registration plate
            entry_type:
              type: string
              description: Entry or Exit
            notes:
              type: string
              description: Additional notes
    responses:
      201:
        description: Manual entry created successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
            data:
              type: object
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        data = request.json
        # In a strict implementation, we would use a Schema here to validate
        # For now, passing raw data as per service design
        entry = lpr_service.create_manual_entry(organization_id, data)
        return jsonify({
            'success': True,
            'message': 'Manual entry created successfully',
            'data': log_schema.dump(entry)
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400

@bp.route('/<organization_id>/lpr/stats', methods=['GET'])
@jwt_required()
def get_lpr_stats(organization_id):
    """
    Get LPR Dashboard Statistics
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
    responses:
      200:
        description: LPR statistics retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              properties:
                total_entries:
                  type: integer
                entries_today:
                  type: integer
                unique_vehicles:
                  type: integer
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    stats = lpr_service.get_dashboard_stats(organization_id)
    return jsonify({
        'success': True,
        'data': stats
    }), 200

# --- HOTLIST MANAGEMENT ---

@bp.route('/<organization_id>/lpr/hotlist', methods=['GET'])
@jwt_required()
def get_hotlist(organization_id):
    """
    Get active hotlist entries (flagged vehicles)
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
    responses:
      200:
        description: Hotlist entries retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: array
              items:
                type: object
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    hotlist = lpr_service.get_hotlist(organization_id)
    return jsonify({
        'success': True,
        'data': hotlist_list_schema.dump(hotlist)
    }), 200

@bp.route('/<organization_id>/lpr/hotlist', methods=['POST'])
@jwt_required()
def add_to_hotlist(organization_id):
    """
    Add vehicle to hotlist (flag as suspicious/dangerous)
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - vehicle_number
            - reason
          properties:
            vehicle_number:
              type: string
              description: Vehicle registration plate
            reason:
              type: string
              description: Reason for flagging
            severity:
              type: string
              enum: [low, medium, high]
              description: Security severity level
    responses:
      201:
        description: Vehicle added to hotlist successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
            data:
              type: object
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        data = hotlist_schema.load(request.json)
        entry = lpr_service.add_to_hotlist(organization_id, data)
        return jsonify({
            'success': True,
            'message': 'Vehicle added to hotlist successfully',
            'data': hotlist_schema.dump(entry)
        }), 201
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Validation error', 'errors': err.messages}), 400

@bp.route('/<organization_id>/lpr/hotlist/<entry_id>', methods=['DELETE'])
@jwt_required()
def remove_from_hotlist(organization_id, entry_id):
    """
    Remove vehicle from hotlist (soft delete)
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
      - in: path
        name: entry_id
        type: string
        required: true
        description: Hotlist entry ID
    responses:
      200:
        description: Vehicle removed from hotlist
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    success = lpr_service.remove_from_hotlist(entry_id, organization_id)
    if success:
        return jsonify({'success': True, 'message': 'Vehicle removed from hotlist'}), 200
    return jsonify({'success': False, 'message': 'Entry not found'}), 404

# --- WHITELIST MANAGEMENT ---

@bp.route('/<organization_id>/lpr/whitelist', methods=['GET'])
@jwt_required()
def get_whitelist(organization_id):
    """
    Get active whitelist entries (authorized vehicles)
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
    responses:
      200:
        description: Whitelist entries retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: array
              items:
                type: object
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    whitelist = lpr_service.get_whitelist(organization_id)
    return jsonify({
        'success': True,
        'data': whitelist_list_schema.dump(whitelist)
    }), 200

@bp.route('/<organization_id>/lpr/whitelist', methods=['POST'])
@jwt_required()
def add_to_whitelist(organization_id):
    """
    Add vehicle to whitelist (authorize entry)
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - vehicle_number
          properties:
            vehicle_number:
              type: string
              description: Vehicle registration plate
            owner_name:
              type: string
              description: Vehicle/Company owner name
            access_level:
              type: string
              enum: [standard, vip, restricted]
              description: Access level for the vehicle
            expiry_date:
              type: string
              format: date
              description: Access expiry date (optional)
    responses:
      201:
        description: Vehicle added to whitelist successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
            data:
              type: object
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        data = whitelist_schema.load(request.json)
        entry = lpr_service.add_to_whitelist(organization_id, data)
        return jsonify({
            'success': True,
            'message': 'Vehicle authorized successfully',
            'data': whitelist_schema.dump(entry)
        }), 201
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Validation error', 'errors': err.messages}), 400

@bp.route('/<organization_id>/lpr/whitelist/<entry_id>', methods=['DELETE'])
@jwt_required()
def remove_from_whitelist(organization_id, entry_id):
    """
    Remove vehicle from whitelist (revoke access)
    ---
    tags:
      - LPR (License Plate Recognition)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: organization_id
        type: string
        required: true
        description: Organization ID
      - in: path
        name: entry_id
        type: string
        required: true
        description: Whitelist entry ID
    responses:
      200:
        description: Vehicle access revoked
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
      404:
        $ref: '#/responses/NotFoundError'
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    success = lpr_service.remove_from_whitelist(entry_id, organization_id)
    if success:
        return jsonify({'success': True, 'message': 'Vehicle access revoked'}), 200
    return jsonify({'success': False, 'message': 'Entry not found'}), 404
