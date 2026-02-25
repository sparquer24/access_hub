# AccessHub Project - Complete Documentation Index

> **Master Documentation Index** - Your guide to all AccessHub documentation

This is the central hub for all AccessHub project documentation. Use the links below to navigate to specific areas.

---

## 📚 Quick Navigation

### Backend

- **[Backend Documentation Index](BACKEND_DOCUMENTATION_INDEX.md)** - All backend docs and architecture
- **[Backend Quickstart](BACKEND_QUICKSTART.md)** - Get the backend running in 5 minutes
- **[API Documentation](BACKEND_API_DOCUMENTATION.md)** - Full API reference

### Frontend

- **[Frontend Documentation Index](FRONTEND_DOCUMENTATION_INDEX.md)** - All frontend docs and setup
- **[Frontend Quickstart](FRONTEND_QUICKSTART.md)** - Get the frontend running in 5 minutes
- **[Tailwind Start Here](TAILWIND_START_HERE.md)** - Begin with Tailwind CSS

### Deployment & Operations

- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment verification
- **[Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)** - Solution to common issues

---

## 📦 Project Structure

```
AccessHub/
├── docs/                          📚 All documentation (you are here)
│   ├── DOCUMENTATION_INDEX.md     📑 This file
│   ├── BACKEND_DOCUMENTATION_INDEX.md
│   ├── FRONTEND_DOCUMENTATION_INDEX.md
│   └── [51 documentation files]
│
├── backend/                       🔧 Python/Flask API
│   ├── app/
│   │   ├── seeds/                 📋 Database seeding
│   │   ├── api/                   🔌 API endpoints
│   │   ├── models/                📊 Database models
│   │   ├── services/              🛠️ Business logic
│   │   └── [other modules]
│   ├── migrations/                🔄 Database migrations
│   ├── seed.py                    🌱 Main seed entry
│   ├── wsgi.py                    🚀 Application entry
│   └── requirements.txt           📦 Python dependencies
│
├── frontend/                      ⚛️ React.js UI
│   ├── src/
│   │   ├── components/            🧩 React components
│   │   ├── pages/                 📄 Page components
│   │   ├── features/              ✨ Feature modules
│   │   ├── services/              🔗 API clients
│   │   └── styles/                🎨 Stylesheets
│   ├── public/                    🖼️ Static assets
│   ├── tailwind.config.js         🎨 Tailwind config
│   └── package.json               📦 Node dependencies
│
└── qdrant-api/                    🔍 Vector search API
```

---

## 🚀 Getting Started

### First Time Setup (5 minutes)

