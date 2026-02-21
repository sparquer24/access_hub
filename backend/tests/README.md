# VMS Backend Tests

This folder contains test scripts for the VMS backend API.

## Test Scripts

Place test scripts here to keep the project organized:
- API integration tests
- Unit tests
- End-to-end tests
- Performance tests

## Running Tests

### Manual API Testing

Use the backend's built-in test commands:

```bash
# Test login endpoint
curl -X POST http://localhost:5001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Admin@123"}'

# Test health endpoint
curl http://localhost:5001/api/health
```

### PowerShell Testing (Windows)

Create test scripts in this folder following this pattern:

```powershell
# test_example.ps1
$uri = "http://localhost:5001/api/health"
$response = Invoke-RestMethod -Uri $uri -Method Get
Write-Host "Status: $($response.status)" -ForegroundColor Green
```

## Test Coverage

- ✅ Health check endpoint
- ✅ Authentication (login, logout, refresh)
- ✅ Protected routes with JWT
- ✅ Stats API endpoints
- ⏳ User management endpoints (pending)
- ⏳ Organization endpoints (pending)

## Best Practices

1. Keep test scripts in this `tests/` folder
2. Use descriptive names: `test_auth_login.ps1`, `test_stats_api.py`
3. Include cleanup in your tests
4. Document expected results
5. Use environment variables for configuration
