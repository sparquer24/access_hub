"""
Subscription-based access control middleware
Validates feature access and usage limits based on organization's subscription tier
"""

from functools import wraps
from flask import request, jsonify, g
from typing import Optional, Dict, Any, List

from ..models import Organization
from ..constants.subscription_plans import (
    SubscriptionTier, FeatureKey, has_feature, get_limit, 
    is_limit_exceeded, get_plan_config
)
from ..extensions import db
from sqlalchemy import func


class SubscriptionError(Exception):
    """Exception raised when subscription access is denied"""
    
    def __init__(self, message: str, required_plan: str = None, current_plan: str = None):
        self.message = message
        self.required_plan = required_plan
        self.current_plan = current_plan
        super().__init__(self.message)


def get_organization_usage(org_id: str) -> Dict[str, int]:
    """Get current usage statistics for an organization"""
    from ..models import Employee, Camera, Location, Department, User
    from datetime import datetime, timedelta
    
    # Get current month's visitor count (implement based on your visitor model)
    current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    usage = {
        "employees": db.session.query(func.count(Employee.id)).filter(
            Employee.organization_id == org_id,
            Employee.deleted_at.is_(None)
        ).scalar() or 0,
        
        "cameras": db.session.query(func.count(Camera.id)).filter(
            Camera.organization_id == org_id,
            Camera.deleted_at.is_(None)
        ).scalar() or 0,
        
        "locations": db.session.query(func.count(Location.id)).filter(
            Location.organization_id == org_id,
            Location.deleted_at.is_(None)
        ).scalar() or 0,
        
        "departments": db.session.query(func.count(Department.id)).filter(
            Department.organization_id == org_id,
            Department.deleted_at.is_(None)
        ).scalar() or 0,
        
        "admin_users": db.session.query(func.count(User.id)).filter(
            User.organization_id == org_id,
            User.role.has(name__in=['super_admin', 'org_admin']),
            User.deleted_at.is_(None)
        ).scalar() or 0,
        
        # Add visitor count logic based on your visitor model
        "visitors_this_month": 0  # TODO: Implement based on your visitor tracking
    }
    
    return usage


def require_feature(feature: FeatureKey):
    """Decorator to require specific feature access"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Get organization from request context (set by auth middleware)
            organization_id = getattr(g, 'organization_id', None)
            if not organization_id:
                return jsonify({
                    "success": False,
                    "message": "Organization context not found",
                    "error_code": "ORGANIZATION_CONTEXT_MISSING"
                }), 400
            
            # Get organization
            org = Organization.query.filter_by(id=organization_id).first()
            if not org:
                return jsonify({
                    "success": False,
                    "message": "Organization not found",
                    "error_code": "ORGANIZATION_NOT_FOUND"
                }), 404
            
            # Check if organization has the required feature
            try:
                tier = SubscriptionTier(org.subscription_tier)
            except ValueError:
                tier = SubscriptionTier.FREE
            
            if not has_feature(tier, feature):
                plan_config = get_plan_config(tier)
                return jsonify({
                    "success": False,
                    "message": f"Feature '{feature.value}' not available in your current plan",
                    "error_code": "FEATURE_NOT_AVAILABLE",
                    "subscription_info": {
                        "current_plan": plan_config["name"],
                        "required_feature": feature.value,
                        "upgrade_required": True
                    }
                }), 403
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


def require_limit(limit_key: str, increment: int = 1):
    """Decorator to check usage limits"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            organization_id = getattr(g, 'organization_id', None)
            if not organization_id:
                return jsonify({
                    "success": False,
                    "message": "Organization context not found",
                    "error_code": "ORGANIZATION_CONTEXT_MISSING"
                }), 400
            
            # Get organization
            org = Organization.query.filter_by(id=organization_id).first()
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
            
            # Check current usage
            current_usage = get_organization_usage(organization_id)
            current_value = current_usage.get(limit_key, 0)
            
            if is_limit_exceeded(tier, limit_key, current_value + increment):
                limit = get_limit(tier, limit_key)
                plan_config = get_plan_config(tier)
                
                return jsonify({
                    "success": False,
                    "message": f"You have reached your {limit_key.replace('_', ' ')} limit ({limit})",
                    "error_code": "USAGE_LIMIT_EXCEEDED",
                    "subscription_info": {
                        "current_plan": plan_config["name"],
                        "limit_key": limit_key,
                        "current_usage": current_value,
                        "limit": limit,
                        "upgrade_required": True
                    }
                }), 403
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


def check_subscription_access(organization_id: str, feature: FeatureKey) -> tuple[bool, Optional[Dict]]:
    """
    Check if an organization has access to a feature
    Returns (has_access, error_info)
    """
    org = Organization.query.filter_by(id=organization_id).first()
    if not org:
        return False, {
            "message": "Organization not found",
            "error_code": "ORGANIZATION_NOT_FOUND"
        }
    
    try:
        tier = SubscriptionTier(org.subscription_tier)
    except ValueError:
        tier = SubscriptionTier.FREE
    
    if not has_feature(tier, feature):
        plan_config = get_plan_config(tier)
        return False, {
            "message": f"Feature '{feature.value}' not available in your current plan",
            "error_code": "FEATURE_NOT_AVAILABLE",
            "subscription_info": {
                "current_plan": plan_config["name"],
                "required_feature": feature.value,
                "upgrade_required": True
            }
        }
    
    return True, None


def get_subscription_status(organization_id: str) -> Dict[str, Any]:
    """Get complete subscription status for an organization"""
    org = Organization.query.filter_by(id=organization_id).first()
    if not org:
        return {"error": "Organization not found"}
    
    try:
        tier = SubscriptionTier(org.subscription_tier)
    except ValueError:
        tier = SubscriptionTier.FREE
    
    plan_config = get_plan_config(tier)
    current_usage = get_organization_usage(organization_id)
    
    # Calculate usage percentages
    limits = plan_config.get("limits", {})
    usage_percentages = {}
    
    for key, current_value in current_usage.items():
        limit = limits.get(key, 0)
        if limit == -1:  # Unlimited
            usage_percentages[key] = 0
        elif limit > 0:
            usage_percentages[key] = min((current_value / limit) * 100, 100)
        else:
            usage_percentages[key] = 0 if current_value == 0 else 100
    
    return {
        "organization_id": organization_id,
        "subscription_tier": tier.value,
        "plan_name": plan_config["name"],
        "features": [f.value for f in plan_config.get("features", [])],
        "limits": limits,
        "current_usage": current_usage,
        "usage_percentages": usage_percentages,
        "is_active": org.is_active,
        "ui_display": plan_config.get("ui_display", {})
    }