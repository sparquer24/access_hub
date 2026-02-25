# Swagger Configuration Guide

**Last Updated**: February 12, 2026  
**Swagger Version**: Flasgger (Swagger 2.0)  
**Documentation URL**: `/api/docs/`

---

## Overview

All APIs in the AccessHub VMS system are now fully documented in Swagger. The documentation includes:

- ✅ Complete endpoint descriptions
- ✅ Request/response schemas
- ✅ Parameter documentation
- ✅ Authentication requirements
- ✅ Error handling
- ✅ Example values

---

## API Categories & Endpoints

### 1. **Authentication**

Authentication and JWT token management

| Endpoint                | Method | Description                    |
| ----------------------- | ------ | ------------------------------ |
| `/api/v2/auth/login`    | POST   | User login with email/password |
| `/api/v2/auth/register` | POST   | Register new user account      |
| `/api/v2/auth/refresh`  | POST   | Refresh JWT token              |
| `/api/v2/auth/logout`   | POST   | Logout user                    |
| `/api/v2/auth/verify`   | GET    | Verify token validity          |

---

### 2. **Organizations** ✅

Organization management and configuration

| Endpoint                                        | Method | Description                        |
| ----------------------------------------------- | ------ | ---------------------------------- |
| `/api/v2/organizations`                         | POST   | Create new organization            |
| `/api/v2/organizations`                         | GET    | List all organizations (paginated) |
| `/api/v2/organizations/{id}`                    | GET    | Get organization details           |
| `/api/v2/organizations/{id}`                    | PUT    | Update organization info           |
| `/api/v2/organizations/{id}`                    | DELETE | Delete organization                |
| `/api/v2/organizations/{id}/stats`              | GET    | Get organization statistics        |
| `/api/v2/organizations/{id}/attendance-summary` | GET    | Get attendance summary report      |
| `/api/v2/organizations/{id}/top-performers`     | GET    | Get top performing employees       |

---

### 3. **Employees** ✅

Employee management and profiles

| Endpoint                   | Method | Description                            |
| -------------------------- | ------ | -------------------------------------- |
| `/api/v2/employees`        | POST   | Create employee                        |
| `/api/v2/employees`        | GET    | List employees (paginated, filterable) |
| `/api/v2/employees/{id}`   | GET    | Get employee profile                   |
| `/api/v2/employees/{id}`   | PUT    | Update employee info                   |
| `/api/v2/employees/{id}`   | DELETE | Delete employee                        |
| `/api/v2/employee/profile` | GET    | Get current logged-in employee profile |

---

### 4. **Departments** ✅

Department structure and management

| Endpoint                   | Method | Description                  |
| -------------------------- | ------ | ---------------------------- |
| `/api/v2/departments`      | POST   | Create department            |
| `/api/v2/departments`      | GET    | List departments (paginated) |
| `/api/v2/departments/{id}` | GET    | Get department details       |
| `/api/v2/departments/{id}` | PUT    | Update department            |
| `/api/v2/departments/{id}` | DELETE | Delete department            |

---

### 5. **Shifts** ✅

Work shift configuration and management

| Endpoint              | Method | Description             |
| --------------------- | ------ | ----------------------- |
| `/api/v2/shifts`      | POST   | Create work shift       |
| `/api/v2/shifts`      | GET    | List shifts (paginated) |
| `/api/v2/shifts/{id}` | GET    | Get shift details       |
| `/api/v2/shifts/{id}` | PUT    | Update shift            |
| `/api/v2/shifts/{id}` | DELETE | Delete shift            |

---

### 6. **Attendance** ✅

Attendance tracking and records

| Endpoint                  | Method | Description                                     |
| ------------------------- | ------ | ----------------------------------------------- |
| `/api/v2/attendance`      | POST   | Create attendance record                        |
| `/api/v2/attendance`      | GET    | List attendance records (paginated, filterable) |
| `/api/v2/attendance/{id}` | GET    | Get attendance details                          |
| `/api/v2/attendance/{id}` | PUT    | Update attendance record                        |
| `/api/v2/attendance/{id}` | DELETE | Delete attendance record                        |

---

### 7. **Leave Requests** ✅

Leave/absence management

| Endpoint                      | Method | Description                     |
| ----------------------------- | ------ | ------------------------------- |
| `/api/v2/leaves`              | POST   | Create leave request            |
| `/api/v2/leaves`              | GET    | List leave requests (paginated) |
| `/api/v2/leaves/{id}`         | GET    | Get leave request details       |
| `/api/v2/leaves/{id}`         | PUT    | Update leave request            |
| `/api/v2/leaves/{id}`         | DELETE | Cancel leave request            |
| `/api/v2/leaves/{id}/approve` | POST   | Approve leave request           |
| `/api/v2/leaves/{id}/reject`  | POST   | Reject leave request            |

---

### 8. **Attendance Change Requests** ✅

Attendance correction and amendment requests

