from flask import Blueprint, request, jsonify
from flasgger import swag_from
from ..extensions import db, bcrypt
from ..models import UserDetails
from ..middlewares import require_csrf, require_login
from ..utils.decorators import permission_required
from ..utils.audit import log_audit

bp = Blueprint("users", __name__)

@bp.post("/api/users")
# Example: Centralized RBAC for v2 APIs
@permission_required('users', 'create')
def create_user():
    """
    Create a new user (Admin only)
    ---
    tags:
      - Users
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
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Missing fields: full_name, login_id"
      401:
        description: Unauthorized
      403:
        description: Forbidden - Admin role required
      409:
        description: Conflict - User already exists
        schema:
          type: object
          properties:
            message:
              type: string
              example: "User Name (login_id) already exists"
    """
    data = request.get_json() or {}

    # 🔧 Remove "role" from required fields
    required = ["full_name", "login_id", "password", "confirm_password"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"message": f"Missing fields: {', '.join(missing)}"}), 400

    if data["password"] != data["confirm_password"]:
        return jsonify({"message": "Passwords do not match"}), 400
    if len(data["password"]) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    # 🧩 Force role to "User" for all new accounts created by Admin
    role = "User"

    # Continue the rest of the code unchanged
    if UserDetails.query.filter_by(login_id=data["login_id"]).first():
        return jsonify({"message": "User Name (login_id) already exists"}), 409
    email = data.get("email")
    if email and UserDetails.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 409
    eid = data.get("employee_id")
    if eid and UserDetails.query.filter_by(employee_id=eid).first():
        return jsonify({"message": "Employee ID already exists"}), 409

    # Enforce org scoping: only super_admin can create users in any org, org_admin only in their org
    from ..middleware.rbac_middleware import RBACMiddleware
    from flask import g
    org_id = None
    if hasattr(g, 'current_organization_id'):
      org_id = g.current_organization_id
    if not RBACMiddleware.is_super_admin():
      # Prevent org_admin from creating users in other orgs
      if data.get("organization_id") and data["organization_id"] != org_id:
        return jsonify({"message": "Cannot create user in another organization"}), 403
    # Set organization_id for org_admin
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
      is_active=True,
      organization_id=org_id
    )
    db.session.add(user)
    db.session.commit()

    # Audit log: user creation
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
        "employee_id": user.employee_id,
        "organization_id": user.organization_id
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


# (Optional) List users for the Existing Users table
@bp.get("/api/users")
# @require_login
# @require_role("Admin")
def list_users():
    """
    List all users (Admin only)
    ---
    tags:
      - Users
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
                example: 1
              login_id:
                type: string
                example: "user123"
              full_name:
                type: string
                example: "John Doe"
              role:
                type: string
                example: "User"
              email:
                type: string
                example: "john@example.com"
              employee_id:
                type: string
                example: "EMP001"
              is_active:
                type: boolean
                example: true
              created_at:
                type: string
                format: date-time
                example: "2025-12-20T10:30:00"
      401:
        description: Unauthorized - Authentication required
      403:
        description: Forbidden - Admin role required
    """
    from ..middleware.rbac_middleware import RBACMiddleware
    from flask import g
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
# @require_login
# @require_role("Admin")
# @require_csrf
def update_user(user_id):
    """
    Update user details (Admin only)
    ---
    tags:
      - Users
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
# @require_login
# @require_role("Admin")
# @require_csrf
def change_password(user_id):
    """
    Change user password (Admin only)
    ---
    tags:
      - Users
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
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Password is required"
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