"""
Subscription Management API Routes
Handles subscription plan management and access control
"""

from flask import Blueprint, request, jsonify, g
from typing import Dict, Any

from ...extensions import db
from ...models import Organization
from ...constants.subscription_plans import (
    SubscriptionTier, SUBSCRIPTION_PLANS, get_plan_config, get_accessible_tabs
)
from ...middleware.subscription_middleware import get_subscription_status
from ...middleware.auth_middleware import require_auth, require_role


bp = Blueprint("subscriptions", __name__)


@bp.route("/api/subscriptions/plans", methods=["GET"])
def get_subscription_plans():
    """
    Get all available subscription plans
    ---
    tags:
      - Subscriptions
    responses:
      200:
        description: All subscription plans retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              properties:
                plans:
                  type: array
                  items:
                    type: object
                    properties:
                      tier:
                        type: string
                        enum: [free, starter, professional, enterprise]
                      name:
                        type: string
                      description:
                        type: string
                      price:
                        type: number
                      currency:
                        type: string
                      features:
                        type: array
                        items:
                          type: string
                      limits:
                        type: object
            message:
              type: string
    """
    plans = []
    
    for tier, config in SUBSCRIPTION_PLANS.items():
        plan_data = {
            "tier": tier.value,
            "name": config["name"],
            "description": config["description"],
            "price": config["price"],
            "currency": config["currency"],
            "billing_cycle": config["billing_cycle"],
            "features": [f.value for f in config["features"]],
            "limits": config["limits"],
            "ui_display": config["ui_display"]
        }
        plans.append(plan_data)
    
    return jsonify({
        "success": True,
        "data": {"plans": plans},
        "message": "Subscription plans retrieved successfully"
    })


@bp.route("/api/subscriptions/organization/<string:org_id>/status", methods=["GET"])
@require_auth
@require_role(['super_admin', 'org_admin'])
def get_organization_subscription_status(org_id: str):
    """
    Get subscription status for an organization
    ---
    tags:
      - Subscriptions
    security:
      - Bearer: []
    parameters:
      - in: path
        name: org_id
        type: string
        required: true
        description: Organization ID
    responses:
      200:
        description: Subscription status retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
              properties:
                tier:
                  type: string
                status:
                  type: string
                renewal_date:
                  type: string
                  format: date
                features_enabled:
                  type: array
                  items:
                    type: string
      403:
        description: Access denied (not authorized for this organization)
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Organization not found
        schema:
          $ref: '#/definitions/Error'
    """
    
    # Check access: super_admin can access any org, org_admin only their own
    if g.user_role != 'super_admin' and g.organization_id != org_id:
        return jsonify({
            "success": False,
            "message": "Access denied",
            "error_code": "ACCESS_DENIED"
        }), 403
    
    status = get_subscription_status(org_id)
    
    if "error" in status:
        return jsonify({
            "success": False,
            "message": status["error"],
            "error_code": "ORGANIZATION_NOT_FOUND"
        }), 404
    
    return jsonify({
        "success": True,
        "data": status,
        "message": "Subscription status retrieved successfully"
    })


@bp.route("/api/subscriptions/organization/<string:org_id>/upgrade", methods=["POST"])
@require_auth
@require_role(['super_admin'])
def upgrade_organization_subscription(org_id: str):
    """
    Upgrade organization subscription (Super Admin only)
    ---
    tags:
      - Subscriptions
    security:
      - Bearer: []
    parameters:
      - in: path
        name: org_id
        type: string
        required: true
        description: Organization ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - subscription_tier
          properties:
            subscription_tier:
              type: string
              enum: [free, starter, professional, enterprise]
              description: New subscription tier
            effective_date:
              type: string
              format: date
              description: Date upgrade becomes effective (optional)
    responses:
      200:
        description: Subscription upgraded successfully
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
              properties:
                previous_tier:
                  type: string
                new_tier:
                  type: string
                effective_date:
                  type: string
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
      403:
        description: Only super admin can upgrade subscriptions
        schema:
          $ref: '#/definitions/Error'
    """
    
    data = request.get_json()
    new_tier = data.get('subscription_tier')
    
    if not new_tier:
        return jsonify({
            "success": False,
            "message": "subscription_tier is required",
            "error_code": "MISSING_SUBSCRIPTION_TIER"
        }), 400
    
    # Validate tier
    try:
        tier_enum = SubscriptionTier(new_tier)
    except ValueError:
        return jsonify({
            "success": False,
            "message": f"Invalid subscription tier: {new_tier}",
            "error_code": "INVALID_SUBSCRIPTION_TIER"
        }), 400
    
    # Get organization
    org = Organization.query.filter_by(id=org_id).first()
    if not org:
        return jsonify({
            "success": False,
            "message": "Organization not found",
            "error_code": "ORGANIZATION_NOT_FOUND"
        }), 404
    
    old_tier = org.subscription_tier
    org.subscription_tier = new_tier
    
    try:
        db.session.commit()
        
        # Log the change (you can add audit logging here)
        # audit_log = AuditLog(...)
        
        return jsonify({
            "success": True,
            "data": {
                "organization_id": org_id,
                "old_tier": old_tier,
                "new_tier": new_tier,
                "plan_config": get_plan_config(tier_enum)
            },
            "message": f"Organization subscription upgraded to {tier_enum.value}"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to upgrade subscription: {str(e)}",
            "error_code": "UPGRADE_FAILED"
        }), 500


