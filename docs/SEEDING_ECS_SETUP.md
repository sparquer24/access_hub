# Database Seeding Setup for ECS Deployment

## Overview

Database seeding and migrations are executed as **separate one-time ECS tasks**, not from the running API container. This ensures safe and conflict-free database updates, especially when multiple containers are running.

## Architecture

### Deployment Flow

```
1. Deploy new Docker image
   ↓
2. Run migration task (flask db upgrade)
   ↓
3. Run seed task if required (python seed.py [options])
   ↓
4. Start/Update the ECS API service
```

### Why Separate Tasks?

- **Safety**: Prevents migration conflicts during autoscaling/restarts
- **Idempotency**: Seed tasks check for existing records and skip if already created
- **Logging**: Task execution is logged separately for debugging
- **Sequencing**: Ensures migrations run before seeds

---

## Running Seeds Locally

### Prerequisites

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### Running Seeds

```bash
# Run master data seeding (default)
python seed.py --master-data

# Run organization data seeding
python seed.py --organizations

# Run admin user seeding
python seed.py --admin

# Run all seeds
python seed.py --all

# Show help
python seed.py --help
```

### Output Example

```
2026-02-25 10:15:30 - root - INFO - ======================================================================
2026-02-25 10:15:30 - root - INFO - Starting Database Seeding Task - 2026-02-25 10:15:30
2026-02-25 10:15:30 - root - INFO - ======================================================================
2026-02-25 10:15:30 - root - INFO - 
[1/3] Running Master Data Seed...
2026-02-25 10:15:30 - app.seeds.seed_master_data - INFO - Creating roles...
2026-02-25 10:15:31 - app.seeds.seed_master_data - INFO - Created organization: India IT Park
2026-02-25 10:15:31 - app.seeds.seed_master_data - INFO - ✓ Master data seeding completed successfully

2026-02-25 10:15:32 - root - INFO - ======================================================================
2026-02-25 10:15:32 - root - INFO - Seeding Summary
2026-02-25 10:15:32 - root - INFO - ======================================================================
2026-02-25 10:15:32 - root - INFO -   master_data: ✓ SUCCESS
2026-02-25 10:15:32 - root - INFO - ======================================================================
2026-02-25 10:15:32 - root - INFO - All seeding tasks completed successfully!
```

---

## ECS Task Configuration

### Migration Task Definition

