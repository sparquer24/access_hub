# CRUD API Implementation Summary

This document summarizes the complete CRUD API implementation for all VMS backend modules.

## Implemented Modules

All modules follow the established pattern from the Organizations module with the following features:
- JWT authentication (`@jwt_required()`)
- RBAC middleware (`@require_permission()`)
- Request/Response validation
- Swagger documentation
- Error handling
- Pagination support
- Tenant isolation (organization_id filtering)
- Soft delete support (where applicable)

---

## 1. Locations Module

**Service:** `vms_backend/app/services/location_service.py`
**Routes:** `vms_backend/app/api/locations/routes.py`

### Endpoints:
- `POST /api/v2/locations` - Create location
- `GET /api/v2/locations` - List locations (with pagination & filters)
- `GET /api/v2/locations/:id` - Get location by ID
- `PUT /api/v2/locations/:id` - Update location
- `DELETE /api/v2/locations/:id` - Delete location (soft delete)

### Features:
- Unique constraint: organization_id + name
- Tenant isolation by organization_id
- Search by name, building, area
- Filter by location_type, is_active

---

## 2. Departments Module

**Service:** `vms_backend/app/services/department_service.py`
**Routes:** `vms_backend/app/api/departments/routes.py`

### Endpoints:
- `POST /api/v2/departments` - Create department
- `GET /api/v2/departments` - List departments (with pagination & filters)
- `GET /api/v2/departments/:id` - Get department by ID
- `PUT /api/v2/departments/:id` - Update department
- `DELETE /api/v2/departments/:id` - Delete department (soft delete)

### Features:
- Unique constraint: organization_id + code
- Tenant isolation by organization_id
- Search by name, code, description
- Filter by is_active
- Code field is immutable after creation

---

## 3. Shifts Module

**Service:** `vms_backend/app/services/shift_service.py`
**Routes:** `vms_backend/app/api/shifts/routes.py`

### Endpoints:
- `POST /api/v2/shifts` - Create shift
- `GET /api/v2/shifts` - List shifts (with pagination & filters)
- `GET /api/v2/shifts/:id` - Get shift by ID
- `PUT /api/v2/shifts/:id` - Update shift
- `DELETE /api/v2/shifts/:id` - Delete shift (hard delete)

### Features:
- Unique constraint: organization_id + name
- Tenant isolation by organization_id
- Search by name
- Filter by is_active
- No soft delete (hard delete only)

---

## 4. Employees Module

**Service:** `vms_backend/app/services/employee_service.py`
**Routes:** `vms_backend/app/api/employees/routes.py`

### Endpoints:
- `POST /api/v2/employees` - Create employee
- `GET /api/v2/employees` - List employees (with pagination & filters)
- `GET /api/v2/employees/:id` - Get employee by ID
- `PUT /api/v2/employees/:id` - Update employee
- `DELETE /api/v2/employees/:id` - Delete employee (soft delete)
- `GET /api/v2/employees/:id/attendance` - Get employee attendance records

### Features:
- Unique constraint: organization_id + employee_code
- One-to-one relationship with User
- Tenant isolation by organization_id
- Search by full_name, employee_code, phone_number
- Filter by department_id, employment_type, is_active
- Employee code and user_id are immutable after creation
- Special endpoint for fetching attendance history

---

## 5. Cameras Module

**Service:** `vms_backend/app/services/camera_service.py`
**Routes:** `vms_backend/app/api/cameras/routes.py`

### Endpoints:
- `POST /api/v2/cameras` - Create camera
- `GET /api/v2/cameras` - List cameras (with pagination & filters)
- `GET /api/v2/cameras/:id` - Get camera by ID
- `PUT /api/v2/cameras/:id` - Update camera
- `DELETE /api/v2/cameras/:id` - Delete camera (soft delete)
- `POST /api/v2/cameras/:id/heartbeat` - Update camera heartbeat status

### Features:
- Unique constraint: organization_id + name
- Tenant isolation by organization_id
- Search by name
- Filter by location_id, camera_type, status, is_active
- Heartbeat endpoint for camera health monitoring
- Status tracking: online, offline, error

---

## 6. Attendance Module

**Service:** `vms_backend/app/services/attendance_service.py`
**Routes:** `vms_backend/app/api/attendance/routes.py`

### Endpoints:
- `POST /api/v2/attendance/check-in` - Employee check-in
- `POST /api/v2/attendance/check-out` - Employee check-out
- `GET /api/v2/attendance` - List attendance records (with pagination & filters)
- `GET /api/v2/attendance/:id` - Get attendance record by ID
- `PUT /api/v2/attendance/:id` - Update attendance record
- `DELETE /api/v2/attendance/:id` - Delete attendance record
- `POST /api/v2/attendance/:id/approve` - Approve/reject attendance

### Features:
- Unique constraint: employee_id + date (one record per day)
- Tenant isolation by organization_id
- Automatic work hours calculation on check-out
- Check-in/check-out validation (prevents duplicates)
- Search by employee name or code
- Filter by employee_id, department_id, date range, status, review_status
- Support for face recognition confidence and liveness verification
- Approval workflow (auto_approved, pending, approved, rejected)

---

## 7. Leave Requests Module

**Service:** `vms_backend/app/services/leave_service.py`
**Routes:** `vms_backend/app/api/leaves/routes.py`

