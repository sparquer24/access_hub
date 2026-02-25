# Organizations API - Quick Reference

## All Endpoints Summary

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| POST | `/api/v2/organizations` | Create organization | `organizations:create` |
| GET | `/api/v2/organizations` | List all organizations | `organizations:read` |
| GET | `/api/v2/organizations/{id}` | Get single organization | `organizations:read` |
| PUT | `/api/v2/organizations/{id}` | Update organization | `organizations:update` |
| DELETE | `/api/v2/organizations/{id}` | Delete organization | `organizations:delete` |
| GET | `/api/v2/organizations/{id}/stats` | Get organization stats | `organizations:read` |

---

## Quick Examples

### 1. CREATE
```bash
POST /api/v2/organizations
{
  "name": "Acme Corp",
  "code": "ACME001",
  "organization_type": "office"
}
```

### 2. GET ALL
```bash
GET /api/v2/organizations
GET /api/v2/organizations?page=1&per_page=20
GET /api/v2/organizations?search=Acme
GET /api/v2/organizations?organization_type=office&is_active=true
```

### 3. GET ONE
```bash
GET /api/v2/organizations/{org_id}
```

### 4. UPDATE
```bash
PUT /api/v2/organizations/{org_id}
{
  "name": "Updated Name",
  "contact_email": "new@email.com"
}
```

### 5. DELETE
```bash
DELETE /api/v2/organizations/{org_id}
DELETE /api/v2/organizations/{org_id}?hard_delete=true
```

### 6. STATS
```bash
GET /api/v2/organizations/{org_id}/stats
```

---

## Query Parameters for List Endpoint

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max: 100) |
| `search` | string | - | Search by name or code |
| `organization_type` | enum | - | Filter: school, office, apartment, home |
| `is_active` | boolean | - | Filter by active status |

---

## Organization Types
- `school` - Educational institutions
- `office` - Corporate offices
- `apartment` - Residential complexes
- `home` - Private homes

---

## Subscription Tiers
- `free` - Basic (default)
- `basic` - Standard
- `premium` - Advancedone
- `enterprise` - Full access

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate code/name) |
| 500 | Server Error |

---

## Complete Organization Object

```json
{
  "id": "uuid",
  "name": "Organization Name",
  "code": "ORG001",
  "address": "Address here",
  "contact_email": "email@example.com",
  "contact_phone": "+1234567890",
  "organization_type": "office",
  "timezone": "Asia/Kolkata",
  "working_hours": {
    "start": "09:00",
    "end": "18:00",
    "days": [1,2,3,4,5]
  },
  "subscription_tier": "free",
  "settings": {},
  "is_active": true,
  "created_at": "2025-12-22T10:00:00",
  "updated_at": "2025-12-22T10:00:00"
}
```

---

## Required Fields for Creation

- ✅ `name` (2-255 chars)
- ✅ `code` (2-50 chars, unique)

All other fields are optional!

---

## Authentication Header

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get your JWT token from the login endpoint:
```bash
POST /api/v2/auth/login
{
  "username": "your_username",
  "password": "your_password"
}
```
