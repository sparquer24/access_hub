"""
Visitor Management API routes (v2).
Organization-level visitor tracking with movement and alerts.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
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
    VisitorAlertSchema,
    CheckInSchema
)
from ...services.visitor_service import VisitorService
from ...middlewares.rbac_middleware import require_permission

bp = Blueprint('visitors_api', __name__, url_prefix='/api/v2/organizations')


# ==================== VISITOR MANAGEMENT ====================

@bp.route('/<org_id>/visitors', methods=['POST'])
@jwt_required()
@require_permission('visitors:create')
@validate_request(VisitorCreateSchema)
def create_visitor(org_id):
    """
    Create a new visitor for an organization (check-in).
    
    Request body:
    {
        "name": "John Doe",
        "mobile_number": "9876543210",
        "purpose_of_visit": "Meeting",
        "allowed_floor": "Floor 3",
        "image_base64": "data:image/jpeg;base64,..."
    }
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        visitor = VisitorService.create_visitor(org_id, data)
        
        response_schema = VisitorResponseSchema()
        return success_response(
            data=response_schema.dump(visitor),
            message='Visitor checked in successfully',
            status_code=201
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to create visitor: {str(e)}', 500)


@bp.route('/<org_id>/visitors', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def list_visitors(org_id):
    """
    Get all visitors for an organization.
    Query params: 
      - page (default 1)
      - limit (default 10)
      - from_date (optional, format: YYYY-MM-DD, filters by check-in date range start)
      - to_date (optional, format: YYYY-MM-DD, filters by check-in date range end)
    """
    try:
        user = get_current_user()
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        from_date = request.args.get('from_date', None, type=str)
        to_date = request.args.get('to_date', None, type=str)
        
        total, visitors = VisitorService.get_visitors_by_organization(org_id, page, limit, from_date, to_date)
        
        response_schema = VisitorResponseSchema(many=True)
        
        # Format the response data with pagination info
        response_data = {
            'visitors': response_schema.dump(visitors),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit  # Calculate total pages
            }
        }
        
        return success_response(
            data=response_data,
            message='Visitors retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve visitors: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor(org_id, visitor_id):
    """Get a specific visitor by ID"""
    try:
        user = get_current_user()
        visitor = VisitorService.get_visitor(org_id, visitor_id)
        
        response_schema = VisitorResponseSchema()
        return success_response(
            data=response_schema.dump(visitor),
            message='Visitor retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve visitor: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>', methods=['PUT'])
@jwt_required()
@require_permission('visitors:update')
@validate_request(VisitorUpdateSchema)
def update_visitor(org_id, visitor_id):
    """Update visitor information"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        visitor = VisitorService.update_visitor(org_id, visitor_id, data)
        
        response_schema = VisitorResponseSchema()
        return success_response(
            data=response_schema.dump(visitor),
            message='Visitor record updated successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to update visitor: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>', methods=['DELETE'])
@jwt_required()
@require_permission('visitors:delete')
def delete_visitor(org_id, visitor_id):
    """Delete a visitor record"""
    try:
        user = get_current_user()
        VisitorService.delete_visitor(org_id, visitor_id)
        
        return success_response(
            data=None,
            message='Visitor record deleted successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
        return error_response(f'Failed to delete visitor: {str(e)}', 500)

@bp.route('/<org_id>/visitors/stats', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor_stats(org_id):
    """Get Visitor Dashboard Stats"""
    try:
        user = get_current_user()
        stats = VisitorService.get_dashboard_stats(org_id)
        return success_response(
            data=stats,
            message='Visitor stats retrieved successfully',
            status_code=200
        )
    except Exception as e:
        return error_response(f'Failed to retrieve visitor stats: {str(e)}', 500)
    
# ==================== CHECK-IN / CHECK-OUT ====================

@bp.route('/<org_id>/visitors/<visitor_id>/check-in', methods=['POST'])
@jwt_required()
@require_permission('visitors:checkin')
def check_in_visitor(org_id, visitor_id):
    """Check in a visitor"""
    try:
        user = get_current_user()
        data = request.get_json() or {}
        
        visitor = VisitorService.check_in_visitor(org_id, visitor_id, data)
        
        response_schema = VisitorResponseSchema()
        return success_response(
            data=response_schema.dump(visitor),
            message='Visitor checked in successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to check in visitor: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/check-out', methods=['POST'])
@jwt_required()
@require_permission('visitors:checkout')
def check_out_visitor(org_id, visitor_id):
    """Check out a visitor"""
    try:
        user = get_current_user()
        data = request.get_json() or {}
        
        visitor = VisitorService.check_out_visitor(org_id, visitor_id, data)
        
        response_schema = VisitorResponseSchema()
        return success_response(
            data=response_schema.dump(visitor),
            message='Visitor checked out successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to check out visitor: {str(e)}', 500)


# ==================== SEARCH ====================

@bp.route('/<org_id>/visitors/search', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def search_visitors(org_id):
    """
    Search visitors by name, mobile number, or visitor ID.
    Query params: 
    - query (search term, optional - if not provided, returns all visitors)
    - status (optional: checked_in, checked_out, all - default: all)
    - limit (optional: number of records to return - default: 50)
    """
    try:
        user = get_current_user()
        query = request.args.get('query', '').strip()
        status = request.args.get('status', 'all')
        limit = request.args.get('limit', 50, type=int)
        
        visitors = VisitorService.search_visitors(org_id, query, status, limit)
        
        response_schema = VisitorResponseSchema(many=True)
        return success_response(
            data=response_schema.dump(visitors),
            message='Search completed successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to search visitors: {str(e)}', 500)


# ==================== MOVEMENT & TRACKING ====================

@bp.route('/<org_id>/visitors/<visitor_id>/movement', methods=['POST'])
@jwt_required()
@require_permission('visitors:movement')
def log_visitor_movement(org_id, visitor_id):
    """
    Log visitor movement to a floor.
    
    Request body:
    {
        "floor": "Floor 3"
    }
    """
    try:
        user = get_current_user()
        data = request.get_json() or {}
        floor = data.get('floor')
        
        if not floor:
            return error_response('Floor is required', 400)
        
        movement_log, alert = VisitorService.log_visitor_movement(org_id, visitor_id, floor)
        
        response = {
            'movement_log': {
                'id': movement_log.id,
                'floor': movement_log.floor,
                'entry_time': movement_log.entry_time.isoformat()
            }
        }
        
        if alert:
            alert_schema = VisitorAlertSchema()
            response['alert'] = alert_schema.dump(alert)
            response['alert']['visitor_name'] = alert.visitor.name
            response['alert']['mobile_number'] = alert.visitor.mobile_number
        
        return success_response(
            data=response,
            message='Visitor movement logged successfully',
            status_code=201
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to log movement: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/movement', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor_movement(org_id, visitor_id):
    """Get movement logs for a visitor"""
    try:
        user = get_current_user()
        limit = request.args.get('limit', 50, type=int)
        
        logs = VisitorService.get_visitor_movement_logs(org_id, visitor_id, limit)
        
        response = [
            {
                'id': log.id,
                'floor': log.floor,
                'entry_time': log.entry_time.isoformat(),
                'exit_time': log.exit_time.isoformat() if log.exit_time else None
            }
            for log in logs
        ]
        
        return success_response(
            data=response,
            message='Movement logs retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve movement logs: {str(e)}', 500)


# ==================== ALERTS ====================

@bp.route('/<org_id>/visitors/alerts', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_organization_alerts(org_id):
    """
    Get all visitor alerts for an organization.
    Query params: limit (default 100)
    """
    try:
        user = get_current_user()
        limit = request.args.get('limit', 100, type=int)
        
        alerts = VisitorService.get_visitor_alerts(org_id, limit=limit)
        
        alert_schema = VisitorAlertSchema(many=True)
        response_data = alert_schema.dump(alerts)
        
        # Add visitor names and mobile numbers
        for i, alert in enumerate(alerts):
            response_data[i]['visitor_name'] = alert.visitor.name
            response_data[i]['mobile_number'] = alert.visitor.mobile_number
        
        return success_response(
            data=response_data,
            message='Alerts retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve alerts: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/alerts', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor_alerts(org_id, visitor_id):
    """Get alerts for a specific visitor"""
    try:
        user = get_current_user()
        limit = request.args.get('limit', 100, type=int)
        
        alerts = VisitorService.get_visitor_alerts(org_id, visitor_id, limit=limit)
        
        alert_schema = VisitorAlertSchema(many=True)
        response_data = alert_schema.dump(alerts)
        
        for i, alert in enumerate(alerts):
            response_data[i]['visitor_name'] = alert.visitor.name
            response_data[i]['mobile_number'] = alert.visitor.mobile_number
        
        return success_response(
            data=response_data,
            message='Alerts retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve alerts: {str(e)}', 500)


# ==================== ACTIVE VISITORS ====================


@bp.route('/<org_id>/visitors/active', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_active_visitors(org_id):
    """Get currently checked-in visitors"""
    try:
        user = get_current_user()
        visitors = VisitorService.get_active_visitors(org_id)
        
        response_schema = VisitorResponseSchema(many=True)
        return success_response(
            data=response_schema.dump(visitors),
            message='Active visitors retrieved successfully',
            status_code=200
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to retrieve active visitors: {str(e)}', 500)


# ==================== BLACKLIST MANAGEMENT ====================

@bp.route('/<org_id>/visitors/blacklist/check', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def check_blacklist(org_id):
    """Check if visitor is blacklisted"""
    try:
        phone = request.args.get('phone')
        email = request.args.get('email')
        id_proof = request.args.get('id_proof')
        
        is_blacklisted, entry = VisitorService.check_blacklist(org_id, phone, email, id_proof)
        
        return success_response(
            data={
                'is_blacklisted': is_blacklisted,
                'blacklist_entry': entry.to_dict() if entry else None
            },
            message='Blacklist check completed',
            status_code=200
        )
    except Exception as e:
        return error_response(f'Failed to check blacklist: {str(e)}', 500)


@bp.route('/<org_id>/visitors/blacklist', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def add_to_blacklist(org_id):
    """Add visitor to blacklist"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        entry = VisitorService.add_to_blacklist(org_id, data, added_by=user.id)
        
        return success_response(
            data={'id': entry.id},
            message='Visitor added to blacklist successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to add to blacklist: {str(e)}', 500)


@bp.route('/<org_id>/visitors/blacklist', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_blacklist(org_id):
    """Get blacklist entries"""
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        entries = VisitorService.get_blacklist(org_id, active_only)
        
        return success_response(
            data=[{
                'id': e.id,
                'phone_number': e.phone_number,
                'email': e.email,
                'visitor_name': e.visitor_name,
                'reason': e.reason,
                'severity': e.severity,
                'start_date': e.start_date.isoformat() if e.start_date else None,
                'end_date': e.end_date.isoformat() if e.end_date else None
            } for e in entries],
            message='Blacklist retrieved successfully',
            status_code=200
        )
    except Exception as e:
        return error_response(f'Failed to retrieve blacklist: {str(e)}', 500)


@bp.route('/<org_id>/visitors/blacklist/<blacklist_id>', methods=['DELETE'])
@jwt_required()
@require_permission('visitors:write')
def remove_from_blacklist(org_id, blacklist_id):
    """Remove visitor from blacklist"""
    try:
        VisitorService.remove_from_blacklist(org_id, blacklist_id)
        return success_response(message='Visitor removed from blacklist successfully')
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to remove from blacklist: {str(e)}', 500)


# ==================== PRE-REGISTRATION ====================

@bp.route('/<org_id>/visitors/pre-register', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def create_pre_registration(org_id):
    """Create pre-registration request"""
    try:
        data = request.get_json()
        prereg = VisitorService.create_pre_registration(org_id, data)
        
        return success_response(
            data={
                'id': prereg.id,
                'qr_code': prereg.qr_code,
                'status': prereg.status
            },
            message='Pre-registration created successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to create pre-registration: {str(e)}', 500)


@bp.route('/<org_id>/visitors/pre-registrations', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_pre_registrations(org_id):
    """Get pre-registrations"""
    try:
        status = request.args.get('status')
        preregs = VisitorService.get_pre_registrations(org_id, status)
        
        return success_response(
            data=[{
                'id': p.id,
                'visitor_name': p.visitor_name,
                'mobile_number': p.mobile_number,
                'scheduled_arrival_time': p.scheduled_arrival_time.isoformat() if p.scheduled_arrival_time else None,
                'status': p.status,
                'qr_code': p.qr_code
            } for p in preregs],
            message='Pre-registrations retrieved successfully',
            status_code=200
        )
    except Exception as e:
        return error_response(f'Failed to retrieve pre-registrations: {str(e)}', 500)


@bp.route('/<org_id>/visitors/pre-registrations/<prereg_id>/approve', methods=['PUT'])
@jwt_required()
@require_permission('visitors:write')
def approve_pre_registration(org_id, prereg_id):
    """Approve pre-registration"""
    try:
        user = get_current_user()
        prereg = VisitorService.approve_pre_registration(org_id, prereg_id, approved_by=user.id)
        
        return success_response(
            data={'id': prereg.id, 'status': prereg.status},
            message='Pre-registration approved successfully'
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to approve pre-registration: {str(e)}', 500)


@bp.route('/<org_id>/visitors/pre-registrations/<prereg_id>/reject', methods=['PUT'])
@jwt_required()
@require_permission('visitors:write')
def reject_pre_registration(org_id, prereg_id):
    """Reject pre-registration"""
    try:
        data = request.get_json()
        reason = data.get('reason')
        prereg = VisitorService.reject_pre_registration(org_id, prereg_id, reason)
        
        return success_response(
            data={'id': prereg.id, 'status': prereg.status},
            message='Pre-registration rejected successfully'
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to reject pre-registration: {str(e)}', 500)


# ==================== VIP MANAGEMENT ====================

@bp.route('/<org_id>/visitors/vip/<visitor_id>/profile', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def create_vip_profile(org_id, visitor_id):
    """Create or update VIP profile"""
    try:
        data = request.get_json()
        profile = VisitorService.create_vip_profile(org_id, visitor_id, data)
        
        return success_response(
            data={'id': profile.id, 'vip_tier': profile.vip_tier},
            message='VIP profile created successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to create VIP profile: {str(e)}', 500)


@bp.route('/<org_id>/visitors/vip/<visitor_id>/preferences', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_vip_preferences(org_id, visitor_id):
    """Get VIP preferences"""
    try:
        profile = VisitorService.get_vip_preferences(org_id, visitor_id)
        
        if not profile:
            return success_response(data=None, message='No VIP profile found')
        
        return success_response(
            data={
                'vip_tier': profile.vip_tier,
                'preferred_greeting': profile.preferred_greeting,
                'dietary_requirements': profile.dietary_requirements,
                'accessibility_requirements': profile.accessibility_requirements,
                'other_preferences': profile.other_preferences
            },
            message='VIP preferences retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve VIP preferences: {str(e)}', 500)


# ==================== CONTRACTOR TIME TRACKING ====================

@bp.route('/<org_id>/visitors/contractors/<visitor_id>/clock-in', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def contractor_clock_in(org_id, visitor_id):
    """Clock in contractor"""
    try:
        data = request.get_json() or {}
        time_log = VisitorService.contractor_clock_in(org_id, visitor_id, data)
        
        return success_response(
            data={'id': time_log.id, 'clock_in_time': time_log.clock_in_time.isoformat()},
            message='Contractor clocked in successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to clock in contractor: {str(e)}', 500)


@bp.route('/<org_id>/visitors/contractors/<visitor_id>/clock-out', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def contractor_clock_out(org_id, visitor_id):
    """Clock out contractor"""
    try:
        time_log = VisitorService.contractor_clock_out(org_id, visitor_id)
        
        return success_response(
            data={
                'id': time_log.id,
                'clock_out_time': time_log.clock_out_time.isoformat(),
                'billable_hours': time_log.billable_hours
            },
            message='Contractor clocked out successfully'
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to clock out contractor: {str(e)}', 500)


@bp.route('/<org_id>/visitors/contractors/<visitor_id>/timesheet', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_contractor_timesheet(org_id, visitor_id):
    """Get contractor timesheet"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        logs = VisitorService.get_contractor_timesheet(org_id, visitor_id, start_date, end_date)
        
        return success_response(
            data=[{
                'id': log.id,
                'clock_in_time': log.clock_in_time.isoformat(),
                'clock_out_time': log.clock_out_time.isoformat() if log.clock_out_time else None,
                'billable_hours': log.billable_hours,
                'work_description': log.work_description
            } for log in logs],
            message='Timesheet retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve timesheet: {str(e)}', 500)


# ==================== DELIVERY MANAGEMENT ====================

@bp.route('/<org_id>/visitors/deliveries', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def log_delivery(org_id):
    """Log delivery"""
    try:
        data = request.get_json()
        visitor_id = data.get('visitor_id')
        
        delivery = VisitorService.log_delivery(org_id, visitor_id, data)
        
        return success_response(
            data={'id': delivery.id, 'status': delivery.status},
            message='Delivery logged successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to log delivery: {str(e)}', 500)


@bp.route('/<org_id>/visitors/deliveries/<delivery_id>/complete', methods=['PUT'])
@jwt_required()
@require_permission('visitors:write')
def complete_delivery(org_id, delivery_id):
    """Complete delivery"""
    try:
        data = request.get_json()
        signature_data = data.get('signature_data')
        
        delivery = VisitorService.complete_delivery(org_id, delivery_id, signature_data)
        
        return success_response(
            data={'id': delivery.id, 'status': delivery.status},
            message='Delivery completed successfully'
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to complete delivery: {str(e)}', 500)


@bp.route('/<org_id>/visitors/deliveries', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_delivery_logs(org_id):
    """Get delivery logs"""
    try:
        status = request.args.get('status')
        deliveries = VisitorService.get_delivery_logs(org_id, status)
        
        return success_response(
            data=[{
                'id': d.id,
                'package_count': d.package_count,
                'recipient_name': d.recipient_name,
                'status': d.status,
                'created_at': d.created_at.isoformat()
            } for d in deliveries],
            message='Delivery logs retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve delivery logs: {str(e)}', 500)


# ==================== HEALTH SCREENING ====================

@bp.route('/<org_id>/visitors/<visitor_id>/health-screening', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def perform_health_screening(org_id, visitor_id):
    """Perform health screening"""
    try:
        data = request.get_json()
        screening = VisitorService.perform_health_screening(org_id, visitor_id, data)
        
        return success_response(
            data={'id': screening.id, 'result': screening.result},
            message='Health screening completed successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to perform health screening: {str(e)}', 500)


# ==================== DOCUMENT SIGNING ====================

@bp.route('/<org_id>/visitors/<visitor_id>/documents/sign', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def sign_document(org_id, visitor_id):
    """Sign document"""
    try:
        data = request.get_json()
        document = VisitorService.sign_document(org_id, visitor_id, data)
        
        return success_response(
            data={'id': document.id, 'document_type': document.document_type},
            message='Document signed successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to sign document: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/documents', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_signed_documents(org_id, visitor_id):
    """Get signed documents"""
    try:
        documents = VisitorService.get_signed_documents(org_id, visitor_id)
        
        return success_response(
            data=[{
                'id': d.id,
                'document_type': d.document_type,
                'signed_at': d.signed_at.isoformat()
            } for d in documents],
            message='Documents retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve documents: {str(e)}', 500)


# ==================== ASSET TRACKING ====================

@bp.route('/<org_id>/visitors/<visitor_id>/assets', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def register_assets(org_id, visitor_id):
    """Register visitor assets"""
    try:
        data = request.get_json()
        assets_data = data.get('assets', [])
        
        assets = VisitorService.register_assets(org_id, visitor_id, assets_data)
        
        return success_response(
            data={'count': len(assets)},
            message='Assets registered successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to register assets: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/assets/verify', methods=['PUT'])
@jwt_required()
@require_permission('visitors:write')
def verify_assets_on_exit(org_id, visitor_id):
    """Verify assets on exit"""
    try:
        assets = VisitorService.verify_assets_on_exit(org_id, visitor_id)
        
        return success_response(
            data={'verified_count': len(assets)},
            message='Assets verified successfully'
        )
    except Exception as e:
        return error_response(f'Failed to verify assets: {str(e)}', 500)


# ==================== BADGE MANAGEMENT ====================

@bp.route('/<org_id>/visitors/<visitor_id>/badge', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def generate_badge(org_id, visitor_id):
    """Generate visitor badge"""
    try:
        data = request.get_json() or {}
        badge_type = data.get('badge_type', 'standard')
        
        badge = VisitorService.generate_badge(org_id, visitor_id, badge_type)
        
        return success_response(
            data={
                'badge_number': badge.badge_number,
                'qr_code_data': badge.qr_code_data
            },
            message='Badge generated successfully',
            status_code=201
        )
    except Exception as e:
        return error_response(f'Failed to generate badge: {str(e)}', 500)


@bp.route('/<org_id>/visitors/<visitor_id>/badge/return', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def return_badge(org_id, visitor_id):
    """Return visitor badge"""
    try:
        badge = VisitorService.return_badge(org_id, visitor_id)
        
        return success_response(
            message='Badge returned successfully'
        )
    except Exception as e:
        return error_response(f'Failed to return badge: {str(e)}', 500)


# ==================== RECURRING VISITORS ====================

@bp.route('/<org_id>/visitors/recurring', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_recurring_visitors(org_id):
    """Get recurring visitors"""
    try:
        min_frequency = int(request.args.get('min_frequency', 3))
        visitors = VisitorService.get_recurring_visitors(org_id, min_frequency)
        
        response_schema = VisitorResponseSchema(many=True)
        return success_response(
            data=response_schema.dump(visitors),
            message='Recurring visitors retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve recurring visitors: {str(e)}', 500)


@bp.route('/<org_id>/visitors/quick-checkin', methods=['POST'])
@jwt_required()
@require_permission('visitors:write')
def quick_checkin_recurring(org_id):
    """Quick check-in for recurring visitor"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        
        visitor = VisitorService.quick_checkin_recurring(org_id, phone_number)
        
        response_schema = VisitorResponseSchema()
        return success_response(
            data=response_schema.dump(visitor),
            message='Recurring visitor checked in successfully',
            status_code=201
        )
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        return error_response(f'Failed to quick check-in: {str(e)}', 500)


# ==================== ANALYTICS ====================

@bp.route('/<org_id>/visitors/analytics', methods=['GET'])
@jwt_required()
@require_permission('visitors:read')
def get_visitor_analytics(org_id):
    """Get visitor analytics"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        analytics = VisitorService.get_visitor_analytics(org_id, start_date, end_date)
        
        return success_response(
            data=analytics,
            message='Analytics retrieved successfully'
        )
    except Exception as e:
        return error_response(f'Failed to retrieve analytics: {str(e)}', 500)
