# Backend Documentation Index

## Quick Links

### Getting Started

- [Backend Quickstart](BACKEND_QUICKSTART.md) - Quick start guide for running the backend
- [Run Server Instructions](RUN_SERVER_INSTRUCTIONS.md) - How to run the server locally
- [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md) - Solutions to common issues

### API Documentation

- [API Documentation](BACKEND_API_DOCUMENTATION.md) - Complete API reference
- [API Integration Guide](API_INTEGRATION_GUIDE.md) - How to integrate with the API
- [API Working Credentials](API_WORKING_CREDENTIALS.md) - Test account credentials
- [Organizations API Guide](ORGANIZATIONS_API_GUIDE.md) - Organizations endpoints
- [Organizations API Quick Reference](ORGANIZATIONS_API_QUICK_REFERENCE.md) - Quick reference for org endpoints

### Database & Seeding

- [Seeding Strategy](SEEDING_STRATEGY.md) - Overview of seeding approach and usage
- [Seeding ECS Setup](SEEDING_ECS_SETUP.md) - How to run seeds in ECS
- [Master Data Seeding](MASTER_DATA_SEEDING.md) - Details about master data seed
- [Seeding Guide](SEEDING_GUIDE.md) - Step-by-step seeding guide
- [Seeding README](SEEDING_README.md) - Seeding documentation
- [Seed Validation Report](SEED_VALIDATION_REPORT.md) - Validation results for seeds
- [Database Connection Fix](DATABASE_CONNECTION_FIX.md) - Troubleshooting database connections

### Implementation & Architecture

- [Backend Implementation](BACKEND_IMPLEMENTATION.md) - Implementation details
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Summary of implementation
- [CRUD API Implementation Summary](CRUD_API_IMPLEMENTATION_SUMMARY.md) - CRUD operations
- [Backend Schema and API](BACKEND_SCHEMA_AND_API.md) - Database schema details
- [Architecture](ARCHITECTURE.md) - System architecture overview
- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Original implementation plan

### Operations & Configuration

- [Swagger Configuration Guide](SWAGGER_CONFIGURATION_GUIDE.md) - How to configure Swagger
- [Swagger Setup](SWAGGER_SETUP.md) - Swagger documentation setup
- [Swagger README](SWAGGER_README.md) - Swagger documentation guide
- [Swagger Status](SWAGGER_STATUS.md) - Swagger implementation status
- [Role Permissions Reference](ROLE_PERMISSIONS_REFERENCE.md) - Role and permission details
- [Organizations Setup](ORGANIZATIONS_SETUP.md) - Organizations configuration

### Deployment

- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions and checklist
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Step-by-step deployment checklist

---

## Directory Structure

```
backend/
├── app/
│   ├── api/              - API endpoints
│   ├── auth/             - Authentication
│   ├── models/           - Database models
│   ├── schemas/          - Request/response schemas
│   ├── seeds/            - Seeding scripts
│   │   ├── seed_master_data.py
│   │   ├── seed_organization_data.py
│   │   └── __init__.py
│   ├── services/         - Business logic
│   ├── middleware/       - HTTP middleware
│   ├── constants/        - App constants
│   ├── utils/            - Utility functions
│   ├── config.py         - Configuration settings
│   ├── extensions.py     - Flask extensions
│   ├── database.py       - Database connection
│   └── __init__.py       - App initialization
├── migrations/           - Database migrations (Alembic)
├── scripts/              - CLI scripts
├── tests/                - Test suite
├── seed.py               - Main seed entry point
├── wsgi.py               - WSGI application entry
├── manage.py             - Management commands
├── requirements.txt      - Python dependencies
├── requirements-core.txt - Core dependencies
├── Dockerfile            - Docker image definition
├── Makefile              - Build automation
├── .env.example          - Environment variables template
└── .dockerignore         - Docker ignore file
```

---

## Starting Development

### 1. Setup Environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Configure Database

