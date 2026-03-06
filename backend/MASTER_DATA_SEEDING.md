# Master Data Seeding Guide

## Overview

This guide explains the master data structure and how to seed the database with test data.

## Database Schema Structure

### 1. Roles (with Role-Based Access Control)

The system uses a hierarchical role structure with fine-grained permissions:

#### Role Hierarchy

```
super_admin (Full system access)
    ↓
org_admin (Organization-level access)
    ↓
manager (Department management)
    ↓
team_lead (Limited team oversight)
    ↓
employee (Individual contributor)
    ↓
visitor (External visitor access)
```

#### Roles and Permissions

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **super_admin** | Global | All resources: create, read, update, delete, approve |
| **org_admin** | Organization | Departments, employees, users, attendance approval, settings |
| **manager** | Department | Team members, attendance, leave approval, reports |
| **team_lead** | Team | Read access to team, attendance updates |
| **employee** | Personal | Own attendance, leave requests, profile |
| **visitor** | Limited | Check-in/out only |

### 2. Organizations

Multi-tenant support with organization-level isolation:

- **Organization Types**: office, school, apartment, hospital, retail, warehouse, factory, hotel, restaurant, gym, other
- **Subscription Tiers**: free, basic, professional, enterprise
- **Timezone Support**: For accurate attendance calculations
- **Working Hours**: Configurable per organization

### 3. Departments

Organizational structure within each organization:

- Linked to Organization (many-to-one)
- Can have multiple Employees
- Manager relationship (reference to Employee)
- Unique constraint: org_id + department_code

### 4. Employees

Employee profiles linked to Users:

- One-to-one relationship with User (for authentication)
- Linked to Department and Organization
- Employment details: designation, type, joining date
- Shift assignment
- Face embeddings support

### 5. Users

Authentication table for all system users:

- Email and username are unique
- Role-based access control
- Organization relationship (nullable for super_admin)
- One-to-one link to Employee profile
- Soft delete support

### 6. Shifts

Work shift definitions:

- Start and end times
- Grace period for late check-in
- Working days configuration (0-6, 0=Sunday)
- Per-organization management

### 7. Attendance Records

Daily attendance tracking:

- Date-wise records
- Check-in/check-out times with GPS location
- Status: present, absent, half_day, on_leave, holiday
- Computed work hours
- Approval workflow

## Master Data Structure

### Sample Data Included

The seed script creates:

#### Organizations (4)
1. **Tech Solutions Inc** (TSI) - Enterprise tier, US timezone
2. **Global Services Ltd** (GSL) - Professional tier, London timezone
3. **India IT Park** (IIT) - Premium tier, India timezone
4. **Startup Hub** (STH) - Basic tier, Austin timezone

#### Departments per Organization (6)
- Engineering
- Sales
- HR
- Finance
- Operations
- Support

#### Roles (6)
- super_admin
- org_admin
- manager
- team_lead
- employee
- visitor

#### Shifts per Organization (4)
- Morning Shift (09:00 - 17:00)
- Evening Shift (14:00 - 22:00)
- Night Shift (22:00 - 06:00)
- Weekend Shift (10:00 - 18:00)

#### Sample Users & Employees (12+)
Each organization gets multiple employees with different roles:
- Managers (org_admin role)
- Team leads
- Regular employees
- Various designations

#### Attendance Records
30 days of historical attendance for each employee with realistic patterns.

## Seed Data Format and Logic

### Role Permissions Structure

```python
{
    "resource_name": ["action1", "action2", ...],
    "users": ["create", "read", "update"],
    "attendance": ["read", "approve"],
    "*": ["*"]  # Wildcard for super_admin
}
```

### User-Employee Relationship

```
User (Authentication)
  ├─ email (unique)
  ├─ username (unique)
  ├─ password_hash (bcrypt)
  ├─ role_id (FK to roles)
  └─ Employee (Profile - optional, one-to-one)
      ├─ employee_code
      ├─ full_name
      ├─ department_id
      └─ shift_id
```

### Tenant Isolation

Each table includes organization_id for multi-tenant isolation:
- Organizations are separate
- Employees belong to one organization
- Users belong to one organization (except super_admin)
- Departments are per-organization
- Shifts are per-organization

## How to Run the Seed Script

### Prerequisites

1. Database is running and accessible
2. Migrations have been applied: `python manage.py db upgrade`
3. Backend dependencies are installed

### Method 1: Run with Flask CLI

```bash
cd backend

# Run specific seed script
python -c "from app import create_app; from app.seeds.seed_master_data import seed_all_master_data; app = create_app(); app.app_context().push(); seed_all_master_data()"

# Or use the runner script
python run_seed_master_data.py
```

### Method 2: Within Application Context

```python
from app import create_app
from app.seeds.seed_master_data import seed_all_master_data

app = create_app()
with app.app_context():
    seed_all_master_data()
```

### Method 3: Using Flask Shell

```bash
cd backend
flask shell

# Then in the Python shell:
>>> from app.seeds.seed_master_data import seed_all_master_data
>>> seed_all_master_data()
```

## Test Credentials

After seeding, use these credentials to test different roles:

