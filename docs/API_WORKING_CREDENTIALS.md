# API Working Credentials & Test Results

## ✅ API Status: WORKING

**Backend URL**: `http://localhost:5001`
**Health Check**: ✅ Passing
**Login Endpoint**: ✅ Working

---

## 🔑 Working Login Credentials

### Super Admin Account
- **Username**: `superadmin`
- **Email**: `admin@sparquer.com`
- **Password**: `Admin@123`
- **Role**: `super_admin` (full system access)

### Test Results
```
✅ Login Successful!
User: superadmin
Email: admin@sparquer.com
Role: super_admin
Access Token: Generated successfully
```

---

## 🚀 Frontend Configuration

The frontend `.env` file has been updated to the correct backend URL:

**File**: `vms_frontend/.env`
```env
REACT_APP_API_BASE_URL=http://localhost:5001
```

**Note**: Make sure to restart your frontend development server after this change to apply the new configuration.

---

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:5001/api/health
```

Expected Response:
```json
{
  "status": "healthy",
  "version": "2.0"
}
```

### 2. Login Test (PowerShell)
Run the test script:
```bash
cd vms_backend
.\test_correct_login.ps1
```

### 3. Login Test (Manual)
```powershell
$uri = "http://localhost:5001/api/v2/auth/login"
$body = @{
    username = "superadmin"
    password = "Admin@123"
} | ConvertTo-Json

Invoke-RestMethod -Uri $uri -Method Post -Body $body -ContentType "application/json"
```

---

## 📝 Available API Endpoints

### Authentication (v2)
- `POST /api/v2/auth/login` - Login with username/password
- `POST /api/v2/auth/register` - Register new user
- `POST /api/v2/auth/refresh` - Refresh access token
- `GET /api/v2/auth/me` - Get current user info
- `POST /api/v2/auth/logout` - Logout user
- `POST /api/v2/auth/change-password` - Change password

### Statistics
- `GET /api/stats/overview` - Get dashboard statistics
- `GET /api/stats/visitors/count` - Get visitor count

### Users (Admin)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/password` - Change user password

---

## 🔧 Troubleshooting

### Issue 1: "Failed to fetch" or CORS errors
**Solution**: Ensure backend is running on port 5001 and frontend .env has correct URL

### Issue 2: 401 Unauthorized
**Solution**: Use correct credentials:
- Username: `superadmin`
- Password: `Admin@123`

### Issue 3: Port conflicts
**Solution**: Backend runs on **port 5001** (not 5000)

---

## 📚 Documentation

For more details, see:
- `vms_backend/SEEDING_GUIDE.md` - Database seeding and user accounts
- `vms_backend/API_DOCUMENTATION.md` - Complete API reference
- `vms_backend/SWAGGER_README.md` - Swagger UI documentation
- Visit: `http://localhost:5001/api/docs/` for interactive API docs

---

## 🎯 Next Steps

1. ✅ Backend is running on port 5001
2. ✅ Frontend .env updated to correct port
3. ✅ Login credentials verified
4. **TODO**: Restart frontend development server to apply changes
5. **TODO**: Test login from the React frontend
6. **TODO**: Verify dashboard loads correctly with authenticated user

---

## 📊 Database Status

**Total Users**: 2
- `superadmin` (admin@sparquer.com) - Super Admin - ✅ Working
- `prem` (prem@sparquer.com) - Role ID: 7

**Note**: If you need more test users, run:
```bash
cd vms_backend
python manage.py seed_all
```

This will create:
- All default roles
- Super admin account
- Sparquer organization with 4 departments
- 11 employee accounts with default password: `Welcome@123`
