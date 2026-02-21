# Permission-based RBAC decorator for API v2
from functools import wraps
from flask import g, jsonify
from ..middleware.rbac_middleware import RBACMiddleware
from ..utils.exceptions import AuthorizationError

def permission_required(resource, action):
    """
    Decorator to enforce permission checks using JWT claims and RBACMiddleware.
    Usage: @permission_required('users', 'create')
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            try:
                RBACMiddleware.check_permission(resource, action)
            except AuthorizationError as e:
                return jsonify({
                    "success": False,
                    "message": str(e),
                    "errorCode": "forbidden"
                }), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator
"""
Custom decorators for access control and authorization.
"""
from functools import wraps
from flask import request, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from .responses import error_response
from .exceptions import AuthorizationError
from ..extensions import db
from ..models import User

def _normalize_role(role_claim):
    """Normalize role claim to a lowercase string.

    Accepts a string role (e.g. 'employee') or an object/dict
    like {'id': '...', 'name': 'employee'} and returns the
    role name in lowercase or None.
    """
    if not role_claim:
        return None
    # If role is an object like {'id':..., 'name':...}
    if isinstance(role_claim, dict):
        name = role_claim.get('name') or role_claim.get('role')
        return name.lower() if isinstance(name, str) else None
    if isinstance(role_claim, str):
        return role_claim.lower()
    return None


def role_required(*roles):
    """
    Decorator to check if user has one of the required roles.
    Usage: @role_required('super_admin', 'org_admin')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = _normalize_role(claims.get('role'))

            # Fallback: if role claim missing, try to load from DB using JWT identity
            if not user_role:
                try:
                    user_id = get_jwt_identity()
                    if user_id:
                        user = User.query.filter_by(id=user_id, is_active=True).first()
                        if user and user.role:
                            user_role = user.role.name.lower()
                            # populate g.current_user for downstream code if not set
                            if not hasattr(g, 'current_user'):
                                g.current_user = {
                                    'id': user.id,
                                    'email': user.email,
                                    'username': user.username,
                                    'organization_id': user.organization_id,
                                    'role_id': user.role_id,
                                    'is_active': user.is_active
                                }
                except Exception:
                    # ignore DB lookup errors here; will raise authorization below
                    user_role = None

            allowed = [r.lower() for r in roles]
            if user_role not in allowed:
                raise AuthorizationError(f"Access denied. Required roles: {', '.join(roles)}")

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def organization_required(fn):
    """
    Decorator to ensure user belongs to an organization.
    Sets g.organization_id for use in views.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        organization_id = claims.get('organization_id')
        
        if not organization_id:
            raise AuthorizationError("Access denied. User must belong to an organization.")
        
        # Store in g for use in view
        g.organization_id = organization_id
        
        return fn(*args, **kwargs)
    return wrapper


def permission_required(resource, action):
    """
    Decorator to check if user has specific permission.
    Usage: @permission_required('employees', 'create')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            permissions = claims.get('permissions', {})
            
            resource_permissions = permissions.get(resource, [])
            if action not in resource_permissions and '*' not in resource_permissions:
                raise AuthorizationError(f"Access denied. Missing permission: {resource}.{action}")
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def tenant_isolation(fn):
    """
    Decorator to enforce tenant isolation based on organization_id.
    Automatically filters queries by organization.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        user_role = _normalize_role(claims.get('role'))

        # Super admin can access all organizations
        if user_role == 'super_admin':
            g.organization_id = None  # No filtering
        else:
            organization_id = claims.get('organization_id')
            if not organization_id:
                raise AuthorizationError("Access denied. Invalid organization context.")
            g.organization_id = organization_id

        # For managers, also set department context if available
        if user_role == 'manager':
            department_id = claims.get('department_id')
            if department_id:
                g.department_id = department_id
        
        return fn(*args, **kwargs)
    return wrapper

tenant_required = tenant_isolation


def manager_required(fn):
    """
    Decorator to check if user is a manager or higher.
    Usage: @manager_required
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        user_role = _normalize_role(claims.get('role'))

        allowed_roles = ['super_admin', 'org_admin', 'manager']
        if user_role not in allowed_roles:
            raise AuthorizationError("Access denied. Manager privileges required.")

        return fn(*args, **kwargs)
    return wrapper


def employee_required(fn):
    """
    Decorator to check if user is an employee or higher.
    Usage: @employee_required
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        user_role = _normalize_role(claims.get('role'))

        allowed_roles = ['super_admin', 'org_admin', 'manager', 'employee']
        if user_role not in allowed_roles:
            raise AuthorizationError("Access denied. Employee privileges required.")

        return fn(*args, **kwargs)
    return wrapper


def team_access_required(fn):
    """
    Decorator for manager access to team resources.
    Managers can only access their department's employees.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        user_role = _normalize_role(claims.get('role'))

        # Super admin and org admin have full access
        if user_role in ['super_admin', 'org_admin']:
            return fn(*args, **kwargs)

        # Manager needs department context
        if user_role == 'manager':
            department_id = claims.get('department_id')
            if not department_id:
                raise AuthorizationError("Access denied. Department context required for manager.")
            g.department_id = department_id
            return fn(*args, **kwargs)

        raise AuthorizationError("Access denied. Team access privileges required.")
    
    return wrapper


def validate_json(required_fields=None):
    """
    Decorator to validate JSON request body.
    Usage: @validate_json(['email', 'password'])
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return error_response("Request must be JSON", 400)
            
            data = request.get_json()
            if not data:
                return error_response("Invalid JSON data", 400)
            
            if required_fields:
                missing = [field for field in required_fields if field not in data]
                if missing:
                    return error_response(f"Missing required fields: {', '.join(missing)}", 400)
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
