"""
Authentication API routes for JWT-based authentication.
"""
from flask import Blueprint, request, current_app
import traceback
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from flasgger import swag_from
from ...services.auth_service import AuthService
from ...utils.responses import success_response, error_response, created_response
from ...utils.decorators import validate_json
from ...utils.exceptions import APIException

bp = Blueprint("auth_v2", __name__, url_prefix="/api/v2/auth")


@bp.post("/login")
@validate_json(['username', 'password'])
def login():
    """
    User Login - Generate JWT tokens
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        description: User credentials
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              example: "superadmin@vms.com"
              description: Username or email address
            password:
              type: string
              format: password
              example: "SecurePassword123"
              description: User password
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Login successful"
            data:
              type: object
              properties:
                user:
                  type: object
                  properties:
                    id:
                      type: string
                      example: "uuid-here"
                    email:
                      type: string
                      example: "superadmin@vms.com"
                    username:
                      type: string
                      example: "superadmin"
                    role:
                      type: object
                      properties:
                        id:
                          type: string
                        name:
                          type: string
                          example: "SuperAdmin"
                access_token:
                  type: string
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  description: JWT access token (expires in 15 minutes)
                refresh_token:
                  type: string
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  description: JWT refresh token (expires in 7 days)
      400:
        description: Bad request - Missing required fields
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Missing required fields: username, password"
      401:
        description: Unauthorized - Invalid credentials
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Invalid username or password"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Login failed: Database error"
            errors:
              type: object
              properties:
                traceback:
                  type: string
                  description: Error traceback (dev mode only)
    """
    try:
        data = request.get_json()
        print(f"Login attempt for user: {data['username']}")
        result = AuthService.login(
            username_or_email=data['username'],
            password=data['password']
        )
        return success_response(result, "Login successful")

    except APIException as e:
        return error_response(e.message, e.status_code)
    except Exception as e:
        # Log full exception trace to server console for debugging
        try:
            current_app.logger.exception("Unhandled error in auth login")
        except Exception:
            # fallback to print if logger is not available
            traceback.print_exc()
        # If running in debug mode, include the traceback in the response for easier local debugging
        tb = None
        try:
            tb = traceback.format_exc()
        except Exception:
            tb = str(e)
        return error_response(f"Login failed: {str(e)}", 500, errors={"traceback": tb})


@bp.post("/register")
@validate_json(['email', 'username', 'password', 'role_id'])
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        description: User registration data
        schema:
          type: object
          required:
            - email
            - username
            - password
            - role_id
          properties:
            email:
              type: string
              format: email
              example: "newuser@vms.com"
              description: User email address (must be unique)
            username:
              type: string
              example: "newuser"
              description: Username (must be unique)
            password:
              type: string
              format: password
              example: "SecurePassword123"
              description: User password (min 8 characters)
            role_id:
              type: string
              format: uuid
              example: "uuid-of-role"
              description: Role ID (Employee, OrgAdmin, SuperAdmin)
            organization_id:
              type: string
              format: uuid
              example: "uuid-of-org"
              description: Organization ID (optional, required for OrgAdmin/Employee)
    responses:
      201:
        description: User registered successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "User registered successfully"
            data:
              type: object
              properties:
                user:
                  type: object
                  properties:
                    id:
                      type: string
                    email:
                      type: string
                    username:
                      type: string
                    role:
                      type: object
      400:
        description: Bad request - Validation error
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Email already exists"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Registration failed: Database error"
    """
    try:
        data = request.get_json()
        user = AuthService.register_user(data)
        
        return created_response(
            {"user": user.to_dict()},
            "User registered successfully"
        )
    
    except APIException as e:
        return error_response(e.message, e.status_code)
    except Exception as e:
        return error_response(f"Registration failed: {str(e)}", 500)


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - name: Authorization
        in: header
        type: string
        required: true
        description: "Bearer <refresh_token>"
        example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    responses:
      200:
        description: Token refreshed successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Token refreshed successfully"
            data:
              type: object
              properties:
                access_token:
                  type: string
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  description: New access token
                refresh_token:
                  type: string
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  description: New refresh token (optional)
      401:
        description: Unauthorized - Invalid or expired refresh token
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Refresh token has expired"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Token refresh failed: Database error"
    """
    try:
        user_id = get_jwt_identity()
        result = AuthService.refresh_token(user_id)
        
        return success_response(result, "Token refreshed successfully")
    
    except APIException as e:
        return error_response(e.message, e.status_code)
    except Exception as e:
        return error_response(f"Token refresh failed: {str(e)}", 500)


@bp.get("/me")
@jwt_required()
def get_current_user():
    """
    Get current authenticated user
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: User details retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Success"
            data:
              type: object
              properties:
                user:
                  type: object
                  properties:
                    id:
                      type: string
                    email:
                      type: string
                      example: "user@vms.com"
                    username:
                      type: string
                      example: "username"
                    role:
                      type: object
                      properties:
                        id:
                          type: string
                        name:
                          type: string
                          example: "Employee"
                    organization_id:
                      type: string
                      nullable: true
                    is_active:
                      type: boolean
                      example: true
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Token has expired"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Failed to get user: Database error"
    """
    try:
        user_id = get_jwt_identity()
        user = AuthService.get_current_user(user_id)
        
        return success_response(
            {"user": user.to_dict()},
            "Success"
        )
    
    except APIException as e:
        return error_response(e.message, e.status_code)
    except Exception as e:
        return error_response(f"Failed to get user: {str(e)}", 500)


@bp.post("/logout")
@jwt_required()
def logout():
    """
    Logout user (blacklist token)
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Logout successful
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Logged out successfully"
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Token has expired"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Logout failed: Database error"
    """
    try:
        user_id = get_jwt_identity()
        token_jti = get_jwt()['jti']
        
        AuthService.logout(user_id, token_jti)
        
        return success_response(None, "Logged out successfully")
    
    except APIException as e:
        return error_response(e.message, e.status_code)
    except Exception as e:
        return error_response(f"Logout failed: {str(e)}", 500)


@bp.post("/change-password")
@jwt_required()
@validate_json(['old_password', 'new_password'])
def change_password():
    """
    Change user password.
    
    Request body:
    {
        "old_password": "current_password",
        "new_password": "new_password"
    }
    
    Response:
    {
        "success": true,
        "message": "Password changed successfully"
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        AuthService.change_password(
            user_id=user_id,
            old_password=data['old_password'],
            new_password=data['new_password']
        )
        
        return success_response(None, "Password changed successfully")
    
    except APIException as e:
        return error_response(e.message, e.status_code)
    except Exception as e:
        return error_response(f"Password change failed: {str(e)}", 500)


@bp.post("/forgot-password")
@validate_json(['email'])
def forgot_password():
    """
    Initiate password reset process.
    
    Request body:
    {
        "email": "user@example.com"
    }
    
    Response:
    {
        "success": true,
        "message": "If the email exists, a password reset link has been sent"
    }
    """
    try:
        data = request.get_json()
        AuthService.reset_password(data['email'])
        
        return success_response(
            None,
            "If the email exists, a password reset link has been sent"
        )
    
    except Exception as e:
        # Always return success to prevent email enumeration
        return success_response(
            None,
            "If the email exists, a password reset link has been sent"
        )