Create `.env` file based on `.env.example`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/accesshub
JWT_SECRET_KEY=your-secret-key
SECRET_KEY=your-secret
ENVIRONMENT=dev
```

### 3. Run Migrations

```bash
flask db upgrade
```

### 4. Seed Database

```bash
python seed.py --master-data
```

### 5. Start Server

```bash
python wsgi.py
```

Or using make:

```bash
make run
```

---

## Key Files

| File              | Purpose                          |
| ----------------- | -------------------------------- |
| `wsgi.py`         | WSGI application entry point     |
| `seed.py`         | Database seeding orchestration   |
| `manage.py`       | Flask-Script management commands |
| `app/config.py`   | Application configuration        |
| `app/__init__.py` | Flask app factory                |
| `migrations/`     | Alembic migration files          |
| `app/seeds/`      | All seed scripts                 |

---

## Common Commands

### Running Seeds

```bash
# Master data seed (14 employees, 1 org, 2 months data)
python seed.py --master-data

# Organization data seed (multiple orgs)
python seed.py --organizations

# Admin user seed
python seed.py --admin

# All seeds
python seed.py --all
```

### Database

```bash
# Create new migration
flask db migrate -m "Description"

# Apply migration
flask db upgrade

# Rollback migration
flask db downgrade
```

### Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_file.py

# Run with coverage
pytest --cov=app tests/
```

---

## Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)

### Quick Fixes

**Database Connection Error**

- Check `DATABASE_URL` is correct in `.env`
- Verify PostgreSQL is running
- Check credentials

**Migration Failed**

- Run `flask db stamp head` to reset migration state
- Check `migrations/` folder for syntax errors
- See [Database Connection Fix](DATABASE_CONNECTION_FIX.md)

**Seed Script Failed**

- Ensure migrations ran first: `flask db upgrade`
- Check seed data exists in database
- See [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)

---

## Deployment

For production deployment, see:

- [Deployment Guide](DEPLOYMENT.md) - Detailed deployment instructions
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Pre/post deployment checks
- [Seeding ECS Setup](SEEDING_ECS_SETUP.md) - ECS task configuration

---

## Architecture Overview

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md)

### High-Level Flow

```
Client Request
    ↓
API Endpoint (app/api/)
    ↓
Middleware (app/middleware/)
    ↓
Schema Validation (app/schemas/)
    ↓
Service Layer (app/services/)
    ↓
Database Models (app/models/)
    ↓
PostgreSQL Database
    ↓
Response to Client
```

---

## API Endpoints

See [API Documentation](BACKEND_API_DOCUMENTATION.md) for complete endpoint reference.

**Main Modules:**

- Organizations (`/api/organizations`)
- Employees (`/api/employees`)
- Attendance (`/api/attendance`)
- Roles & Permissions (`/api/roles`)
- Users (`/api/users`)
- Leaves (`/api/leaves`)
- Shifts (`/api/shifts`)

---

## Database Schema

See [Backend Schema and API](BACKEND_SCHEMA_AND_API.md) for:

- Complete database schema
- Model relationships
- Validation rules
- Constraints

---

## Security

The backend implements:

- **JWT Authentication** - Token-based authentication
- **RBAC** (Role-Based Access Control) - Permission management
- **Password Hashing** - bcrypt for password security
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Prevent abuse

---

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

**Critical Variables:**

```
DATABASE_URL          - Database connection string (required)
JWT_SECRET_KEY        - JWT signing key (required)
SECRET_KEY            - Flask secret key (required)
ENVIRONMENT           - dev|staging|prod
```

### Flask Configuration

See `app/config.py` for Flask-specific settings like:

- Database connection pooling
- Session configuration
- CORS settings
- JWT configuration

---

## Support

For questions or issues:

1. Check [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)
2. Review relevant documentation above
3. Check application logs
4. Contact the development team

---

Last Updated: February 25, 2026
