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
