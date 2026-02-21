# LocalStorage and Authentication Fix

## Problem Summary

After login, users were experiencing issues with:
1. Role-based redirection not working properly
2. Blank screens after successful authentication
3. Inconsistent localStorage key usage across the application

## Root Causes Identified

### 1. Inconsistent LocalStorage Key Names
The application was using different localStorage keys in different files:
- **authService.js** was using `'user'` but should be using `'accesshub_user_data'`
- **api.jsx** was checking multiple legacy key names
- Different parts of the code were looking for tokens in different places

### 2. Role Checking Issues
- AuthContext was checking `user.role.name` (e.g., "Super Admin")
- Routes were configured to match `user.role.id` (e.g., "super_admin")
- This mismatch prevented role-based routing from working

### 3. Token Refresh Logic Duplication
- Both authService.js and api.jsx had their own token refresh logic
- They weren't using consistent localStorage keys
- Cleanup on logout was incomplete

## Fixes Applied

### 1. Fixed LocalStorage Key Constants (authService.js)

**Before:**
```javascript
const ACCESS_TOKEN_KEY = 'accesshub_access_token';
const REFRESH_TOKEN_KEY = 'accesshub_refresh_token';
const USER_KEY = 'user'; // ❌ WRONG
```

**After:**
```javascript
const ACCESS_TOKEN_KEY = 'accesshub_access_token';
const REFRESH_TOKEN_KEY = 'accesshub_refresh_token';
const USER_KEY = 'accesshub_user_data'; // ✅ CORRECT
```

### 2. Centralized Token Access (api.jsx)

**Before:**
```javascript
// Directly accessing localStorage with multiple fallbacks
const token = authService.getAccessToken?.() || 
              localStorage.getItem("accesshub_access_token") || 
              localStorage.getItem("access_token");
```

**After:**
```javascript
// Using authService exclusively
const token = authService.getAccessToken();
```

### 3. Fixed Token Refresh Logic (api.jsx)

**Before:**
```javascript
const refreshToken = localStorage.getItem('accesshub_refresh_token') || 
                     localStorage.getItem('refresh_token');
if (refreshToken) {
  const { access_token, refresh_token } = response.data.data;
  localStorage.setItem('accesshub_access_token', access_token);
  if (refresh_token)
    localStorage.setItem('accesshub_refresh_token', refresh_token);
}
```

**After:**
```javascript
const refreshToken = authService.getRefreshToken();
if (refreshToken) {
  const { access_token, refresh_token } = response.data.data;
  authService.setAccessToken(access_token);
  if (refresh_token) {
    authService.setRefreshToken(refresh_token);
  }
}
```

### 4. Comprehensive Cleanup on Logout (api.jsx)

**Before:**
```javascript
localStorage.removeItem('vms_access_token');
localStorage.removeItem('vms_refresh_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user');
localStorage.removeItem('vms_user_data');
```

**After:**
```javascript
// Clear all possible token keys (both old and new formats)
localStorage.removeItem('accesshub_access_token');
localStorage.removeItem('accesshub_refresh_token');
localStorage.removeItem('accesshub_user_data');
localStorage.removeItem('vms_access_token');
localStorage.removeItem('vms_refresh_token');
localStorage.removeItem('vms_user_data');
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user');
```

### 5. Improved AuthContext Initialization

**Before:**
```javascript
const token = authService.getAccessToken();
if (token) {
  // Always fetch from API (slow)
  const userData = await authService.getCurrentUser();
  setUser(userData);
  setIsAuthenticated(true);
}
```

**After:**
```javascript
const token = authService.getAccessToken();
if (token) {
  // First check localStorage (fast)
  const cachedUser = authService.getUser();
  if (cachedUser) {
    setUser(cachedUser);
    setIsAuthenticated(true);
    setLoading(false);
    
    // Then verify in background
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // If verification fails, clear everything
      authService.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  }
}
```

### 6. Added Debug Logging (authService.js)

Added comprehensive console logging to help debug authentication issues:

```javascript
console.log('[AuthService] Attempting login...');
console.log('[AuthService] Login response:', response.data);
console.log('[AuthService] User role:', user?.role);
console.log('[AuthService] Tokens stored. Verifying...');
console.log('[AuthService] Access token exists:', !!this.getAccessToken());
console.log('[AuthService] User data exists:', !!this.getUser());
```

## LocalStorage Structure

After these fixes, the application consistently uses these keys:

| Key | Value | Description |
|-----|-------|-------------|
| `accesshub_access_token` | JWT string | Access token for API authentication |
| `accesshub_refresh_token` | JWT string | Refresh token for obtaining new access tokens |
| `accesshub_user_data` | JSON object | Complete user object including role, permissions, etc. |

### User Data Structure
```javascript
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": {
    "id": "super_admin",
    "name": "Super Admin",
    "permissions": {
      "organizations": ["create", "read", "update", "delete"],
      // ... other permissions
    }
  },
  "organization_id": null,
  "employee": null,
  // ... other fields
}
```

