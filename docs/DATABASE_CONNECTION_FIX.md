# Database Connection Fix - AccessHub

## Problem

Error: `could not translate host name "postgres" to address: Name or service not known`

This error occurs when:

- The application tries to connect to hostname `"postgres"` (a Docker container name)
- But the code is running locally on Windows/Mac/Linux without Docker
- The `_build_db_url()` function was missing, causing a fallback to an incorrect default

## Solution Applied ✅

Added the missing `_build_db_url()` function to `app/config.py` that:

1. **First checks**: `DATABASE_URL` environment variable (set by `.env` file)
2. **Then falls back to**: Loading from Pydantic Settings
3. **Finally defaults to**: `postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/access_hub` (localhost, not docker hostname)

This ensures the connection URL is properly resolved whether running:

- ✅ Locally on Windows without Docker
- ✅ Locally with Docker Compose
- ✅ On a remote server
- ✅ In CI/CD pipelines

## Configuration Guide

### For Local Development (Windows/Mac/Linux)

**Ensure `.env` file in `backend/` folder:**

```env
DATABASE_URL=postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/access_hub
JWT_SECRET_KEY=dev-jwt-secret-key
SECRET_KEY=dev-secret-key
ENVIRONMENT=dev
CORS_ORIGIN=http://localhost:3000
```

**Ensure PostgreSQL is running locally:**

```powershell
# Windows - Start PostgreSQL service
net start PostgreSQL15

# Or verify it's running on port 5432
netstat -ano | findstr :5432
```

### For Docker Deployments

**Update `.env` to use Docker service name:**

```env
DATABASE_URL=postgresql+psycopg2://postgres:pg1234@postgres:5432/access_hub
JWT_SECRET_KEY=your-secret-key
SECRET_KEY=your-secret-key
ENVIRONMENT=dev
```

**Then run:**

```bash
docker-compose up -d
docker-compose exec backend flask db upgrade
docker-compose exec backend python -m app.seeds.seed_master_data
```

### Environment-Specific Configurations

Use included environment files for quick setup:

#### `.env.development` - For local development

```env
DATABASE_URL=postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/visitor_db
```

#### `.env.example` - Template with common localhost

```env
DATABASE_URL=postgresql+psycopg2://admin:admin@localhost:5432/visitor_db
```

#### `.env.production` - For production server

```env
DATABASE_URL=postgresql+psycopg2://vms_user:secure_password@prod-server.com:5432/vms_prod
```

## Troubleshooting

### Issue: Still getting "postgres" hostname error

**Check your .env file:**

```bash
# Windows PowerShell
Get-Content backend\.env | Select-String DATABASE_URL

# Mac/Linux
grep DATABASE_URL backend/.env
```

**Ensure it contains 127.0.0.1 or localhost, NOT "postgres":**

```env
# ✅ Correct for local development
DATABASE_URL=postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/access_hub

# ❌ Wrong for local development (this is for Docker only)
DATABASE_URL=postgresql+psycopg2://postgres:pg1234@postgres:5432/access_hub
```

### Issue: Connection refused on port 5432

**Verify PostgreSQL credentials:**

```bash
# Mac/Linux/Windows (with PostgreSQL CLI installed)
psql -U postgres -h 127.0.0.1 -p 5432 -c "SELECT 1"
```

**If credential error, reset PostgreSQL:**

```bash
# Windows
# 1. Use pgAdmin or SQL Shell
# 2. Or reinstall PostgreSQL with known credentials
# 3. Update .env with correct credentials
```

### Issue: Database doesn't exist

**Create the database:**

```bash
# Using psql
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE access_hub;"

# Or using Python script
python manage.py create-db
```

### Issue: Seeding fails after connection fix

**Ensure migrations are run first:**

```bash
cd backend
flask db upgrade
python -m app.seeds.seed_master_data
```

## Environment Variables Priority

The `_build_db_url()` function resolves DATABASE_URL with this priority:

1. **`DATABASE_URL` OS environment variable** (highest priority)
   - Can be set before running Python
   - Useful for CI/CD and production

2. **`DATABASE_URL` in `.env` file** (loaded by Pydantic)
   - Read during Settings initialization
   - Most common for local development

3. **Fallback hardcoded value** (lowest priority)
   - `postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/access_hub`
   - Used if neither of the above is set

## Quick Reference

| Scenario   | Hostname               | Port | User     | Password               |
| ---------- | ---------------------- | ---- | -------- | ---------------------- |
| Local dev  | 127.0.0.1 or localhost | 5432 | postgres | pg1234                 |
| Docker     | postgres               | 5432 | postgres | pg1234                 |
| Production | your.server.com        | 5432 | vms_user | (your secure password) |

## Testing the Connection

```bash
# Option 1: Direct Python test
cd backend
python -c "
import os
os.environ['DATABASE_URL'] = 'postgresql+psycopg2://postgres:pg1234@127.0.0.1:5432/access_hub'
from app.config import _build_db_url
print('Resolved URL:', _build_db_url())
"

# Option 2: Using Flask shell
cd backend
flask shell
>>> from app.config import _build_db_url
>>> print(_build_db_url())

# Option 3: Test seed script
python -m app.seeds.seed_master_data
```

## Related Files

- [app/config.py](app/config.py) - Configuration management with `_build_db_url()` function
- [app/database.py](app/database.py) - Uses `_build_db_url()` for async database setup
- [.env](..env) - Environment variables (local)
- [.env.development](..env.development) - Development configuration template
- [.env.example](..env.example) - Example configuration template
- [docker-compose.infra.yml](../docker-compose.infra.yml) - Docker setup (uses "postgres" hostname)

---

**Last Updated**: February 12, 2026  
**Fixed**: Missing `_build_db_url()` function that was forcing "postgres" hostname
