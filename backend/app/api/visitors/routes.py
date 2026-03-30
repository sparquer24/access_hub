from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
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
    VisitorMovementLogSchema
)
from ...services.visitor_service import VisitorService
from ...middlewares.rbac_middleware import require_permission
from ...models import OrganizationVisitor, VisitorHistoryDetails, VisitorMovementLog
from ...extensions import db, socketio

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
            - name
            - phone
            - purpose_of_visit
          properties:
            name:
              type: string
              example: "John Doe"
            phone:
              type: string
              example: "6301424989"
            email:
              type: string
              example: "john@example.com"
            gender:
              type: string
              example: "Male"
            visitor_type:
              type: string
              example: "guest"
            host_name:
              type: string
              example: "Jane Smith"
            host_number:
              type: string
              example: "6301424990"
            purpose_of_visit:
              type: string
              example: "Meeting"
            allowed_location_id:
              type: string
              example: "location-123"
              description: "Location ID (new system, preferred)"
            allowed_floor:
              type: string
              example: "1st Floor"
              description: "Legacy field - use allowed_location_id instead"
            allowed_tower:
              type: string  
              example: "Tower A"
              description: "Legacy field - use allowed_location_id instead"
            from_date:
              type: string
              example: "2024-03-30"
            to_date:
              type: string
              example: "2024-03-30"
            image_base64:
              type: string
              example: "data:image/jpeg;base64,..."
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
        
        # Validate required fields - Updated for new location system
        required_fields = ['name', 'phone', 'purpose_of_visit']
        
        # Check for location field (new system) or legacy floor/tower
        has_location = data.get('allowed_location_id')
        has_legacy = data.get('allowed_floor') and data.get('allowed_tower')
        
        if not (has_location or has_legacy):
            return error_response("Either 'allowed_location_id' (new system) or 'allowed_floor' + 'allowed_tower' (legacy) must be provided", 400)
        
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
    Check out a visitor
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
      - name: history_id
        in: path
        type: string
        required: true
        description: Visit history ID
    responses:
      200:
        description: Visitor checked out successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor checked out successfully"
      401:
        description: Unauthorized
      404:
        description: History not found
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
    Get all currently active (checked-in) visitors for the organization
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
        description: Active visitors retrieved successfully
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
                properties:
                  history_id:
                    type: string
                  visitor_id:
                    type: string
                  name:
                    type: string
                  phone:
                    type: string
                  check_in_time:
                    type: string
                    format: date-time
      401:
        description: Unauthorized
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
    Get all visitor alerts for the organization
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
      - name: unacknowledged_only
        in: query
        type: boolean
        description: Only show unacknowledged alerts
      - name: alert_type
        in: query
        type: string
        description: Filter by alert type (floor_violation, overstay, etc.)
      - name: date_from
        in: query
        type: string
        format: date
        description: Filter by start date (YYYY-MM-DD)
      - name: date_to
        in: query
        type: string
        format: date
        description: Filter by end date (YYYY-MM-DD)
      - name: limit
        in: query
        type: integer
        default: 50
        description: Number of results per page
      - name: offset
        in: query
        type: integer
        default: 0
        description: Pagination offset
    responses:
      200:
        description: Alerts retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              properties:
                alerts:
                  type: array
                total:
                  type: integer
      401:
        description: Unauthorized
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
        if isinstance(alerts, list):
            for alert in alerts:
                visitor = alert.visitor if hasattr(alert, 'visitor') else None
                alert_data.append({
                    'id': alert.id if hasattr(alert, 'id') else None,
                    'organization_id': alert.organization_id if hasattr(alert, 'organization_id') else None,
                    'visitor_id': alert.visitor_id if hasattr(alert, 'visitor_id') else None,
                    'name': visitor.name if visitor else None,
                    'visitor_phone': visitor.phone if visitor else None,
                    'camera_id': alert.camera_id if hasattr(alert, 'camera_id') else None,
                    'alert_type': alert.alert_type if hasattr(alert, 'alert_type') else None,
                    'alert_time': alert.alert_time.isoformat() if hasattr(alert, 'alert_time') and alert.alert_time else None,
                    'annotated_image_base64': alert.annotated_image_base64 if hasattr(alert, 'annotated_image_base64') else None,
                    'alert_status': alert.alert_status if hasattr(alert, 'alert_status') else None,
                    'handled_by': alert.handled_by if hasattr(alert, 'handled_by') else None,
                    'handled_at': alert.handled_at.isoformat() if hasattr(alert, 'handled_at') and alert.handled_at else None
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
    Get visitor movement logs
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
      - name: visitor_id
        in: query
        type: string
        description: Filter by visitor ID
      - name: floor
        in: query
        type: string
        description: Filter by floor
      - name: date_from
        in: query
        type: string
        format: date
        description: Filter by start date (YYYY-MM-DD)
      - name: date_to
        in: query
        type: string
        format: date
        description: Filter by end date (YYYY-MM-DD)
      - name: limit
        in: query
        type: integer
        default: 50
        description: Number of results per page
      - name: offset
        in: query
        type: integer
        default: 0
        description: Pagination offset
    responses:
      200:
        description: Movement logs retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              properties:
                logs:
                  type: array
                total:
                  type: integer
      401:
        description: Unauthorized
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
        
        result = VisitorService.get_visitor_logs(org_id, filters)
        logs = result.get('logs', [])
        total = result.get('total', 0)
        
        log_data = []
        for log in logs:
            visitor = log.visitor
            log_data.append({
                'id': log.id,
                'visitor_id': log.visitor_id,
                'name': visitor.name if visitor else None,
                'visitor_phone': visitor.phone if visitor else None,
                'tower': log.tower if hasattr(log, 'tower') else None,
                'floor': log.floor,
                'status': log.status if hasattr(log, 'status') else None,
                'entry_time': log.entry_time.isoformat(),
                'exit_time': log.exit_time.isoformat() if log.exit_time else None,
                'created_at': log.created_at.isoformat()
            })
        
        return success_response({
            'logs': log_data,
            'total': total,
            'limit': filters['limit'],
            'offset': filters['offset']
        }, 200)
        
    except Exception as e:
        return error_response(str(e), 400)





@bp.route('/<org_id>/visitors/<visitor_id>/history', methods=['GET'])
@jwt_required()
def get_visitor_history(org_id, visitor_id):
    """
    Get complete visit history for a specific visitor
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
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
    responses:
      200:
        description: Visitor history retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              properties:
                visitor:
                  type: object
                history:
                  type: array
                total_visits:
                  type: integer
      401:
        description: Unauthorized
      404:
        description: Visitor not found
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
    Acknowledge/mark as read a specific alert
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
      - name: alert_id
        in: path
        type: string
        required: true
        description: Alert ID
    responses:
      200:
        description: Alert acknowledged successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Alert acknowledged successfully"
      401:
        description: Unauthorized
      404:
        description: Alert not found
    """
    try:
        user_id = get_jwt_identity()
        alert = VisitorService.acknowledge_alert(org_id, alert_id, user_id)
        
        return success_response({
            'message': 'Alert acknowledged successfully'
        }, 200)
        
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors', methods=['GET'])
@jwt_required()
def list_visitors(org_id):
    """
    Get paginated list of all visitors in the organization
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
      - name: page
        in: query
        type: integer
        default: 1
        description: Page number
      - name: per_page
        in: query
        type: integer
        default: 20
        description: Number of items per page
    responses:
      200:
        description: Visitors list retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              properties:
                items:
                  type: array
                total:
                  type: integer
                pages:
                  type: integer
      401:
        description: Unauthorized
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
    Search visitors by name, phone, or email
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
      - name: query
        in: query
        type: string
        required: true
        description: Search query (name, phone, or email)
      - name: limit
        in: query
        type: integer
        default: 10
        description: Maximum number of results
      - name: offset
        in: query
        type: integer
        default: 0
        description: Number of results to skip
    responses:
      200:
        description: Search results retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: array
      401:
        description: Unauthorized
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
        overview = VisitorService.get_visitors_overview(org_id)
        
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
    Get a specific visitor profile
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
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
    responses:
      200:
        description: Visitor profile retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
      401:
        description: Unauthorized
      404:
        description: Visitor not found
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
    Update visitor profile data
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
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            phone:
              type: string
            email:
              type: string
            gender:
              type: string
    responses:
      200:
        description: Visitor updated successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
      401:
        description: Unauthorized
      404:
        description: Visitor not found
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
    Delete a visitor record
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
      - name: visitor_id
        in: path
        type: string
        required: true
        description: Visitor ID
    responses:
      200:
        description: Visitor deleted successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Visitor deleted successfully"
      401:
        description: Unauthorized
      404:
        description: Visitor not found
    """
    try:
        VisitorService.delete_visitor(org_id, visitor_id)
        return success_response(None, "Visitor deleted successfully", 200)
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/analytics', methods=['GET'])
@jwt_required()
def get_visitor_analytics(org_id):
    """
    Get visitor analytics for dashboard charts
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
      - name: period
        in: query
        type: string
        enum: ['monthly', 'weekly', 'hourly']
        default: monthly
        description: Analytics period
    responses:
      200:
        description: Analytics data retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              description: Analytics data based on period parameter
      400:
        description: Invalid period parameter
      401:
        description: Unauthorized
      404:
        description: Organization not found
    """
    try:
        period = request.args.get('period', 'monthly')
        
        if period not in ['monthly', 'weekly', 'hourly']:
            return error_response("Invalid period. Must be 'monthly', 'weekly', or 'hourly'", 400)
        
        analytics = VisitorService.get_visitor_analytics(org_id, period)
        
        return success_response(analytics, 200)
    except Exception as e:
        return error_response(str(e), 400)


@bp.route('/<org_id>/visitors/locations', methods=['GET'])
@jwt_required()
def get_visitor_locations(org_id):
    """
    Get locations organized by tower and floor for visitor registration
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
        description: Locations retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              properties:
                towers:
                  type: array
                  items:
                    type: object
                    properties:
                      name:
                        type: string
                        description: Tower/Building name
                      floors:
                        type: array
                        items:
                          type: object
                          properties:
                            name:
                              type: string
                              description: Floor name
                            locations:
                              type: array
                              items:
                                type: object
                                properties:
                                  id:
                                    type: string
                                  name:
                                    type: string
                                  description:
                                    type: string
      401:
        description: Unauthorized
      404:
        description: Organization not found
    """
    try:
        from ...models.location import Location
        
        # Get all active locations for the organization
        locations = Location.query.filter_by(
            organization_id=org_id,
            is_active=True,
            deleted_at=None
        ).all()
        
        if not locations:
            return success_response({
                "towers": [],
                "locations": []
            }, 200)
        
        # Organize locations by tower and floor
        towers_dict = {}
        all_locations = []
        
        for location in locations:
            location_data = {
                "id": location.id,
                "name": location.name,
                "description": location.description,
                "building": location.building,
                "floor": location.floor,
                "area": location.area,
                "location_type": location.location_type
            }
            all_locations.append(location_data)
            
            # Organize by tower/building
            building_name = location.building or "Default Building"
            floor_name = location.floor or "Ground Floor"
            
            if building_name not in towers_dict:
                towers_dict[building_name] = {}
            
            if floor_name not in towers_dict[building_name]:
                towers_dict[building_name][floor_name] = []
            
            towers_dict[building_name][floor_name].append(location_data)
        
        # Convert to structured format for frontend
        towers = []
        for building_name, floors_dict in towers_dict.items():
            floors = []
            for floor_name, floor_locations in floors_dict.items():
                floors.append({
                    "name": floor_name,
                    "locations": floor_locations
                })
            towers.append({
                "name": building_name,
                "floors": floors
            })
        
        return success_response({
            "items": all_locations,
            "pagination": {
                "page": 1,
                "per_page": 100,
                "total_items": len(all_locations),
                "total_pages": 1,
                "has_next": False,
                "has_prev": False
            }
        }, 200)
        
    except Exception as e:
        return error_response(str(e), 400)
