"""
Multi-tenant isolation middleware.
"""
from flask import g
from ..utils.exceptions import AuthorizationError


class TenantMiddleware:
    """Enforce multi-tenant data isolation"""
    
    @staticmethod
    def enforce_tenant_isolation(query, model):
        """
        Automatically filter queries by organization_id for tenant isolation.
        Super admins bypass this filter.
        
        Args:
            query: SQLAlchemy query object
            model: Model class being queried
        
        Returns:
            Filtered query
        """
        # Check if model has organization_id column
        if not hasattr(model, 'organization_id'):
            return query
        
        # Super admin can see all data
        if hasattr(g, 'current_user_role') and g.current_user_role == 'super_admin':
            return query
        
        # Filter by organization
        if hasattr(g, 'current_organization_id') and g.current_organization_id:
            return query.filter(model.organization_id == g.current_organization_id)
        
        raise AuthorizationError("Organization context required for this operation")
    
    @staticmethod
    def set_organization_context(obj):
        """
        Set organization_id on new objects before saving.
        
        Args:
            obj: Model instance
        """
        # Skip if object already has organization_id set
        if hasattr(obj, 'organization_id') and obj.organization_id:
            return
        
        # Super admin must explicitly set organization
        if hasattr(g, 'current_user_role') and g.current_user_role == 'super_admin':
            return
        
        # Set from current context
        if hasattr(obj, 'organization_id') and hasattr(g, 'current_organization_id'):
            obj.organization_id = g.current_organization_id
    
    @staticmethod
    def validate_organization_access(organization_id):
        """
        Validate that current user can access specified organization.
        
        Args:
            organization_id: Organization ID to check
        
        Raises:
            AuthorizationError: If user cannot access the organization
        """
        # Super admin can access any organization
        if hasattr(g, 'current_user_role') and g.current_user_role == 'super_admin':
            return True
        
        # Check if user belongs to the organization
        if hasattr(g, 'current_organization_id'):
            if g.current_organization_id != organization_id:
                raise AuthorizationError(
                    "Access denied. You can only access your own organization's data."
                )
            return True
        
        raise AuthorizationError("Organization context required")
