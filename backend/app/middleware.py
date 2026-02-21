from functools import wraps
from flask import session, jsonify, request
from .security import verify_csrf
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from .models.user import User
from .models.role import Role
from .models.employee import Employee

def require_login(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Session-based login
        if session.get("user_id"):
            return f(*args, **kwargs)

        # JWT Bearer token
        auth = request.headers.get("Authorization")

        if auth and auth.lower().startswith("bearer "):
            try:
                # Verify JWT token (explicitly require it)
                verify_jwt_in_request(optional=False)
                user_id = get_jwt_identity()
                
                # Check if user exists in DB
                user = User.query.filter_by(id=user_id).first()
                if not user:
                    return jsonify({
                        "success": False,
                        "message": "Unauthorized: User not found",
                        "errorCode": "user_not_found"
                    }), 401
                
                return f(*args, **kwargs)
            except Exception as e:
                # Log the actual error for debugging
                print(f"[require_login] JWT verification failed: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                return jsonify({
                    "success": False,
                    "message": f"Unauthorized: Invalid or expired token - {str(e)}",
                    "errorCode": "invalid_token"
                }), 401

        return jsonify({
            "success": False,
            "message": "Unauthorized: Login required",
            "errorCode": "unauthorized"
        }), 401
    return wrapper

def require_role(*roles):
    def deco(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            role = session.get("role")
            if not role or role not in roles:
                return jsonify({
                    "success": False,
                    "message": "Forbidden: Insufficient permissions",
                    "errorCode": "forbidden"
                }), 403
            return f(*args, **kwargs)
        return wrapper
    return deco

def require_csrf(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Allow valid Bearer JWTs to bypass CSRF checks for API clients
        auth = request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            try:
                verify_jwt_in_request()
                return f(*args, **kwargs)
            except Exception:
                pass

        if not verify_csrf():
            return jsonify({
                "success": False,
                "message": "CSRF verification failed",
                "errorCode": "csrf_failed"
            }), 400
        return f(*args, **kwargs)
    return wrapper