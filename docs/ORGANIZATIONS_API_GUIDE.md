# Organizations CRUD API Guide

Complete documentation for the Organizations API endpoints.

## Base URL
```
http://localhost:5001/api/v2/organizations
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 1. Create Organization
Create a new organization in the system.

**Endpoint:** `POST /api/v2/organizations`

**Required Permissions:** `organizations:create`

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
    "allow_remote_checkin": true,
    "require_face_recognition": true
  }
}
```

**Required Fields:**
- `name` (string, 2-255 chars): Organization name
- `code` (string, 2-50 chars): Unique organization code

**Optional Fields:**
- `address` (string): Physical address
- `contact_email` (email): Contact email
- `contact_phone` (string, max 32 chars): Contact phone
- `organization_type` (enum): One of: `school`, `office`, `apartment`, `home` (default: `office`)
- `timezone` (string): Timezone (default: `UTC`)
- `working_hours` (object): Working hours configuration
- `settings` (object): Organization-specific settings

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
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
    "subscription_tier": "free",
    "settings": {
      "allow_remote_checkin": true,
      "require_face_recognition": true
    },
    "is_active": true,
    "created_at": "2025-12-22T10:00:00",
    "updated_at": "2025-12-22T10:00:00"
  }
}
```

---

### 2. Get All Organizations (List with Pagination)
Retrieve all organizations with filtering and pagination support.

**Endpoint:** `GET /api/v2/organizations`

**Required Permissions:** `organizations:read`

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `per_page` (integer, default: 20, max: 100): Items per page
- `search` (string, optional): Search by name or code
- `organization_type` (enum, optional): Filter by type (`school`, `office`, `apartment`, `home`)
- `is_active` (boolean, optional): Filter by active status

**Examples:**

1. Get first page (default):
```
GET /api/v2/organizations
```

2. Search for organizations:
```
GET /api/v2/organizations?search=Acme
```

3. Filter by type:
```
GET /api/v2/organizations?organization_type=office
```

4. Get active organizations only:
```
GET /api/v2/organizations?is_active=true
```

5. Combined filters with pagination:
```
GET /api/v2/organizations?page=2&per_page=10&organization_type=office&is_active=true
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
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
        "subscription_tier": "free",
        "settings": {},
        "is_active": true,
        "created_at": "2025-12-22T10:00:00",
        "updated_at": "2025-12-22T10:00:00"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Tech School",
        "code": "TECH001",
        "address": "456 School Ave",
        "contact_email": "admin@techschool.com",
        "contact_phone": "+9876543210",
        "organization_type": "school",
        "timezone": "UTC",
        "working_hours": {},
        "subscription_tier": "premium",
        "settings": {},
        "is_active": true,
        "created_at": "2025-12-20T08:00:00",
        "updated_at": "2025-12-20T08:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_items": 2,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

---

### 3. Get Single Organization by ID
Retrieve detailed information about a specific organization.

**Endpoint:** `GET /api/v2/organizations/{org_id}`

**Required Permissions:** `organizations:read`

**URL Parameters:**
- `org_id` (string, required): Organization UUID

**Example:**
```
GET /api/v2/organizations/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
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
    "subscription_tier": "free",
    "settings": {
      "allow_remote_checkin": true
    },
    "is_active": true,
    "created_at": "2025-12-22T10:00:00",
    "updated_at": "2025-12-22T10:00:00"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Organization not found"
}
```

---

### 4. Update Organization
Update an existing organization's information.

**Endpoint:** `PUT /api/v2/organizations/{org_id}`

**Required Permissions:** `organizations:update`

**URL Parameters:**
- `org_id` (string, required): Organization UUID

**Request Body (all fields optional):**
```json
{
  "name": "Acme Corporation Ltd.",
  "address": "789 New Address, City, Country",
  "contact_email": "newcontact@acme.com",
  "contact_phone": "+1234567899",
  "organization_type": "office",
  "timezone": "America/New_York",
  "working_hours": {
    "start": "08:00",
    "end": "17:00",
    "days": [1, 2, 3, 4, 5]
  },
  "settings": {
    "allow_remote_checkin": false,
    "require_face_recognition": true,
    "max_employees": 500
  },
  "is_active": true
}
```

**Note:** You can update any combination of fields. Only include the fields you want to update.

