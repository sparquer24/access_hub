from flask import Blueprint, jsonify, make_response
from ..security import generate_csrf_token, get_csrf_cookie_name

bp = Blueprint("common", __name__)

@bp.get("/healthz")
def health():
    return jsonify({"status": "ok"})

@bp.get("/api/csrf")
def csrf():
    """Issues a CSRF token via JSON and sets it in a readable cookie."""
    token = generate_csrf_token()
    resp = make_response(jsonify({"csrfToken": token}))
    resp.set_cookie(
        get_csrf_cookie_name(),
        token,
        httponly=False,   # FE needs to read it and send X-CSRFToken
        samesite="Lax",
        secure=False      # set True behind HTTPS in prod
    )
    return resp
