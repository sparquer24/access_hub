# Organizations API - Complete Documentation

This directory contains complete documentation and testing tools for the Organizations CRUD API.

## 📚 Documentation Files

### 1. [ORGANIZATIONS_API_GUIDE.md](./ORGANIZATIONS_API_GUIDE.md)
**Complete API documentation** with detailed explanations:
- All 6 endpoints (Create, List, Get, Update, Delete, Stats)
- Request/response examples
- Query parameters and filters
- Error handling
- cURL and PowerShell examples
- Best practices

### 2. [ORGANIZATIONS_API_QUICK_REFERENCE.md](./ORGANIZATIONS_API_QUICK_REFERENCE.md)
**Quick reference card** for developers:
- Endpoint summary table
- Quick examples
- Common parameters
- Response codes
- Required fields

### 3. [Organizations_API_Postman_Collection.json](./Organizations_API_Postman_Collection.json)
**Postman collection** for testing:
- Import into Postman
- Pre-configured requests
- Automatic token management
- Test assertions included

### 4. [tests/test_organizations_api.ps1](./tests/test_organizations_api.ps1)
**PowerShell test script** for automated testing:
- Tests all CRUD operations
- Colored output
- Automatic cleanup
- Verification steps

---

## 🚀 Quick Start

### Option 1: Using PowerShell Script (Recommended)

1. Ensure the backend server is running:
   ```bash
   cd vms_backend
   python manage.py run
   ```

2. Update credentials in the test script:
   ```powershell
   # Edit tests/test_organizations_api.ps1
   $username = "your_username"
   $password = "your_password"
   ```

3. Run the test script:
   ```powershell
   cd vms_backend
   .\tests\test_organizations_api.ps1
   ```

### Option 2: Using Postman

1. Open Postman
2. Import the collection: `Organizations_API_Postman_Collection.json`
3. Update the `jwt_token` variable in collection variables
4. Run requests individually or use the Collection Runner

### Option 3: Using cURL

See examples in [ORGANIZATIONS_API_GUIDE.md](./ORGANIZATIONS_API_GUIDE.md)

---

## 📋 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/organizations` | Create new organization |
| GET | `/api/v2/organizations` | List all organizations (with pagination/filters) |
| GET | `/api/v2/organizations/{id}` | Get single organization |
| PUT | `/api/v2/organizations/{id}` | Update organization |
| DELETE | `/api/v2/organizations/{id}` | Delete organization |
| GET | `/api/v2/organizations/{id}/stats` | Get organization statistics |

---

## 🔑 Authentication

All endpoints require JWT authentication:

1. **Login first:**
   ```bash
   POST /api/v2/auth/login
   {
     "username": "your_username",
     "password": "your_password"
   }
   ```

2. **Use the token in requests:**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

---

## 📝 Example Usage

### Create an Organization
```json
POST /api/v2/organizations
{
  "name": "Acme Corporation",
  "code": "ACME001",
  "organization_type": "office",
  "timezone": "Asia/Kolkata",
  "contact_email": "contact@acme.com"
}
```

### Get All Organizations with Filters
```
GET /api/v2/organizations?page=1&per_page=20&search=Acme&organization_type=office&is_active=true
```

### Update an Organization
```json
PUT /api/v2/organizations/{org_id}
{
  "name": "Updated Name",
  "contact_email": "newemail@acme.com"
}
```

### Get Organization Statistics
```
GET /api/v2/organizations/{org_id}/stats
```

Response includes counts for:
- Departments
- Employees
- Locations
- Cameras
- Shifts

---

## 🔧 Features

### Pagination
- Default: 20 items per page
- Max: 100 items per page
- Query params: `page`, `per_page`

### Filtering
- `search`: Search by name or code
- `organization_type`: Filter by type (school, office, apartment, home)
- `is_active`: Filter by active status

### Soft Delete
- Default delete is soft delete (marks as deleted)
- Use `?hard_delete=true` for permanent deletion
- Soft deleted organizations won't appear in queries

### Organization Types
- `school` - Educational institutions
- `office` - Corporate offices
- `apartment` - Residential complexes
- `home` - Private homes

