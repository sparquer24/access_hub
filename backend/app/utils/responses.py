"""
Standardized API response utilities.
"""
from flask import jsonify
from typing import Any, Dict, Optional
from datetime import datetime, date
from decimal import Decimal


def success_response(data: Any = None, message: str = "Success", status_code: int = 200, pagination: Optional[Dict] = None):
    """
    Return a standardized success response.
    
    Args:
        data: The response data (dict, list, etc.)
        message: Success message
        status_code: HTTP status code
        pagination: Pagination info for list responses
    """
    response = {
        "success": True,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    }
    
    if data is not None:
        response["data"] = serialize_data(data)
    
    if pagination:
        response["pagination"] = pagination
    
    return jsonify(response), status_code


def error_response(message: str, status_code: int = 400, errors: Optional[Dict] = None, error_type: Optional[str] = None):
    """
    Return a standardized error response.
    
    Args:
        message: Error message
        status_code: HTTP status code
        errors: Additional error details
        error_type: Type of error for client handling
    """
    response = {
        "success": False,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    }
    
    if errors:
        response["errors"] = errors
    
    if error_type:
        response["error_type"] = error_type
    
    return jsonify(response), status_code


def created_response(data: Any = None, message: str = "Resource created successfully", location: Optional[str] = None):
    """
    Return a created response (201).
    
    Args:
        data: The created resource data
        message: Success message
        location: Location header for the new resource
    """
    response = {
        "success": True,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    }
    
    if data is not None:
        response["data"] = serialize_data(data)
    
    flask_response = jsonify(response)
    flask_response.status_code = 201
    
    if location:
        flask_response.headers['Location'] = location
    
    return flask_response


def paginated_response(data: Any, page: int, per_page: int, total: int, message: str = "Data retrieved successfully"):
    """
    Return a paginated response.
    
    Args:
        data: The paginated data
        page: Current page number
        per_page: Items per page
        total: Total number of items
        message: Success message
    """
    pagination = {
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
        'has_prev': page > 1,
        'has_next': page * per_page < total
    }
    
    return success_response(data=data, message=message, pagination=pagination)


def serialize_data(obj):
    """Serialize complex data types for JSON response"""
    if isinstance(obj, dict):
        return {key: serialize_data(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [serialize_data(item) for item in obj]
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif hasattr(obj, '__dict__') and not obj.__dict__.get('_sa_instance_state'):
        # Handle objects with __dict__ but not SQLAlchemy models
        return serialize_data(obj.__dict__)
    elif hasattr(obj, '_sa_instance_state'):
        # Handle SQLAlchemy models specifically
        result = {}
        for key, value in obj.__dict__.items():
            if not key.startswith('_'):
                result[key] = serialize_data(value)
        return result
    else:
        return obj


def validation_error_response(errors: Dict, message: str = "Validation failed"):
    """
    Return a validation error response.
    
    Args:
        errors: Dictionary of field-level errors
        message: General validation error message
    """
    return error_response(message, 422, errors)


def paginated_response(items: list, page: int, per_page: int, total: int, message: str = "Success"):
    """
    Return a paginated response.
    
    Args:
        items: List of items for current page
        page: Current page number
        per_page: Items per page
        total: Total number of items
        message: Success message
    """
    response = {
        "success": True,
        "message": message,
        "data": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page if per_page > 0 else 0
        }
    }
    return jsonify(response), 200


def created_response(data: Any, message: str = "Resource created successfully"):
    """Return a 201 Created response"""
    return success_response(data, message, 201)


def no_content_response():
    """Return a 204 No Content response"""
    return '', 204


def unauthorized_response(message: str = "Authentication required"):
    """Return a 401 Unauthorized response"""
    return error_response(message, 401)


def forbidden_response(message: str = "Access forbidden"):
    """Return a 403 Forbidden response"""
    return error_response(message, 403)


def not_found_response(message: str = "Resource not found"):
    """Return a 404 Not Found response"""
    return error_response(message, 404)
