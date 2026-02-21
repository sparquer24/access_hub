"""
Input validation utilities.
"""
import re
from datetime import datetime
from uuid import UUID


def validate_email(email):
    """Validate email format"""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """Validate phone number format"""
    if not phone:
        return False
    # Remove common formatting characters
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    # Check if it contains only digits and is between 10-15 characters
    return cleaned.isdigit() and 10 <= len(cleaned) <= 15


def validate_date(date_string, format='%Y-%m-%d'):
    """Validate date string format"""
    try:
        datetime.strptime(date_string, format)
        return True
    except (ValueError, TypeError):
        return False


def validate_uuid(uuid_string):
    """Validate UUID format"""
    try:
        UUID(uuid_string)
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present in data.
    Returns (is_valid, missing_fields)
    """
    missing = [field for field in required_fields if field not in data or data[field] is None]
    return len(missing) == 0, missing


def validate_choice(value, choices):
    """Validate that value is in allowed choices"""
    return value in choices


def validate_length(value, min_length=None, max_length=None):
    """Validate string length"""
    if not isinstance(value, str):
        return False
    length = len(value)
    if min_length and length < min_length:
        return False
    if max_length and length > max_length:
        return False
    return True


def validate_number_range(value, min_value=None, max_value=None):
    """Validate number is within range"""
    try:
        num = float(value)
        if min_value is not None and num < min_value:
            return False
        if max_value is not None and num > max_value:
            return False
        return True
    except (ValueError, TypeError):
        return False