### Endpoints:
- `POST /api/v2/leaves` - Create leave request
- `GET /api/v2/leaves` - List leave requests (with pagination & filters)
- `GET /api/v2/leaves/:id` - Get leave request by ID
- `PUT /api/v2/leaves/:id` - Update leave request (only pending)
- `DELETE /api/v2/leaves/:id` - Delete leave request (only pending)
- `POST /api/v2/leaves/:id/approve` - Approve leave request
- `POST /api/v2/leaves/:id/reject` - Reject leave request

### Features:
- Tenant isolation by organization_id
- Overlap detection (prevents conflicting leave requests)
- Date validation (end_date must be after start_date)
- Search by employee name or code
- Filter by employee_id, department_id, leave_type, status, date range
- Only pending requests can be updated or deleted
- Approval/rejection workflow with notes
- Leave types: sick, casual, earned, unpaid

---

## Common Patterns Used

### Service Layer Structure:
- `create_<resource>(data)` - Creates new resource
- `get_<resource>(id)` - Retrieves single resource by ID
- `list_<resources>(filters, organization_id)` - Lists resources with filters
- `update_<resource>(id, data)` - Updates existing resource
- `delete_<resource>(id, soft_delete=True)` - Deletes resource

### Route Structure:
- POST / - Create
- GET / - List (with pagination)
- GET /:id - Get by ID
- PUT /:id - Update
- DELETE /:id - Delete

### Error Handling:
- `NotFoundError` - Resource not found (404)
- `ConflictError` - Unique constraint violation (409)
- `BadRequestError` - Invalid request data (400)
- `ForbiddenError` - Insufficient permissions (403)

### Validation:
- Request validation: `@validate_request(Schema)`
- Query validation: `@validate_query(Schema)`
- Marshmallow schemas for all endpoints

### Authorization:
- JWT authentication on all endpoints
- Permission-based access control
- Tenant isolation (users can only access their organization's data)

---

## Blueprint Registration

All blueprints are registered in `vms_backend/app/__init__.py`:

```python
from .api.locations.routes import bp as locations_v2_bp
app.register_blueprint(locations_v2_bp)

from .api.departments.routes import bp as departments_v2_bp
app.register_blueprint(departments_v2_bp)

from .api.shifts.routes import bp as shifts_v2_bp
app.register_blueprint(shifts_v2_bp)

from .api.employees.routes import bp as employees_v2_bp
app.register_blueprint(employees_v2_bp)

from .api.cameras.routes import bp as cameras_v2_bp
app.register_blueprint(cameras_v2_bp)

from .api.attendance.routes import bp as attendance_v2_bp
app.register_blueprint(attendance_v2_bp)

from .api.leaves.routes import bp as leaves_v2_bp
app.register_blueprint(leaves_v2_bp)
```

---

## Swagger Documentation

All endpoints are documented with Swagger/OpenAPI. Tags have been added for:
- Organizations
- Locations
- Departments
- Shifts
- Employees
- Cameras
- Attendance
- Leave Requests

Access the API documentation at: `http://localhost:5001/api/docs/`

---

## Testing

To test the APIs:

1. Start the server: `python run.py`
2. Access Swagger UI: `http://localhost:5001/api/docs/`
3. Authenticate using JWT token (Bearer {token})
4. Test each endpoint with sample data

---

## Files Created

### Services:
- `vms_backend/app/services/location_service.py`
- `vms_backend/app/services/department_service.py`
- `vms_backend/app/services/shift_service.py`
- `vms_backend/app/services/employee_service.py`
- `vms_backend/app/services/camera_service.py`
- `vms_backend/app/services/attendance_service.py`
- `vms_backend/app/services/leave_service.py`

### Routes:
- `vms_backend/app/api/locations/__init__.py`
- `vms_backend/app/api/locations/routes.py`
- `vms_backend/app/api/departments/__init__.py`
- `vms_backend/app/api/departments/routes.py`
- `vms_backend/app/api/shifts/__init__.py`
- `vms_backend/app/api/shifts/routes.py`
- `vms_backend/app/api/employees/__init__.py`
- `vms_backend/app/api/employees/routes.py`
- `vms_backend/app/api/cameras/__init__.py`
- `vms_backend/app/api/cameras/routes.py`
- `vms_backend/app/api/attendance/__init__.py`
- `vms_backend/app/api/attendance/routes.py`
- `vms_backend/app/api/leaves/__init__.py`
- `vms_backend/app/api/leaves/routes.py`

### Modified:
- `vms_backend/app/__init__.py` - Registered all new blueprints and updated Swagger tags

---

## Notes

1. All modules follow the exact pattern established in the Organizations module
2. Tenant isolation is implemented via organization_id filtering from current user context
3. Soft delete is supported where applicable (using deleted_at field)
4. Unique constraints are checked before create/update operations
5. Work hours calculation is automatic on attendance check-out
6. Leave request overlap detection prevents conflicting requests
7. All endpoints include comprehensive Swagger documentation
8. Error handling uses standardized exception classes

---

## Next Steps

1. Write unit tests for all services
2. Write integration tests for all routes
3. Add rate limiting for public endpoints
4. Implement caching for frequently accessed data
5. Add bulk operations endpoints (e.g., bulk employee import)
6. Implement export functionality (CSV, Excel)
7. Add notification system for leave approvals and attendance alerts
