"""
Utility helper functions for the VMS application.
"""

from flask import jsonify, request
from functools import wraps
from marshmallow import ValidationError as MarshmallowValidationError
from .exceptions import ValidationError


def success_response(data=None, message='Success', status_code=200):
    """Create a success response"""
    response = {
        'success': True,
        'message': message
    }
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code


def error_response(message='Error', status_code=400, errors=None):
    """Create an error response"""
    response = {
        'success': False,
        'message': message
    }
    if errors:
        response['errors'] = errors
    return jsonify(response), status_code


def paginate(query, page, per_page, schema=None):
    """
    Paginate a SQLAlchemy query and return formatted response.
    
    Args:
        query: SQLAlchemy query object
        page: Current page number
        per_page: Items per page
        schema: Marshmallow schema for serialization (optional)
    
    Returns:
        dict: Paginated response with items, pagination metadata
    """
    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    # Serialize items
    if schema:
        # Handle cases where items are tuples (e.g., with counts)
        processed_items = []
        for item in pagination.items:
            if isinstance(item, tuple):
                # First element is the model, rest are counts
                obj = item[0]
                obj_dict = schema().dump(obj)
                
                # Add count fields if they exist
                # Order: employees_count, cameras_count, locations_count, departments_count
                if len(item) > 1:
                    obj_dict['employees_count'] = int(item[1]) if item[1] is not None else 0
                if len(item) > 2:
                    obj_dict['cameras_count'] = int(item[2]) if item[2] is not None else 0
                if len(item) > 3:
                    obj_dict['locations_count'] = int(item[3]) if item[3] is not None else 0
                if len(item) > 4:
                    obj_dict['departments_count'] = int(item[4]) if item[4] is not None else 0
                
                processed_items.append(obj_dict)
            else:
                processed_items.append(schema().dump(item))
        items = processed_items
    else:
        items = [item.to_dict() if hasattr(item, 'to_dict') else item for item in pagination.items]
    
    return {
        'items': items,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total_items': pagination.total,
            'total_pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }


def validate_request(schema_class):
    """
    Decorator to validate request data using a Marshmallow schema.
    
    Usage:
        @validate_request(MySchema)
        def my_route():
            # request.validated_data will contain the validated data
            pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            schema = schema_class()
            
            # Get request data
            if request.is_json:
                data = request.get_json()
            elif request.method == 'GET':
                data = request.args.to_dict()
            else:
                data = request.form.to_dict()
            
            # Validate data
            try:
                validated_data = schema.load(data)
                request.validated_data = validated_data
            except MarshmallowValidationError as err:
                raise ValidationError('Validation failed', payload={'errors': err.messages})
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def validate_query(schema_class):
    """
    Decorator to validate query parameters using a Marshmallow schema.
    
    Usage:
        @validate_query(MyFilterSchema)
        def my_route():
            # request.validated_query will contain the validated query params
            pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            schema = schema_class()
            
            # Get query parameters
            data = request.args.to_dict()
            
            # Convert known boolean fields
            for field in data:
                if data[field].lower() in ['true', 'false']:
                    data[field] = data[field].lower() == 'true'
            
            # Validate data
            try:
                validated_query = schema.load(data)
                request.validated_query = validated_query
            except MarshmallowValidationError as err:
                raise ValidationError('Invalid query parameters', payload={'errors': err.messages})
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def get_current_user():
    """Get current authenticated user from request context"""
    from flask import g
    return getattr(g, 'current_user', None)


def get_current_org_id():
    """Get current organization ID from request context"""
    from flask import g
    user = get_current_user()
    if user:
        return getattr(user, 'organization_id', None)
    return None