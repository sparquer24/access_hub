# Deployment Checklist: Database Migrations & Seeding

This checklist ensures that migrations and seeds are executed correctly in ECS.

## Pre-Deployment

## Release Notes

- [ ] Database schema changes documented
- [ ] New migration files included in deployment
- [ ] Seed data requirements identified
- [ ] Environment variables configured
- [ ] Database backup taken (production only)

## Deployment Steps

### 1. Build & Push Docker Image

```bash
# Build image with latest code
docker build -t accesshub-backend:v1.0.0 .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag accesshub-backend:v1.0.0 <account-id>.dkr.ecr.us-east-1.amazonaws.com/accesshub-backend:v1.0.0
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/accesshub-backend:v1.0.0
```

### 2. Run Migrations

Run as separate ECS task (blocks until complete):

```bash
# Method 1: AWS CLI
aws ecs run-task \
  --cluster accesshub-cluster \
  --task-definition accesshub-migration:1 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --launch-type FARGATE \
  --wait

# Method 2: Monitor specific task
TASK_ARN=$(aws ecs run-task ... | jq -r '.tasks[0].taskArn')
aws ecs wait tasks-stopped --cluster accesshub-cluster --tasks $TASK_ARN
```

- [ ] Migration task started
- [ ] Verify in CloudWatch: `/ecs/accesshub-migrations`
- [ ] Check for errors in logs
- [ ] Wait for "Migration complete" message

### 3. Run Seeds (If Required)

Only run if:
- [ ] First deployment to environment
- [ ] Specific seed parameter in release notes
- [ ] Manual approval given

```bash
# Run master data seed
aws ecs run-task \
  --cluster accesshub-cluster \
  --task-definition accesshub-seed-master:1 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --launch-type FARGATE

# Monitor progress
watch -n 5 'aws logs tail /ecs/accesshub-seeds --follow'
```

- [ ] Seed task started
- [ ] Verify in CloudWatch: `/ecs/accesshub-seeds`
- [ ] Check for errors in logs
- [ ] Verify idempotency (check for "already exists" messages)

### 4. Update ECS Service

Now deploy the API service with new image:

```bash
# Update service with new image
aws ecs update-service \
  --cluster accesshub-cluster \
  --service accesshub-api \
  --force-new-deployment

# Wait for rollout
aws ecs wait services-stable \
  --cluster accesshub-cluster \
  --services accesshub-api
```

- [ ] Service update initiated
- [ ] Tasks rolling out
- [ ] Old tasks replaced with new ones
- [ ] Health checks passing

## Post-Deployment Verification

### API Service Checks

```bash
# Check service status
aws ecs describe-services \
  --cluster accesshub-cluster \
  --services accesshub-api

# Verify running tasks
aws ecs list-tasks \
  --cluster accesshub-cluster \
  --service-name accesshub-api

# Check application logs
aws logs tail /ecs/accesshub-api --follow
```

- [ ] All tasks in RUNNING state
- [ ] No errors in application logs
- [ ] Response time acceptable
- [ ] CPU/Memory usage normal

### Database Checks

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check migrations applied
psql $DATABASE_URL -c "SELECT * FROM alembic_version;"

# Verify seed data (if applicable)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM roles;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM organizations;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM employees;"
```

- [ ] Database responsive
- [ ] All migrations in alembic_version
- [ ] Expected seed records present
- [ ] No orphaned references

### API Health Endpoint

```bash
# Health check
curl -s https://api.example.com/health | jq .

# Expected response
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

- [ ] Health check returns 200
- [ ] Database connection OK
- [ ] Version matches deployment

## Rollback Plan

If issues occur during/after deployment:

### Option 1: Roll Back to Previous Version

```bash
# Update service to previous image
aws ecs update-service \
  --cluster accesshub-cluster \
  --service accesshub-api \
  --force-new-deployment

# Select previous Docker image tag
# e.g., v1.0.0-previous
```

### Option 2: Database Migration Rollback

```bash
# Connect to database
psql $DATABASE_URL

# Check current revision
SELECT * FROM alembic_version;

# Downgrade to previous
-- In migration scripts or via Alembic CLI
alembic downgrade -1
```

### Option 3: Seed Data Cleanup

If seed task corrupted data:

```bash
# Remove recently created records
-- DELETE FROM employees WHERE created_at > NOW() - INTERVAL '1 hour';
-- DELETE FROM roles WHERE name IN ('new_role_1', 'new_role_2');

-- Run cleanup script if available
python cleanup.py
```

- [ ] Rollback executed
- [ ] Service running previous version
- [ ] Database reverted to previous state
- [ ] All systems operational

## Post-Rollback

- [ ] Team notified of rollback
- [ ] Root cause analysis started
- [ ] Fix prepared for next deployment attempt
- [ ] Alert threshold review

## Sign-Off

- [ ] Deployment lead: __________ Date: __________
- [ ] Database admin: __________ Date: __________
- [ ] QA approval: __________ Date: __________

## Deployment History

| Date | Version | Environment | Migrations | Seeds | Status | Notes |
|------|---------|-------------|------------|-------|--------|-------|
| YYYY-MM-DD | v1.0.0 | prod | Yes | master-data | ✓ | Initial release |
| | | | | | | |

---

## Quick Reference Commands

```bash
# View all ECS tasks
aws ecs list-tasks --cluster accesshub-cluster

# Get detailed task info
aws ecs describe-tasks --cluster accesshub-cluster --tasks <task-arn>

# View task logs
aws logs tail /ecs/accesshub-migrations --follow
aws logs tail /ecs/accesshub-seeds --follow
aws logs tail /ecs/accesshub-api --follow

# Manually run migration
aws ecs run-task \
  --cluster accesshub-cluster \
  --task-definition accesshub-migration:1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={...}"

# Manually run seed
aws ecs run-task \
  --cluster accesshub-cluster \
  --task-definition accesshub-seed-master:1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={...}"

# Force service redeployment
aws ecs update-service \
  --cluster accesshub-cluster \
  --service accesshub-api \
  --force-new-deployment

# Get service status
aws ecs describe-services \
  --cluster accesshub-cluster \
  --services accesshub-api
```

