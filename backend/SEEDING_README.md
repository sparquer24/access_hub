# Database Seeding Guide

This guide explains how to populate your database with sample data for testing and development.

## 📋 Overview

The seeding script (`seed_all_tables.py`) populates ALL database tables with realistic sample data, including:

- **Organizations** - 3 sample companies
- **Roles** - 4 system roles (super_admin, org_admin, manager, employee)
- **Users** - 6 sample users with different roles
- **Departments** - 5 departments across organizations
- **Employees** - 4 employee records with complete details
- **Shifts** - 3 work shifts (morning, evening, night)
- **Locations** - 4 physical locations
- **Cameras** - 3 camera configurations
- **Face Embeddings** - Face recognition data for employees
- **Attendance Records** - 7 days of attendance history
- **Presence Events** - Real-time face detection events
- **Leave Requests** - Sample leave applications
- **Visitors** - 2 visitor check-ins with alerts
- **Audit Logs** - System activity logs
- **Images** - Employee profile images

---

## 🚀 Quick Start

### Option 1: Using Batch File (Windows)
```bash
run_seed.bat
```

### Option 2: Direct Python Command
```bash
.venv\Scripts\python.exe seed_all_tables.py
```

### Option 3: Using Make (if available)
```bash
make seed
```

---

## 📊 What Gets Created

### 1. Organizations (3)
- **Sparquer Technologies** - Enterprise tier tech company
- **TechCorp Solutions** - Professional tier tech company  
- **Global Manufacturing Inc** - Enterprise tier manufacturing

### 2. Users & Authentication (6 users)

| Username | Email | Role | Password | Organization |
|----------|-------|------|----------|--------------|
| superadmin | superadmin@system.com | Super Admin | Super@123 | System-wide |
| sparquer_admin | admin@sparquer.com | Org Admin | Admin@123 | Sparquer |
| john_manager | manager@sparquer.com | Manager | Manager@123 | Sparquer |
| alice_emp | employee1@sparquer.com | Employee | Employee@123 | Sparquer |
| bob_emp | employee2@sparquer.com | Employee | Employee@123 | Sparquer |
| techcorp_admin | admin@techcorp.com | Org Admin | Admin@123 | TechCorp |

### 3. Departments (5)
- Engineering (Sparquer)
- Human Resources (Sparquer)
- Sales & Marketing (Sparquer)
- Finance (Sparquer)
- Operations (TechCorp)

### 4. Employees (4)
- Admin User - VP Engineering
- John Manager - Engineering Manager
- Alice Smith - Senior Software Engineer
- Bob Johnson - Software Engineer

### 5. Attendance & Presence
- **7 days** of attendance records (excluding weekends)
- **9-hour** work days with check-in/check-out times
- Face recognition confidence scores
- Presence events at various locations

### 6. Other Data
- **3 Work Shifts** - Morning, Evening, Night
- **4 Locations** - Entrance, Office floors, Cafeteria
- **3 Cameras** - Entry and monitoring cameras
- **2 Visitors** - With check-in/check-out and alerts
- **2 Leave Requests** - Pending and approved

---

## ✅ Verification

After seeding, verify the data was created:

```bash
.venv\Scripts\python.exe verify_seeded_data.py
```

This will display:
- Row counts for all tables
- Sample data from key tables
- Department statistics
- Recent attendance records

---

## 🔄 Re-seeding

The seed script is **idempotent** for some entities (like roles and organizations) - it won't create duplicates if they already exist. However, it will create new records for:
- Users with different emails
- Employees
- Attendance records
- Events and logs

### To completely reset and re-seed:

1. **Drop all data (CAUTION!)**:
   ```sql
   -- Connect to your database and run:
   TRUNCATE TABLE attendance_records CASCADE;
   TRUNCATE TABLE presence_events CASCADE;
   TRUNCATE TABLE face_embeddings CASCADE;
   TRUNCATE TABLE employees CASCADE;
   TRUNCATE TABLE departments CASCADE;
   TRUNCATE TABLE users CASCADE;
   TRUNCATE TABLE organizations CASCADE;
   -- ... etc for other tables
   ```

