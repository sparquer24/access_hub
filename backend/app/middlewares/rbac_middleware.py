"""
Role-Based Access Control (RBAC) middleware for Flask.
"""

from functools import wraps
from flask import g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..utils.exceptions import ForbiddenError, UnauthorizedError
from ..models import User, Role


def require_permission(permission):
    """
    Decorator to check if user has the required permission.
    Permission format: "resource:action" (e.g., "users:create", "attendance:read")
    
    Usage:
        @require_permission('users:create')
        def create_user():
            pass
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT is present
            verify_jwt_in_request()
            
            # Get current user ID from JWT
            user_id = get_jwt_identity()
            
            if not user_id:
                raise UnauthorizedError('User not authenticated')
            
            # Get user from database
            user = User.query.filter_by(id=user_id, is_active=True).first()
            
            if not user:
                raise UnauthorizedError('User not found or inactive')
            
            # Store user in Flask's g object for use in route handlers
            g.current_user = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'organization_id': user.organization_id,
                'role_id': user.role_id,
                'is_active': user.is_active
            }
            
            # Super admins have all permissions
            if user.role and user.role.name == 'super_admin':
                return fn(*args, **kwargs)
            
            # Check if user has the required permission
            if not user.role:
                raise ForbiddenError('User has no role assigned')
            
            # Parse permission string
            parts = permission.split(':')
            if len(parts) != 2:
                raise ValueError(f'Invalid permission format: {permission}')
            
            resource, action = parts
            
            # Check if role has the permission
            if not user.role.has_permission(resource, action):
                raise ForbiddenError(f'Insufficient permissions: {permission}')
            
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator


def require_role(*roles):
    """
    Decorator to check if user has one of the required roles.
    
    Usage:
        @require_role('admin', 'super_admin')
        def admin_only_route():
            pass
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT is present
            verify_jwt_in_request()
            
            # Get current user ID from JWT
            user_id = get_jwt_identity()
            
            if not user_id:
                raise UnauthorizedError('User not authenticated')
            
            # Get user from database
            user = User.query.filter_by(id=user_id, is_active=True).first()
            
            if not user:
                raise UnauthorizedError('User not found or inactive')
            
            # Store user in Flask's g object
            g.current_user = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'organization_id': user.organization_id,
                'role_id': user.role_id,
                'is_active': user.is_active
            }
            
            # Check if user has required role
            if not user.role:
                raise ForbiddenError('User has no role assigned')
            
            if user.role.name not in roles:
                raise ForbiddenError(f'Role {user.role.name} is not authorized')
            
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator


def require_same_org(get_org_id_from_request):
    """
    Decorator to check if user belongs to the same organization as the resource.
    
    Args:
        get_org_id_from_request: Function that extracts org_id from request
    
    Usage:
        @require_same_org(lambda: request.view_args.get('org_id'))
        def get_organization(org_id):
            pass
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT is present
            verify_jwt_in_request()
            
            # Get current user ID from JWT
            user_id = get_jwt_identity()
            
            if not user_id:
                raise UnauthorizedError('User not authenticated')
            
            # Get user from database
            user = User.query.filter_by(id=user_id, is_active=True).first()
            
            if not user:
                raise UnauthorizedError('User not found or inactive')
            
            # Super admins can access any organization
            if user.role and user.role.name == 'super_admin':
                return fn(*args, **kwargs)
            
            # Get organization ID from request
            requested_org_id = get_org_id_from_request()
            
            # Check if user belongs to the same organization
            if user.organization_id != requested_org_id:
                raise ForbiddenError('Access denied: different organization')
            
            return fn(*args, **kwargs)
        
        return wrapper
    return decorator
