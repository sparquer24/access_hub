from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from ...utils.helpers import (
    success_response,
    error_response,
    validate_request,
    get_current_user
)
from ...utils.exceptions import NotFoundError, ForbiddenError, ValidationError
from ...schemas.visitor import (
    VisitorCreateSchema,
    VisitorUpdateSchema,
    VisitorResponseSchema,
    VisitorListSchema,
    VisitorMovementLogSchema,
    VisitorAlertSchema,
)
from ...services.visitor_service import VisitorService
from ...middlewares.rbac_middleware import require_permission
from ...models import OrganizationVisitor, VisitorHistoryDetails, VisitorMovementLog, VisitorAlert
from ...extensions import db

bp = Blueprint('Visitors', __name__, url_prefix='/api/v2/organizations')


@bp.route('/<org_id>/visitors/check-in', methods=['POST'])
@jwt_required()
def check_in_visitor(org_id):
    """
    Check in a visitor
    ---
    tags:
      - Visitors
    security:
      - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - visitor_id
          properties:
            visitor_id:
              type: string
              example: "visitor-uuid-123"
            check_in_location:
              type: string
              example: "Main Gate"
    responses:
      200:
        description: Visitor checked in successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor checked in successfully"
      400:
        description: Invalid request data
      401:
        description: Unauthorized
      404:
        description: Visitor not found
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        # Validate required fields
        required_fields = ['name', 'phone', 'purpose_of_visit', 'allowed_floor']
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return error_response(f"Missing required fields: {', '.join(missing)}", 400)
        
        # Convert date strings to date objects if provided
        if data.get('from_date') and isinstance(data['from_date'], str):
            data['from_date'] = datetime.strptime(data['from_date'], '%Y-%m-%d').date()
        if data.get('to_date') and isinstance(data['to_date'], str):
            data['to_date'] = datetime.strptime(data['to_date'], '%Y-%m-%d').date()
        
        # Check-in the visitor
        visitor, history = VisitorService.check_in_visitor(org_id, data)
        
        return success_response({
            'visitor_id': visitor.id,
            'history_id': history.id,
            'name': visitor.name,
            'phone': visitor.phone,
            'check_in_time': history.check_in_time.isoformat(),
            'message': 'Visitor checked in successfully'
        }, 201)
        
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/<history_id>/check-out', methods=['POST'])
@jwt_required()
def check_out_visitor(org_id, history_id):
    """
    Check-out a visitor.
    """
    try:
        history = VisitorService.check_out_visitor(org_id, history_id)
        
        visitor = history.visitor
        
        return success_response({
            'visitor_id': visitor.id,
            'history_id': history.id,
            'name': visitor.name,
            'phone': visitor.phone,
            'check_in_time': history.check_in_time.isoformat() if history.check_in_time else None,
            'check_out_time': history.check_out_time.isoformat() if history.check_out_time else None,
            'message': 'Visitor checked out successfully'
        }, 200)
        
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/active', methods=['GET'])
@jwt_required()
def get_active_visitors(org_id):
    """
    Get all currently active (checked-in) visitors for the organization.
    """
    try:
        active_records = VisitorService.get_active_visitors(org_id)
        
        active_data = []
        for history in active_records:
            visitor = history.visitor
            active_data.append({
                'history_id': history.id,
                'visitor_id': history.visitor_id,
                'name': visitor.name if visitor else None,
                'phone': visitor.phone if visitor else None,
                'visitor_type': history.visitor_type,
                'purpose_of_visit': history.purpose_of_visit,
                'host_name': history.host_name,
                'allowed_floor': history.allowed_floor,
                'check_in_time': history.check_in_time.isoformat() if history.check_in_time else None,
                'is_checked_in': history.is_checked_in
            })
            
        return success_response(active_data, 200)
        
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/alerts', methods=['GET'])
@jwt_required()
def get_alerts(org_id):
    """
    Get all visitor alerts for the organization.
    
    Query Parameters:
    - unacknowledged_only: boolean (optional) - Only show unacknowledged alerts
    - alert_type: string (optional) - Filter by alert type (floor_violation, overstay, etc.)
    - date_from: date (optional) - Filter by start date (YYYY-MM-DD)
    - date_to: date (optional) - Filter by end date (YYYY-MM-DD)
    - limit: integer (optional, default=50) - Number of results per page
    - offset: integer (optional, default=0) - Pagination offset
    """
    try:
        # Build filters from query parameters
        filters = {}
        
        if request.args.get('unacknowledged_only') == 'true':
            filters['unacknowledged_only'] = True
        
        if request.args.get('alert_type'):
            filters['alert_type'] = request.args.get('alert_type')
        
        if request.args.get('date_from'):
            try:
                filters['date_from'] = datetime.strptime(
                    request.args.get('date_from'), '%Y-%m-%d'
                )
            except ValueError:
                return error_response("Invalid date format for date_from. Use YYYY-MM-DD", 400)
        
        if request.args.get('date_to'):
            try:
                filters['date_to'] = datetime.strptime(
                    request.args.get('date_to'), '%Y-%m-%d'
                )
            except ValueError:
                return error_response("Invalid date format for date_to. Use YYYY-MM-DD", 400)
        
        filters['limit'] = int(request.args.get('limit', 50))
        filters['offset'] = int(request.args.get('offset', 0))
        
        alerts = VisitorService.get_visitor_alerts(org_id, filters)
        
        alert_data = []
        for alert in alerts:
            visitor = alert.visitor
            alert_data.append({
                'id': alert.id,
                'visitor_id': alert.visitor_id,
                'visitor_name': visitor.name if visitor else None,
                'visitor_phone': visitor.phone if visitor else None,
                'alert_type': alert.alert_type,
                'current_floor': alert.current_floor,
                'allowed_floor': alert.allowed_floor,
                'alert_time': alert.alert_time.isoformat(),
                'acknowledged': alert.acknowledged,
                'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                'details': alert.details
            })
        
        return success_response({
            'alerts': alert_data,
            'total': len(alert_data),
            'limit': filters['limit'],
            'offset': filters['offset']
        }, 200)
        
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/logs', methods=['GET'])
@jwt_required()
def get_logs(org_id):
    """
    Get visitor movement logs.
    
    Query Parameters:
    - visitor_id: string (optional) - Filter by visitor ID
    - floor: string (optional) - Filter by floor
    - date_from: date (optional) - Filter by start date (YYYY-MM-DD)
    - date_to: date (optional) - Filter by end date (YYYY-MM-DD)
    - limit: integer (optional, default=50) - Number of results per page
    - offset: integer (optional, default=0) - Pagination offset
    """
    try:
        # Build filters from query parameters
        filters = {}
        
        if request.args.get('visitor_id'):
            filters['visitor_id'] = request.args.get('visitor_id')
        
        if request.args.get('floor'):
            filters['floor'] = request.args.get('floor')
        
        if request.args.get('date_from'):
            try:
                filters['date_from'] = datetime.strptime(
                    request.args.get('date_from'), '%Y-%m-%d'
                )
            except ValueError:
                return error_response("Invalid date format for date_from. Use YYYY-MM-DD", 400)
        
        if request.args.get('date_to'):
            try:
                filters['date_to'] = datetime.strptime(
                    request.args.get('date_to'), '%Y-%m-%d'
                )
            except ValueError:
                return error_response("Invalid date format for date_to. Use YYYY-MM-DD", 400)
        
        filters['limit'] = int(request.args.get('limit', 50))
        filters['offset'] = int(request.args.get('offset', 0))
        
        logs = VisitorService.get_visitor_logs(org_id, filters)
        
        log_data = []
        for log in logs:
            visitor = log.visitor
            log_data.append({
                'id': log.id,
                'visitor_id': log.visitor_id,
                'visitor_name': visitor.name if visitor else None,
                'visitor_phone': visitor.phone if visitor else None,
                'floor': log.floor,
                'entry_time': log.entry_time.isoformat(),
                'exit_time': log.exit_time.isoformat() if log.exit_time else None,
                'created_at': log.created_at.isoformat()
            })
        
        return success_response({
            'logs': log_data,
            'total': len(log_data),
            'limit': filters['limit'],
            'offset': filters['offset']
        }, 200)
        
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/overview', methods=['GET'])
@jwt_required()
def get_overview(org_id):
    """
    Get visitor management overview statistics.
    
    Returns:
    {
        "active_visitors": 5,
        "total_entries_today": 12,
        "total_visitors": 42,
        "active_alerts": 2,
        "logged_movements": 28,
        "visitor_types_breakdown": {
            "guest": 8,
            "contractor": 3,
            "vendor": 1
        }
    }
    """
    try:
        stats = VisitorService.get_overview_stats(org_id)
        
        return success_response({
            'overview': stats
        }, 200)
        
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/<visitor_id>/history', methods=['GET'])
@jwt_required()
def get_visitor_history(org_id, visitor_id):
    """
    Get complete visit history for a specific visitor.
    """
    try:
        # Get visitor
        visitor = OrganizationVisitor.query.filter_by(
            id=visitor_id,
            organization_id=org_id
        ).first()
        
        if not visitor:
            return error_response("Visitor not found", 404)
        
        # Get history records
        history_records = VisitorService.get_visitor_history(org_id, visitor_id)
        
        history_data = []
        for history in history_records:
            history_data.append({
                'id': history.id,
                'visitor_id': history.visitor_id,
                'visitor_type': history.visitor_type,
                'purpose_of_visit': history.purpose_of_visit,
                'host_name': history.host_name,
                'host_number': history.host_number,
                'allowed_floor': history.allowed_floor,
                'allowed_tower': history.allowed_tower,
                'from_date': history.from_date.isoformat() if history.from_date else None,
                'to_date': history.to_date.isoformat() if history.to_date else None,
                'check_in_time': history.check_in_time.isoformat() if history.check_in_time else None,
                'check_out_time': history.check_out_time.isoformat() if history.check_out_time else None,
                'is_checked_in': history.is_checked_in,
                'current_floor': history.current_floor,
                'created_at': history.created_at.isoformat()
            })
        
        return success_response({
            'visitor': {
                'id': visitor.id,
                'name': visitor.name,
                'phone': visitor.phone,
                'email': visitor.email,
                'gender': visitor.gender
            },
            'history': history_data,
            'total_visits': len(history_data)
        }, 200)
        
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/alerts/<alert_id>/acknowledge', methods=['POST'])
@jwt_required()
def acknowledge_alert(org_id, alert_id):
    """
    Acknowledge/mark as read a specific alert.
    """
    try:
        alert = VisitorService.acknowledge_alert(org_id, alert_id)
        
        visitor = alert.visitor
        
        return success_response({
            'id': alert.id,
            'visitor_id': alert.visitor_id,
            'visitor_name': visitor.name if visitor else None,
            'alert_type': alert.alert_type,
            'acknowledged': alert.acknowledged,
            'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            'message': 'Alert acknowledged successfully'
        }, 200)
        
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors', methods=['GET'])
@jwt_required()
def list_visitors(org_id):
    """
    Get paginated list of all visitors in the organization.
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        pagination = VisitorService.list_visitors(org_id, page, per_page)
        
        # Use our pagination helper
        from ...utils.helpers import paginate
        result = paginate(pagination, page, per_page, VisitorResponseSchema)
        
        return success_response(result, 200)
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/search', methods=['GET'])
@jwt_required()
def search_visitors(org_id):
    """
    Search visitors by name, phone, or email.
    """
    try:
        query = request.args.get('query', '')
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        visitors = VisitorService.search_visitors(org_id, query, limit, offset)
        
        schema = VisitorResponseSchema(many=True)
        return success_response(schema.dump(visitors), 200)
    except Exception as e:
        return error_response(str(e), 400)