**Example:**
```
PUT /api/v2/organizations/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Organization updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation Ltd.",
    "code": "ACME001",
    "address": "789 New Address, City, Country",
    "contact_email": "newcontact@acme.com",
    "contact_phone": "+1234567899",
    "organization_type": "office",
    "timezone": "America/New_York",
    "working_hours": {
      "start": "08:00",
      "end": "17:00",
      "days": [1, 2, 3, 4, 5]
    },
    "subscription_tier": "free",
    "settings": {
      "allow_remote_checkin": false,
      "require_face_recognition": true,
      "max_employees": 500
    },
    "is_active": true,
    "created_at": "2025-12-22T10:00:00",
    "updated_at": "2025-12-22T11:30:00"
  }
}
```

---

### 5. Delete Organization
Delete an organization (soft delete by default, hard delete optional).

**Endpoint:** `DELETE /api/v2/organizations/{org_id}`

**Required Permissions:** `organizations:delete`

**URL Parameters:**
- `org_id` (string, required): Organization UUID

**Query Parameters:**
- `hard_delete` (boolean, default: false): If true, permanently delete the organization

**Examples:**

1. Soft delete (default - marks as deleted, keeps data):
```
DELETE /api/v2/organizations/550e8400-e29b-41d4-a716-446655440000
```

2. Hard delete (permanently removes from database):
```
DELETE /api/v2/organizations/550e8400-e29b-41d4-a716-446655440000?hard_delete=true
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Organization deleted successfully",
  "data": null
}
```

**Note:** 
- **Soft delete** sets `deleted_at` timestamp and `is_active` to false. The organization won't appear in queries but data is preserved.
- **Hard delete** permanently removes the organization and all related data (departments, employees, etc.) due to cascade delete.

---

### 6. Get Organization Statistics
Get detailed statistics about an organization.

**Endpoint:** `GET /api/v2/organizations/{org_id}/stats`

**Required Permissions:** `organizations:read`

**URL Parameters:**
- `org_id` (string, required): Organization UUID

**Example:**
```
GET /api/v2/organizations/550e8400-e29b-41d4-a716-446655440000/stats
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "organization": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corporation",
      "code": "ACME001",
      "organization_type": "office",
      "is_active": true
    },
    "departments_count": 5,
    "employees_count": 123,
    "locations_count": 3,
    "cameras_count": 12,
    "shifts_count": 4
  }
}
```

---

## Error Responses

### 400 Bad Request
Invalid request data or validation errors.
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "name": ["Field is required"],
    "code": ["Must be between 2 and 50 characters"]
  }
}
```

### 401 Unauthorized
Missing or invalid JWT token.
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 Forbidden
User doesn't have required permissions.
```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found
Organization not found.
```json
{
  "success": false,
  "message": "Organization not found"
}
```

### 409 Conflict
Organization with same code or name already exists.
```json
{
  "success": false,
  "message": "Organization with code 'ACME001' already exists"
}
```

### 500 Internal Server Error
Server error.
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Testing with cURL

### 1. Create Organization
```bash
curl -X POST http://localhost:5001/api/v2/organizations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organization",
    "code": "TEST001",
    "organization_type": "office",
    "contact_email": "test@example.com"
  }'
```

### 2. Get All Organizations
```bash
curl -X GET http://localhost:5001/api/v2/organizations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get All Organizations with Filters
```bash
curl -X GET "http://localhost:5001/api/v2/organizations?page=1&per_page=10&search=Test&is_active=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Single Organization
```bash
curl -X GET http://localhost:5001/api/v2/organizations/YOUR_ORG_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Update Organization
```bash
curl -X PUT http://localhost:5001/api/v2/organizations/YOUR_ORG_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Organization Name",
    "contact_email": "updated@example.com"
  }'
```

### 6. Delete Organization (Soft)
```bash
curl -X DELETE http://localhost:5001/api/v2/organizations/YOUR_ORG_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Delete Organization (Hard)
```bash
curl -X DELETE "http://localhost:5001/api/v2/organizations/YOUR_ORG_ID?hard_delete=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Get Organization Stats
```bash
curl -X GET http://localhost:5001/api/v2/organizations/YOUR_ORG_ID/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing with PowerShell

### Create Test Script
Save this as `test_organizations_api.ps1`:

