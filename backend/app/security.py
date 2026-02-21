import secrets
from flask import current_app, request

def generate_csrf_token():
    return secrets.token_urlsafe(32)

def get_csrf_cookie_name():
    return current_app.config["CSRF_COOKIE_NAME"]

def verify_csrf():
    cookie_name = get_csrf_cookie_name()
    cookie_val = request.cookies.get(cookie_name)
    header_val = request.headers.get("X-CSRFToken")
    return cookie_val and header_val and cookie_val == header_val
