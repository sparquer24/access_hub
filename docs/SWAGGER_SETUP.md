# Swagger Setup - Quick Start

## Installation

### Step 1: Install Flasgger
```bash
cd vms_backend
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # Linux/Mac

pip install flasgger>=0.9.7
```

Or add to `requirements.txt` and install:
```bash
pip install -r requirements.txt
```

### Step 2: Start the Server
```bash
python manage.py run
```

### Step 3: Access Swagger UI
Open your browser and navigate to:
```
http://localhost:5001/api/docs/
```

## Quick Test

### 1. Test Health Endpoint (No Auth)
In Swagger UI:
1. Expand `GET /api/health`
2. Click "Try it out"
3. Click "Execute"
4. Should return: `{"status": "healthy", "version": "2.0"}`

### 2. Test Protected Endpoint (With Auth)

#### Get a Token First:
```bash
curl -X POST http://localhost:5001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin@vms.com", "password": "YourPassword"}'
```

Copy the `access_token` from the response.

#### Authorize in Swagger UI:
1. Click the "Authorize" button (🔒 lock icon at top right)
2. In the "Bearer" field, enter: `Bearer <your_access_token>`
3. Click "Authorize"
4. Click "Close"

#### Test Stats Endpoint:
1. Expand `GET /api/stats/overview`
2. Click "Try it out"
3. Click "Execute"
4. Should return dashboard statistics

## Swagger UI Features

### Available Now:
- ✅ Interactive API documentation
- ✅ Try endpoints directly from browser
- ✅ View request/response schemas
- ✅ Authentication support (Bearer Token)
- ✅ Organized by tags (Statistics, Health, etc.)

### Endpoints Documented:
- `GET /api/health` - System health check
- `GET /api/stats/overview` - Dashboard statistics
- `GET /api/stats/visitors/count` - Visitor count
- `GET /api/debug/token` - Token verification

## Configuration

Swagger is configured in `vms_backend/app/__init__.py`:

```python
swagger_config = {
    "specs_route": "/api/docs/",  # Swagger UI URL
}

swagger_template = {
    "info": {
        "title": "VMS API Documentation",
        "version": "2.0.0"
    }
}
```

## Adding Documentation to Your Endpoints

```python
@bp.get("/api/your-endpoint")
@require_login
def your_endpoint():
    """
    Your endpoint description
    ---
    tags:
      - YourTag
    security:
      - Bearer: []
    responses:
      200:
        description: Success
        schema:
          type: object
          properties:
            data:
              type: string
              example: "Success"
    """
    return jsonify({"data": "Success"}), 200
```

## Troubleshooting

### Swagger UI not loading?
- Check server is running: `http://localhost:5001/api/health`
- Clear browser cache
- Check console for errors

### Authentication not working?
- Ensure token is prefixed with "Bearer "
- Token should not be expired
- Check token format: `Bearer eyJhbGci...`

### Endpoints not showing?
- Restart Flask server
- Check blueprint is registered
- Verify route decorators

## Next Steps

1. ✅ Access Swagger UI at `/api/docs/`
2. ✅ Test endpoints
3. ✅ Add documentation to new endpoints
4. ✅ Share with team

For complete documentation, see: `SWAGGER_DOCUMENTATION_GUIDE.md`

---

**Quick Start Complete! 🎉**