```powershell
# Configuration
$baseUrl = "http://localhost:5001/api/v2/organizations"
$token = "YOUR_JWT_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 1. Create Organization
Write-Host "1. Creating organization..." -ForegroundColor Green
$createBody = @{
    name = "Test Organization"
    code = "TEST001"
    organization_type = "office"
    contact_email = "test@example.com"
    timezone = "Asia/Kolkata"
    working_hours = @{
        start = "09:00"
        end = "18:00"
        days = @(1,2,3,4,5)
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $createBody
$orgId = $response.data.id
Write-Host "Created organization with ID: $orgId" -ForegroundColor Cyan
$response.data | ConvertTo-Json -Depth 10

# 2. Get All Organizations
Write-Host "`n2. Getting all organizations..." -ForegroundColor Green
$response = Invoke-RestMethod -Uri $baseUrl -Method GET -Headers $headers
Write-Host "Found $($response.data.pagination.total_items) organizations" -ForegroundColor Cyan
$response.data.items | Format-Table id, name, code, organization_type, is_active

# 3. Get Single Organization
Write-Host "`n3. Getting single organization..." -ForegroundColor Green
$response = Invoke-RestMethod -Uri "$baseUrl/$orgId" -Method GET -Headers $headers
$response.data | ConvertTo-Json -Depth 10

# 4. Update Organization
Write-Host "`n4. Updating organization..." -ForegroundColor Green
$updateBody = @{
    name = "Updated Test Organization"
    contact_phone = "+1234567890"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/$orgId" -Method PUT -Headers $headers -Body $updateBody
Write-Host "Updated organization name: $($response.data.name)" -ForegroundColor Cyan

# 5. Get Organization Stats
Write-Host "`n5. Getting organization statistics..." -ForegroundColor Green
$response = Invoke-RestMethod -Uri "$baseUrl/$orgId/stats" -Method GET -Headers $headers
$response.data | ConvertTo-Json -Depth 10

# 6. Search Organizations
Write-Host "`n6. Searching organizations..." -ForegroundColor Green
$response = Invoke-RestMethod -Uri "$baseUrl`?search=Test" -Method GET -Headers $headers
Write-Host "Found $($response.data.pagination.total_items) matching organizations" -ForegroundColor Cyan

# 7. Delete Organization (Soft)
Write-Host "`n7. Soft deleting organization..." -ForegroundColor Green
$response = Invoke-RestMethod -Uri "$baseUrl/$orgId" -Method DELETE -Headers $headers
Write-Host $response.message -ForegroundColor Cyan

Write-Host "`nAll tests completed!" -ForegroundColor Green
```

Run with:
```powershell
.\test_organizations_api.ps1
```

---

## Organization Types

The system supports four types of organizations:

1. **school** - Educational institutions
2. **office** - Corporate offices and businesses
3. **apartment** - Residential apartment complexes
4. **home** - Private homes

Each type can have different workflows and requirements.

---

## Subscription Tiers

Organizations can have different subscription levels:

1. **free** - Basic features (default)
2. **basic** - Standard features
3. **premium** - Advanced features
4. **enterprise** - Full feature access with custom support

---

## Working Hours Configuration

The `working_hours` field is a JSON object that can store organization-specific working hours:

```json
{
  "start": "09:00",
  "end": "18:00",
  "days": [1, 2, 3, 4, 5],
  "break_start": "12:00",
  "break_end": "13:00"
}
```

Where:
- `start`: Start time (24-hour format)
- `end`: End time (24-hour format)
- `days`: Array of working days (1=Monday, 7=Sunday)
- Additional custom fields can be added as needed

---

## Related Entities

Organizations have relationships with:
- **Departments** - Organizational units
- **Employees** - Staff members
- **Users** - System users
- **Locations** - Physical locations/buildings
- **Cameras** - Surveillance cameras
- **Shifts** - Work shifts
- **Attendance Records** - Employee attendance
- **Leave Requests** - Employee leave management
- **Audit Logs** - Activity tracking

---

## Best Practices

1. **Code Field**: Use a short, unique identifier (e.g., "ACME001", "TECH001")
2. **Soft Delete**: Use soft delete for data retention and audit purposes
3. **Pagination**: Always use pagination for listing organizations in production
4. **Filters**: Apply appropriate filters to reduce response size
5. **Timezone**: Always set the correct timezone for accurate attendance tracking
6. **Working Hours**: Configure working hours for automated attendance calculations

---

## Swagger Documentation

The API is also documented using Swagger UI. Access it at:
```
http://localhost:5001/api/docs/
```

You can test all endpoints directly from the Swagger interface with proper authentication.
