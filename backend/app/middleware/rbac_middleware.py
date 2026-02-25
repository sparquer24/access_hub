"""
Role-Based Access Control (RBAC) middleware.
"""
from flask import g
from ..utils.exceptions import AuthorizationError


class RBACMiddleware:
    """RBAC enforcement middleware"""
    
    # Define role hierarchy (higher roles inherit lower role permissions)
    ROLE_HIERARCHY = {
        'super_admin': 100,
        'admin': 80,
        'org_admin': 50,
        'manager': 30,
        'employee': 10,
    }
    
    @staticmethod
    def check_role(required_role):
        """
        Check if current user has required role or higher.
        
        Args:
            required_role: Required role name
        
        Raises:
            AuthorizationError: If user doesn't have required role
        """
        if not hasattr(g, 'current_user_role'):
            raise AuthorizationError("User role not found in request context")
        
        current_role = g.current_user_role
        current_level = RBACMiddleware.ROLE_HIERARCHY.get(current_role, 0)
        required_level = RBACMiddleware.ROLE_HIERARCHY.get(required_role, 0)
        
        if current_level < required_level:
            raise AuthorizationError(
                f"Access denied. Required role: {required_role}, current role: {current_role}"
            )
    
    @staticmethod
    def check_permission(resource, action):
        """
        Check if current user has specific permission.
        
        Args:
            resource: Resource name (e.g., 'employees', 'attendance')
            action: Action name (e.g., 'create', 'read', 'update', 'delete')
        
        Raises:
            AuthorizationError: If user doesn't have required permission
        """
        if not hasattr(g, 'current_user_claims'):
            raise AuthorizationError("User claims not found in request context")
        
        permissions = g.current_user_claims.get('permissions', {})
        resource_permissions = permissions.get(resource, [])
        
        # Check for wildcard or specific permission
        if '*' not in resource_permissions and action not in resource_permissions:
            raise AuthorizationError(
                f"Access denied. Missing permission: {resource}.{action}"
            )
    
    @staticmethod
    def is_super_admin():
        """Check if current user is super admin"""
        return hasattr(g, 'current_user_role') and g.current_user_role == 'super_admin'
    
    @staticmethod
    def is_org_admin():
        """Check if current user is organization admin"""
        if not hasattr(g, 'current_user_role'):
            return False
        return g.current_user_role in ['super_admin', 'org_admin']
    
    @staticmethod
    def is_manager():
        """Check if current user is a manager or higher"""
        if not hasattr(g, 'current_user_role'):
            return False
        return g.current_user_role in ['super_admin', 'org_admin', 'manager']
    
    @staticmethod
    def is_employee():
        """Check if current user is an employee or higher"""
        if not hasattr(g, 'current_user_role'):
            return False
        return g.current_user_role in ['super_admin', 'org_admin', 'manager', 'employee']
    
    @staticmethod
    def can_view_own_data():
        """Check if current user can view their own data"""
        if not hasattr(g, 'current_user_role'):
            return False
        # All authenticated users can view their own data
        return g.current_user_role in ['super_admin', 'org_admin', 'manager', 'employee']
    
    @staticmethod
    def can_manage_employees():
        """Check if current user can manage employees"""
        if not hasattr(g, 'current_user_role'):
            return False
        return g.current_user_role in ['super_admin', 'org_admin', 'manager']
    
    @staticmethod
    def can_approve_attendance():
        """Check if current user can approve attendance"""
        if not hasattr(g, 'current_user_role'):
            return False
        return g.current_user_role in ['super_admin', 'org_admin', 'manager']
    
    @staticmethod
    def can_approve_leaves():
        """Check if current user can approve leave requests"""
        if not hasattr(g, 'current_user_role'):
            return False
        return g.current_user_role in ['super_admin', 'org_admin', 'manager']
    
    @staticmethod
    def get_organization_filter():
        """
        Get organization filter for queries.
        Returns None for super_admin (no filter), organization_id otherwise.
        """
        if RBACMiddleware.is_super_admin():
            return None
        
        if hasattr(g, 'current_organization_id'):
            return g.current_organization_id
        
        raise AuthorizationError("Organization context required")
    
    @staticmethod
    def get_department_filter():
        """
        Get department filter for manager role.
        Returns None for super_admin/org_admin, department_id for manager.
        """
        if RBACMiddleware.is_super_admin() or g.current_user_role == 'org_admin':
            return None
            
        if g.current_user_role == 'manager' and hasattr(g, 'current_department_id'):
            return g.current_department_id
            
        return None


def require_permission(permission):
    """
    Decorator to check if user has required permission.
    
    Args:
        permission: Permission string in format 'resource:action' or 'resource.*'
    
    Returns:
        Decorated function that checks permission before executing
    """
    from functools import wraps
    from flask_jwt_extended import verify_jwt_in_request
    
    def decorator(fn):
        @wraps(fn)
        def decorated_function(*args, **kwargs):
            # First ensure JWT token is valid
            try:
                verify_jwt_in_request()
            except Exception as e:
                raise AuthorizationError("Authentication required")
            
            # Skip permission check for super_admin
            if RBACMiddleware.is_super_admin():
                return fn(*args, **kwargs)
            
            # Get user claims from g
            claims = getattr(g, 'current_user_claims', {})
            
            if not claims:
                raise AuthorizationError("User claims not found in request context")
            
            permissions = claims.get('permissions', {})
            
            if '*' in permission:
                # Wildcard permission - just check resource
                resource = permission.split(':')[0]
                if resource not in permissions:
                    raise AuthorizationError(f"Access denied. Missing permission: {permission}")
            else:
                # Specific resource:action permission
                if ':' in permission:
                    resource, action = permission.split(':', 1)
                    resource_permissions = permissions.get(resource, [])
                    
                    # Check for wildcard or specific permission
                    if '*' not in resource_permissions and action not in resource_permissions:
                        raise AuthorizationError(f"Access denied. Missing permission: {resource}.{action}")
                else:
                    raise AuthorizationError(f"Invalid permission format: {permission}")
            
            return fn(*args, **kwargs)
        
        return decorated_function
    
    return decorator
