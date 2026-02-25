# VMS Backend - Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: ModuleNotFoundError: No module named 'marshmallow'

**Error:**
```
ModuleNotFoundError: No module named 'marshmallow'
```

**Fix:**
```powershell
pip install marshmallow==3.20.1
```

---

### Issue 2: Cannot import name 'require_csrf' or 'require_login'

**Error:**
```
ImportError: cannot import name 'require_csrf' from 'app.middlewares'
```

**Status:** ✅ Already Fixed
- Added backward compatibility imports in `app/middlewares/__init__.py`

---

### Issue 3: Cannot import name 'AuthenticationError' or 'AuthorizationError'

**Error:**
```
ImportError: cannot import name 'AuthenticationError' from 'app.utils.exceptions'
```

**Status:** ✅ Already Fixed
- Added aliases in `app/utils/exceptions.py`

---

### Issue 4: Database Connection Issues

**Error:**
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```

**Fix:**
```powershell
# Check your .env file has correct DATABASE_URL
# Example:
DATABASE_URL=postgresql://username:password@localhost:5432/vms_db

# Test connection
psql -U username -d vms_db -c "SELECT 1"
```

---

### Issue 5: Port Already in Use

**Error:**
```
OSError: [WinError 10048] Only one usage of each socket address is normally permitted
```

**Fix:**
```powershell
# Find process using port 5001
netstat -ano | findstr :5001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
flask run --host 0.0.0.0 --port 5002
```

---

### Issue 6: Flask App Not Found

**Error:**
```
Error: Could not locate a Flask application
```

**Fix:**
```powershell
# Make sure FLASK_APP is set
$env:FLASK_APP = "wsgi.py"

# Or set it in .env file
echo "FLASK_APP=wsgi.py" >> .env
```

---

### Issue 7: Blueprint Registration Errors

**Error:**
```
AssertionError: A name collision occurred between blueprints
```

**Fix:**
This shouldn't occur with our implementation, but if it does:
1. Check `app/__init__.py` for duplicate blueprint registrations
2. Ensure blueprint names are unique

---

### Issue 8: Migration Issues

**Error:**
```
alembic.util.exc.CommandError: Target database is not up to date
```

**Fix:**
```powershell
# Run pending migrations
flask db upgrade

# If that fails, check migration status
flask db current

# If needed, reset migrations (⚠️ WARNING: This will lose data)
flask db downgrade base
flask db upgrade
```

---

### Issue 9: Missing Environment Variables

**Error:**
```
KeyError: 'SECRET_KEY' or similar
```

**Fix:**
```powershell
# Copy example env file
cp .env.example .env

# Edit .env and set all required variables:
# - SECRET_KEY
# - JWT_SECRET_KEY
# - DATABASE_URL
# - etc.
```

---

### Issue 10: Import Circular Dependencies

**Error:**
```
ImportError: cannot import name 'X' from partially initialized module
```

**Fix:**
This shouldn't occur with our implementation. If it does:
1. Check for circular imports in models/services
2. Move imports inside functions if needed
3. Use late imports (`from . import X` inside functions)

---

## Step-by-Step Diagnostic Process

### 1. Run the Diagnostic Script

```powershell
.\diagnose_and_fix.ps1
```

This will:
- Check if virtual environment is activated
- Test Python imports
- Run comprehensive diagnostics
- Try to start the server

### 2. Manual Diagnostic Steps

If the script doesn't work, follow these steps:

#### Step A: Check Virtual Environment
```powershell
# Should show (.venv-1) in your prompt
# If not, activate it:
..\.venv-1\Scripts\Activate.ps1
```

#### Step B: Check Python Version
```powershell
python --version
# Should be Python 3.9 or higher
```

#### Step C: Test Imports
```powershell
python -c "from app import create_app; print('OK')"
```

#### Step D: Check Dependencies
```powershell
pip list | findstr marshmallow
# Should show: marshmallow 3.20.1
```

#### Step E: Test Database Connection
```powershell
python -c "from app import create_app; app = create_app(); from app.extensions import db; app.app_context().push(); db.session.execute(db.text('SELECT 1')); print('DB OK')"
```

#### Step F: Check for Port Conflicts
```powershell
netstat -ano | findstr :5001
# Should be empty, or show your Flask process
```

---

## Quick Fixes Checklist

Run these commands in order:

```powershell
# 1. Ensure virtual environment is activated
..\.venv-1\Scripts\Activate.ps1

# 2. Navigate to vms_backend
cd vms_backend

# 3. Install/update dependencies
pip install -r requirements.txt

# 4. Ensure marshmallow is installed
pip install marshmallow==3.20.1

# 5. Run migrations
flask db upgrade

# 6. Test the app
python test_startup.py

# 7. Start the server
flask run --host 0.0.0.0 --port 5001
```

---

## Getting Detailed Error Information

If the server crashes, check:

1. **Terminal Output**: Look for the error message and traceback

2. **Flask Logs**: Check for detailed error information

3. **Test Startup Script**:
```powershell
python test_startup.py
```

This will show exactly where the error occurs.

---

## Still Having Issues?

### Get More Help

1. Check the error message carefully
2. Look at the full traceback
3. Copy the error and search for it
4. Check if it's one of the common issues above

### Report the Issue

If none of the fixes work, please provide:
1. Full error message and traceback
2. Output of `pip list`
3. Content of your `.env` file (remove sensitive data)
4. Python version: `python --version`
5. Operating system version

---

## Success Indicators

When the server starts successfully, you should see:

```
 * Serving Flask app 'wsgi'
 * Debug mode: on
WARNING: This is a development server.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001
 * Running on http://192.168.x.x:5001
Press CTRL+C to quit
 * Restarting with stat
 * Debugger is active!
```

Then you can access:
- **Swagger UI**: http://localhost:5001/api/docs/
- **Health Check**: http://localhost:5001/api/health

---

**Good luck! Your VMS backend should be up and running soon!** 🚀
