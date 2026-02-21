"""
Middleware modules for authentication, authorization, and tenant isolation.
"""

from .auth_middleware import jwt_required_middleware, create_jwt_payload
from .rbac_middleware import RBACMiddleware
from .tenant_middleware import TenantMiddleware

# Backwards compatibility: re-export helpers defined in the top-level
# `app/middleware.py` file. Load that file by path under a unique module
# name to avoid circular import / name collisions with this package.
try:
    import importlib.util
    import os

    module_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "middleware.py"))
    if os.path.exists(module_path):
        spec = importlib.util.spec_from_file_location("app._legacy_middleware", module_path)
        _legacy_mw = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_legacy_mw)

        require_login = getattr(_legacy_mw, "require_login", None)
        require_role = getattr(_legacy_mw, "require_role", None)
        require_csrf = getattr(_legacy_mw, "require_csrf", None)
except Exception:
    require_login = require_role = require_csrf = None

__all__ = [
    "jwt_required_middleware",
    "create_jwt_payload",
    "RBACMiddleware",
    "TenantMiddleware",
]

if require_login:
    __all__.append("require_login")
if require_role:
    __all__.append("require_role")
if require_csrf:
    __all__.append("require_csrf")
