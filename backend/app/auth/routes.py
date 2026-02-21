from flask import Blueprint, jsonify, request, session
from ..extensions import db, bcrypt
from ..models import UserDetails
from ..middleware import require_csrf

bp = Blueprint("auth", __name__)

@bp.post("/api/login")
def login():
    """Legacy login endpoint. Does not require CSRF because it authenticates
    with credentials and establishes a server-side session.
    Accepts either `login_id` or `username` for compatibility with newer clients.
    """
    data = request.get_json() or {}
    login_id = data.get("login_id") or data.get("username") or data.get("email")
    password = data.get("password")
    if not login_id or not password:
        return jsonify({"message": "login_id/username and password required"}), 400

    user = UserDetails.query.filter_by(login_id=login_id).first()
    print(user, '<<<<<<<<<<<<')
    if not user or not user.is_active:
        return jsonify({"message": "Invalid credentials"}), 401

    if not bcrypt.check_password_hash(user.password_hash, password):
        print('password mismatch')
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
    session.clear()
    return jsonify({"message": "ok"}), 200

@bp.get("/api/me")
def me():
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
