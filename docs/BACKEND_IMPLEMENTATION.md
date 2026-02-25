# Backend Implementation - Phase 1 Complete ✅

## Overview
Phase 1 of the multi-tenant attendance tracking system backend has been implemented. This includes the foundation for JWT authentication, RBAC, multi-tenant isolation, and new database models.

## What's Been Implemented

### 1. Database Models ✅
All new models have been created in `app/models/`:

- **Organization** - Multi-tenant organization management
- **Role** - RBAC roles with permissions
- **User** - Unified authentication table
- **Department** - Department management within organizations
- **Employee** - Employee profiles linked to users
- **Shift** - Work shift definitions
- **FaceEmbedding** - Face recognition data storage
- **AttendanceRecord** - Daily attendance tracking
- **LeaveRequest** - Leave management
- **AuditLog** - Audit trail for all actions

### 2. Configuration Updates ✅
- Added JWT configuration (access/refresh tokens)
- Added Redis configuration for caching
- Updated `requirements.txt` with new dependencies

### 3. Extensions ✅
Added to `app/extensions.py`:
- `jwt` - JWT token management
- `cache` - Redis caching

### 4. Utilities ✅
Created comprehensive utilities in `app/utils/`:

- **validators.py** - Input validation functions
- **decorators.py** - Authorization decorators (@role_required, @organization_required, etc.)
- **responses.py** - Standardized API responses
- **exceptions.py** - Custom exception classes

### 5. Middleware ✅
Created middleware in `app/middleware/`:

- **auth_middleware.py** - JWT authentication
- **rbac_middleware.py** - Role-based access control
- **tenant_middleware.py** - Multi-tenant data isolation

### 6. Services ✅
Created service layer in `app/services/`:

- **base_service.py** - Base CRUD operations for all services
- **auth_service.py** - Authentication and user management

### 7. API Endpoints ✅
Created new API v2 auth endpoints in `app/api/auth/routes.py`:

- `POST /api/v2/auth/login` - JWT login
- `POST /api/v2/auth/register` - User registration
- `POST /api/v2/auth/refresh` - Token refresh
- `GET /api/v2/auth/me` - Get current user
- `POST /api/v2/auth/logout` - Logout (token blacklist)
- `POST /api/v2/auth/change-password` - Change password
- `POST /api/v2/auth/forgot-password` - Password reset

### 8. Database Seeds ✅
Created seed scripts in `app/seeds/`:

- **init_roles.py** - Initialize default roles (super_admin, org_admin, employee)

### 9. Management CLI ✅
Created `manage.py` with commands:

- `flask init-db` - Initialize database tables
- `flask seed-roles` - Seed default roles
- `flask create-superadmin` - Create super admin user
- `flask reset-db` - Reset database (caution!)

## Setup Instructions

### 1. Install Dependencies

```bash
cd vms_backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create/update `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=visitor_db
DB_USER=admin
DB_PASS=admin

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES_HOURS=1
JWT_REFRESH_TOKEN_EXPIRES_DAYS=30

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGIN=http://localhost:3000

# Server
HOST=0.0.0.0
PORT=5001
```

### 3. Database Migration

```bash
# Create migration for new models
flask db migrate -m "Add multi-tenant models"

# Apply migration
flask db upgrade
```

### 4. Initialize Roles

```bash
# Seed default roles
python manage.py seed-roles
```

### 5. Create Super Admin

```bash
# Create first super admin user
python manage.py create-superadmin
# Follow the prompts to enter email, username, and password
```

### 6. Run the Server

```bash
python wsgi.py
```

## Testing the New API

### 1. Health Check
```bash
curl http://localhost:5001/api/health
```

### 2. Create Super Admin
```bash
python manage.py create-superadmin
# Enter credentials when prompted
```

### 3. Login
```bash
curl -X POST http://localhost:5001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

### 4. Get Current User
```bash
curl http://localhost:5001/api/v2/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Refresh Token
```bash
curl -X POST http://localhost:5001/api/v2/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

## Architecture Highlights

### Multi-Tenant Isolation
- All queries automatically filtered by `organization_id`
- Super admin can access all organizations
- Enforced at middleware level

### RBAC (Role-Based Access Control)
- Three default roles: super_admin, org_admin, employee
- Permissions stored as JSON in roles table
- Enforced via decorators and middleware

### JWT Authentication
- Access tokens (short-lived, 1 hour default)
- Refresh tokens (long-lived, 30 days default)
- Token includes user claims (role, organization, permissions)

