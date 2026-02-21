"""
Validation utilities for API endpoints
"""

from functools import wraps
from flask import request, jsonify
import re
from datetime import datetime


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """Validate phone number format"""
    if not phone:
        return True  # Phone is optional in most cases
    # Remove all non-digit characters for validation
    digits_only = re.sub(r'[^\d]', '', phone)
    return len(digits_only) >= 10


def validate_date(date_string):
    """Validate date format (YYYY-MM-DD)"""
    try:
        datetime.strptime(date_string, '%Y-%m-%d')
        return True
    except ValueError:
        return False


def validate_json_schema(schema):
    """
    Decorator to validate JSON request body against a schema
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'status': 'error',
                    'message': 'Request must be JSON'
                }), 400
            
            data = request.get_json()
            if not data:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid JSON data'
                }), 400
            
            # Validate required fields
            if 'required' in schema:
                missing_fields = []
                for field in schema['required']:
                    if field not in data or data[field] is None or data[field] == '':
                        missing_fields.append(field)
                
                if missing_fields:
                    return jsonify({
                        'status': 'error',
                        'message': f'Missing required fields: {", ".join(missing_fields)}'
                    }), 400
            
            # Validate field types and formats
            if 'fields' in schema:
                validation_errors = []
                
                for field_name, field_config in schema['fields'].items():
                    if field_name in data:
                        value = data[field_name]
                        field_type = field_config.get('type')
                        
                        # Type validation
                        if field_type == 'email' and not validate_email(value):
                            validation_errors.append(f'{field_name} must be a valid email address')
                        elif field_type == 'phone' and not validate_phone(value):
                            validation_errors.append(f'{field_name} must be a valid phone number')
                        elif field_type == 'date' and not validate_date(value):
                            validation_errors.append(f'{field_name} must be in YYYY-MM-DD format')
                        elif field_type == 'string' and not isinstance(value, str):
                            validation_errors.append(f'{field_name} must be a string')
                        elif field_type == 'integer' and not isinstance(value, int):
                            validation_errors.append(f'{field_name} must be an integer')
                        
                        # Length validation
                        if 'min_length' in field_config and len(str(value)) < field_config['min_length']:
                            validation_errors.append(f'{field_name} must be at least {field_config["min_length"]} characters')
                        if 'max_length' in field_config and len(str(value)) > field_config['max_length']:
                            validation_errors.append(f'{field_name} must be at most {field_config["max_length"]} characters')
                        
                        # Value validation
                        if 'allowed_values' in field_config and value not in field_config['allowed_values']:
                            validation_errors.append(f'{field_name} must be one of: {", ".join(field_config["allowed_values"])}')
                
                if validation_errors:
                    return jsonify({
                        'status': 'error',
                        'message': 'Validation errors',
                        'errors': validation_errors
                    }), 400
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Common validation schemas
LEAVE_APPLICATION_SCHEMA = {
    'required': ['leave_type', 'start_date', 'end_date', 'reason'],
    'fields': {
        'leave_type': {
            'type': 'string',
            'allowed_values': ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave']
        },
        'start_date': {'type': 'date'},
        'end_date': {'type': 'date'},
        'reason': {
            'type': 'string',
            'min_length': 10,
            'max_length': 500
        }
    }
}

PROFILE_UPDATE_SCHEMA = {
    'required': ['first_name', 'last_name'],
    'fields': {
        'first_name': {
            'type': 'string',
            'min_length': 1,
            'max_length': 50
        },
        'last_name': {
            'type': 'string',
            'min_length': 1,
            'max_length': 50
        },
        'phone': {'type': 'phone'},
        'position': {
            'type': 'string',
            'max_length': 100
        }
    }
}

LEAVE_APPROVAL_SCHEMA = {
    'fields': {
        'comments': {
            'type': 'string',
            'max_length': 500
        }
    }
}