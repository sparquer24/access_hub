"""
Custom exceptions for the VMS application.
"""


class APIException(Exception):
    """Base exception for API errors"""
    status_code = 400
    
    def __init__(self, message, status_code=None, payload=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload
    
    def to_dict(self):
        rv = dict(self.payload or ())
        rv['success'] = False
        rv['message'] = self.message
        return rv


class ValidationError(APIException):
    """Validation error (400)"""
    status_code = 400


class UnauthorizedError(APIException):
    """Unauthorized error (401)"""
    status_code = 401
    
    def __init__(self, message='Unauthorized'):
        super().__init__(message, 401)


class ForbiddenError(APIException):
    """Forbidden error (403)"""
    status_code = 403
    
    def __init__(self, message='Forbidden'):
        super().__init__(message, 403)


class NotFoundError(APIException):
    """Not found error (404)"""
    status_code = 404
    
    def __init__(self, resource='Resource'):
        super().__init__(f'{resource} not found', 404)


class ConflictError(APIException):
    """Conflict error (409)"""
    status_code = 409
    
    def __init__(self, message='Resource already exists'):
        super().__init__(message, 409)


class InternalServerError(APIException):
    """Internal server error (500)"""
    status_code = 500
    
    def __init__(self, message='Internal server error'):
        super().__init__(message, 500)


# Aliases for backward compatibility
AuthenticationError = UnauthorizedError
AuthorizationError = ForbiddenError
ResourceNotFound = NotFoundError
BadRequestError = ValidationError