### Subscription Tiers
- `free` - Basic features (default)
- `basic` - Standard features
- `premium` - Advanced features
- `enterprise` - Full access

---

## 🧪 Testing

### Automated Testing with PowerShell

The test script performs:
1. ✅ Login and get JWT token
2. ✅ Create organization
3. ✅ List all organizations
4. ✅ Search organizations
5. ✅ Filter by type
6. ✅ Get single organization
7. ✅ Update organization
8. ✅ Get statistics
9. ✅ Verify update
10. ✅ Soft delete
11. ✅ Verify deletion

Run it:
```powershell
.\tests\test_organizations_api.ps1
```

### Manual Testing

See the complete guide in [ORGANIZATIONS_API_GUIDE.md](./ORGANIZATIONS_API_GUIDE.md)

---

## 🔐 Required Permissions

| Operation | Permission Required |
|-----------|---------------------|
| Create | `organizations:create` |
| Read/List | `organizations:read` |
| Update | `organizations:update` |
| Delete | `organizations:delete` |

---

## 📊 Response Format

### Success Response (200/201)
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### List Response with Pagination
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_items": 50,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

---

## 🌐 Swagger Documentation

The API is also documented in Swagger UI:

```
http://localhost:5001/api/docs/
```

You can test all endpoints interactively with proper authentication.

---

## 💡 Tips

1. **Always use pagination** in production to avoid large responses
2. **Use soft delete** to maintain data integrity and audit trails
3. **Set the correct timezone** for accurate attendance tracking
4. **Use unique codes** (e.g., "ACME001", "TECH001") for easy identification
5. **Apply filters** when listing to reduce response size
6. **Check permissions** before calling endpoints

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Token missing or expired
- Solution: Login again to get a new token

### 403 Forbidden
- User doesn't have required permission
- Solution: Check user role and permissions

### 404 Not Found
- Organization doesn't exist or is soft deleted
- Solution: Verify organization ID

### 409 Conflict
- Organization code/name already exists
- Solution: Use a different code or name

### 500 Internal Server Error
- Server-side error
- Solution: Check backend logs

---

## 📞 Support

For issues or questions:
1. Check the [ORGANIZATIONS_API_GUIDE.md](./ORGANIZATIONS_API_GUIDE.md) for detailed documentation
2. Review the [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) for common issues
3. Test with the PowerShell script to verify functionality
4. Check Swagger documentation at `/api/docs/`

---

## 🎯 Related APIs

After creating an organization, you can create related entities:

- **Locations** - `/api/v2/locations` (Physical locations within organization)
- **Departments** - `/api/v2/departments` (Organizational units)
- **Employees** - `/api/v2/employees` (Staff members)
- **Shifts** - `/api/v2/shifts` (Work shifts)
- **Cameras** - `/api/v2/cameras` (Surveillance cameras)

---

## 📁 File Structure

```
vms_backend/
├── ORGANIZATIONS_API_GUIDE.md                    # Comprehensive guide
├── ORGANIZATIONS_API_QUICK_REFERENCE.md          # Quick reference
├── Organizations_API_Postman_Collection.json     # Postman collection
├── ORGANIZATIONS_README.md                       # This file
├── tests/
│   └── test_organizations_api.ps1                # PowerShell test script
├── app/
│   ├── api/
│   │   └── organizations/
│   │       └── routes.py                         # API routes
│   ├── models/
│   │   └── organization.py                       # Database model
│   ├── schemas/
│   │   └── organization.py                       # Validation schemas
│   └── services/
│       └── organization_service.py               # Business logic
```

---

## ✅ Checklist

Before using the Organizations API:

- [ ] Backend server is running
- [ ] Database migrations are applied
- [ ] You have valid JWT token
- [ ] Your user has appropriate permissions
- [ ] You've reviewed the API documentation
- [ ] You've tested with the PowerShell script or Postman

---

**Last Updated:** December 22, 2025  
**API Version:** 2.0  
**Base URL:** `http://localhost:5001/api/v2/organizations`