@bp.route("/api/subscriptions/organization/<string:org_id>/accessible-tabs", methods=["GET"])
@require_auth
def get_organization_accessible_tabs(org_id: str):
    """Get accessible tabs for an organization based on subscription"""
    
    # Check access
    if g.user_role != 'super_admin' and g.organization_id != org_id:
        return jsonify({
            "success": False,
            "message": "Access denied",
            "error_code": "ACCESS_DENIED"
        }), 403
    
    org = Organization.query.filter_by(id=org_id).first()
    if not org:
        return jsonify({
            "success": False,
            "message": "Organization not found",
            "error_code": "ORGANIZATION_NOT_FOUND"
        }), 404
    
    try:
        tier = SubscriptionTier(org.subscription_tier)
    except ValueError:
        tier = SubscriptionTier.FREE
    
    accessible_tabs = get_accessible_tabs(tier)
    plan_config = get_plan_config(tier)
    
    return jsonify({
        "success": True,
        "data": {
            "organization_id": org_id,
            "subscription_tier": tier.value,
            "accessible_tabs": accessible_tabs,
            "plan_name": plan_config["name"]
        },
        "message": "Accessible tabs retrieved successfully"
    })


@bp.route("/api/subscriptions/features/<string:feature>/check", methods=["POST"])
@require_auth
def check_feature_access():
    """Check if current user's organization has access to a feature"""
    
    data = request.get_json()
    feature_key = data.get('feature')
    
    if not feature_key:
        return jsonify({
            "success": False,
            "message": "feature is required",
            "error_code": "MISSING_FEATURE"
        }), 400
    
    # Validate feature
    try:
        from ..constants.subscription_plans import FeatureKey
        feature_enum = FeatureKey(feature_key)
    except ValueError:
        return jsonify({
            "success": False,
            "message": f"Invalid feature: {feature_key}",
            "error_code": "INVALID_FEATURE"
        }), 400
    
    organization_id = g.organization_id
    
    from ..middleware.subscription_middleware import check_subscription_access
    has_access, error_info = check_subscription_access(organization_id, feature_enum)
    
    if has_access:
        return jsonify({
            "success": True,
            "data": {"has_access": True},
            "message": "Feature access granted"
        })
    else:
        return jsonify({
            "success": False,
            "message": error_info["message"],
            "error_code": error_info["error_code"],
            "data": {
                "has_access": False,
                **error_info.get("subscription_info", {})
            }
        }), 403


@bp.route("/api/subscriptions/usage-summary", methods=["GET"])
@require_auth
def get_usage_summary():
    """Get usage summary for current user's organization"""
    
    organization_id = g.organization_id
    status = get_subscription_status(organization_id)
    
    if "error" in status:
        return jsonify({
            "success": False,
            "message": status["error"],
            "error_code": "ORGANIZATION_NOT_FOUND"
        }), 404
    
    # Create simplified usage summary
    usage_summary = {
        "plan_name": status["plan_name"],
        "subscription_tier": status["subscription_tier"],
        "usage_items": []
    }
    
    limits = status["limits"]
    current_usage = status["current_usage"]
    usage_percentages = status["usage_percentages"]
    
    for key, limit in limits.items():
        if key in current_usage:
            current = current_usage[key]
            percentage = usage_percentages[key]
            
            usage_item = {
                "key": key,
                "name": key.replace('_', ' ').title(),
                "current": current,
                "limit": limit if limit != -1 else "Unlimited",
                "percentage": percentage,
                "is_near_limit": percentage >= 80,
                "is_exceeded": percentage >= 100
            }
            usage_summary["usage_items"].append(usage_item)
    
    return jsonify({
        "success": True,
        "data": usage_summary,
        "message": "Usage summary retrieved successfully"
    })