```json
{
  "name": "database-migration",
  "command": [
    "sh",
    "-c",
    "flask db upgrade"
  ],
  "environment": {
    "FLASK_APP": "wsgi:app",
    "ENVIRONMENT": "prod"
  },
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/accesshub-migrations",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

### Seed Task Definition (Master Data)

```json
{
  "name": "database-seed-master",
  "command": [
    "python",
    "seed.py",
    "--master-data"
  ],
  "environment": {
    "ENVIRONMENT": "prod"
  },
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/accesshub-seeds",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

### Running via AWS CLI

```bash
# Run migration
aws ecs run-task \
  --cluster accesshub-cluster \
  --task-definition accesshub-migration:1 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --launch-type FARGATE

# Run seed
aws ecs run-task \
  --cluster accesshub-cluster \
  --task-definition accesshub-seed-master:1 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --launch-type FARGATE
```

---

## Docker Setup

Add to Dockerfile after setting working directory:

```dockerfile
# Copy seed scripts
COPY backend/seed.py ./seed.py
COPY backend/app/seeds/ ./app/seeds/

# Ensure migrations directory is available
COPY backend/migrations/ ./migrations/

# Install dependencies
RUN pip install -r requirements.txt

# Keep seed executable
RUN chmod +x /app/seed.py
```

---

## Available Seed Scripts

### 1. Master Data Seed (`--master-data`)

**Purpose**: Creates comprehensive test data for a single organization

**Creates**:
- 6 roles (super_admin, org_admin, manager, team_lead, employee, visitor)
- 1 primary organization (India IT Park)
- 6 departments (Engineering, Sales, HR, Finance, Operations, Support)
- 4 shifts (Morning, Evening, Night, Weekend)
- 14 test users with appropriate roles
- 14 linked employees
- ~588 attendance records (60 days × 14 employees, weekends excluded)

**Test Credentials**:
- Email: `priya.sharma@indiaittpark.com` (Manager)
- Email: `neha.gupta@indiaittpark.com` (Org Admin)
- Password: `Test@123`

**Usage**:
```bash
python seed.py --master-data
```

### 2. Organization Data Seed (`--organizations`)

**Purpose**: Seeds multiple organizations with realistic test data

**Creates**:
- Multiple organizations with full infrastructure
- Department hierarchies
- Employee teams
- Attendance records
- Leave requests
- Camera and location data

**Usage**:
```bash
python seed.py --organizations
```

### 3. Admin User Seed (`--admin`)

**Purpose**: Creates a default admin user for initial system access

**Creates**:
- Admin user with credentials
- Login ID: `AE21D018`
- Password: `123456`

**Usage**:
```bash
python seed.py --admin
```

---

## Idempotency

All seed scripts are **idempotent** — they check for existing records before creating:

```python
existing_role = Role.query.filter_by(name=role_data["name"]).first()

if existing_role:
    logger.debug(f"Role already exists: {role_data['name']}")
else:
    # Create new role
    ...
```

This means running the same seed script multiple times is safe and won't create duplicates.

---

## Environment Variables

Required for seed execution:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
ENVIRONMENT=prod
FLASK_APP=wsgi:app
```

Optional:

```
LOG_LEVEL=DEBUG  # Default: INFO
JWT_SECRET_KEY=your-secret
SECRET_KEY=your-secret
```

---

## Logging & Monitoring

All seed operations produce structured logs:

### Log Levels

- **DEBUG**: Individual record creation details
- **INFO**: Major operation milestones (creating roles, organizations, etc.)
- **WARNING**: Skipped records or missing dependencies
- **ERROR**: Fatal errors with stack traces

### CloudWatch Integration

Logs are automatically sent to CloudWatch when running in ECS:

```
/ecs/accesshub-seeds          # Seed task logs
/ecs/accesshub-migrations     # Migration task logs
```

### Querying Logs

```bash
aws logs tail /ecs/accesshub-seeds --follow
```

---

## Troubleshooting

### Database Connection Failed

```
Error: could not translate host name "postgres" to address
```

**Solution**: Ensure `DATABASE_URL` is correct and database is accessible from ECS VPC

### Migration Conflicts

```
Error: Target database is being accessed by other users
```

**Solution**: Only one migration task should run at a time. Check for running tasks:
```bash
aws ecs list-tasks --cluster accesshub-cluster
```

### Duplicate Records After Re-run

This shouldn't happen due to idempotency checks. If it does:
1. Check log level — set to DEBUG for details
2. Verify database state manually
3. Check for custom seed modifications

---

## Best Practices

✓ **Always run migrations before seeds**
```
Migration (flask db upgrade) → Seed (python seed.py)
```

✓ **Run seeds only once during initial deployment**
Use conditional checks in deployment automation

✓ **Monitor task logs during first deployment**
```bash
aws ecs describe-tasks --cluster accesshub-cluster --tasks <task-arn>
```

✓ **Use separate log groups for audit trail**
Keep migration and seed logs in separate CloudWatch groups

✓ **Test seed script in staging first**
Verify all database schemas are applied before running seeds

✓ **Set appropriate timeout values in ECS tasks**
Typically 5-10 minutes for seed execution depending on data volume

---

## Recovery

### If Seeding Fails

1. **Check logs**: Review CloudWatch logs for errors
2. **Verify database**: Check if partial data was created
3. **Rollback if needed**: Delete test data and re-run
4. **Re-run**: Simply run `python seed.py [options]` again (idempotent)

### If Migrations Fail

1. **Check schema**: Verify migration files are present
2. **Review database state**: Check Alembic version table
3. **Fix migration**: Update migration file if needed
4. **Re-apply**: Run `flask db upgrade` again

---

## Files Reference

- **Main Seed Script**: `backend/seed.py`
- **Master Data Seed**: `backend/app/seeds/seed_master_data.py`
- **Organization Data Seed**: `backend/seed_organization_data.py`
- **Admin Seed**: `backend/scripts/seed_admin.py`
- **Migrations**: `backend/migrations/`

---

## Next Steps

1. Update ECS task definitions in your deployment pipeline
2. Add seed.py execution step before starting API service
3. Configure CloudWatch log groups for monitoring
4. Test in staging environment
5. Deploy to production

