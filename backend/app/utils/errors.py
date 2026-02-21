"""
Centralized error handlers for the application
"""

from flask import jsonify, request
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
import logging

logger = logging.getLogger(__name__)


def register_error_handlers(app):
    """Register all error handlers with the Flask app"""
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        logger.warning(f"Validation error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'validation_error'
        }), 400
    
    @app.errorhandler(AuthenticationError)
    def handle_authentication_error(e):
        logger.warning(f"Authentication error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'authentication_error'
        }), 401
    
    @app.errorhandler(AuthorizationError)
    def handle_authorization_error(e):
        logger.warning(f"Authorization error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'authorization_error'
        }), 403
    
    @app.errorhandler(ResourceNotFoundError)
    def handle_not_found_error(e):
        logger.info(f"Resource not found: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'not_found_error'
        }), 404
    
    @app.errorhandler(ConflictError)
    def handle_conflict_error(e):
        logger.warning(f"Conflict error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'error_type': 'conflict_error'
        }), 409
    
    @app.errorhandler(IntegrityError)
    def handle_integrity_error(e):
        logger.error(f"Database integrity error: {str(e)}")
        # Common integrity errors
        if "UNIQUE constraint failed" in str(e) or "duplicate key value" in str(e):
            return jsonify({
                'status': 'error',
                'message': 'This record already exists',
                'error_type': 'integrity_error'
            }), 409
        elif "FOREIGN KEY constraint failed" in str(e):
            return jsonify({
                'status': 'error',
                'message': 'Referenced record does not exist',
                'error_type': 'integrity_error'
            }), 400
        else:
            return jsonify({
                'status': 'error',
                'message': 'Database constraint violation',
                'error_type': 'integrity_error'
            }), 400
    
    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(e):
        logger.error(f"Database error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Database operation failed',
            'error_type': 'database_error'
        }), 500
    
    @app.errorhandler(InvalidTokenError)
    def handle_invalid_token_error(e):
        logger.warning(f"Invalid token: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Invalid authentication token',
            'error_type': 'invalid_token'
        }), 401
    
    @app.errorhandler(ExpiredSignatureError)
    def handle_expired_token_error(e):
        logger.warning(f"Expired token: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Authentication token has expired',
            'error_type': 'expired_token'
        }), 401
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Handle standard HTTP exceptions"""
        logger.info(f"HTTP exception: {e.code} - {e.description}")
        return jsonify({
            'status': 'error',
            'message': e.description,
            'error_type': 'http_error'
        }), e.code
    
    @app.errorhandler(Exception)
    def handle_generic_exception(e):
        """Handle any unhandled exceptions"""
        logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        
        # Don't expose internal error details in production
        if app.debug:
            return jsonify({
                'status': 'error',
                'message': str(e),
                'error_type': 'internal_error'
            }), 500
        else:
            return jsonify({
                'status': 'error',
                'message': 'An internal server error occurred',
                'error_type': 'internal_error'
            }), 500
    
    @app.before_request
    def log_request_info():
        """Log request information for debugging"""
        if app.debug:
            logger.debug(f"{request.method} {request.url} - IP: {request.remote_addr}")
    
    @app.after_request
    def log_response_info(response):
        """Log response information for debugging"""
        if app.debug:
            logger.debug(f"Response: {response.status_code}")
        return response


# Custom exception classes
class ValidationError(Exception):
    """Raised when request validation fails"""
    pass


class AuthenticationError(Exception):
    """Raised when authentication fails"""
    pass


class AuthorizationError(Exception):
    """Raised when user doesn't have permission for the requested action"""
    pass


class ResourceNotFoundError(Exception):
    """Raised when a requested resource is not found"""
    pass


class ConflictError(Exception):
    """Raised when there's a conflict with the current state of the resource"""
    pass


# Utility functions for raising errors
def require_resource(resource, message="Resource not found"):
    """Raise ResourceNotFoundError if resource is None"""
    if resource is None:
        raise ResourceNotFoundError(message)
    return resource


def require_permission(condition, message="Access denied"):
    """Raise AuthorizationError if condition is False"""
    if not condition:
        raise AuthorizationError(message)


def validate_condition(condition, message="Invalid request"):
    """Raise ValidationError if condition is False"""
    if not condition:
        raise ValidationError(message)