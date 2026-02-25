# How to Run the VMS Backend Server

## Quick Start

### Option 1: Using the Batch File (Easiest)
Simply double-click or run:
```cmd
.\run_server.bat
```

### Option 2: Using PowerShell Command
In your PowerShell terminal (with virtual environment activated):
```powershell
flask run --host 0.0.0.0 --port 5001
```

### Option 3: Using Python Directly
```powershell
python -m flask run --host 0.0.0.0 --port 5001
```

---

## Prerequisites

Make sure you have:
1. ✅ Virtual environment activated (you should see `(.venv-1)` in your prompt)
2. ✅ All dependencies installed (especially `marshmallow==3.20.1`)
3. ✅ Database migrations applied (`flask db upgrade`)
4. ✅ Environment variables set (check `.env` file)

---

## Expected Output

When the server starts successfully, you should see:

```
 * Serving Flask app 'wsgi'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
Use a production WSGI server instead.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001
 * Running on http://192.168.x.x:5001
Press CTRL+C to quit
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: xxx-xxx-xxx
```

---

## Access Points

Once running:
- **Swagger Docs:** http://localhost:5001/api/docs/
- **Health Check:** http://localhost:5001/api/health
- **API v2:** http://localhost:5001/api/v2/
- **Legacy API:** http://localhost:5001/api/

---

## Troubleshooting

### If you get "marshmallow not found" error:
```powershell
pip install marshmallow==3.20.1
```

### If you get "port already in use" error:
```powershell
# Find and kill the process using port 5001
netstat -ano | findstr :5001
taskkill /PID <process_id> /F

# Or use a different port
flask run --host 0.0.0.0 --port 5002
```

### If virtual environment is not activated:
```powershell
# From the vms directory (parent of vms_backend)
.\.venv-1\Scripts\Activate.ps1

# Then navigate to vms_backend
cd vms_backend

# Run the server
flask run --host 0.0.0.0 --port 5001
```

### If you get import errors:
```powershell
# Reinstall all dependencies
pip install -r requirements.txt

# Then try running again
flask run --host 0.0.0.0 --port 5001
```

---

## Testing the Server

### Quick Health Check
Open in browser: http://localhost:5001/api/health

Expected response:
```json
{"status": "healthy", "version": "2.0"}
```

### Test with cURL
```bash
curl http://localhost:5001/api/health
```

### Access Swagger UI
Open in browser: http://localhost:5001/api/docs/

---

## Stopping the Server

Press **Ctrl + C** in the terminal where the server is running.

---

## Production Deployment

⚠️ **Important:** This is a development server. For production, use:
- **Gunicorn:** `gunicorn -w 4 -b 0.0.0.0:5001 wsgi:app`
- **uWSGI:** `uwsgi --http :5001 --module wsgi:app`
- **Docker:** Use the provided Dockerfile

---

**Ready to go!** Run the server using any of the options above. 🚀