| Endpoint                                          | Method | Description                       |
| ------------------------------------------------- | ------ | --------------------------------- |
| `/api/v2/attendance-change-requests`              | POST   | Create correction request         |
| `/api/v2/attendance-change-requests`              | GET    | List pending requests (paginated) |
| `/api/v2/attendance-change-requests/{id}`         | GET    | Get request details               |
| `/api/v2/attendance-change-requests/{id}`         | PUT    | Update request                    |
| `/api/v2/attendance-change-requests/{id}`         | DELETE | Cancel request                    |
| `/api/v2/attendance-change-requests/{id}/approve` | POST   | Approve correction                |

---

### 9. **Roles** ✅

Role-based access control (RBAC)

| Endpoint                         | Method | Description             |
| -------------------------------- | ------ | ----------------------- |
| `/api/v2/roles`                  | POST   | Create role             |
| `/api/v2/roles`                  | GET    | List roles              |
| `/api/v2/roles/{id}`             | GET    | Get role details        |
| `/api/v2/roles/{id}`             | PUT    | Update role             |
| `/api/v2/roles/{id}`             | DELETE | Delete role             |
| `/api/v2/roles/{id}/permissions` | PUT    | Update role permissions |

---

### 10. **Locations** ✅

Office location management

| Endpoint                 | Method | Description                |
| ------------------------ | ------ | -------------------------- |
| `/api/v2/locations`      | POST   | Create location            |
| `/api/v2/locations`      | GET    | List locations (paginated) |
| `/api/v2/locations/{id}` | GET    | Get location details       |
| `/api/v2/locations/{id}` | PUT    | Update location            |
| `/api/v2/locations/{id}` | DELETE | Delete location            |

---

### 11. **Cameras** ✅

CCTV camera management

| Endpoint               | Method | Description              |
| ---------------------- | ------ | ------------------------ |
| `/api/v2/cameras`      | POST   | Add camera               |
| `/api/v2/cameras`      | GET    | List cameras (paginated) |
| `/api/v2/cameras/{id}` | GET    | Get camera details       |
| `/api/v2/cameras/{id}` | PUT    | Update camera config     |
| `/api/v2/cameras/{id}` | DELETE | Remove camera            |

---

### 12. **Face Recognition** ✅ _NEW_

Face detection and enrollment for employee verification

| Endpoint              | Method | Description                |
| --------------------- | ------ | -------------------------- |
| `/api/v1/face/enroll` | POST   | Enroll employee face image |

**Parameters:**

- `employee_id` (string, required): Employee ID for enrollment
- `img_b64` (string, required): Base64 encoded image data

---

### 13. **LPR (License Plate Recognition)** ✅ _NEW_

Vehicle tracking and access control

#### Vehicle Logs (The Register)

| Endpoint                                          | Method | Description                  |
| ------------------------------------------------- | ------ | ---------------------------- |
| `/api/v2/organizations/{org_id}/lpr/logs`         | GET    | Get vehicle entry logs       |
| `/api/v2/organizations/{org_id}/lpr/manual-entry` | POST   | Create manual vehicle entry  |
| `/api/v2/organizations/{org_id}/lpr/stats`        | GET    | Get LPR dashboard statistics |

#### Hotlist Management (Flagged Vehicles)

| Endpoint                                          | Method | Description            |
| ------------------------------------------------- | ------ | ---------------------- |
| `/api/v2/organizations/{org_id}/lpr/hotlist`      | GET    | Get flagged vehicles   |
| `/api/v2/organizations/{org_id}/lpr/hotlist`      | POST   | Add vehicle to hotlist |
| `/api/v2/organizations/{org_id}/lpr/hotlist/{id}` | DELETE | Remove from hotlist    |

#### Whitelist Management (Authorized Vehicles)

| Endpoint                                            | Method | Description              |
| --------------------------------------------------- | ------ | ------------------------ |
| `/api/v2/organizations/{org_id}/lpr/whitelist`      | GET    | Get authorized vehicles  |
| `/api/v2/organizations/{org_id}/lpr/whitelist`      | POST   | Add vehicle to whitelist |
| `/api/v2/organizations/{org_id}/lpr/whitelist/{id}` | DELETE | Revoke vehicle access    |

---

### 14. **Subscriptions** ✅ _NEW_

Subscription and feature access management

| Endpoint                                           | Method | Description                          |
| -------------------------------------------------- | ------ | ------------------------------------ |
| `/api/subscriptions/plans`                         | GET    | Get all available plans              |
| `/api/subscriptions/organization/{org_id}/status`  | GET    | Get organization subscription status |
| `/api/subscriptions/organization/{org_id}/upgrade` | POST   | Upgrade subscription tier            |
| `/api/subscriptions/organization/{org_id}/tabs`    | GET    | Get accessible tabs/features         |
| `/api/subscriptions/check-feature`                 | POST   | Check if feature is accessible       |
| `/api/subscriptions/usage-summary`                 | GET    | Get usage statistics                 |

---

### 15. **Manager Endpoints** ✅ _NEW_

Manager-specific endpoints for team management

