"""
Subscription Plans Configuration
Defines feature access and limits for each subscription tier
"""

from enum import Enum
from typing import Dict, Any, List


class SubscriptionTier(Enum):
    """Available subscription tiers"""
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class FeatureKey(Enum):
    """Available features in the system"""
    VISITOR_MANAGEMENT = "visitor_management"
    VISITOR_ANALYTICS = "visitor_analytics"
    EMPLOYEE_MANAGEMENT = "employee_management"
    EMPLOYEE_ATTENDANCE = "employee_attendance"
    DEPARTMENT_MANAGEMENT = "department_management"
    CAMERA_INTEGRATION = "camera_integration"
    SHIFT_MANAGEMENT = "shift_management"
    ADVANCED_ANALYTICS = "advanced_analytics"
    ALERTS_MANAGEMENT = "alerts_management"
    BULK_OPERATIONS = "bulk_operations"
    API_ACCESS = "api_access"
    CUSTOM_REPORTS = "custom_reports"
    MULTI_ORGANIZATION = "multi_organization"
    WHITE_LABEL = "white_label"
    PRIORITY_SUPPORT = "priority_support"


# Subscription plan configurations
SUBSCRIPTION_PLANS: Dict[SubscriptionTier, Dict[str, Any]] = {
    SubscriptionTier.FREE: {
        "name": "Free",
        "description": "Basic visitor registration",
        "price": 0,
        "currency": "USD",
        "billing_cycle": "monthly",
        "limits": {
            "visitors_per_month": 25,
            "locations": 1,
            "cameras": 1,
            "admin_users": 1,
            "employees": 10,
            "departments": 1,
        },
        "features": [
            FeatureKey.VISITOR_MANAGEMENT,
        ],
        "ui_display": {
            "color": "#6B7280",
            "icon": "🆓",
            "badge": "FREE",
            "highlight": False,
        }
    },
    
    SubscriptionTier.STARTER: {
        "name": "Starter",
        "description": "Small business visitor management",
        "price": 29,
        "currency": "USD",
        "billing_cycle": "monthly",
        "limits": {
            "visitors_per_month": 500,
            "locations": 3,
            "cameras": 5,
            "admin_users": 3,
            "employees": 50,
            "departments": 5,
        },
        "features": [
            FeatureKey.VISITOR_MANAGEMENT,
            FeatureKey.VISITOR_ANALYTICS,
            FeatureKey.CAMERA_INTEGRATION,
        ],
        "ui_display": {
            "color": "#3B82F6",
            "icon": "📦",
            "badge": "STARTER",
            "highlight": False,
        }
    },
    
    SubscriptionTier.PROFESSIONAL: {
        "name": "Professional",
        "description": "Complete workforce management",
        "price": 99,
        "currency": "USD",
        "billing_cycle": "monthly",
        "limits": {
            "visitors_per_month": -1,  # Unlimited
            "locations": 10,
            "cameras": 20,
            "admin_users": 10,
            "employees": 200,
            "departments": 20,
        },
        "features": [
            FeatureKey.VISITOR_MANAGEMENT,
            FeatureKey.VISITOR_ANALYTICS,
            FeatureKey.EMPLOYEE_MANAGEMENT,
            FeatureKey.EMPLOYEE_ATTENDANCE,
            FeatureKey.DEPARTMENT_MANAGEMENT,
            FeatureKey.CAMERA_INTEGRATION,
            FeatureKey.SHIFT_MANAGEMENT,
            FeatureKey.ADVANCED_ANALYTICS,
            FeatureKey.ALERTS_MANAGEMENT,
            FeatureKey.BULK_OPERATIONS,
        ],
        "ui_display": {
            "color": "#10B981",
            "icon": "👥",
            "badge": "PROFESSIONAL",
            "highlight": True,
        }
    },
    
    SubscriptionTier.ENTERPRISE: {
        "name": "Enterprise",
        "description": "Large scale enterprise solution",
        "price": 299,
        "currency": "USD",
        "billing_cycle": "monthly",
        "limits": {
            "visitors_per_month": -1,  # Unlimited
            "locations": -1,  # Unlimited
            "cameras": -1,  # Unlimited
            "admin_users": -1,  # Unlimited
            "employees": -1,  # Unlimited
            "departments": -1,  # Unlimited
        },
        "features": list(FeatureKey),  # All features
        "ui_display": {
            "color": "#8B5CF6",
            "icon": "🚀",
            "badge": "ENTERPRISE",
            "highlight": False,
        }
    }
}


def get_plan_config(tier: SubscriptionTier) -> Dict[str, Any]:
    """Get configuration for a subscription tier"""
    return SUBSCRIPTION_PLANS.get(tier, SUBSCRIPTION_PLANS[SubscriptionTier.FREE])


def has_feature(tier: SubscriptionTier, feature: FeatureKey) -> bool:
    """Check if a subscription tier has a specific feature"""
    plan_config = get_plan_config(tier)
    return feature in plan_config.get("features", [])


def get_limit(tier: SubscriptionTier, limit_key: str) -> int:
    """Get a specific limit for a subscription tier (-1 means unlimited)"""
    plan_config = get_plan_config(tier)
    return plan_config.get("limits", {}).get(limit_key, 0)


def is_limit_exceeded(tier: SubscriptionTier, limit_key: str, current_value: int) -> bool:
    """Check if current usage exceeds the subscription limit"""
    limit = get_limit(tier, limit_key)
    if limit == -1:  # Unlimited
        return False
    return current_value >= limit


# Feature to tab mapping for UI
FEATURE_TAB_MAPPING = {
    FeatureKey.VISITOR_MANAGEMENT: ["visitors"],
    FeatureKey.VISITOR_ANALYTICS: ["statistics"],
    FeatureKey.EMPLOYEE_MANAGEMENT: ["employees"],
    FeatureKey.EMPLOYEE_ATTENDANCE: ["employees", "statistics"],
    FeatureKey.DEPARTMENT_MANAGEMENT: ["departments"],
    FeatureKey.CAMERA_INTEGRATION: ["cameras"],
    FeatureKey.SHIFT_MANAGEMENT: ["shifts"],
    FeatureKey.ADVANCED_ANALYTICS: ["statistics"],
    FeatureKey.ALERTS_MANAGEMENT: ["alerts"],
}


def get_accessible_tabs(tier: SubscriptionTier) -> List[str]:
    """Get list of accessible tabs for a subscription tier"""
    plan_config = get_plan_config(tier)
    accessible_tabs = set()
    
    for feature in plan_config.get("features", []):
        tabs = FEATURE_TAB_MAPPING.get(feature, [])
        accessible_tabs.update(tabs)
    
    # Always include basic tabs
    accessible_tabs.update(["info"])
    
    return list(accessible_tabs)