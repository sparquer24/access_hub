"""
Authentication middleware for JWT token validation.
"""
from functools import wraps
from flask import request, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from ..utils.exceptions import AuthenticationError


def jwt_required_middleware():
    """
    Middleware to validate JWT token for protected routes.
    Populates g.current_user_id and g.current_user_claims.
    """
    # Skip authentication for public endpoints
    public_endpoints = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/refresh',
        '/api/health',
    ]

    if request.path in public_endpoints:
        return

    # Skip for OPTIONS requests (CORS preflight)
    if request.method == 'OPTIONS':
        return

    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        claims = get_jwt()
    
        # Store in g for use in views
        g.current_user_id = user_id
        g.current_user_claims = claims
        g.current_user_role = claims.get('role')
        g.current_organization_id = claims.get('organization_id')
        g.current_department_id = claims.get('department_id')
    
    except Exception as e:
        raise AuthenticationError("Invalid or expired token")


def create_jwt_payload(user):
    """
    Create JWT payload with user claims.

    Args:
        user: User model instance

    Returns:
        dict: JWT claims
    """
    # Get employee details if available to enrich claims
    department_id = None
    organization_id = user.organization_id
    
    if user.role and user.role.name.lower() in ['manager', 'employee', 'org_admin']:
        from ..models.employee import Employee
        from ..models.department import Department
        
        employee = Employee.query.filter_by(user_id=user.id).first()
        if employee:
            # Fallback: If user record lacks organization_id, use employee's
            if not organization_id:
                organization_id = employee.organization_id
                
            # Manager-specific department logic
            if user.role.name.lower() == 'manager':
                department = Department.query.filter_by(manager_id=employee.id).first()
                if department:
                    department_id = department.id
                elif employee.department_id:
                    # Fallback: If not explicitly set as manager of a department, 
                    # assume they manage their assigned department
                    department_id = employee.department_id
            # For regular employees, we might want their department_id too if needed
            elif user.role.name.lower() == 'employee':
                department_id = employee.department_id
    
    claims = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role.name if user.role else None,
        'organization_id': organization_id,
        'department_id': department_id,
        'permissions': user.role.permissions if user.role else {}
    }
    return claims


def require_auth(f):
    """
    Decorator to require JWT authentication.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            claims = get_jwt()
        
            # Store in g for use in views
            g.current_user_id = user_id
            g.current_user_claims = claims
            g.current_user_role = claims.get('role')
            g.current_organization_id = claims.get('organization_id')
            g.current_department_id = claims.get('department_id')
            
            # Also set user_role and organization_id for backward compatibility
            g.user_role = claims.get('role')
            g.organization_id = claims.get('organization_id')
        
        except AuthenticationError:
            raise
        except Exception as e:
            raise AuthenticationError("Invalid or expired token")
        
        return f(*args, **kwargs)
    return decorated_function


def require_role(roles):
    """
    Decorator to require specific roles.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                claims = get_jwt()
            
                # Store in g for use in views
                g.current_user_id = user_id
                g.current_user_claims = claims
                g.current_user_role = claims.get('role')
                g.current_organization_id = claims.get('organization_id')
                g.current_department_id = claims.get('department_id')
                
                # Also set user_role and organization_id for backward compatibility
                g.user_role = claims.get('role')
                g.organization_id = claims.get('organization_id')
                
                # Check role
                user_role = claims.get('role')
                if user_role not in roles:
                    raise AuthenticationError(f"Role '{user_role}' not authorized. Required: {roles}")
            
            except AuthenticationError:
                raise
            except Exception as e:
                raise AuthenticationError("Invalid or expired token")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator