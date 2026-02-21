# Dashboard API Testing Guide

## 🆕 NEW: Swagger UI Available!

The easiest way to test the API is now through Swagger UI:
```
http://localhost:5001/api/docs/
```

Features:
- Interactive API documentation
- Test endpoints directly from browser  
- View request/response schemas
- Built-in authentication support

## Quick Test Commands

### 1. Test Backend API Endpoint

```bash
# Test with curl (after logging in)
curl -X GET http://localhost:5001/api/stats/overview \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt

# Or use the existing cookies.txt file
curl -X GET http://localhost:5001/api/stats/overview \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### 2. Start Both Servers

#### Terminal 1 - Backend
```bash
cd vms_backend
# Activate virtual environment (Windows)
.venv\Scripts\activate

# Run Flask server
python manage.py run
# OR
flask run

# Server should start at http://localhost:5001
```

#### Terminal 2 - Frontend
```bash
cd vms_frontend

# Install dependencies (if not already done)
npm install

# Start React dev server
npm start

# Browser should open at http://localhost:3000
```

### 3. Test with Swagger UI (Recommended)

1. **Open Swagger UI**
   ```
   http://localhost:5001/api/docs/
   ```

2. **Test Health Endpoint (No Auth)**
   - Expand `GET /api/health`
   - Click "Try it out" → "Execute"
   - Should return: `{"status": "healthy"}`

3. **Get JWT Token**
   ```bash
   curl -X POST http://localhost:5001/api/v2/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"superadmin@vms.com","password":"YourPassword"}'
   ```
   Copy the `access_token` from response

4. **Authorize in Swagger**
   - Click "Authorize" button (🔒 icon)
   - Enter: `Bearer <your_token>`
   - Click "Authorize" → "Close"

5. **Test Stats Endpoint**
   - Expand `GET /api/stats/overview`
   - Click "Try it out" → "Execute"
   - View dashboard statistics

### 4. Test with Frontend

1. **Login as SuperAdmin**
   - Navigate to: http://localhost:3000/login
   - Email: `superadmin@vms.com`
   - Password: Check your seed data or default password

2. **View Dashboard**
   - After login, you should be redirected to SuperAdmin Dashboard
   - Dashboard should display real-time statistics
   - Observe the 8 statistics cards with live data

3. **Test Refresh**
   - Click the "🔄 Refresh" button
   - Should see "Dashboard data refreshed successfully" message
   - Data should update

4. **Test Auto-Refresh**
   - Wait 30 seconds
   - Dashboard should auto-refresh (check browser console logs)
   - Data updates silently without user interaction

## Verification Checklist

### Backend Verification
- [ ] Backend server running on port 5000
- [ ] `/api/stats/overview` endpoint accessible
- [ ] Returns valid JSON response
- [ ] No authentication errors
- [ ] Database has seed data

### Frontend Verification
- [ ] Frontend server running on port 3000
- [ ] Login page loads correctly
- [ ] Can login as SuperAdmin
- [ ] Dashboard loads without errors
- [ ] All 8 cards display data
- [ ] Refresh button works
- [ ] Auto-refresh working
- [ ] No console errors

## Expected Dashboard Data

### Sample Response Structure
```json
{
  "organizations": {
    "total": 2,
    "active": 2
  },
  "employees": {
    "total": 5,
    "active": 5
  },
  "face_embeddings": {
    "total": 0,
    "primary": 0,
    "avg_quality": 0.0
  },
  "presence_events": {
    "total": 0,
    "unknown_faces": 0,
    "anomalies": 0,
    "pending_reviews": 0
  },
  "cameras": {
    "total": 0,
    "online": 0
  },
  "visitors": {
    "total": 0
  }
}
```

## Common Issues and Solutions

### Issue 1: CORS Errors
**Symptom**: Browser console shows CORS policy errors

**Solution**:
```python
# Check vms_backend/app/__init__.py
CORS(app, 
     origins=[frontend_origin],
     supports_credentials=True,
     allow_headers=["Content-Type", "X-CSRFToken"])
```

### Issue 2: 401 Unauthorized
**Symptom**: API returns 401 error

**Solution**:
1. Clear browser cookies
2. Login again
3. Check JWT token is being sent
4. Verify `withCredentials: true` in axios config

### Issue 3: Empty Data (All Zeros)
**Symptom**: Dashboard shows 0 for all statistics

**Solution**:
```bash
# Run backend seed scripts
cd vms_backend
python -m app.seeds.seed_roles
python -m app.seeds.seed_users
python -m app.seeds.seed_organizations
```

### Issue 4: Module Import Errors
**Symptom**: Backend shows import errors for models

**Solution**:
```python
# Check vms_backend/app/stats/routes.py
# Ensure models are imported correctly:
from ..models import (
    Organization,
    Employee,
    FaceEmbedding,
    PresenceEvent,
    Camera,
)
```

## Browser DevTools Testing

### Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: XHR
4. Look for `/api/stats/overview` requests
5. Verify:
   - Status: 200 OK
   - Response contains data
   - Request has cookies

### Console Tab
1. Look for any errors (red text)
2. Check for successful API calls logs
3. Verify component rendering logs
4. No CORS errors

### Application Tab
1. Check Cookies section
2. Verify JWT token cookie exists
3. Check CSRF token cookie
4. Ensure cookies are not expired

## Performance Testing

### Load Time
- Dashboard should load within 2-3 seconds
- Initial API call completes within 1 second
- No blocking UI during refresh

### Auto-Refresh
- Triggers every 30 seconds exactly
- No memory leaks (check Task Manager)
- Cleanup on component unmount

### User Experience
- Smooth animations
- No flickering during updates
- Loading indicators show/hide correctly
- Error messages are clear

## Manual Test Scenarios

### Scenario 1: First Load
1. Clear all cookies
2. Navigate to app
3. Login as SuperAdmin
4. Verify dashboard loads with data
5. Check all 8 cards display correctly

### Scenario 2: Refresh
1. On dashboard, click Refresh button
2. Verify success message appears
3. Check data updates (if database changed)
4. Verify button shows "Refreshing..." state

### Scenario 3: Error Handling
1. Stop backend server
2. Click Refresh button
3. Verify error message appears
4. Verify retry button is available
5. Restart backend and click retry

### Scenario 4: Auto-Refresh
1. Open browser console
2. Wait 30 seconds
3. Verify API call in Network tab
4. Check data updates (silent, no message)
5. Verify no errors in console

## API Response Time Benchmarks

### Expected Performance
- `/api/stats/overview`: < 500ms
- With 10 organizations: < 1s
- With 100 employees: < 1.5s
- With 1000 presence events: < 2s

### Optimization Tips
```python
# Add database indexes
CREATE INDEX idx_org_active ON organizations(is_active);
CREATE INDEX idx_emp_active ON employees(is_active);
CREATE INDEX idx_camera_status ON cameras(status);
CREATE INDEX idx_presence_review ON presence_events(review_status);
```

## Debugging Commands

### Check Database Content
```bash
cd vms_backend
python manage.py shell

# In Python shell
from app.models import Organization, Employee, User
print(f"Organizations: {Organization.query.count()}")
print(f"Employees: {Employee.query.count()}")
print(f"Users: {User.query.count()}")
```

### Check API Directly
```bash
# Test API with authentication
curl -X POST http://localhost:5001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@vms.com","password":"YourPassword"}' \
  -c cookies.txt

curl -X GET http://localhost:5001/api/stats/overview \
  -b cookies.txt
```

### Check Frontend State
```javascript
// In browser console
// Check if component is receiving data
console.log('Auth Context:', useAuth());
console.log('Stats Data:', statsData);
```

## Success Criteria

✅ Backend API responds within 2 seconds
✅ Dashboard displays 8 cards with real data
✅ Manual refresh works correctly
✅ Auto-refresh updates every 30 seconds
✅ Error handling shows appropriate messages
✅ Loading states display correctly
✅ No console errors or warnings
✅ Mobile responsive layout works
✅ All animations smooth and performant
✅ Logout works correctly

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Document any issues found
3. ✅ Create Phase 2 feature plan
4. ✅ Consider adding more analytics
5. ✅ Plan for real-time WebSocket updates

---

**Test Date**: December 20, 2025
**Tested By**: Development Team
**Status**: Ready for Testing