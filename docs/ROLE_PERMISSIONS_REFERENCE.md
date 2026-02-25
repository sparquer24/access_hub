# Role Permissions Reference

## 📋 Overview

This document details all role-based access control (RBAC) permissions in the system.

---

## 🎭 Roles Hierarchy

1. **Super Admin** - System-wide access
2. **Organization Admin** - Organization-wide access
3. **Manager** - Department/Team management
4. **Employee** - Limited self-service access

---

## 🔐 Super Admin Permissions

**Scope:** System-wide across all organizations

### Full CRUD Access:
- ✅ Organizations (create, read, update, delete)
- ✅ Users (create, read, update, delete)
- ✅ Employees (create, read, update, delete)
- ✅ Departments (create, read, update, delete)
- ✅ Attendance (create, read, update, delete)
- ✅ Cameras (create, read, update, delete)
- ✅ Locations (create, read, update, delete)
- ✅ Shifts (create, read, update, delete)
- ✅ Leave Requests (create, read, update, delete, approve, reject)
- ✅ Visitors (create, read, update, delete)

### Read-Only:
- ✅ Reports (read, export)
- ✅ Audit Logs (read)

---

## 🏢 Organization Admin Permissions

**Scope:** Their organization only

### Full CRUD Access:
- ✅ Users (within their org)
- ✅ Employees (within their org)
- ✅ Departments (within their org)
- ✅ Attendance (within their org)
- ✅ Cameras (within their org)
- ✅ Locations (within their org)
- ✅ Shifts (within their org)
- ✅ Leave Requests (within their org - can approve/reject)
- ✅ Visitors (within their org)

### Read-Only:
- ✅ Reports (read, export)
- ✅ Audit Logs (read - their org only)

### Cannot Access:
- ❌ Other organizations
- ❌ System-wide settings

---

## 👔 Manager Permissions

**Scope:** Their department/team

### Read & Update:
- ✅ Employees (read, update - their team)

### Read & Approve:
- ✅ Attendance (read, approve - their team)
- ✅ Leave Requests (read, approve, reject - their team)

### Read-Only:
- ✅ Departments (read)
- ✅ Cameras (read)
- ✅ Locations (read)
- ✅ Shifts (read)
- ✅ Visitors (read)
- ✅ Reports (read)

### Cannot Access:
- ❌ User management
- ❌ System configuration
- ❌ Other departments' detailed data

---

## 👤 Employee Permissions

**Scope:** Self-service only

### Can Create & Read:
- ✅ Leave Requests (create, read - own only)

### Read-Only:
- ✅ Attendance (read - own only)
- ✅ Profile (read, update - own only)
- ✅ Shifts (read - assigned shifts)
- ✅ Locations (read - allowed locations)

### Cannot Access:
- ❌ Other employees' data
- ❌ Management functions
- ❌ Configuration
- ❌ Reports

---

## 📊 Permission Matrix

| Resource | Super Admin | Org Admin | Manager | Employee |
|----------|-------------|-----------|---------|----------|
| **Organizations** | CRUD | - | - | - |
| **Users** | CRUD | CRUD | - | - |
| **Employees** | CRUD | CRUD | RU | - |
| **Departments** | CRUD | CRUD | R | - |
| **Attendance** | CRUD | CRUD | RA | R (own) |
| **Cameras** | CRUD | CRUD | R | - |
| **Locations** | CRUD | CRUD | R | R |
| **Shifts** | CRUD | CRUD | R | R |
| **Leave Requests** | CRUD+A | CRUD+A | RA | CR (own) |
| **Visitors** | CRUD | CRUD | R | - |
| **Reports** | RE | RE | R | - |
| **Audit Logs** | R | R | - | - |

**Legend:**
- C = Create
- R = Read
- U = Update
- D = Delete
- A = Approve/Reject
- E = Export
- (own) = Own data only

---

## 🔍 Permission Checking

### Backend Implementation

Permissions are checked using the `has_permission` method on the Role model:

```python
from app.utils.decorators import require_permission

@require_permission('cameras', 'read')
def get_cameras():
    # Only accessible if user has cameras:read permission
    pass
```

### How It Works

1. User logs in and receives JWT token
2. Token contains user role information
3. Each API endpoint checks required permissions
4. Access granted/denied based on role permissions

---

## 🛠️ Updating Permissions

### Option 1: Update Database Directly

Run the update script:
```bash
.venv\Scripts\python.exe update_role_permissions.py
```

### Option 2: Re-seed Data

Delete and recreate roles:
```bash
.venv\Scripts\python.exe seed_all_tables.py
```

### Option 3: Manual Update via API

Use the roles API endpoint (Super Admin only):
```bash
PUT /api/v2/roles/{role_id}
{
  "permissions": {
    "resource": ["action1", "action2"]
  }
}
```

---

## 🎯 Common Scenarios

### Scenario 1: Super Admin Needs Access to Everything
**Solution:** Already configured - Super Admin has all permissions

### Scenario 2: Org Admin Can't Manage Cameras
**Solution:** Ensure `cameras:create,read,update,delete` is in their permissions

### Scenario 3: Manager Can't Approve Leave Requests
**Solution:** Ensure `leave_requests:approve,reject` is in their permissions

### Scenario 4: Employee Can't See Their Attendance
**Solution:** Ensure `attendance:read` is in their permissions

---

## 🔒 Security Best Practices

1. **Principle of Least Privilege**
   - Give users minimum permissions needed
   - Regularly review and audit permissions

2. **Separation of Duties**
   - Don't give one role too much power
   - Separate administrative and operational roles

3. **Regular Audits**
   - Check audit_logs regularly
   - Review who has what access

4. **Organization Isolation**
   - Org Admins can't see other organizations
   - Data is properly isolated by organization_id

---

## 📝 Adding New Permissions

When adding new resources/features:

1. **Define Permission Keys**
   ```python
   'new_resource': ['create', 'read', 'update', 'delete']
   ```

2. **Update Role Definitions**
   - Add to appropriate roles in `seed_all_tables.py`
   - Run update script

3. **Add Decorators**
   ```python
   @require_permission('new_resource', 'read')
   def get_new_resource():
       pass
   ```

4. **Test Thoroughly**
   - Test with each role
   - Verify access control works

---

## 🧪 Testing Permissions

### Test Super Admin Access
```bash
# Login as super admin
curl -X POST http://localhost:5001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@system.com","password":"Super@123"}'

# Try accessing cameras (should work)
curl http://localhost:5001/api/v2/cameras \
  -H "Authorization: Bearer TOKEN"
```

### Test Employee Access
```bash
# Login as employee
curl -X POST http://localhost:5001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee1@sparquer.com","password":"Employee@123"}'

# Try accessing cameras (should fail)
curl http://localhost:5001/api/v2/cameras \
  -H "Authorization: Bearer TOKEN"
```

---

## 📚 Related Files

- `app/models/role.py` - Role model definition
- `app/utils/decorators.py` - Permission checking decorators
- `app/middleware/rbac_middleware.py` - RBAC middleware
- `seed_all_tables.py` - Role seeding script
- `update_role_permissions.py` - Permission update script

---

## ✅ Verification Checklist

After updating permissions:

- [ ] Run update script successfully
- [ ] Test Super Admin can access all resources
- [ ] Test Org Admin can access org resources
- [ ] Test Manager has appropriate team access
- [ ] Test Employee has limited access
- [ ] Verify cross-organization isolation
- [ ] Check audit logs are being created

---

**Last Updated:** December 26, 2025  
**Permissions Updated:** Yes  
**All Roles Configured:** Yes
