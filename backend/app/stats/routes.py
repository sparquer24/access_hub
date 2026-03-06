# app/stats/routes.py
from flask import Blueprint, jsonify, request
from flasgger import swag_from
from ..middleware import require_login
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
# Import models used for analytics
from ..models import (
    Organization,
    Employee,
    FaceEmbedding,
    PresenceEvent,
    Camera,
)
# Legacy visitor models live in app/models.py and are available as module-level names
from .. import models as legacy_models
from ..extensions import db
from sqlalchemy import func
from sqlalchemy.exc import ProgrammingError
from ..services.attendance_service import AttendanceService

bp = Blueprint("stats", __name__)


@bp.get("/api/stats/visitors/count")
@jwt_required()
def visitor_count():
    """
    Get total visitor count (legacy)
    ---
    tags:
      - Statistics
    security:
      - Bearer: []
      - SessionCookie: []
    responses:
      200:
        description: Total visitor count
        schema:
          type: object
          properties:
            count:
              type: integer
              example: 500
              description: Total number of registered visitors
      401:
        description: Unauthorized - Authentication required
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Unauthorized"
    """
    VisitorDetails = getattr(legacy_models, "VisitorDetails", None)
    if VisitorDetails is None:
        return jsonify({"count": 0}), 200

    total = db.session.query(func.count(VisitorDetails.aadhaar_id)).scalar() or 0
    return jsonify({"count": int(total)}), 200


@bp.get("/api/stats/overview")
@jwt_required()
def stats_overview():
    """
    Get system statistics overview
    ---
    tags:
      - Statistics
    security:
      - Bearer: []
      - SessionCookie: []
    responses:
      200:
        description: Overview statistics
        schema:
          type: object
          properties:
            organizations:
              type: object
              properties:
                total:
                  type: integer
                  example: 5
                active:
                  type: integer
                  example: 4
            employees:
              type: object
              properties:
                total:
                  type: integer
                  example: 100
                active:
                  type: integer
                  example: 95
            face_embeddings:
              type: object
              properties:
                total:
                  type: integer
                  example: 200
                primary:
                  type: integer
                  example: 180
                avg_quality:
                  type: number
                  format: float
                  example: 0.85
            presence_events:
              type: object
              properties:
                total:
                  type: integer
                  example: 5000
                unknown_faces:
                  type: integer
                  example: 50
                anomalies:
                  type: integer
                  example: 10
                pending_reviews:
                  type: integer
                  example: 5
            cameras:
              type: object
              properties:
                total:
                  type: integer
                  example: 10
                online:
                  type: integer
                  example: 8
            visitors:
              type: object
              properties:
                total:
                  type: integer
                  example: 300
      401:
        description: Unauthorized - Invalid or expired token
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
            errorCode:
              type: string
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            success:
              type: boolean
            message:
              type: string
            errorCode:
              type: string
    """
    # Organizations
    try:
        org_total = db.session.query(func.count(Organization.id)).scalar() or 0
        org_active = db.session.query(func.count(Organization.id)).filter(Organization.is_active.is_(True)).scalar() or 0
        print(f"Org total: {org_total}, active: {org_active}")
    except ProgrammingError as e:
        print(f"[stats_overview] Organizations table missing: {e}")
        org_total = org_active = 0
        db.session.rollback()
    
    # Employees
    try:
        emp_total = db.session.query(func.count(Employee.id)).scalar() or 0
        emp_active = db.session.query(func.count(Employee.id)).filter(Employee.is_active.is_(True)).scalar() or 0
    except ProgrammingError as e:
        print(f"[stats_overview] Employees table missing: {e}")
        emp_total = emp_active = 0
        db.session.rollback()

    # Face embeddings
    try:
        face_total = db.session.query(func.count(FaceEmbedding.id)).scalar() or 0
        face_primary = db.session.query(func.count(FaceEmbedding.id)).filter(FaceEmbedding.is_primary.is_(True)).scalar() or 0
        face_avg_quality = db.session.query(func.avg(FaceEmbedding.quality_score)).scalar() or 0.0
    except ProgrammingError as e:
        print(f"[stats_overview] FaceEmbeddings table missing: {e}")
        face_total = face_primary = 0
        face_avg_quality = 0.0
        db.session.rollback()

    # Presence events
    try:
        pe_total = db.session.query(func.count(PresenceEvent.id)).scalar() or 0
        pe_unknown = db.session.query(func.count(PresenceEvent.id)).filter(PresenceEvent.is_unknown_face.is_(True)).scalar() or 0
        pe_anomalies = db.session.query(func.count(PresenceEvent.id)).filter(PresenceEvent.is_anomaly.is_(True)).scalar() or 0
        pe_pending = db.session.query(func.count(PresenceEvent.id)).filter(PresenceEvent.review_status == "pending").scalar() or 0
    except ProgrammingError as e:
        print(f"[stats_overview] PresenceEvents table missing: {e}")
        pe_total = pe_unknown = pe_anomalies = pe_pending = 0
        db.session.rollback()

    # Cameras
    try:
        cam_total = db.session.query(func.count(Camera.id)).scalar() or 0
        cam_online = db.session.query(func.count(Camera.id)).filter(Camera.status == "online").scalar() or 0
    except ProgrammingError as e:
        print(f"[stats_overview] Cameras table missing: {e}")
        cam_total = cam_online = 0
        db.session.rollback()

    # Legacy visitors (if present)
    VisitorDetails = getattr(legacy_models, "VisitorDetails", None)
    visitors_total = 0
    if VisitorDetails is not None:
        try:
            visitors_total = db.session.query(func.count(VisitorDetails.aadhaar_id)).scalar() or 0
        except ProgrammingError as e:
            print(f"[stats_overview] VisitorDetails table missing: {e}")
            visitors_total = 0
            db.session.rollback()

    payload = {
        "organizations": {
            "total": int(org_total),
            "active": int(org_active),
        },
        "employees": {
            "total": int(emp_total),
            "active": int(emp_active),
        },
        "face_embeddings": {
            "total": int(face_total),
            "primary": int(face_primary),
            "avg_quality": float(face_avg_quality) if face_avg_quality is not None else 0.0,
        },
        "presence_events": {
            "total": int(pe_total),
            "unknown_faces": int(pe_unknown),
            "anomalies": int(pe_anomalies),
            "pending_reviews": int(pe_pending),
        },
        "cameras": {
            "total": int(cam_total),
            "online": int(cam_online),
        },
        "visitors": {
            "total": int(visitors_total),
        },
    }

    return jsonify(payload), 200