2. **Or reset migrations and re-apply**:
   ```bash
   .venv\Scripts\python.exe fix_migrations_simple.py
   .venv\Scripts\python.exe -m flask db migrate -m "Reset"
   .venv\Scripts\python.exe -m flask db upgrade
   ```

3. **Then re-run seed**:
   ```bash
   .venv\Scripts\python.exe seed_all_tables.py
   ```

---

## 🧪 Testing with Seeded Data

### 1. Login Testing
Use any of the seeded user credentials to test authentication:

```bash
# Test Super Admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@system.com",
    "password": "Super@123"
  }'

# Test Org Admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sparquer.com",
    "password": "Admin@123"
  }'
```

### 2. API Testing
Test various endpoints with seeded data:

```bash
# Get organizations
curl http://localhost:5000/api/organizations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get employees
curl http://localhost:5000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get attendance records
curl http://localhost:5000/api/attendance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Dashboard Testing
- Login with different roles to see role-based access
- View attendance records and statistics
- Test leave request approvals
- Monitor visitor tracking

---

## 🎯 Customization

### Adding More Data

Edit `seed_all_tables.py` to add more sample data:

```python
# Add more organizations
orgs_data = [
    {
        'name': 'Your Company',
        'code': 'YOURCO',
        # ... other fields
    },
    # ... existing organizations
]

# Add more employees
employees_data = [
    {
        'employee_code': 'EMP005',
        'full_name': 'Jane Doe',
        # ... other fields
    },
    # ... existing employees
]
```

### Modifying Existing Data

You can modify the sample data in any of the `create_*` functions:

- `create_roles()` - System roles and permissions
- `create_organizations()` - Company details
- `create_users()` - User accounts
- `create_departments()` - Department structure
- `create_employees()` - Employee information
- etc.

---

## 📝 Data Relationships

The seeding script maintains proper foreign key relationships:

```
Organizations
    └── Users (organization_id)
    └── Departments (organization_id)
        └── Employees (department_id)
            └── Attendance Records (employee_id)
            └── Face Embeddings (employee_id)
            └── Leave Requests (employee_id)
    └── Shifts (organization_id)
    └── Locations (organization_id)
        └── Cameras (location_id)
            └── Presence Events (camera_id)
    └── Visitors (organization_id)
```

---

## ⚠️ Important Notes

1. **Passwords**: All seeded passwords follow the format: `Role@123`
   - Change these in production!
   - Never commit real passwords to git

2. **Face Embeddings**: Sample embeddings are dummy data
   - Real face embeddings would be generated from actual face images
   - The dummy data is just for testing the data structure

3. **Dates**: Attendance records are created for the past 7 days
   - Adjust `day_offset` range in `create_attendance_records()` for more history

4. **Production**: Never run this script in production!
   - This is for development and testing only
   - Contains default passwords and sample data

---

## 🔧 Troubleshooting

### Issue: "Table does not exist"
**Solution**: Run migrations first
```bash
.venv\Scripts\python.exe -m flask db upgrade
```

### Issue: "User already exists"
**Solution**: Script is idempotent for users. It will skip existing users. If you want fresh data, reset the database.

### Issue: "Foreign key constraint violation"
**Solution**: The script handles dependencies automatically. If you see this, ensure:
- All migrations are applied
- Tables are created in the correct order
- You're not manually deleting referenced records

### Issue: "Import errors"
**Solution**: Ensure you're in the correct directory and virtual environment:
```bash
cd c:\Users\preml\Desktop\office\vms\backend
.venv\Scripts\activate
```

---

## 📚 Related Files

- `seed_all_tables.py` - Main seeding script
- `verify_seeded_data.py` - Verification script
- `run_seed.bat` - Batch file to run seeding
- `app/seeds/` - Individual seed modules (used by main script)

---

## 🎓 Learning Resources

- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- [SQLAlchemy Relationships](https://docs.sqlalchemy.org/en/14/orm/relationships.html)
- [Database Seeding Best Practices](https://en.wikipedia.org/wiki/Database_seeding)

---

## ✨ Next Steps

After seeding:

1. ✅ Verify data: `python verify_seeded_data.py`
2. ✅ Start server: `python wsgi.py`
3. ✅ Test login with seeded credentials
4. ✅ Explore the API endpoints
5. ✅ Test frontend with real data

Happy coding! 🚀