| Endpoint                              | Method | Description                 |
| ------------------------------------- | ------ | --------------------------- |
| `/api/v2/manager/team`                | GET    | Get team members            |
| `/api/v2/manager/dashboard`           | GET    | Get dashboard activities    |
| `/api/v2/manager/stats`               | GET    | Get team statistics         |
| `/api/v2/manager/leaves/pending`      | GET    | Get pending leave requests  |
| `/api/v2/manager/leaves/{id}/approve` | POST   | Approve leave request       |
| `/api/v2/manager/leaves/{id}/reject`  | POST   | Reject leave request        |
| `/api/v2/manager/reports/attendance`  | GET    | Get attendance report       |
| `/api/v2/manager/reports/leaves`      | GET    | Get leaves report           |
| `/api/v2/manager/cameras`             | GET    | Get accessible cameras      |
| `/api/v2/manager/locations`           | GET    | Get accessible locations    |
| `/api/v2/manager/performance`         | GET    | Get team performance report |

---

### 16. **Visitors** ✅ _LEGACY_

Visitor management (legacy endpoints)

| Endpoint                                                | Method | Description           |
| ------------------------------------------------------- | ------ | --------------------- |
| `/api/v2/organizations/{org_id}/visitors`               | POST   | Create visitor record |
| `/api/v2/organizations/{org_id}/visitors`               | GET    | List visitors         |
| `/api/v2/organizations/{org_id}/visitors/{id}`          | GET    | Get visitor details   |
| `/api/v2/organizations/{org_id}/visitors/{id}/checkin`  | POST   | Check in visitor      |
| `/api/v2/organizations/{org_id}/visitors/{id}/checkout` | POST   | Check out visitor     |
| `/api/v2/organizations/{org_id}/visitors/{id}/movement` | POST   | Log visitor movement  |

---

### 17. **Images** ✅ _NEW_

Image storage and retrieval

| Endpoint                            | Method | Description       |
| ----------------------------------- | ------ | ----------------- |
| `/api/v2/images`                    | POST   | Upload image      |
| `/api/v2/images/{id}`               | GET    | Get image         |
| `/api/v2/images/entity/{type}/{id}` | GET    | Get entity images |

---

### 18. **Audit Logs** ✅

System audit trail and activity tracking

| Endpoint                  | Method | Description                 |
| ------------------------- | ------ | --------------------------- |
| `/api/v2/audit-logs`      | GET    | List audit logs (paginated) |
| `/api/v2/audit-logs/{id}` | GET    | Get audit log details       |

---

## Authentication

All protected endpoints require JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Token Format

```bash
# Login to get token
POST /api/v2/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // response payload
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Description of error",
  "errors": {
    // additional error details
  }
}
```

---

## Common HTTP Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | OK - Request successful                 |
| 201  | Created - Resource created successfully |
| 204  | No Content - Successful deletion        |
| 400  | Bad Request - Invalid parameters        |
| 401  | Unauthorized - Missing/invalid token    |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource doesn't exist      |
| 422  | Unprocessable Entity - Validation error |
| 500  | Internal Server Error                   |

---

## Pagination

List endpoints support pagination with:

- `page`: Page number (default: 1)
- `per_page`: Records per page (default: 20)

Example:

```
GET /api/v2/employees?page=2&per_page=50
```

Response:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "per_page": 50,
    "total": 250,
    "pages": 5
  }
}
```

---

## Filtering

Most list endpoints support filtering:

```
GET /api/v2/employees?department_id=dept-123&status=active
```

---

## Rate Limiting

API requests are rate limited per user:

- Standard: 1000 requests/hour
- Premium: 10000 requests/hour
- Enterprise: Unlimited

Rate limit info in response headers:

```
X-Rate-Limit-Limit: 1000
X-Rate-Limit-Remaining: 950
X-Rate-Limit-Reset: 1634567890
```

---

## Testing in Swagger UI

1. Navigate to: `http://localhost:5001/api/docs/`
2. Click "Authorize" button
3. Enter JWT token in format: `Bearer <token>`
4. Try out endpoints using the UI

---

## Accessing Swagger JSON

Raw Swagger/OpenAPI specification available at:

```
http://localhost:5001/apispec.json
```

---

## Troubleshooting

### Endpoints not showing in Swagger?

1. **Ensure proper docstring format:**

   ```python
   @bp.route('/endpoint', methods=['GET'])
   def my_endpoint():
       """
       Endpoint description
       ---
       tags:
         - TagName
       responses:
         200:
           description: Success
       """
   ```

2. **Check Swagger configuration:**
   - Verify blueprint is registered in `app/__init__.py`
   - Ensure routes use correct format with `---` separator

3. **Refresh endpoint:**
   - Stop and restart Flask server
   - Clear browser cache
   - Try accessing `/apispec.json` directly

### Missing tags?

Add new tags to `swagger_template` in `app/__init__.py`:

```python
"tags": [
    {
        "name": "YourTag",
        "description": "Your description"
    }
]
```

---

## Recent Additions

✅ **Face Recognition API** - Employee face enrollment  
✅ **LPR (License Plate Recognition)** - Vehicle tracking  
✅ **Subscriptions API** - Feature access management  
✅ **Manager Endpoints** - Team management features  
✅ **Images API** - Image storage

All newly added endpoints are fully documented in Swagger.

---

## Support

For API documentation updates or issues, contact the development team.

Last verified: **February 12, 2026**