@bp.get("/api/analytics/attendance")
@jwt_required()
def analytics_attendance():
    """Get attendance analytics for an organization or overall.
    Query params: organization_id, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), department_id, employment_type
    """
    try:
        org_id = request.args.get('organization_id', type=str)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        department_id = request.args.get('department_id')
        employment_type = request.args.get('employment_type')

        # Default to last 7 days if not provided
        if not end_date:
            end_date = datetime.utcnow().date().isoformat()
        if not start_date:
            start_date = (datetime.utcnow().date() - timedelta(days=6)).isoformat()

        filters = {}
        if department_id:
            filters['department_id'] = department_id
        if employment_type:
            filters['employment_type'] = employment_type

        if not org_id:
            return jsonify({ 'success': False, 'message': 'organization_id is required' }), 400

        summary = AttendanceService.get_organization_attendance_summary(org_id, start_date, end_date, filters)
        return jsonify({ 'success': True, 'data': summary }), 200
    except Exception as e:
        import traceback
        print(f"[analytics_attendance] Error: {e}")
        print(f"[analytics_attendance] Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({ 'success': False, 'message': 'Failed to compute analytics', 'error': str(e) }), 500


@bp.get("/api/stats/organization-analytics")
@jwt_required()
def organization_analytics():
    """
    Get organization analytics - overall or for a specific organization
    ---
    tags:
      - Statistics
    security:
      - Bearer: []
      - SessionCookie: []
    parameters:
      - name: organization_id
        in: query
        type: integer
        required: false
        description: Organization ID to get analytics for. If omitted, returns overall stats
        example: 1
    responses:
      200:
        description: Organization analytics
        schema:
          type: object
          properties:
            employees:
              type: object
              properties:
                total:
                  type: integer
                active:
                  type: integer
            cameras:
              type: object
              properties:
                total:
                  type: integer
                online:
                  type: integer
            presence_events:
              type: object
              properties:
                total:
                  type: integer
                unknown_faces:
                  type: integer
                anomalies:
                  type: integer
                pending_reviews:
                  type: integer
            face_embeddings:
              type: object
              properties:
                total:
                  type: integer
                primary:
                  type: integer
                avg_quality:
                  type: number
            visitors:
              type: object
              properties:
                total:
                  type: integer
      401:
        description: Unauthorized
      404:
        description: Organization not found (if organization_id specified)
    """
    organization_id = request.args.get('organization_id', type=int)
    
    # Base queries
    emp_query = db.session.query(func.count(Employee.id))
    emp_active_query = db.session.query(func.count(Employee.id)).filter(Employee.is_active.is_(True))
    cam_query = db.session.query(func.count(Camera.id))
    cam_online_query = db.session.query(func.count(Camera.id)).filter(Camera.status == "online")
    pe_query = db.session.query(func.count(PresenceEvent.id))
    pe_unknown_query = db.session.query(func.count(PresenceEvent.id)).filter(PresenceEvent.is_unknown_face.is_(True))
    pe_anomalies_query = db.session.query(func.count(PresenceEvent.id)).filter(PresenceEvent.is_anomaly.is_(True))
    pe_pending_query = db.session.query(func.count(PresenceEvent.id)).filter(PresenceEvent.review_status == "pending")
    face_query = db.session.query(func.count(FaceEmbedding.id))
    face_primary_query = db.session.query(func.count(FaceEmbedding.id)).filter(FaceEmbedding.is_primary.is_(True))
    face_quality_query = db.session.query(func.avg(FaceEmbedding.quality_score))
    
    # If organization_id specified, filter all queries
    if organization_id:
        # Verify organization exists
        try:
            org = db.session.query(Organization).filter(Organization.id == organization_id).first()
            if not org:
                return jsonify({
                    "success": False,
                    "message": "Organization not found",
                    "errorCode": "organization_not_found"
                }), 404
        except ProgrammingError as e:
            print(f"[organization_analytics] Error checking organization: {e}")
            db.session.rollback()
            return jsonify({
                "success": False,
                "message": "Database error",
                "errorCode": "db_error"
            }), 500
        
        # Apply organization filter
        emp_query = emp_query.filter(Employee.organization_id == organization_id)
        emp_active_query = emp_active_query.filter(Employee.organization_id == organization_id)
        cam_query = cam_query.filter(Camera.organization_id == organization_id)
        cam_online_query = cam_online_query.filter(Camera.organization_id == organization_id)
        pe_query = pe_query.filter(PresenceEvent.organization_id == organization_id)
        pe_unknown_query = pe_unknown_query.filter(PresenceEvent.organization_id == organization_id)
        pe_anomalies_query = pe_anomalies_query.filter(PresenceEvent.organization_id == organization_id)
        pe_pending_query = pe_pending_query.filter(PresenceEvent.organization_id == organization_id)
        face_query = face_query.filter(FaceEmbedding.organization_id == organization_id)
        face_primary_query = face_primary_query.filter(FaceEmbedding.organization_id == organization_id)
        face_quality_query = face_quality_query.filter(FaceEmbedding.organization_id == organization_id)
    
    try:
        emp_total = emp_query.scalar() or 0
        emp_active = emp_active_query.scalar() or 0
        cam_total = cam_query.scalar() or 0
        cam_online = cam_online_query.scalar() or 0
        pe_total = pe_query.scalar() or 0
        pe_unknown = pe_unknown_query.scalar() or 0
        pe_anomalies = pe_anomalies_query.scalar() or 0
        pe_pending = pe_pending_query.scalar() or 0
        face_total = face_query.scalar() or 0
        face_primary = face_primary_query.scalar() or 0
        face_quality = face_quality_query.scalar() or 0.0
    except ProgrammingError as e:
        print(f"[organization_analytics] Error querying stats: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Error retrieving statistics",
            "errorCode": "query_error"
        }), 500
    
    # Legacy visitors
    VisitorDetails = getattr(legacy_models, "VisitorDetails", None)
    visitors_total = 0
    if VisitorDetails is not None:
        try:
            visitor_query = db.session.query(func.count(VisitorDetails.aadhaar_id))
            if organization_id:
                visitor_query = visitor_query.filter(VisitorDetails.organization_id == organization_id)
            visitors_total = visitor_query.scalar() or 0
        except ProgrammingError as e:
            print(f"[organization_analytics] Error querying visitors: {e}")
            db.session.rollback()
            visitors_total = 0
    
    payload = {
        "employees": {
            "total": int(emp_total),
            "active": int(emp_active),
        },
        "cameras": {
            "total": int(cam_total),
            "online": int(cam_online),
        },
        "presence_events": {
            "total": int(pe_total),
            "unknown_faces": int(pe_unknown),
            "anomalies": int(pe_anomalies),
            "pending_reviews": int(pe_pending),
        },
        "face_embeddings": {
            "total": int(face_total),
            "primary": int(face_primary),
            "avg_quality": float(face_quality) if face_quality is not None else 0.0,
        },
        "visitors": {
            "total": int(visitors_total),
        },
    }
    
    if organization_id:
        payload["organization_id"] = organization_id
    else:
        payload["scope"] = "overall"
    
    return jsonify(payload), 200