1. **Backend**

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate     # Windows: .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   flask db upgrade               # Apply migrations
   python seed.py --master-data   # Seed database
   python wsgi.py                 # Start server
   ```

   → Open http://localhost:5000

2. **Frontend**

   ```bash
   cd frontend
   npm install
   npm start
   ```

   → Open http://localhost:3000

3. **Login with test account**
   - Email: `priya.sharma@indiaittpark.com`
   - Password: `Test@123`

See [Backend Quickstart](BACKEND_QUICKSTART.md) and [Frontend Quickstart](FRONTEND_QUICKSTART.md) for detailed guides.

---

## 📖 Documentation Overview

### Backend (22 documents)

| Category            | Documents                                                      |
| ------------------- | -------------------------------------------------------------- |
| **Getting Started** | Quickstart, API Documentation, API Integration Guide           |
| **Database**        | Seeding Strategy, Master Data Seeding, Database Connection Fix |
| **Deployment**      | Deployment Guide, Deployment Checklist, ECS Setup              |
| **Implementation**  | CRUD API Summary, Implementation Details, Architecture         |
| **Operations**      | Swagger Setup, Swagger Status, Role Permissions Reference      |

**→ See [Backend Documentation Index](BACKEND_DOCUMENTATION_INDEX.md) for complete list**

### Frontend (19 documents)

| Category            | Documents                                               |
| ------------------- | ------------------------------------------------------- |
| **Getting Started** | Quickstart, README, Implementation Report               |
| **Styling**         | Tailwind Setup, Tailwind Guide, Tailwind Implementation |
| **Features**        | Organization Creation, LocalStorage, Admin Dashboard    |
| **Tailwind CSS**    | 11 Tailwind-specific guides and references              |

**→ See [Frontend Documentation Index](FRONTEND_DOCUMENTATION_INDEX.md) for complete list**

### Shared (10 documents)

| Category         | Documents                                    |
| ---------------- | -------------------------------------------- |
| **Architecture** | Architecture Overview, Implementation Plan   |
| **API**          | Organizations API Guide, Organizations Setup |
| **Operations**   | Troubleshooting, Deployment, Credentials     |

---

## 🔧 Key Resources

### Development

- **Quickstart Guides** - [Backend](BACKEND_QUICKSTART.md) | [Frontend](FRONTEND_QUICKSTART.md)
- **API Reference** - [Full Documentation](BACKEND_API_DOCUMENTATION.md)
- **Database** - [Seeding Strategy](SEEDING_STRATEGY.md) | [Schema](BACKEND_SCHEMA_AND_API.md)
- **Styling** - [Tailwind Start Here](TAILWIND_START_HERE.md)

### Deployment

- **Production** - [Deployment Guide](DEPLOYMENT.md)
- **Infrastructure** - [ECS Setup](SEEDING_ECS_SETUP.md)
- **Pre-deployment** - [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

### Troubleshooting

- **Common Issues** - [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)
- **Database Problems** - [Database Connection Fix](DATABASE_CONNECTION_FIX.md)
- **Frontend Issues** - [LocalStorage Fix](LOCALSTORAGE_FIX.md) | [Organization Create Fix](ORGANIZATION_CREATE_FIX.md)

---

## 💻 Technology Stack

### Backend

- **Framework**: Flask (Python)
- **Database**: PostgreSQL
- **Authentication**: JWT
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **API Docs**: Swagger/OpenAPI
- **Deployment**: Docker, ECS

### Frontend

- **Framework**: React 17+
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **HTTP**: Axios
- **State**: React Context API
- **Build**: Create React App

### Infrastructure

- **Containerization**: Docker
- **Orchestration**: AWS ECS
- **Database**: AWS RDS (PostgreSQL)
- **Search**: Qdrant Vector DB
- **CI/CD**: GitHub Actions (planned)

---

## 📋 Common Tasks

### Database Operations

```bash
# Apply migrations
flask db upgrade

# Create new migration
flask db migrate -m "Description"

# Seed database
python seed.py --master-data      # Single org (14 employees)
python seed.py --organizations    # Multiple orgs
python seed.py --all              # Everything
```

### Development

```bash
# Backend
cd backend
python wsgi.py                    # Start server on :5000

# Frontend
cd frontend
npm start                         # Start dev server on :3000
npm run lint                      # Run ESLint
npm test                         # Run tests
```

### Deployment

```bash
# Build Docker image
docker build -t accesshub-backend .

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag accesshub-backend <account>.dkr.ecr.us-east-1.amazonaws.com/accesshub-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/accesshub-backend:latest

# Run migrations in ECS
aws ecs run-task --cluster accesshub --task-definition accesshub-migration:1 ...

# Run seed in ECS
aws ecs run-task --cluster accesshub --task-definition accesshub-seed:1 ...

