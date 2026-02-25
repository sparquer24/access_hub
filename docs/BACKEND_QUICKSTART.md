# Quick Start Guide - Multi-Tenant AccessHub Backend

## Prerequisites

- Python 3.10+
- PostgreSQL 15+
- Redis 7+
- pip

## Step-by-Step Setup

### 1. Clone and Navigate
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# On Linux/Mac
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Create a `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=visitor_db
DB_USER=admin
DB_PASS=admin

# JWT Configuration
JWT_SECRET_KEY=change-this-to-a-random-secret-key-in-production
JWT_ACCESS_TOKEN_EXPIRES_HOURS=1
JWT_REFRESH_TOKEN_EXPIRES_DAYS=30

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Server Configuration
HOST=0.0.0.0
PORT=5001
SECRET_KEY=change-this-secret-key-in-production
```

### 5. Setup PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE visitor_db;
CREATE USER admin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE visitor_db TO admin;
\q
```

### 6. Start Redis
```bash
# On Linux/Mac with Redis installed
redis-server

# On Windows (with Redis for Windows)
redis-server.exe

# Or using Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 7. Initialize Database
```bash
# Create migration
flask db migrate -m "Add multi-tenant models"

# Apply migration
flask db upgrade
```

### 8. Seed Default Roles
```bash
python manage.py seed-roles
```

Expected output:
```
Created role: super_admin
Created role: org_admin
Created role: employee

✅ Successfully initialized 3 roles
```

### 9. Create Super Admin User
```bash
python manage.py create-superadmin
```

Follow the prompts:
```
Email: admin@example.com
Username: admin
Password: ********
Confirm Password: ********

✅ Super admin created successfully!
   Email: admin@example.com
   Username: admin
```

### 10. Run the Server
```bash
python wsgi.py
```

You should see:
```
 * Running on http://0.0.0.0:5001
```

## Verify Installation

### 1. Health Check
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0"
}
```

### 2. Login Test
```bash
curl -X POST http://localhost:5001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "username": "admin",
      "role": {
        "name": "super_admin",
        ...
      }
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

### 3. Get Current User
Save the access token from login, then:

```bash
curl http://localhost:5001/api/v2/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Quick Commands Reference

```bash
# Database
flask db migrate -m "message"     # Create migration
flask db upgrade                  # Apply migrations
flask db downgrade                # Rollback migration

# Management
python manage.py seed-roles       # Initialize roles
python manage.py create-superadmin  # Create super admin
python manage.py reset-db         # Reset database (caution!)

# Server
python wsgi.py                    # Run development server
```

## Next Steps

1. **Create an Organization** (Phase 2 - Coming soon)
2. **Add Organization Admin**
3. **Create Departments**
4. **Add Employees**
5. **Setup Face Recognition**

## Troubleshooting

### Database Connection Error
```
Error: could not connect to server
```
**Solution**: Ensure PostgreSQL is running and credentials are correct in `.env`

### Redis Connection Error
```
Error: Redis connection failed
```
**Solution**: Start Redis server with `redis-server`

### Port Already in Use
```
Error: Address already in use
```
**Solution**: Change PORT in `.env` or stop the process using port 5001

### Migration Error
```
Error: Can't locate revision identified by 'xxx'
```
**Solution**: 
```bash
rm -rf migrations/
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### Import Errors
```
ModuleNotFoundError: No module named 'xxx'
```
**Solution**: Ensure virtual environment is activated and dependencies are installed:
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Docker Setup (Alternative)

If you prefer Docker:

```bash
# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend flask db upgrade

# Seed roles
docker-compose exec backend python manage.py seed-roles

# Create super admin
docker-compose exec backend python manage.py create-superadmin
```

## Development Tools

### API Testing with Postman
1. Import the Postman collection (if available)
2. Set environment variables:
   - `base_url`: http://localhost:5001
   - `access_token`: (get from login response)

### Database GUI
- **pgAdmin**: Visual PostgreSQL management
- **DBeaver**: Universal database tool
- **TablePlus**: Modern database client

### Redis GUI
- **RedisInsight**: Official Redis GUI
- **Redis Commander**: Web-based Redis management

## Support

- Check `BACKEND_IMPLEMENTATION.md` for detailed documentation
- Review `ARCHITECTURE.md` for system design
- See `IMPLEMENTATION_PLAN.md` for roadmap

## Quick Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Frontend (React)                    │
│         http://localhost:3000                    │
└───────────────────┬─────────────────────────────┘
                    │
                    │ HTTP/JSON + JWT
                    │
┌───────────────────▼─────────────────────────────┐
│           Backend API (Flask)                    │
│         http://localhost:5001                    │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Auth API     │  │ Org API      │  (Phase 2)  │
│  │ /api/v2/auth │  │ /api/v2/org  │            │
│  └──────────────┘  └──────────────┘            │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ RBAC         │  │ Multi-Tenant │            │
│  │ Middleware   │  │ Isolation    │            │
│  └──────────────┘  └──────────────┘            │
└───────────────────┬─────────────────────────────┘
                    │
      ┌─────────────┴──────────────┐
      │                             │
┌─────▼──────┐              ┌──────▼─────┐
│ PostgreSQL │              │   Redis    │
│  Database  │              │   Cache    │
└────────────┘              └────────────┘
```

---

**Ready to build?** Start with Phase 2: Organization Management! 🚀
