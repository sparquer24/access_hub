"""
Legacy session-based authentication routes (v1)
These endpoints use server-side sessions instead of JWT tokens.
"""

from flask import Blueprint, jsonify, request, session
from ...extensions import db, bcrypt
from ...models import UserDetails

bp = Blueprint("auth_legacy", __name__)

@bp.post("/api/login")
def login():
    """
    Legacy login endpoint (session-based)
    ---
    tags:
      - Authentication (Legacy)
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - password
          properties:
            login_id:
              type: string
              example: "johndoe"
              description: Username (alternative to email)
            username:
              type: string
              example: "johndoe"
              description: Username (alternative to login_id)
            email:
              type: string
              format: email
              example: "john@example.com"
              description: Email (alternative to login_id)
            password:
              type: string
              format: password
              example: "SecurePassword123"
    responses:
      200:
        description: Login successful - session established
        schema:
          type: object
          properties:
            user_id:
              type: integer
            login_id:
              type: string
            role:
              type: string
      401:
        description: Invalid credentials
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Invalid credentials"
    """
    data = request.get_json() or {}
    login_id = data.get("login_id") or data.get("username") or data.get("email")
    password = data.get("password")
    
    if not login_id or not password:
        return jsonify({"message": "login_id/username and password required"}), 400

    user = UserDetails.query.filter_by(login_id=login_id).first()
    
    if not user or not user.is_active:
        return jsonify({"message": "Invalid credentials"}), 401

    if not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    # Success → set server-side session for this client
    session["user_id"]  = user.id
    session["login_id"] = user.login_id
    session["role"]     = user.role

    return jsonify({
        "user_id": user.id,
        "login_id": user.login_id,
        "role": user.role
    }), 200


@bp.get("/api/logout")
def logout():
    """
    Legacy logout endpoint (session-based)
    ---
    tags:
      - Authentication (Legacy)
    responses:
      200:
        description: Logout successful
        schema:
          type: object
          properties:
            message:
              type: string
              example: "ok"
    """
    session.clear()
    return jsonify({"message": "ok"}), 200


@bp.get("/api/me")
def me():
    """
    Get current session user
    ---
    tags:
      - Authentication (Legacy)
    responses:
      200:
        description: Current user info
        schema:
          type: object
          properties:
            authenticated:
              type: boolean
            user_id:
              type: integer
            login_id:
              type: string
            role:
              type: string
            full_name:
              type: string
    """
    if not session.get("user_id"):
        return jsonify({"authenticated": False}), 200
    
    user = UserDetails.query.get(session["user_id"])
    return jsonify({
        "authenticated": True,
        "user_id": session["user_id"],
        "login_id": session["login_id"],
        "role": session["role"],
        "full_name": user.full_name if user else None,
    }), 200
