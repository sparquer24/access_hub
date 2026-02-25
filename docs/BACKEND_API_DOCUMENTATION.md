# VMS (Visitor Management System) API Documentation

## Overview
This is a comprehensive, production-grade API for a Visitor Management System with multi-tenant support, role-based access control (RBAC), attendance tracking, face recognition, and complete audit trails.

**Base URL:** `http://localhost:5001`  
**API Version:** 2.0  
**Authentication:** JWT Bearer Token  
**Swagger Documentation:** `http://localhost:5001/api/docs/`

---

## Table of Contents
1. [Authentication & Authorization](#1-authentication--authorization)
2. [User Management](#2-user-management)
3. [Organization Management](#3-organization-management)
4. [Location Management](#4-location-management)
5. [Department Management](#5-department-management)
6. [Shift Management](#6-shift-management)
7. [Employee Management](#7-employee-management)
8. [Camera Management](#8-camera-management)
9. [Attendance Tracking](#9-attendance-tracking)
10. [Leave Management](#10-leave-management)
11. [Role Management](#11-role-management)
12. [Audit Logs](#12-audit-logs)
13. [Visitor Management (Legacy)](#13-visitor-management-legacy)
14. [Analytics & Statistics](#14-analytics--statistics)

---

## 1. Authentication & Authorization

### 1.1 Login
**POST** `/api/v2/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@vms.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@vms.com",
      "username": "admin",
      "role": "super_admin",
      "organization_id": "org-uuid"
    }
  }
}
```

### 1.2 Logout
**POST** `/api/v2/auth/logout`

Invalidate current JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

### 1.3 Refresh Token
**POST** `/api/v2/auth/refresh`

Get new access token using refresh token.

### 1.4 Get Current User
**GET** `/api/v2/auth/me`

Get authenticated user details.

### 1.5 Change Password
**POST** `/api/v2/auth/change-password`

Change password for authenticated user.

### 1.6 Forgot Password
**POST** `/api/v2/auth/forgot-password`

Request password reset email.

### 1.7 Reset Password
**POST** `/api/v2/auth/reset-password`

Reset password using token from email.

---

## 2. User Management

### 2.1 Create User
**POST** `/api/v2/users`

**Permission Required:** `users:create`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "role_id": "role-uuid",
  "organization_id": "org-uuid",
  "is_active": true
}
```

### 2.2 List Users
**GET** `/api/v2/users?page=1&per_page=20&search=john&is_active=true`

**Permission Required:** `users:read`

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20, max: 100)
- `search` (string): Search by username or email
- `organization_id` (string): Filter by organization
- `role_id` (string): Filter by role
- `is_active` (boolean): Filter by active status

### 2.3 Get User
**GET** `/api/v2/users/{user_id}`

**Permission Required:** `users:read`

### 2.4 Update User
**PUT** `/api/v2/users/{user_id}`

**Permission Required:** `users:update`

### 2.5 Delete User
**DELETE** `/api/v2/users/{user_id}`

**Permission Required:** `users:delete`

### 2.6 Activate/Deactivate User
**PATCH** `/api/v2/users/{user_id}/status`

**Permission Required:** `users:update`

---

## 3. Organization Management

### 3.1 Create Organization
**POST** `/api/v2/organizations`

**Permission Required:** `organizations:create`

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "code": "ACME001",
  "address": "123 Main St, City, Country",
  "contact_email": "contact@acme.com",
  "contact_phone": "+1234567890",
  "organization_type": "office",
  "timezone": "Asia/Kolkata",
  "working_hours": {
    "start": "09:00",
    "end": "18:00",
    "days": [1, 2, 3, 4, 5]
  },
  "settings": {
    "face_recognition_enabled": true,
    "auto_checkout_time": "20:00"
  }
}
```

**Organization Types:**
- `school`
- `office`
- `apartment`
- `home`

### 3.2 List Organizations
**GET** `/api/v2/organizations?page=1&per_page=20&search=acme&organization_type=office&is_active=true`

**Permission Required:** `organizations:read`

### 3.3 Get Organization
**GET** `/api/v2/organizations/{org_id}`

**Permission Required:** `organizations:read`

### 3.4 Update Organization
**PUT** `/api/v2/organizations/{org_id}`

**Permission Required:** `organizations:update`

### 3.5 Delete Organization
**DELETE** `/api/v2/organizations/{org_id}?hard_delete=false`

**Permission Required:** `organizations:delete`

**Query Parameters:**
- `hard_delete` (boolean): Permanently delete (default: false - soft delete)

### 3.6 Get Organization Statistics
**GET** `/api/v2/organizations/{org_id}/stats`

**Permission Required:** `organizations:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "organization": { ... },
    "departments_count": 5,
    "employees_count": 120,
    "locations_count": 3,
    "cameras_count": 8,
    "shifts_count": 3
  }
}
```

---

## 4. Location Management

### 4.1 Create Location
**POST** `/api/v2/locations`

**Permission Required:** `locations:create`

**Request Body:**
```json
{
  "organization_id": "org-uuid",
  "name": "Main Gate",
  "location_type": "BOTH",
  "description": "Main entrance gate with security",
  "building": "Building A",
  "floor": "Ground Floor",
  "area": "Reception",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**Location Types:**
- `ENTRY` - Entry point only
- `EXIT` - Exit point only
- `BOTH` - Both entry and exit

### 4.2 List Locations
**GET** `/api/v2/locations?organization_id={org_id}&location_type=BOTH&is_active=true`

**Permission Required:** `locations:read`

### 4.3 Get Location
**GET** `/api/v2/locations/{location_id}`

**Permission Required:** `locations:read`

### 4.4 Update Location
**PUT** `/api/v2/locations/{location_id}`

**Permission Required:** `locations:update`

### 4.5 Delete Location
**DELETE** `/api/v2/locations/{location_id}`

**Permission Required:** `locations:delete`

---

## 5. Department Management

### 5.1 Create Department
**POST** `/api/v2/departments`

**Permission Required:** `departments:create`

**Request Body:**
```json
{
  "organization_id": "org-uuid",
  "name": "Engineering",
  "code": "ENG",
  "description": "Engineering department",
  "manager_id": "employee-uuid"
}
```

### 5.2 List Departments
**GET** `/api/v2/departments?organization_id={org_id}&search=eng&is_active=true`

**Permission Required:** `departments:read`

### 5.3 Get Department
**GET** `/api/v2/departments/{dept_id}`

**Permission Required:** `departments:read`

### 5.4 Update Department
**PUT** `/api/v2/departments/{dept_id}`

**Permission Required:** `departments:update`

### 5.5 Delete Department
**DELETE** `/api/v2/departments/{dept_id}`

**Permission Required:** `departments:delete`

---

## 6. Shift Management

### 6.1 Create Shift
**POST** `/api/v2/shifts`

**Permission Required:** `shifts:create`

**Request Body:**
```json
{
  "organization_id": "org-uuid",
  "name": "Morning Shift",
  "start_time": "09:00:00",
  "end_time": "18:00:00",
  "grace_period_minutes": 15,
  "working_days": [1, 2, 3, 4, 5]
}
```

**Working Days:**
- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

### 6.2 List Shifts
**GET** `/api/v2/shifts?organization_id={org_id}&is_active=true`

**Permission Required:** `shifts:read`

### 6.3 Get Shift
**GET** `/api/v2/shifts/{shift_id}`

**Permission Required:** `shifts:read`

### 6.4 Update Shift
**PUT** `/api/v2/shifts/{shift_id}`

**Permission Required:** `shifts:update`

### 6.5 Delete Shift
**DELETE** `/api/v2/shifts/{shift_id}`

**Permission Required:** `shifts:delete`

---

## 7. Employee Management

### 7.1 Create Employee
**POST** `/api/v2/employees`

**Permission Required:** `employees:create`

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "organization_id": "org-uuid",
  "department_id": "dept-uuid",
  "employee_code": "EMP001",
  "full_name": "John Doe",
  "gender": "male",
  "date_of_birth": "1990-01-15",
  "phone_number": "+1234567890",
  "emergency_contact": {
    "name": "Jane Doe",
    "relation": "Spouse",
    "phone": "+0987654321"
  },
  "address": "123 Street, City",
  "joining_date": "2024-01-01",
  "designation": "Software Engineer",
  "employment_type": "full_time",
  "shift_id": "shift-uuid"
}
```

**Employment Types:**
- `full_time`
- `part_time`
- `contract`
- `intern`

### 7.2 List Employees
**GET** `/api/v2/employees?organization_id={org_id}&department_id={dept_id}&employment_type=full_time&is_active=true`

**Permission Required:** `employees:read`

### 7.3 Get Employee
**GET** `/api/v2/employees/{employee_id}`

**Permission Required:** `employees:read`

### 7.4 Update Employee
**PUT** `/api/v2/employees/{employee_id}`

**Permission Required:** `employees:update`

### 7.5 Delete Employee
**DELETE** `/api/v2/employees/{employee_id}`

**Permission Required:** `employees:delete`

### 7.6 Get Employee Attendance
**GET** `/api/v2/employees/{employee_id}/attendance?start_date=2024-01-01&end_date=2024-01-31`

**Permission Required:** `employees:read`

---

## 8. Camera Management

### 8.1 Create Camera
**POST** `/api/v2/cameras`

**Permission Required:** `cameras:create`

**Request Body:**
```json
{
  "organization_id": "org-uuid",
  "location_id": "location-uuid",
  "name": "Gate Camera 1",
  "camera_type": "CHECK_IN",
  "source_type": "IP_CAMERA",
  "source_url": "rtsp://192.168.1.100:554/stream",
  "source_config": {
    "username": "admin",
    "password": "password123"
  },
  "fps": 10,
  "resolution": "1920x1080",
  "confidence_threshold": 0.7,
  "liveness_check_enabled": true
}
```

**Camera Types:**
- `CHECK_IN` - For employee check-in
- `CHECK_OUT` - For employee check-out
- `CCTV` - General surveillance

**Source Types:**
- `IP_CAMERA` - Network IP camera
- `USB_CAMERA` - USB connected camera
- `RTSP_STREAM` - RTSP video stream

### 8.2 List Cameras
**GET** `/api/v2/cameras?organization_id={org_id}&location_id={loc_id}&camera_type=CHECK_IN&status=online&is_active=true`

**Permission Required:** `cameras:read`

### 8.3 Get Camera
**GET** `/api/v2/cameras/{camera_id}`

**Permission Required:** `cameras:read`

### 8.4 Update Camera
**PUT** `/api/v2/cameras/{camera_id}`

**Permission Required:** `cameras:update`

### 8.5 Delete Camera
**DELETE** `/api/v2/cameras/{camera_id}`

**Permission Required:** `cameras:delete`

### 8.6 Camera Heartbeat
**POST** `/api/v2/cameras/{camera_id}/heartbeat`

**Permission Required:** `cameras:update`

**Request Body:**
```json
{
  "status": "online",
  "error_message": null
}
```

**Camera Status:**
- `online` - Camera is working
- `offline` - Camera is not responding
- `error` - Camera has errors

---

## 9. Attendance Tracking

### 9.1 Check-In
**POST** `/api/v2/attendance/check-in`

**Permission Required:** `attendance:create`

**Request Body:**
```json
{
  "employee_id": "employee-uuid",
  "camera_id": "camera-uuid",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "device_info": {
    "type": "mobile",
    "os": "Android",
    "browser": "Chrome"
  },
  "face_match_confidence": 0.95,
  "liveness_verified": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "id": "attendance-uuid",
    "employee_id": "employee-uuid",
    "date": "2024-01-15",
    "check_in_time": "2024-01-15T09:05:00Z",
    "status": "present"
  }
}
```

### 9.2 Check-Out
**POST** `/api/v2/attendance/check-out`

**Permission Required:** `attendance:create`

**Request Body:**
```json
{
  "employee_id": "employee-uuid",
  "camera_id": "camera-uuid",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "device_info": {
    "type": "mobile",
    "os": "Android"
  }
}
```

### 9.3 List Attendance Records
**GET** `/api/v2/attendance?organization_id={org_id}&employee_id={emp_id}&start_date=2024-01-01&end_date=2024-01-31&status=present`

**Permission Required:** `attendance:read`

**Query Parameters:**
- `organization_id` - Filter by organization
- `employee_id` - Filter by employee
- `department_id` - Filter by department
- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)
- `status` - Filter by status (present, absent, half_day, on_leave, holiday)
- `review_status` - Filter by review status (auto_approved, pending, approved, rejected)

### 9.4 Get Attendance Record
**GET** `/api/v2/attendance/{attendance_id}`

**Permission Required:** `attendance:read`

### 9.5 Update Attendance Record
**PUT** `/api/v2/attendance/{attendance_id}`

**Permission Required:** `attendance:update`

### 9.6 Approve/Reject Attendance
**POST** `/api/v2/attendance/{attendance_id}/approve`

**Permission Required:** `attendance:approve`

**Request Body:**
```json
{
  "review_status": "approved",
  "notes": "Approved by manager"
}
```

### 9.7 Delete Attendance Record
**DELETE** `/api/v2/attendance/{attendance_id}`

**Permission Required:** `attendance:delete`

---

## 10. Leave Management

### 10.1 Create Leave Request
**POST** `/api/v2/leaves`

**Permission Required:** `leaves:create`

**Request Body:**
```json
{
  "employee_id": "employee-uuid",
  "organization_id": "org-uuid",
  "leave_type": "casual",
  "start_date": "2024-02-01",
  "end_date": "2024-02-03",
  "total_days": 3.0,
  "reason": "Family function to attend"
}
```

**Leave Types:**
- `sick` - Sick leave
- `casual` - Casual leave
- `earned` - Earned leave
- `unpaid` - Unpaid leave

### 10.2 List Leave Requests
**GET** `/api/v2/leaves?organization_id={org_id}&employee_id={emp_id}&status=pending&leave_type=casual`

**Permission Required:** `leaves:read`

### 10.3 Get Leave Request
**GET** `/api/v2/leaves/{leave_id}`

**Permission Required:** `leaves:read`

### 10.4 Update Leave Request
**PUT** `/api/v2/leaves/{leave_id}`

**Permission Required:** `leaves:update`

*Note: Only pending leave requests can be updated*

### 10.5 Approve Leave Request
**POST** `/api/v2/leaves/{leave_id}/approve`

**Permission Required:** `leaves:approve`

**Request Body:**
```json
{
  "status": "approved",
  "approval_notes": "Approved by department head"
}
```

### 10.6 Reject Leave Request
**POST** `/api/v2/leaves/{leave_id}/reject`

**Permission Required:** `leaves:approve`

**Request Body:**
```json
{
  "status": "rejected",
  "approval_notes": "Not enough leave balance"
}
```

### 10.7 Delete Leave Request
**DELETE** `/api/v2/leaves/{leave_id}`

**Permission Required:** `leaves:delete`

---

## 11. Role Management

### 11.1 Create Role
**POST** `/api/v2/roles`

**Permission Required:** `roles:create`

**Request Body:**
```json
{
  "name": "department_manager",
  "description": "Department manager role",
  "permissions": {
    "employees": ["read", "update"],
    "attendance": ["read", "approve"],
    "leaves": ["read", "approve"]
  }
}
```

### 11.2 List Roles
**GET** `/api/v2/roles?search=manager`

**Permission Required:** `roles:read`

### 11.3 Get Role
**GET** `/api/v2/roles/{role_id}`

**Permission Required:** `roles:read`

### 11.4 Update Role
**PUT** `/api/v2/roles/{role_id}`

**Permission Required:** `roles:update`

### 11.5 Delete Role
**DELETE** `/api/v2/roles/{role_id}`

**Permission Required:** `roles:delete`

### 11.6 Update Role Permissions
**PUT** `/api/v2/roles/{role_id}/permissions`

**Permission Required:** `roles:update`

**Request Body:**
```json
{
  "permissions": {
    "employees": ["read", "update"],
    "attendance": ["read", "approve"],
    "leaves": ["read", "approve"],
    "reports": ["read"]
  }
}
```

---

## 12. Audit Logs

### 12.1 List Audit Logs
**GET** `/api/v2/audit?user_id={user_id}&action=create&entity_type=employee&start_date=2024-01-01&end_date=2024-01-31`

**Permission Required:** `audit:read`

**Query Parameters:**
- `user_id` - Filter by user who performed action
- `organization_id` - Filter by organization
- `action` - Filter by action (create, update, delete, login, etc.)
- `entity_type` - Filter by entity type (employee, attendance, etc.)
- `entity_id` - Filter by specific entity ID
- `start_date` - Start date/time
- `end_date` - End date/time

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "audit-uuid",
        "user_id": "user-uuid",
        "organization_id": "org-uuid",
        "action": "create",
        "entity_type": "employee",
        "entity_id": "employee-uuid",
        "old_values": null,
        "new_values": { ... },
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### 12.2 Get Audit Log
**GET** `/api/v2/audit/{log_id}`

**Permission Required:** `audit:read`

### 12.3 Get User Audit Logs
**GET** `/api/v2/audit/user/{user_id}?limit=50`

**Permission Required:** `audit:read`

### 12.4 Get Entity Audit History
**GET** `/api/v2/audit/entity/{entity_type}/{entity_id}`

**Permission Required:** `audit:read`

### 12.5 Get Audit Statistics
**GET** `/api/v2/audit/stats?organization_id={org_id}&start_date=2024-01-01&end_date=2024-01-31`

**Permission Required:** `audit:read`

### 12.6 Get Recent Activity
**GET** `/api/v2/audit/recent?organization_id={org_id}&limit=20`

**Permission Required:** `audit:read`

---

## 13. Visitor Management (Legacy)

These endpoints use the legacy visitor system for backward compatibility.

### 13.1 Create Visitor
**POST** `/api/visitors/onboard`

### 13.2 List Visitors
**GET** `/api/visitors`

### 13.3 Get Visitor
**GET** `/api/visitors/{aadhaar_id}`

### 13.4 Update Visitor
**PUT** `/api/visitors/{aadhaar_id}`

### 13.5 Delete Visitor
**DELETE** `/api/visitors/{aadhaar_id}`

---

## 14. Analytics & Statistics

### 14.1 Get Dashboard Statistics
**GET** `/api/stats/dashboard`

**Permission Required:** `analytics:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_employees": 150,
    "present_today": 142,
    "absent_today": 8,
    "on_leave_today": 5,
    "late_arrivals": 12,
    "pending_leave_requests": 7,
    "cameras_online": 8,
    "cameras_offline": 0
  }
}
```

### 14.2 Get Attendance Report
**GET** `/api/analytics/attendance?start_date=2024-01-01&end_date=2024-01-31&department_id={dept_id}`

**Permission Required:** `analytics:read`

### 14.3 Get Leave Statistics
**GET** `/api/analytics/leaves?organization_id={org_id}&year=2024`

**Permission Required:** `analytics:read`

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_items": 150,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or token invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists or conflict
- `500 Internal Server Error` - Server error

---

## Permission System

The API uses a granular permission system with the format `resource:action`.

### Permission Format
`resource:action`

**Resources:**
- `organizations`, `users`, `roles`, `departments`, `employees`
- `shifts`, `locations`, `cameras`, `attendance`, `leaves`
- `audit`, `analytics`, `visitors`

**Actions:**
- `create` - Create new resources
- `read` - View resources
- `update` - Modify resources
- `delete` - Remove resources
- `approve` - Approve requests (attendance, leaves)

**Examples:**
- `employees:create` - Create employees
- `attendance:read` - View attendance records
- `leaves:approve` - Approve leave requests
- `audit:read` - View audit logs

### Special Permissions
- `*:*` - Super admin (all permissions)
- `resource:*` - All actions on a resource

---

## Rate Limiting

- **Default Rate Limit:** 100 requests per minute per user
- **Burst Limit:** 200 requests per minute
- **Headers:** 
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

---

## Postman Collection

Import the Postman collection for easy testing:
`/docs/VMS_API_Collection.postman_collection.json`

---

## Support

For API support or issues:
- **Documentation:** http://localhost:5001/api/docs/
- **GitHub Issues:** https://github.com/your-org/vms/issues
- **Email:** support@vms.com

---

*Last Updated: 2024*
