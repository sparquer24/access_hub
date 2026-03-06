# Master Data Seeding - Quick Reference

## Quick Start

```bash
cd backend
python run_seed_master_data.py
```

## What Gets Created

| Entity | Count | Details |
|--------|-------|---------|
| Roles | 6 | super_admin, org_admin, manager, team_lead, employee, visitor |
| Organizations | 4 | TSI, GSL, IIT, STH with different subscriptions |
| Departments | 24 | 6 per organization |
| Shifts | 16 | 4 per organization |
| Users | 12+ | Different roles across organizations |
| Employees | 12+ | Linked to users |
| Attendance | 200+ | 30 days per employee |

## Role Permissions Quick Map

```
super_admin      → All permissions (*)
org_admin        → Org departments, users, attendance approval
manager          → Team, attendance, leave approval
team_lead        → Team view, attendance read/update
employee         → Own attendance, leaves, profile
visitor          → Check-in/check-out only
```

## Test User Credentials

```
Email: alice.johnson@techsolutions.com       (Manager)
Email: david.wilson@techsolutions.com        (Org Admin)
Email: bob.smith@techsolutions.com           (Employee)
Password: Test@123 (for all test users)
```

## Database Schema

```
Organizations (4)
├── Departments (6 each) = 24
├── Shifts (4 each) = 16
└── Employees (3+ each)
    ├── Users (linked)
    ├── Attendance Records (30+ each)
    └── Roles (via Users)

Roles (6 global)
├── Permissions (JSON)
└── Users (many)
```

## Permissions Structure

Each role has permissions as JSON:

```json
{
  "organizations": ["create", "read", "update", "delete"],
  "departments": ["read"],
  "attendance": ["read", "approve"],
  "profile": ["read", "update"]
}
```

## Multi-Tenant Isolation

- Every entity (except Role, User when super_admin) has `organization_id`
- super_admin has `organization_id = NULL`
- Queries should filter by org: `Entity.query.filter_by(organization_id=org_id)`

## Attendance Status Values

```
present    → Employee checked in and out
absent     → No check-in
half_day   → Checked in for half day
on_leave   → Employee on approved leave
holiday    → Organization holiday
```

## Shift Working Days (JSON array)

```
[1, 2, 3, 4, 5]  → Monday to Friday
[5, 6]           → Friday to Saturday
[0, 1, 2, 3, 4, 5, 6]  → All days
```

(0=Sunday, 1=Monday, ..., 6=Saturday)

## Key Files

```
backend/
├── app/seeds/seed_master_data.py      ← Main seed script
├── run_seed_master_data.py            ← Runner script
├── MASTER_DATA_SEEDING.md             ← Full documentation
└── MASTER_DATA_SEEDING_QUICK_REF.md   ← This file
```

## Verify Seeded Data

```python
# In Flask shell or Python script
from app import create_app
from app.models import Role, Organization, User, Employee

app = create_app()
with app.app_context():
    print(f"Roles: {Role.query.count()}")
    print(f"Orgs: {Organization.query.count()}")
    print(f"Users: {User.query.count()}")
    print(f"Employees: {Employee.query.count()}")
```

## Sample Organizations

| Code | Name | Tier | Timezone | Location |
|------|------|------|----------|----------|
| TSI | Tech Solutions Inc | enterprise | US/Pacific | San Francisco |
| GSL | Global Services Ltd | professional | Europe/London | London |
| IIT | India IT Park | premium | Asia/Kolkata | Hyderabad |
| STH | Startup Hub | basic | US/Central | Austin |

## API Testing Users

After seeding, login with:

```json
{
  "email": "alice.johnson@techsolutions.com",
  "password": "Test@123"
}
```

Returns: JWT token with manager permissions

## Important Notes

⚠️ **Security**
- Default password: `Test@123` for all test users
- Must be changed before production use
- super_admin email: admin@sparquer.com (if seeded separately)

✅ **Idempotent**
- Safe to run multiple times
- Won't create duplicates
- Checks for existing records first

🔒 **Tenant-Safe**
- All organizations are isolated
- Users only see their org data
- super_admin can see all

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Foreign key fails" | Check all parent records exist |
| "Email already exists" | Data already seeded, skip |
| "Shift not found" | Verify shift name matches exactly |
| "Database locked" | Close Flask server, try again |

## Next Steps

1. ✅ Seed database: `python run_seed_master_data.py`
2. ✅ Verify data: `SELECT COUNT(*) FROM roles;`
3. ✅ Start server: `python manage.py runserver`
4. ✅ Login with test credentials
5. ✅ Create API endpoints using seeded data

---

For detailed information, see `MASTER_DATA_SEEDING.md`
