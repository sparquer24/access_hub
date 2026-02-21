"""
Middleware package for authentication and authorization.
"""

from .rbac_middleware import require_permission, require_role, require_same_org

# Import legacy middleware functions from the old middleware.py for backward compatibility
from ..middleware import require_login, require_csrf

__all__ = [
    'require_permission', 
    'require_role', 
    'require_same_org',
    'require_login',  # Legacy
    'require_csrf',   # Legacy
]