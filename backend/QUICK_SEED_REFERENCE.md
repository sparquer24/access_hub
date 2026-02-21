# Quick Seed Reference Card

## 🚀 Run Seeding
```bash
.venv\Scripts\python.exe seed_all_tables.py
```

## ✅ Verify Data
```bash
.venv\Scripts\python.exe verify_seeded_data.py
```

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | superadmin@system.com | Super@123 |
| **Org Admin** | admin@sparquer.com | Admin@123 |
| **Manager** | manager@sparquer.com | Manager@123 |
| **Employee** | employee1@sparquer.com | Employee@123 |

## 📊 Sample Data Created

| Category | Count | Details |
|----------|-------|---------|
| Organizations | 3 | Sparquer, TechCorp, GlobalMfg |
| Roles | 4 | super_admin, org_admin, manager, employee |
| Users | 6 | Various roles across organizations |
| Departments | 5 | Engineering, HR, Sales, Finance, Operations |
| Employees | 4 | Complete employee profiles |
| Shifts | 3 | Morning, Evening, Night |
| Locations | 4 | Entrance, Office floors, Cafeteria |
| Cameras | 3 | Entry and monitoring cameras |
| Attendance | ~20 | Last 7 days (weekdays only) |
| Visitors | 2 | With check-in and alerts |
| Leave Requests | 2 | Pending and approved |

## 🧪 Quick API Tests

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sparquer.com","password":"Admin@123"}'
```

### Get Organizations (with token)
```bash
curl http://localhost:5000/api/organizations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Employees
```bash
curl http://localhost:5000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔄 Reset & Reseed

```bash
# 1. Reset database
.venv\Scripts\python.exe fix_migrations_simple.py

# 2. Apply migrations
.venv\Scripts\python.exe -m flask db upgrade

# 3. Run seed
.venv\Scripts\python.exe seed_all_tables.py
```

## 📝 Database Info

- **Database**: PostgreSQL
- **Database Name**: access_hub
- **Host**: 127.0.0.1:5432
- **Schemas**: 
  - `public` - Application tables
  - `main` - Alembic version tracking

## ⚡ Pro Tips

1. **Always seed after fresh migrations**
2. **Use different users to test RBAC**
3. **Check audit_logs table for activity tracking**
4. **Verify face_embeddings for face recognition testing**
5. **Use visitor data to test access control**

---

**Last Updated**: December 26, 2025  
**Script Version**: 1.0
