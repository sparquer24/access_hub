# Database Seeding Strategy & Implementation

## Quick Start

Run seeding locally in 3 steps:

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Run seeds
python seed.py --master-data  # Default: creates test org + employees + attendance
python seed.py --all         # Run all available seeds
python seed.py --help        # Show all options
```

---

## Architecture Overview

### Seeding Approach

```
┌─────────────────────────────────────────────┐
│         Main Seed Script (seed.py)          │
│  • Entry point for all seeding operations   │
│  • Orchestrates multiple seed modules       │
│  • Handles logging & error reporting        │
│  • Returns success/failure exit code        │
└───────┬───────────────────────────────────┬─┘
        │                                   │
        ▼                                   ▼
┌─────────────────────┐         ┌──────────────────────┐
│  Master Data Seed   │         │  Organization Seed   │
│ (seed_master_data) │         │ (seed_organization_) │
│                     │         │   data)              │
│ • Roles             │         │                      │
│ • 1 Organization    │         │ • Multiple Orgs      │
│ • Departments       │         │ • Complex hierarchy  │
│ • Shifts            │         │ • Full infrastructure│
│ • 14 Employees      │         │ • 30 days data       │
│ • Test Users        │         │                      │
│ • 2 months data     │         │ For comprehensive    │
│                     │         │ testing              │
│ Primary use case    │         │                      │
└─────────────────────┘         └──────────────────────┘
```

### Why This Structure?

| Aspect | Single Org (Master) | Multi-Org (Full) |
|--------|-------------------|-----------------|
| **Size** | ~1,000 records | ~50,000 records |
| **Setup Time** | ~2-5 sec | ~10-30 sec |
| **Use Case** | Development, Basic Testing | Full scenario testing |
| **Idempotent** | ✓ Yes | ✓ Yes |
| **Partial Data** | ✓ Safe to run individually | ✓ Safe to run individually |

---

## Seed Scripts

### 1. Master Data Seed

**File**: `backend/app/seeds/seed_master_data.py`  
**Entry**: `python seed.py --master-data` or directly via `seed.py`

#### What It Creates

```
India IT Park (IIT) - Organization
├── Engineering Department
│   ├── Priya Sharma (Manager) - priya.sharma@...
│   ├── Rajesh Kumar (Team Lead) - rajesh.kumar@...
│   ├── Neelam Verma (Junior Dev) - neelam.verma@...
│   └── Arun Singh (QA) - arun.singh@...
├── Sales Department  
│   ├── Anjali Patel (Manager) - anjali.patel@...
│   └── Rohan Malhotra (Executive) - rohan.malhotra@...
├── HR Department
│   ├── Divya Nair (Manager) - divya.nair@...
│   └── Suresh Iyer (Executive) - suresh.iyer@...
├── Finance Department
│   ├── Neha Gupta (Org Admin) - neha.gupta@...
│   └── Vikram Desai (Accountant) - vikram.desai@...
├── Operations Department
│   ├── Kavya Reddy (Manager) - kavya.reddy@...
│   └── Arjun Patel (Executive) - arjun.patel@...
└── Support Department
    ├── Shreya Chopra (Team Lead) - shreya.chopra@...
    └── Deepak Nayak (Executive) - deepak.nayak@...

Roles Created:
• super_admin (Full system access)
• org_admin (Organization level)
• manager (Department level)
• team_lead (Limited team access)
• employee (Individual contributor)
• visitor (Check-in/out only)

Shifts Created:
• Morning Shift (09:00-17:00)
• Evening Shift (14:00-22:00)
• Night Shift (22:00-06:00)
• Weekend Shift (10:00-18:00)

Data Generated:
• 14 test users with realistic credentials
• 14 employees across 6 departments
• ~588 attendance records (60 days, weekends excluded)
• Realistic patterns: 75% present, 15% half-day, 10% absent
```

#### Test Credentials

```
Username: priya.sharma@indiaittpark.com
Password: Test@123
Role: Manager

Username: neha.gupta@indiaittpark.com
Password: Test@123
Role: Org Admin

Username: rajesh.kumar@indiaittpark.com
Password: Test@123
Role: Team Lead
```

#### Idempotency

All records are checked before creation:

```python
existing_role = Role.query.filter_by(name="super_admin").first()
if existing_role:
    # Skip creation
    logger.debug("Role already exists")
