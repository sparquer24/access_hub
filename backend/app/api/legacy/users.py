"""
Legacy user management endpoints (v1)
These endpoints provide basic user CRUD operations.
"""

from flask import Blueprint, request, jsonify, g
from ...extensions import db, bcrypt
from ...models import UserDetails
from ...utils.decorators import permission_required
from ...utils.audit import log_audit

bp = Blueprint("users_legacy", __name__)


@bp.post("/api/users")
@permission_required('users', 'create')
def create_user():
    """
    Create a new user (Admin only)
    ---
    tags:
      - Users (Legacy)
    security:
      - Bearer: []
      - SessionCookie: []
    parameters:
      - name: X-CSRFToken
        in: header
        type: string
        required: true
        description: CSRF token for security
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - full_name
            - login_id
            - password
            - confirm_password
          properties:
            full_name:
              type: string
              example: "John Doe"
            login_id:
              type: string
              example: "johndoe"
              description: Username (must be unique)
            password:
              type: string
              format: password
              example: "SecurePass123"
              description: Password (min 6 characters)
            confirm_password:
              type: string
              format: password
              example: "SecurePass123"
            email:
              type: string
              format: email
              example: "john@example.com"
            employee_id:
              type: string
              example: "EMP001"
            gender:
              type: string
              example: "Male"
            phone_number:
              type: string
              example: "+1234567890"
            building_name:
              type: string
              example: "Building A"
            tower:
              type: string
              example: "Tower 1"
    responses:
      201:
        description: User created successfully
        schema:
          type: object
          properties:
            id:
              type: integer
            login_id:
              type: string
            full_name:
              type: string
            role:
              type: string
              example: "User"
            email:
              type: string
            is_active:
              type: boolean
            created_at:
              type: string
              format: date-time
      400:
        description: Bad request - Validation error
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin role required
      409:
        description: Conflict - User already exists
    """
    data = request.get_json() or {}

    # Validate required fields
    required = ["full_name", "login_id", "password", "confirm_password"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"message": f"Missing fields: {', '.join(missing)}"}), 400

    if data["password"] != data["confirm_password"]:
        return jsonify({"message": "Passwords do not match"}), 400
    if len(data["password"]) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    # Force role to "User" for all new accounts
    role = "User"

    # Check for duplicates
    if UserDetails.query.filter_by(login_id=data["login_id"]).first():
        return jsonify({"message": "User Name (login_id) already exists"}), 409
    
    email = data.get("email")
    if email and UserDetails.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 409
    
    eid = data.get("employee_id")
    if eid and UserDetails.query.filter_by(employee_id=eid).first():
        return jsonify({"message": "Employee ID already exists"}), 409

    # Enforce org scoping
    from ...middleware.rbac_middleware import RBACMiddleware
    org_id = None
    if hasattr(g, 'current_organization_id'):
        org_id = g.current_organization_id
    
    if not RBACMiddleware.is_super_admin():
        if data.get("organization_id") and data["organization_id"] != org_id:
            return jsonify({"message": "Cannot create user in another organization"}), 403
    
    # Create user
    user = UserDetails(
        full_name=data.get("full_name"),
        gender=data.get("gender"),
        phone_number=data.get("phone_number"),
        email=email,
        employee_id=eid,
        building_name=data.get("building_name"),
        tower=data.get("tower"),
        login_id=data.get("login_id"),
        role=role,
        password_hash=bcrypt.generate_password_hash(data["password"]).decode(),
        is_active=True
    )
    db.session.add(user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Check for specific integrity errors
        error_str = str(e).lower()
        if 'unique constraint' in error_str or 'duplicate' in error_str:
            if 'login_id' in error_str:
                return jsonify({"message": "User Name (login_id) already exists"}), 409
            elif 'email' in error_str:
                return jsonify({"message": "Email already exists"}), 409
            elif 'employee_id' in error_str:
                return jsonify({"message": "Employee ID already exists"}), 409
        print(f"[create_user] Database error: {e}")
        return jsonify({"message": "Database constraint violation"}), 400

    # Audit log
    log_audit(
        action="create",
        entity_type="UserDetails",
        entity_id=user.id,
        old_values=None,
        new_values={
            "login_id": user.login_id,
            "full_name": user.full_name,
            "role": user.role,
            "email": user.email,
            "employee_id": user.employee_id
        }
    )

    return jsonify({
        "id": user.id,
        "login_id": user.login_id,
        "full_name": user.full_name,
        "role": user.role,
        "email": user.email,
        "employee_id": user.employee_id,
        "gender": user.gender,
        "phone_number": user.phone_number,
        "building_name": user.building_name,
        "tower": user.tower,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat()
    }), 201


@bp.get("/api/users")
def list_users():
    """
    List all users (Admin only)
    ---
    tags:
      - Users (Legacy)
    security:
      - Bearer: []
      - SessionCookie: []
    responses:
      200:
        description: List of users
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              login_id:
                type: string
              full_name:
                type: string
              role:
                type: string
              email:
                type: string
              employee_id:
                type: string
              is_active:
                type: boolean
              created_at:
                type: string
                format: date-time
      401:
        description: Unauthorized - Authentication required
      403:
        description: Forbidden - Admin role required
    """
    from ...middleware.rbac_middleware import RBACMiddleware
    
    org_filter = RBACMiddleware.get_organization_filter()
    q = UserDetails.query.filter_by(role="User")
    
    if org_filter:
        q = q.filter_by(organization_id=org_filter)
    
    users = q.order_by(UserDetails.id.desc()).all()
    return jsonify([{
        "id": u.id,
        "login_id": u.login_id,
        "full_name": u.full_name,
        "role": u.role,
        "email": u.email,
        "employee_id": u.employee_id,
        "gender": u.gender,
        "phone_number": u.phone_number,
        "building_name": u.building_name,
        "tower": u.tower,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat()
    } for u in users]), 200


@bp.put("/api/users/<int:user_id>")
def update_user(user_id):
    """
    Update user details (Admin only)
    ---
    tags:
      - Users (Legacy)
    security:
      - Bearer: []
      - SessionCookie: []
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: User ID to update
      - name: X-CSRFToken
        in: header
        type: string
        required: true
        description: CSRF token
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            full_name:
              type: string
            gender:
              type: string
            phone_number:
              type: string
            email:
              type: string
            employee_id:
              type: string
            building_name:
              type: string
            tower:
              type: string
    responses:
      200:
        description: User updated successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "User updated successfully"
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin role required
      404:
        description: User not found
    """
    user = UserDetails.query.get_or_404(user_id)
    data = request.get_json() or {}

    for field in ["full_name", "gender", "phone_number", "email", "employee_id", "building_name", "tower"]:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()
    return jsonify({"message": "User updated successfully"}), 200


@bp.patch("/api/users/<int:user_id>/password")
def change_password(user_id):
    """
    Change user password (Admin only)
    ---
    tags:
      - Users (Legacy)
    security:
      - Bearer: []
      - SessionCookie: []
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: User ID
      - name: X-CSRFToken
        in: header
        type: string
        required: true
        description: CSRF token
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - password
          properties:
            password:
              type: string
              format: password
              example: "NewSecurePassword123"
              description: New password for the user
    responses:
      200:
        description: Password updated successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Password updated successfully"
      400:
        description: Bad request - Password missing
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin role required
      404:
        description: User not found
    """
    user = UserDetails.query.get_or_404(user_id)
    data = request.get_json() or {}

    if not data.get("password"):
        return jsonify({"message": "Password is required"}), 400

    user.password_hash = bcrypt.generate_password_hash(data["password"]).decode()
    db.session.commit()
    return jsonify({"message": "Password updated successfully"}), 200