## How Authentication Flow Works Now

### 1. Login Process
```
User enters credentials
    ↓
LoginV2 calls authService.login()
    ↓
authService makes API call to /api/v2/auth/login
    ↓
Backend returns { access_token, refresh_token, user }
    ↓
authService stores in localStorage:
  - accesshub_access_token
  - accesshub_refresh_token
  - accesshub_user_data
    ↓
AuthContext updates:
  - setUser(userData)
  - setIsAuthenticated(true)
    ↓
LoginV2 redirects based on user.role.id:
  - super_admin → /super-admin/dashboard
  - org_admin → /org-admin/dashboard
  - manager → /manager/dashboard
  - employee → /employee/dashboard
```

### 2. Page Refresh / App Initialization
```
App starts
    ↓
AuthContext useEffect runs
    ↓
Checks localStorage for accesshub_access_token
    ↓
If token exists:
  - Gets accesshub_user_data from localStorage
  - Sets user immediately (fast initial load)
  - Calls /api/v2/auth/me to verify token
  - Updates user data if needed
    ↓
If token missing or invalid:
  - Redirects to /login
```

### 3. API Requests
```
Component makes API call
    ↓
api.jsx interceptor adds Authorization header
    ↓
Gets token from authService.getAccessToken()
    ↓
Adds: Authorization: Bearer <token>
    ↓
If 401 response:
  - Gets refresh token from authService.getRefreshToken()
  - Calls /api/v2/auth/refresh
  - Updates tokens in localStorage
  - Retries original request
    ↓
If refresh fails:
  - Clears all localStorage
  - Redirects to /login
```

## Testing the Fix

### 1. Test Login
```javascript
// Open browser console
localStorage.clear(); // Clear any old data
// Login with super admin credentials
// Check console logs for:
// [AuthService] Attempting login...
// [AuthService] Login response: {...}
// [AuthService] User role: {id: "super_admin", name: "Super Admin", ...}
// [AuthService] Tokens stored. Verifying...
// [AuthService] Access token exists: true
// [AuthService] User data exists: true
```

### 2. Verify LocalStorage
```javascript
// After successful login, check:
console.log('Access Token:', localStorage.getItem('accesshub_access_token'));
console.log('Refresh Token:', localStorage.getItem('accesshub_refresh_token'));
console.log('User Data:', JSON.parse(localStorage.getItem('accesshub_user_data')));
```

### 3. Test Page Refresh
```javascript
// After login, refresh the page
// User should remain logged in
// Should redirect to correct dashboard based on role
```

### 4. Test All Roles
Test each role's login and redirection:
- ✅ super_admin → /super-admin/dashboard
- ✅ org_admin → /org-admin/dashboard
- ✅ manager → /manager/dashboard
- ✅ employee → /employee/dashboard

## Files Modified

1. **src/services/authService.js**
   - Fixed USER_KEY constant
   - Added debug logging

2. **src/services/api.jsx**
   - Centralized token access through authService
   - Fixed token refresh logic
   - Improved logout cleanup

3. **src/contexts/AuthContext.jsx**
   - Improved initialization with localStorage caching
   - Better error handling
   - Fixed role checking

4. **src/components/auth/LoginV2.jsx**
   - Fixed role-based redirection
   - Support for both role.id and role.name

5. **src/routes/RoutesV2.jsx**
   - Added manager dashboard route
   - Fixed role checking in routes

6. **src/components/dashboards/ManagerDashboard.jsx** (NEW)
   - Created manager dashboard component

## Common Issues and Solutions

### Issue: "Blank screen after login"
**Cause:** Role mismatch between backend and frontend
**Solution:** Now checks both `role.id` and `role.name`

### Issue: "User data not persisting on refresh"
**Cause:** Wrong localStorage key name
**Solution:** Fixed USER_KEY to `'accesshub_user_data'`

### Issue: "403 Forbidden errors"
**Cause:** Token not being sent in requests
**Solution:** Centralized token access through authService

### Issue: "Redirect loop on login"
**Cause:** AuthContext not reading cached user data
**Solution:** Check localStorage first before API call

## Best Practices Going Forward

1. **Always use authService methods** - Never access localStorage directly
2. **Use consistent key names** - All keys prefixed with `accesshub_`
3. **Check console logs** - Debug messages help identify issues quickly
4. **Test all roles** - Each role should have proper dashboard access
5. **Clear all formats on logout** - Ensure complete cleanup

## Security Notes

1. **Token Storage:** Tokens are stored in localStorage (not sessionStorage) for persistence across browser sessions
2. **Token Refresh:** Automatic token refresh on 401 errors prevents session expiration
3. **Cleanup:** Comprehensive cleanup on logout prevents token leakage
4. **Verification:** Background token verification ensures tokens are valid

## Migration from Old Keys

If users have old localStorage keys, they will be automatically cleared on:
1. Logout
2. Token refresh failure
3. 401 errors

The application maintains backward compatibility during the transition period.