### Service Layer
- Business logic separated from routes
- Base service with common CRUD operations
- Easy to extend for new entities

## Database Schema

### Key Relationships
```
Organization
  ├── Departments
  │   └── Employees
  │       ├── User (auth)
  │       ├── FaceEmbeddings
  │       ├── AttendanceRecords
  │       └── LeaveRequests
  ├── Shifts
  └── AuditLogs

User
  ├── Role (permissions)
  └── Employee (profile)
```

### Soft Deletes
Models with `deleted_at` field support soft deletion:
- Organization
- User
- Employee
- Department
- FaceEmbedding

## Security Features

### 1. Password Hashing
- Uses bcrypt for password hashing
- Secure password storage

### 2. JWT Tokens
- Signed with secret key
- Include expiration time
- Refresh token rotation

### 3. Token Blacklisting
- Tokens can be blacklisted on logout
- Stored in Redis with TTL

### 4. Organization Isolation
- Users can only access their organization's data
- Enforced at query level

### 5. RBAC
- Fine-grained permission control
- Role hierarchy support

## Next Steps (Phase 2 - Organization Management)

1. Create `OrganizationService` in `app/services/organization_service.py`
2. Create organization API endpoints in `app/api/organizations/routes.py`
3. Add organization CRUD operations
4. Build organization settings management
5. Create tests for organization endpoints

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {...} // optional
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Error Handling

Custom exceptions in `app/utils/exceptions.py`:
- `APIException` - Base exception
- `ValidationError` - 422
- `AuthenticationError` - 401
- `AuthorizationError` - 403
- `ResourceNotFound` - 404
- `ConflictError` - 409
- `ServerError` - 500

## Logging and Audit

All user actions are logged in `audit_logs` table:
- User who performed action
- Action type (create, update, delete, etc.)
- Entity type and ID
- Old and new values
- IP address and user agent
- Timestamp

## Performance Considerations

### Caching
Redis caching enabled for:
- User sessions
- Organization settings
- Frequently accessed data

### Database Indexing
Indexes created on:
- Foreign keys
- Frequently queried fields (email, username, organization_id, etc.)
- Composite indexes for common queries

### Query Optimization
- Eager loading for relationships
- Pagination for list endpoints
- Soft deletes filtered automatically

## Development Tips

### Using Decorators
```python
from app.utils.decorators import role_required, organization_required

@bp.get("/admin-only")
@jwt_required()
@role_required('super_admin')
def admin_only():
    # Only super_admins can access
    pass

@bp.get("/org-data")
@jwt_required()
@organization_required
def org_data():
    # User must belong to an organization
    # g.organization_id is automatically set
    pass
```

### Using Base Service
```python
from app.services import BaseService
from app.models import Organization

class OrganizationService(BaseService):
    model = Organization
    
    # Inherit all CRUD operations
    # Add custom methods as needed
```

### Accessing Current User
```python
from flask import g
from flask_jwt_extended import jwt_required

@bp.get("/my-data")
@jwt_required()
def my_data():
    user_id = g.current_user_id
    role = g.current_user_role
    org_id = g.current_organization_id
    # Use these values
```

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Check `DB_HOST` (use 'localhost' for local, 'postgres' for Docker)

### Redis Connection Issues
- Ensure Redis is running: `redis-server`
- Check `REDIS_URL` in `.env`

### Migration Issues
```bash
# Reset migrations if needed
rm -rf migrations/
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### Token Issues
- Check `JWT_SECRET_KEY` is set
- Verify token hasn't expired
- Check token format: `Bearer <token>`

## Running Tests

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run tests
pytest

# With coverage
pytest --cov=app tests/
```

## Deployment Notes

### Production Checklist
- [ ] Change `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Set `SESSION_COOKIE_SECURE=true`
- [ ] Use managed PostgreSQL and Redis
- [ ] Enable HTTPS
- [ ] Set appropriate CORS origins
- [ ] Configure logging
- [ ] Setup monitoring
- [ ] Enable database backups
- [ ] Use environment-specific configs

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "wsgi:app"]
```

## Support

For issues or questions:
- Check the main ARCHITECTURE.md and IMPLEMENTATION_PLAN.md
- Review API documentation
- Check error logs

---

**Status**: Phase 1 Complete ✅  
**Next Phase**: Organization Management (Phase 2)  
**Last Updated**: December 2024
