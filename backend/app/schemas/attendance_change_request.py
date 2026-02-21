"""
Schemas for Attendance Change Request validation.
"""

# Request type choices
REQUEST_TYPES = ['manual_checkin', 'time_correction', 'status_change']

# Status choices
STATUS_CHOICES = ['pending', 'approved', 'rejected']


ATTENDANCE_CHANGE_REQUEST_SCHEMA = {
    'required': ['request_date', 'request_type', 'requested_changes', 'reason'],
    'properties': {
        'request_date': {
            'type': 'string',
            'format': 'date',
            'description': 'Date for which attendance correction is requested (YYYY-MM-DD)'
        },
        'request_type': {
            'type': 'string',
            'allowed_values': REQUEST_TYPES,
            'description': 'Type of change request'
        },
        'requested_changes': {
            'type': 'object',
            'description': 'JSON object with requested changes (e.g., check_in_time, check_out_time, status)'
        },
        'reason': {
            'type': 'string',
            'min_length': 10,
            'max_length': 500,
            'description': 'Explanation for the attendance correction request'
        },
        'attendance_record_id': {
            'type': 'string',
            'description': 'ID of existing attendance record (optional, for corrections)'
        }
    }
}


ATTENDANCE_CHANGE_REQUEST_UPDATE_SCHEMA = {
    'properties': {
        'requested_changes': {
            'type': 'object',
            'description': 'JSON object with requested changes'
        },
        'reason': {
            'type': 'string',
            'min_length': 10,
            'max_length': 500,
            'description': 'Explanation for the attendance correction request'
        }
    }
}


ATTENDANCE_CHANGE_REQUEST_APPROVAL_SCHEMA = {
    'required': ['status'],
    'properties': {
        'status': {
            'type': 'string',
            'allowed_values': ['approved', 'rejected'],
            'description': 'Approval decision'
        },
        'approval_notes': {
            'type': 'string',
            'max_length': 500,
            'description': 'Optional notes from approver'
        }
    }
}


ATTENDANCE_CHANGE_REQUEST_LIST_SCHEMA = {
    'properties': {
        'employee_id': {
            'type': 'string',
            'description': 'Filter by employee ID'
        },
        'status': {
            'type': 'string',
            'allowed_values': STATUS_CHOICES + ['all'],
            'description': 'Filter by request status'
        },
        'request_type': {
            'type': 'string',
            'allowed_values': REQUEST_TYPES + ['all'],
            'description': 'Filter by request type'
        },
        'start_date': {
            'type': 'string',
            'format': 'date',
            'description': 'Filter from this request date (YYYY-MM-DD)'
        },
        'end_date': {
            'type': 'string',
            'format': 'date',
            'description': 'Filter until this request date (YYYY-MM-DD)'
        },
        'page': {
            'type': 'integer',
            'min_value': 1,
            'description': 'Page number for pagination'
        },
        'per_page': {
            'type': 'integer',
            'min_value': 1,
            'max_value': 100,
            'description': 'Results per page'
        }
    }
}