@bp.get("/api/debug/token")
def debug_token():
    """
    Debug endpoint to verify JWT token
    ---
    tags:
      - Health
    security:
      - Bearer: []
    parameters:
      - name: Authorization
        in: header
        type: string
        required: true
        description: Bearer token to verify
        example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    responses:
      200:
        description: Token is valid
        schema:
          type: object
          properties:
            identity:
              type: string
              example: "user@example.com"
              description: User identity from token
            claims:
              type: object
              description: JWT claims
              properties:
                sub:
                  type: string
                  example: "user@example.com"
                role:
                  type: string
                  example: "SuperAdmin"
                exp:
                  type: integer
                  example: 1703073600
                  description: Token expiration timestamp
      401:
        description: Invalid or expired token
        schema:
          type: object
          properties:
            error:
              type: string
              example: "invalid_or_expired_token"
            detail:
              type: string
              example: "Signature has expired"
    """
    try:
      verify_jwt_in_request()
      identity = get_jwt_identity()
      claims = get_jwt()
      return jsonify({
        "success": True,
        "identity": identity,
        "claims": claims
      }), 200
    except Exception as e:
      print(f"[debug_token] JWT verify failed: {e}")
      return jsonify({
        "success": False,
        "message": "Invalid or expired token",
        "errorCode": "invalid_token",
        "detail": str(e)
      }), 401