@bp.route('/<org_id>/visitors/overview', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitors_overview(org_id):
    """
    Visitors Overview for Dashboard Statistics

    ---
    tags:
        - Visitors
    security:
        - Bearer: []
    parameters:
      - name: org_id
        in: path
        type: string
        required: true
        description: Organization ID
    responses:
      200:
        description: Visitors overview retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitors overview retrieved successfully"
            data:
              type: object
              properties:
                total_visitors:
                  type: integer
                  example: 100
                today_visitors:
                  type: integer
                  example: 10
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          $ref: "#/definitions/Error"
      403:
        description: Forbidden - Insufficient permissions
        schema:
          $ref: "#/definitions/Error"
      404:
        description: Organization not found
        schema:
          $ref: "#/definitions/Error"
      500:
        description: Internal server error
        schema:
          $ref: "#/definitions/Error"
    """
    try:
        user = get_current_user()
        overview = VisitorService.get_visitors_overview(org_id)
        print(overview, '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<')
        
        return success_response(
            data=overview,
            message='Visitors overview retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve visitors overview: {str(e)}', 500)   

@bp.route('/<org_id>/visitors/<visitor_id>', methods=['GET'])
@jwt_required()
def get_visitor(org_id, visitor_id):
    """
    Get a specific visitor profile.
    """
    try:
        visitor = OrganizationVisitor.query.filter_by(
            id=visitor_id, 
            organization_id=org_id
        ).first()
        
        if not visitor:
            return error_response("Visitor not found", 404)
        
        schema = VisitorResponseSchema()
        return success_response(schema.dump(visitor), 200)
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/<visitor_id>', methods=['PUT'])
@jwt_required()
def update_visitor(org_id, visitor_id):
    """
    Update visitor profile data.
    """
    try:
        data = request.get_json()
        visitor = VisitorService.update_visitor(org_id, visitor_id, data)
        
        schema = VisitorResponseSchema()
        return success_response(schema.dump(visitor), 200)
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/<visitor_id>', methods=['DELETE'])
@jwt_required()
def delete_visitor(org_id, visitor_id):
    """
    Delete a visitor record.
    """
    try:
        VisitorService.delete_visitor(org_id, visitor_id)
        return success_response(None, "Visitor deleted successfully", 200)
    except Exception as e:
        return error_response(str(e), 400)