else:
    # Create new role
    logger.info("Created role: super_admin")
```

**Safe to run multiple times** — will skip existing records

### 2. Organization Data Seed

**File**: `backend/seed_organization_data.py`  
**Entry**: `python seed.py --organizations`

#### What It Creates

Multiple organizations with:
- Full org hierarchy
- Multiple departments & employees
- Division-based teams
- Complex reporting structures
- 30+ days of realistic attendance patterns
- Leave requests & approvals
- Access control infrastructure
- Camera and location mappings

**Use for**: Integration tests, multi-org scenarios, complex hierarchies

### 3. Admin User Seed

**File**: `backend/scripts/seed_admin.py`  
**Entry**: `python seed.py --admin`

#### What It Creates

Single admin user:
- Login ID: `AE21D018`
- Password: `123456`
- Full system access
- Used for initial system access

---

## Common Use Cases

### Development Setup

```bash
# Fresh development environment
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Create database (using your local DB)
flask db upgrade
python seed.py --master-data

# Now ready to develop!
# Test accounts available
```

### Feature Testing

```bash
# Test new attendance features
python seed.py --master-data
# Now have 588 realistic attendance records + 14 employees

# Test org hierarchy
python seed.py --organizations
# Now have complex multi-org structure
```

### Initial ECS Deployment

```bash
# In deployment pipeline
1. Deploy Docker image
2. aws ecs run-task ... (run migration)
3. aws ecs run-task ... --command="python seed.py --master-data" (run seed)
4. aws ecs update-service ... (start API)
```

### Production Deployment (No Seeding)

```bash
# In production, seeding typically skipped
# Only run migrations unless specifically needed
1. Deploy Docker image
2. aws ecs run-task ... (run migration only)
3. aws ecs update-service ... (start API)
# Existing production data remains untouched
```

---

## Logging

All seeding operations produce structured logs:

### Log Format

```
2026-02-25 10:15:30 - app.seeds.seed_master_data - INFO - Creating roles...
2026-02-25 10:15:30 - app.seeds.seed_master_data - DEBUG - Created role: super_admin
2026-02-25 10:15:31 - app.seeds.seed_master_data - INFO - Created organization: India IT Park
```

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| **DEBUG** | Detail for debugging | `Created role: super_admin` |
| **INFO** | Major operations | `Creating roles...` |
| **WARNING** | Skipped/optional | `Department not found, skipping` |
| **ERROR** | Failures | `Error during seeding: <error>` |

### Viewing Logs

```bash
# Local console
python seed.py --master-data  # Logs to stdout

# CloudWatch (ECS)
aws logs tail /ecs/accesshub-seeds --follow
aws logs tail /ecs/accesshub-seeds --since 1h
aws logs filter-log-events --log-group-name /ecs/accesshub-seeds
```

---

## Environment Variables Required

```
DATABASE_URL=postgresql://user:password@localhost:5432/accesshub_db
ENVIRONMENT=dev
FLASK_APP=wsgi:app
JWT_SECRET_KEY=your-jwt-secret
SECRET_KEY=your-secret-key
```

### Optional

```
LOG_LEVEL=DEBUG  # Default: INFO (also supports INFO, WARNING, ERROR)
UPLOAD_FOLDER=./uploads
```

---

## Error Handling

### Common Errors & Solutions

#### 1. Database Connection Failed

```
Error: could not translate host name "postgres" to address
```

**Cause**: Database not accessible  
**Solution**:
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Update .env if needed
```

#### 2. Migration Not Applied

```
Error: Relation "roles" does not exist
```

**Cause**: `flask db upgrade` not run before seed  
**Solution**:
```bash
flask db upgrade  # First
python seed.py    # Then
```

#### 3. Permission Denied

```
Error: permission denied for schema public
```

**Cause**: Database user lacks permissions  
**Solution**:
```sql
-- Grant all on schema public to your_user;
-- Grant all privileges on all tables in schema public to your_user;
```

#### 4. Duplicate Key Violation (shouldn't happen)

```
Error: duplicate key value violates unique constraint "roles_name_key"
```

**Cause**: Idempotency check failed (rare)  
**Solution**:
```bash
# Delete existing data (ONLY in dev/test)
# Then re-run seed
python seed.py
```

---

## Best Practices

### Do ✓

