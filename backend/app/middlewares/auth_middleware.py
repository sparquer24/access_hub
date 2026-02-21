"""
Authentication middleware for JWT token validation.
"""
from flask import request, g
from ..utils.exceptions import AuthenticationError
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

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
    claims = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role.name if user.role else None,
        'organization_id': user.organization_id,
        'permissions': user.role.permissions if user.role else {}
    }
    return claims
