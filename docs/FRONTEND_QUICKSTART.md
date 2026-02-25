# Frontend Quick Start Guide

## Prerequisites
- Node.js 16+ and npm
- Backend server running on `http://localhost:5001`
- Super admin user created in backend

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create `.env` file (or use existing):
```env
REACT_APP_API_BASE_URL=http://localhost:5001
REACT_APP_ENV=development
```

### 3. Start Development Server
```bash
npm start
```

The app will automatically open at `http://localhost:3000`

## First Login

### Default Credentials
If you created a super admin in the backend:
```
Username: admin
Password: [your password]
```

### Test Flow
1. Navigate to `http://localhost:3000`
2. You'll be redirected to `/login`
3. Enter your credentials
4. Click "Login"
5. You'll be redirected based on your role:
   - Super Admin → `/super-admin/dashboard`
   - Org Admin → `/org-admin/dashboard`
   - Employee → `/employee/dashboard`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/              ← 🆕 New auth components
│   │   │   ├── LoginV2.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── RoleBasedRoute.jsx
│   │   │   └── PublicRoute.jsx
│   │   ├── dashboards/        ← 🆕 Role-based dashboards
│   │   │   ├── SuperAdminDashboard.jsx
│   │   │   ├── OrgAdminDashboard.jsx
│   │   │   └── EmployeeDashboard.jsx
│   │   ├── Unauthorized.jsx   ← 🆕 Access denied page
│   │   └── [legacy components]
│   ├── contexts/
│   │   └── AuthContext.jsx    ← 🆕 Auth state management
│   ├── services/
│   │   └── authService.js     ← 🆕 JWT authentication
│   ├── routes/
│   │   └── RoutesV2.jsx       ← 🆕 Protected routing
│   ├── styles/
│   │   ├── LoginV2.css        ← 🆕 Modern login styles
│   │   ├── Dashboard.css      ← 🆕 Dashboard styles
│   │   └── Unauthorized.css   ← 🆕 Error page styles
│   └── App.js                 ← Updated with AuthProvider
├── .env                       ← Environment config
└── package.json
```

## Available Routes

### Public Routes (Not Authenticated)
- `/login` - Modern login page
- `/login-old` - Legacy login page

### Protected Routes (Authenticated)

**Super Admin Only:**
- `/super-admin/dashboard` - System overview

**Org Admin + Super Admin:**
- `/org-admin/dashboard` - Organization management

**All Authenticated Users:**
- `/employee/dashboard` - Personal dashboard

**Legacy Routes (All Authenticated):**
- `/user_dashboard` - Old user dashboard
- `/admin_dashboard` - Old admin dashboard
- `/visitor_registration` - Visitor registration
- `/visitor_preview/:aadhaar` - Visitor preview
- `/admin/existing-users` - User management

### Special Routes
- `/unauthorized` - Access denied page
- `/` - Redirects to login
- `*` - Any unknown route redirects to login

## Key Features

### 1. JWT Authentication ✅
- Secure token-based authentication
- Automatic token refresh
- Persistent login sessions

### 2. Role-Based Access Control ✅
- Super Admin: Full system access
- Org Admin: Organization management
- Employee: Personal features

### 3. Protected Routes ✅
- Automatic login redirect
- Role-based route protection
- Unauthorized access handling

### 4. Modern UI ✅
- Beautiful gradient design
- Fully responsive
- Loading states
- Error handling

## Testing Different Roles

### 1. Test Super Admin
```bash
# Login with super admin credentials
Username: admin
Password: your-password

# You should see:
- System-wide statistics
- Organization management options
- User management features
```

### 2. Test Org Admin (Create First)
```bash
# Create org admin via backend API or Postman
POST http://localhost:5001/api/v2/auth/register
{
  "email": "orgadmin@example.com",
  "username": "orgadmin",
  "password": "password123",
  "role_id": "org_admin_role_id",
  "organization_id": "some_org_id"
}

# Then login with these credentials
```

### 3. Test Route Protection
```
1. Open browser in incognito mode
2. Try to access: http://localhost:3000/super-admin/dashboard
3. You'll be redirected to /login
4. After login, try to access super admin route as employee
5. You'll be redirected to /unauthorized
```

## Common Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables

```env
# Required
REACT_APP_API_BASE_URL=http://localhost:5001

# Optional
REACT_APP_ENV=development
```

## Troubleshooting

### Issue: Login button doesn't work
**Solution:**
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:5001/api/health`
3. Check `.env` has correct `REACT_APP_API_BASE_URL`

### Issue: CORS errors
**Solution:**
```bash
# Check backend .env has:
CORS_ORIGIN=http://localhost:3000

# Restart backend server
cd backend
python wsgi.py
```

### Issue: "Invalid token" error
**Solution:**
```javascript
// Clear localStorage in browser console
localStorage.clear()

// Refresh page and login again
```

### Issue: Redirects to login after successful login
**Solution:**
1. Check backend JWT tokens are being returned
2. Verify `authService.js` is storing tokens
3. Check browser localStorage has `access_token`

### Issue: Page not found
**Solution:**
```bash
# Ensure you're using the correct route paths
# Check RoutesV2.jsx for available routes

# Available dashboards:
/super-admin/dashboard
/org-admin/dashboard
/employee/dashboard
```

## Development Workflow

### 1. Check Backend Status
```bash
curl http://localhost:5001/api/health
# Should return: {"status":"healthy","version":"2.0"}
```

### 2. Start Frontend
```bash
npm start
```

### 3. Test Login
```
1. Open http://localhost:3000
2. Login with credentials
3. Verify redirect to correct dashboard
```

### 4. Test Route Protection
```
1. Logout
2. Try accessing protected routes
3. Should redirect to login
```

## Browser DevTools Tips

### Check Authentication State
```javascript
// In browser console
localStorage.getItem('access_token')    // Check token
localStorage.getItem('user')            // Check user data
```

### Clear Auth State
```javascript
// In browser console
localStorage.clear()
// Then refresh page
```

### Network Tab
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Watch for API calls to `/api/v2/auth/login`
4. Check response has tokens

## API Endpoints Used

```
POST   /api/v2/auth/login           - Login
GET    /api/v2/auth/me              - Get current user
POST   /api/v2/auth/refresh         - Refresh token
POST   /api/v2/auth/logout          - Logout
POST   /api/v2/auth/change-password - Change password
GET    /api/health                  - Health check
```

## Next Steps

### Immediate
- ✅ Login works
- ✅ Role-based routing works
- ✅ Dashboards display correctly

### Phase 2 (Organization Management)
- Create organization management UI
- Build department management
- Add employee management

### Phase 3+ (Future)
- Face recognition UI
- Attendance marking
- Leave management
- Analytics dashboards

## Quick Demo Script

```bash
# Terminal 1: Start Backend
cd vms_backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python wsgi.py

# Terminal 2: Start Frontend
cd vms_frontend
npm start

# Browser: Test the app
1. Navigate to http://localhost:3000
2. Login with admin credentials
3. Explore the super admin dashboard
4. Try accessing different routes
5. Logout and test route protection
```

## Support

### Documentation
- `FRONTEND_IMPLEMENTATION.md` - Detailed technical docs
- `../ARCHITECTURE.md` - System architecture
- `../IMPLEMENTATION_PLAN.md` - Complete roadmap

### Common Files to Check
- `src/contexts/AuthContext.jsx` - Auth state
- `src/services/authService.js` - API calls
- `src/routes/RoutesV2.jsx` - Route config
- `src/components/auth/LoginV2.jsx` - Login UI

---

**Ready to code!** 🚀

The authentication system is fully functional and ready for Phase 2 development.