- ✓ Run migrations **before** seeds
- ✓ Use separate ECS tasks for migrations & seeds
- ✓ Monitor seed execution with CloudWatch logs
- ✓ Test seed scripts in staging first
- ✓ Document any custom seed modifications
- ✓ Run seeds only on initial deployment
- ✓ Use idempotent seed scripts

### Don't ✗

- ✗ Run seeds from main API container
- ✗ Skip migrations and go straight to seeding
- ✗ Run seeds repeatedly in production
- ✗ Modify seed data without documentation
- ✗ Seed multiple times without checking idempotency
- ✗ Run concurrent seed/migration tasks

---

## AddingNew Seeds

To create new seed functions:

```python
# In backend/app/seeds/seed_master_data.py

def create_custom_data():
    """Create custom test data"""
    logger.info("Creating custom data...")
    
    try:
        # Your seeding logic
        logger.debug("Created custom entity")
        return True
    except Exception as e:
        logger.error(f"Error creating custom data: {str(e)}", exc_info=True)
        return False

# Then in seed_all_master_data():
def seed_all_master_data():
    ...
    success = create_custom_data()
    ...
```

Then add to `backend/seed.py`:

```python
def run_custom_seed():
    try:
        from app import create_app
        from app.seeds.seed_master_data import create_custom_data
        
        app = create_app()
        with app.app_context():
            success = create_custom_data()
            if success:
                logger.info("✓ Custom seed completed")
                return True
            return False
    except Exception as e:
        logger.error(f"✗ Error in custom seed: {str(e)}", exc_info=True)
        return False

# In main():
if args.custom:
    run_custom_seed()
```

---

## Monitoring & Maintenance

### Check Seed Status

```bash
# Count seeded records
psql $DATABASE_URL -c "
SELECT 
  (SELECT COUNT(*) FROM roles) as roles,
  (SELECT COUNT(*) FROM organizations) as organizations,
  (SELECT COUNT(*) FROM departments) as departments,
  (SELECT COUNT(*) FROM employees) as employees,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM attendance_records) as attendance_records;
"
```

### Expected Numbers (Master Data Seed)

| Entity | Count | Notes |
|--------|-------|-------|
| Roles | 6 | super_admin, org_admin, manager, team_lead, employee, visitor |
| Organizations | 1 | India IT Park |
| Departments | 6 | Engineering, Sales, HR, Finance, Operations, Support |
| Shifts | 4 | Morning, Evening, Night, Weekend |
| Users | 14 | Test users across departments |
| Employees | 14 | Linked to users |
| Attendance Records | ~588 | 60 days × 14 employees, weekends excluded |

### Clean Up Seeds (Dev Only)

```bash
# CAUTION: Only in development environments!
psql $DATABASE_URL << EOF
DELETE FROM attendance_records WHERE employee_id IN (
  SELECT id FROM employees WHERE organization_id = (
    SELECT id FROM organizations WHERE code = 'IIT'
  )
);

DELETE FROM employees WHERE organization_id = (
  SELECT id FROM organizations WHERE code = 'IIT'
);

DELETE FROM users WHERE organization_id = (
  SELECT id FROM organizations WHERE code = 'IIT'
);

DELETE FROM departments WHERE organization_id = (
  SELECT id FROM organizations WHERE code = 'IIT'
);

DELETE FROM shifts WHERE organization_id = (
  SELECT id FROM organizations WHERE code = 'IIT'
);

DELETE FROM organizations WHERE code = 'IIT';
DELETE FROM roles;
EOF
```

---

## Deployment Integration

### GitHub Actions Example

```yaml
- name: Run Migrations
  run: flask db upgrade
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    FLASK_APP: wsgi:app

- name: Run Seeds
  run: python seed.py --master-data
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    ENVIRONMENT: staging

- name: Start API
  run: python wsgi.py
```

### Django-style (if using Django instead)

```bash
# Equivalent
python manage.py migrate              # Migrations
python manage.py seed_master_data    # Seeding
python manage.py runserver           # Start
```

---

## References

- **Main Seed Script**: [backend/seed.py](backend/seed.py)
- **Master Data Seed**: [backend/app/seeds/seed_master_data.py](backend/app/seeds/seed_master_data.py)
- **Organization Seed**: [backend/seed_organization_data.py](backend/seed_organization_data.py)
- **ECS Setup Guide**: [SEEDING_ECS_SETUP.md](SEEDING_ECS_SETUP.md)
- **Deployment Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