# Deploy service
aws ecs update-service --cluster accesshub --service accesshub-api --force-new-deployment
```

---

## 🧑‍💼 User Roles & Permissions

The system includes 6 user roles:

| Role            | Email (Test)                  | Password | Access Level       |
| --------------- | ----------------------------- | -------- | ------------------ |
| **Super Admin** | -                             | -        | Full system access |
| **Org Admin**   | neha.gupta@indiaittpark.com   | Test@123 | Organization level |
| **Manager**     | priya.sharma@indiaittpark.com | Test@123 | Department level   |
| **Team Lead**   | rajesh.kumar@indiaittpark.com | Test@123 | Team oversight     |
| **Employee**    | (various)                     | Test@123 | Personal records   |
| **Visitor**     | -                             | -        | Check-in/out only  |

See [Role Permissions Reference](ROLE_PERMISSIONS_REFERENCE.md) for detailed permissions.

---

## 📊 Database Schema

The system manages:

- **Organizations** - Company/office locations
- **Departments** - Organizational divisions
- **Employees** - Staff members
- **Users** - System accounts
- **Roles** - Access control
- **Attendance** - Check-in/out records
- **Leaves** - Leave requests
- **Shifts** - Work schedules
- **Visitors** - External visitor tracking
- **Cameras** - CCTV camera management
- **Locations** - Physical locations

See [Backend Schema and API](BACKEND_SCHEMA_AND_API.md) for detailed schema information.

---

## 🔌 API Endpoints

### Core Endpoints

- `/api/organizations` - Organization management
- `/api/departments` - Department management
- `/api/employees` - Employee records
- `/api/users` - User accounts
- `/api/attendance` - Attendance tracking
- `/api/roles` - Role and permissions
- `/api/leaves` - Leave management
- `/api/shifts` - Shift scheduling
- `/api/visitors` - Visitor management
- `/api/cameras` - Camera management
- `/api/locations` - Location management

See [API Documentation](BACKEND_API_DOCUMENTATION.md) for complete endpoints with examples.

---

## 🔐 Security

The system implements:

- **JWT Authentication** - Token-based authentication
- **RBAC** - Role-based access control with permissions
- **Password Hashing** - bcrypt for password security
- **CORS** - Cross-origin resource sharing
- **Tenant Isolation** - Multi-organization support
- **Rate Limiting** - Prevent API abuse
- **HTTPS** - Encrypted communication (production)

---

## 📈 Monitoring & Logging

### Application Logs

```bash
# Backend
tail -f backend/app/logs/app.log

# Frontend
# Check browser console (F12 → Console)
```

### Docker Logs

```bash
# View container logs
docker logs <container-id>

# Follow logs
docker logs -f <container-id>
```

### CloudWatch (Production)

- Backend logs: `/ecs/accesshub-api`
- Migration logs: `/ecs/accesshub-migrations`
- Seed logs: `/ecs/accesshub-seeds`

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Seed data validated
- [ ] Environment variables configured
- [ ] Docker image built and tested
- [ ] ECS task definitions updated
- [ ] CloudWatch log groups created
- [ ] Backup taken (if applicable)
- [ ] Rollback plan documented
- [ ] Post-deployment verification planned

See [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) for detailed pre/post-deployment steps.

---

## 🆘 Getting Help

### Troubleshooting Steps

1. Check [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)
2. Review relevant documentation above
3. Check application logs
4. Search GitHub issues
5. Contact development team

### Common Issues

**Backend won't start**
→ See [Database Connection Fix](DATABASE_CONNECTION_FIX.md)

**Frontend styling broken**
→ See [Tailwind Start Here](TAILWIND_START_HERE.md)

**Seed script failed**
→ See [Seeding Strategy](SEEDING_STRATEGY.md)

**Deployment issues**
→ See [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

---

## 📝 Documentation Maintenance

### Adding New Documentation

1. Write in Markdown format
2. Add to appropriate folder/index
3. Update relevant index files
4. Commit with descriptive message

### Documentation Standards

- Clear, concise language
- Include examples where applicable
- Link to related documentation
- Update timestamps
- Keep technical accuracy

---

## 📞 Contact & Support

For questions or issues:

- **🐛 Bugs**: File an issue in GitHub
- **📝 Documentation**: Update relevant docs
- **🤔 Questions**: Check docs first, then ask team
- **🚀 Deployment**: Follow checklist, contact DevOps

---

## 📅 Last Updated

- **Backend**: February 25, 2026
- **Frontend**: February 25, 2026
- **Deployment**: February 25, 2026
- **Documentation**: February 25, 2026

---

## 🔗 Quick Links

| Resource            | Link                                                            |
| ------------------- | --------------------------------------------------------------- |
| **Backend Docs**    | [Backend Documentation Index](BACKEND_DOCUMENTATION_INDEX.md)   |
| **Frontend Docs**   | [Frontend Documentation Index](FRONTEND_DOCUMENTATION_INDEX.md) |
| **API Reference**   | [API Documentation](BACKEND_API_DOCUMENTATION.md)               |
| **Deployment**      | [Deployment Guide](DEPLOYMENT.md)                               |
| **Architecture**    | [Architecture Overview](ARCHITECTURE.md)                        |
| **Troubleshooting** | [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)               |

---

**Welcome to AccessHub! 🎉 Happy coding! 🚀**