```
Organization: Tech Solutions Inc (TSI)

1. Super Admin (System-wide access)
   - Email: admin@sparquer.com (if initialized)
   - Password: Admin@123

2. Org Admin (Organization access)
   - Email: david.wilson@techsolutions.com
   - Role: org_admin
   - Password: Test@123

3. Manager (Department management)
   - Email: alice.johnson@techsolutions.com
   - Role: manager
   - Password: Test@123

4. Employee (Limited access)
   - Email: bob.smith@techsolutions.com
   - Role: employee
   - Password: Test@123

Organization: India IT Park (IIT)

5. Senior Developer / Manager
   - Email: priya.sharma@indiaittpark.com
   - Role: manager
   - Password: Test@123

6. Support Employee
   - Email: arjun.patel@indiaittpark.com
   - Role: employee
   - Shift: Evening Shift
   - Password: Test@123
```

## Seed Flow Diagram

```
seed_all_master_data()
    ↓
1. create_roles()              → Creates 6 roles with permissions
    ↓ db.session.commit()
2. create_organizations()      → Creates 4 organizations
    ↓ db.session.commit()
3. create_departments()        → Creates 6 depts per organization (24 total)
    ↓ db.session.commit()
4. create_shifts()             → Creates 4 shifts per organization (16 total)
    ↓ db.session.commit()
5. create_users_and_employees()→ Creates users with linked employees (12+)
    ↓ db.session.commit()
6. create_attendance_records() → Creates 30 days of attendance per employee
    ↓ db.session.commit()
✅ Complete
```

## Verifying Seeded Data

### Check Roles

```python
from app.models import Role

# Check all roles
for role in Role.query.all():
    print(f"{role.name}: {list(role.permissions.keys())}")
```

### Check Organizations

```python
from app.models import Organization

# Check all organizations
for org in Organization.query.all():
    print(f"{org.name} ({org.code}): {org.subscription_tier}")
```

### Check Users and Roles

```python
from app.models import User

# Check all users with their roles
for user in User.query.all():
    print(f"{user.email} - {user.role.name} in {user.organization.name if user.organization else 'No Org'}")
```

### Check Attendance

```python
from app.models import AttendanceRecord
from datetime import date

# Check today's attendance
today_attendance = AttendanceRecord.query.filter_by(date=date.today()).all()
print(f"Attendance records for today: {len(today_attendance)}")
```

## Resetting Seeded Data

To clear and reseed the database:

```bash
cd backend

# Option 1: Drop and recreate all tables
python manage.py db downgrade
python manage.py db upgrade

# Option 2: Clear specific tables (careful with this)
python -c "
from app import create_app
from app.extensions import db
from app.models import AttendanceRecord, Employee, User, Role, Department, Shift, Organization

app = create_app()
with app.app_context():
    # Delete in reverse order of dependencies
    db.session.query(AttendanceRecord).delete()
    db.session.query(Employee).delete()
    db.session.query(User).delete()
    db.session.query(Department).delete()
    db.session.query(Shift).delete()
    db.session.query(Organization).delete()
    db.session.query(Role).delete()
    db.session.commit()
    print('All data cleared')
"

# Then reseed
python run_seed_master_data.py
```

## Important Notes

### Security Considerations

1. **Default Passwords**: All test users have password `Test@123` - MUST be changed in production
2. **Super Admin**: Keep credentials secure
3. **Email Uniqueness**: Each user must have a unique email
4. **Username Uniqueness**: Each user must have a unique username

### Data Consistency

1. **FK Constraints**: All foreign keys are properly maintained
2. **Tenant Isolation**: super_admin has no organization, all others belong to one
3. **Soft Deletes**: deleted_at field supports soft deletion
4. **Cascade Deletes**: Related records are deleted with parent (except managers)

### Performance

1. **Batch Inserts**: Use db.session.flush() between related record types
2. **Indexes**: Created on frequently queried fields (email, username, organization_id)
3. **Pagination**: Prepare for large datasets in production

## Extending the Seed Data

To add more organizations, departments, or employees:

1. Edit the corresponding `_data` list in `seed_master_data.py`
2. Follow the same structure and naming conventions
3. Ensure all FK relationships are satisfied
4. Run the seed script again (it will skip existing records)

Example:

```python
# Add to employees_data
{
    "org_code": "TSI",
    "dept_code": "ENG",
    "full_name": "New Employee",
    "email": "new.employee@techsolutions.com",
    "username": "new_employee",
    "employee_code": "TSI999",
    "designation": "Software Engineer",
    "gender": "male",
    "role": "employee",
    "shift_name": "Morning Shift",
}
```

## Troubleshooting

### Issue: "Foreign key constraint fails"
- **Cause**: Missing parent record (organization, role, etc.)
- **Solution**: Ensure all referenced IDs exist and seed in correct order

### Issue: "Unique constraint violation"
- **Cause**: Duplicate email, username, or org+code combination
- **Solution**: Check if data already exists or use unique values

### Issue: "Shift not found"
- **Cause**: Shift name doesn't match exactly
- **Solution**: Verify shift names are exact matches

### Issue: Database locked
- **Cause**: Another process has a connection to the database
- **Solution**: Close all Flask apps and try again

## Additional Resources

- See `app/models/` for complete schema definitions
- See `ROLE_PERMISSIONS_REFERENCE.md` for detailed permissions
- See `SEEDING_GUIDE.md` for additional seeding utilities
