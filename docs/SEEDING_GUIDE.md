# Database Seeding Guide

## Quick Start 🚀

To initialize your database with all default data (roles, super admin, and Sparquer organization):

```bash
cd vms_backend
python manage.py seed_all
```

This single command will:
1. ✅ Create all default roles (super_admin, org_admin, employee)
2. ✅ Create a super admin account
3. ✅ Create Sparquer organization with 4 departments
4. ✅ Create 11 employee accounts

## Login Credentials 🔑

### Super Admin
- **Email**: `admin@sparquer.com`
- **Password**: `Admin@123`
- **Role**: Super Administrator (full system access)

### Org Admin (You - Prem)
- **Email**: `giribabunettlinx@gmail.com`
- **Password**: `Welcome@123`
- **Role**: Organization Administrator

### All Employees
Default password for all employees: `Welcome@123`

**Employee List:**
1. **Sai Krishna** - AI Team - saikrishna@sparquer.com
2. **Sankara Bharadwaj** - AI Team - sankara@sparquer.com
3. **DP** - Frontend - dp@sparquer.com
4. **Shirlene** - Frontend - shirlene@sparquer.com
5. **Prem** - Backend - giribabunettlinx@gmail.com (Org Admin)
6. **Manoj** - Backend - manoj@sparquer.com
7. **Kajal Yadav** - HR - kajal@sparquer.com
8. **Navyasree Yadavalli** - HR - navyasree@sparquer.com
9. **Nisha Yadav** - HR - nisha@sparquer.com
10. **Ramesh** - HR - ramesh@sparquer.com
11. **Sujay Jacob** - HR - sujay@sparquer.com

## Organization Structure 🏢

**Sparquer** (Code: SPARQUER)
- 📍 Location: India
- 🌐 Timezone: Asia/Kolkata
- 📧 Contact: info@sparquer.com

### Departments

| Department | Code | Employees |
|------------|------|-----------|
| AI Team | AI | Sai Krishna, Sankara Bharadwaj |
| Frontend | FRONTEND | DP, Shirlene |
| Backend | BACKEND | Prem (Org Admin), Manoj |
| HR | HR | Kajal, Navyasree, Nisha, Ramesh, Sujay |

## Individual Seed Commands

If you need to run seeds separately:

```bash
# Seed only roles
python manage.py seed_roles

# Seed only super admin
python manage.py seed_super_admin

# Seed only Sparquer organization
python manage.py seed_sparquer
```

## Database Management Commands

### Initialize Database
```bash
python manage.py init_db
```

### Reset Database (⚠️ WARNING: Deletes all data)
```bash
python manage.py reset_db
python manage.py seed_all
```

### Create Custom Super Admin
```bash
python manage.py create_superadmin
# You'll be prompted for email, username, and password
```

## Testing the Setup 🧪

1. **Start the backend server**:
   ```bash
   python wsgi.py
   ```

2. **Test login as Super Admin**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@sparquer.com",
       "password": "Admin@123"
     }'
   ```

3. **Test login as Org Admin (Prem)**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "giribabunettlinx@gmail.com",
       "password": "Welcome@123"
     }'
   ```

## Complete Setup Workflow 📋

For a fresh database setup:

```bash
# 1. Navigate to backend directory
cd vms_backend

# 2. Activate virtual environment (if using one)
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
# Copy .env.example to .env and configure

# 5. Initialize database
flask db upgrade

# 6. Seed all data
python manage.py seed_all

# 7. Start the server
python wsgi.py
```

## Security Recommendations 🔒

⚠️ **IMPORTANT**: Before deploying to production:

1. **Change all default passwords**
2. **Update email addresses** to real company emails
3. **Enable email verification** for new users
4. **Set up proper environment variables** in production
5. **Never commit** `.env` file with real credentials
6. **Enable HTTPS** for all communications
7. **Set up proper backup** procedures

## Troubleshooting 🔧

### Issue: "Role not found" error
**Solution**: Roles haven't been seeded yet. Run:
```bash
python manage.py seed_roles
```

### Issue: "User already exists"
**Solution**: Seeds have already been run. They're idempotent, so running them again will skip existing records.

### Issue: Database connection error
**Solution**: Check your `.env` file:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/vms_db
```

### Issue: Import errors
**Solution**: Make sure you're in the `vms_backend` directory and Flask app is properly configured:
```bash
export FLASK_APP=wsgi:app  # On macOS/Linux
$env:FLASK_APP = "wsgi:app"  # On Windows PowerShell
```

## Next Steps 🎯

After seeding:
1. ✅ Test all login credentials
2. ✅ Verify role-based access control
3. ✅ Check organization and department structure
4. ✅ Test employee management features
5. ✅ Set up frontend environment to connect to backend
6. ✅ Change default passwords
7. ✅ Configure email settings for notifications

## Additional Resources 📚

- **Seed Scripts Documentation**: `app/seeds/README.md`
- **Backend Implementation Guide**: `BACKEND_IMPLEMENTATION.md`
- **Quick Start Guide**: `QUICKSTART.md`
- **API Documentation**: Available at `/api/docs` when server is running

## Support 💬

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the error messages in console
3. Check database connection settings
4. Ensure all dependencies are installed
5. Verify Python version compatibility (Python 3.8+)

---

Happy Coding! 🎉
