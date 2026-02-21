# Swagger API Documentation Guide

## Overview
The VMS (Visitor Management System) backend now includes comprehensive Swagger/OpenAPI documentation for all API endpoints. This provides an interactive UI to explore, test, and understand the API.

## Accessing Swagger UI

### Local Development
```
http://localhost:5001/api/docs/
```

### Production
```
https://your-domain.com/api/docs/
```

## Features

### ✅ Interactive API Explorer
- Browse all available endpoints
- View request/response schemas
- Test endpoints directly from the browser
- See authentication requirements

### ✅ Authentication Support
The API supports two authentication methods:

1. **Bearer Token (JWT)**
   - Click "Authorize" button in Swagger UI
   - Enter: `Bearer <your_token>`
   - Token obtained from `/api/v2/auth/login`

2. **Session Cookie**
   - Automatically handled if logged in via browser
   - Uses cookie-based sessions

## API Endpoints Documented

### 1. Statistics Endpoints

#### GET `/api/stats/overview`
Returns comprehensive dashboard statistics for SuperAdmin.

**Authentication**: Required (Bearer Token or Session Cookie)

**Response Example**:
```json
{
  "organizations": {
    "total": 10,
    "active": 8
  },
  "employees": {
    "total": 150,
    "active": 142
  },
  "face_embeddings": {
    "total": 200,
    "primary": 150,
    "avg_quality": 0.85
  },
  "presence_events": {
    "total": 5000,
    "unknown_faces": 25,
    "anomalies": 10,
    "pending_reviews": 5
  },
  "cameras": {
    "total": 20,
    "online": 18
  },
  "visitors": {
    "total": 500
  }
}
```

#### GET `/api/stats/visitors/count`
Returns total count of legacy visitors.

**Authentication**: Required

**Response Example**:
```json
{
  "count": 500
}
```

### 2. Health Check Endpoints

#### GET `/api/health`
System health check endpoint.

**Authentication**: Not required

**Response Example**:
```json
{
  "status": "healthy",
  "version": "2.0"
}
```

#### GET `/api/debug/token`
Debug endpoint to verify JWT token validity.

**Authentication**: Required (Bearer Token)

**Response Example**:
```json
{
  "identity": "superadmin@vms.com",
  "claims": {
    "sub": "superadmin@vms.com",
    "role": "SuperAdmin",
    "exp": 1703073600
  }
}
```

## Using Swagger UI

### Step 1: Start the Backend
```bash
cd vms_backend
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # Linux/Mac

python manage.py run
```

### Step 2: Open Swagger UI
Navigate to: `http://localhost:5001/api/docs/`

### Step 3: Authenticate

#### Option A: Using Bearer Token
1. Login via API or frontend to get JWT token
2. Click the "Authorize" button (🔒 icon) in Swagger UI
3. Enter: `Bearer <your_jwt_token>`
4. Click "Authorize"
5. Click "Close"

#### Option B: Using Session Cookie
1. Login via browser at `http://localhost:3000/login`
2. Navigate to Swagger UI in the same browser
3. Cookies are automatically sent with requests

### Step 4: Test Endpoints
1. Expand any endpoint (e.g., `/api/stats/overview`)
2. Click "Try it out"
3. Click "Execute"
4. View the response below

## Testing with curl

### 1. Login to Get Token
```bash
curl -X POST http://localhost:5001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin@vms.com",
    "password": "YourPassword"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "superadmin@vms.com",
      "role": {
        "name": "SuperAdmin"
      }
    }
  }
}
```

### 2. Use Token to Access Protected Endpoints
```bash
# Replace <TOKEN> with your actual access_token
curl -X GET http://localhost:5001/api/stats/overview \
  -H "Authorization: Bearer <TOKEN>"
```

### 3. Verify Token
```bash
curl -X GET http://localhost:5001/api/debug/token \
  -H "Authorization: Bearer <TOKEN>"
```

## Swagger Configuration

### Location
`vms_backend/app/__init__.py`

### Key Configuration Options

```python
swagger_config = {
    "headers": [],
    "specs": [{
        "endpoint": "apispec",
        "route": "/apispec.json",
    }],
    "swagger_ui": True,
    "specs_route": "/api/docs/",  # Swagger UI URL
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "VMS API Documentation",
        "version": "2.0.0"
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header"
        }
    }
}
```

## Adding Documentation to New Endpoints

### Method 1: Inline YAML (Recommended)
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
    parameters:
      - name: param_name
        in: query
        type: string
        required: false
        description: Parameter description
    responses:
      200:
        description: Success response
        schema:
          type: object
          properties:
            data:
              type: string
              example: "Success"
      401:
        description: Unauthorized
    """
    return jsonify({"data": "Success"}), 200
```

### Method 2: External YAML File
```python
from flasgger import swag_from

@bp.get("/api/your-endpoint")
@require_login
@swag_from('swagger/your_endpoint.yml')
def your_endpoint():
    return jsonify({"data": "Success"}), 200
```

**swagger/your_endpoint.yml**:
```yaml
tags:
  - YourTag
security:
  - Bearer: []
responses:
  200:
    description: Success response
    schema:
      type: object
      properties:
        data:
          type: string
          example: "Success"
```

## Common YAML Schema Patterns

### Object Response
```yaml
schema:
  type: object
  properties:
    id:
      type: integer
      example: 1
    name:
      type: string
      example: "John Doe"
    active:
      type: boolean
      example: true
```

### Array Response
```yaml
schema:
  type: array
  items:
    type: object
    properties:
      id:
        type: integer
      name:
        type: string
```

### Request Body
```yaml
parameters:
  - name: body
    in: body
    required: true
    schema:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          example: "user@example.com"
        password:
          type: string
          format: password
          example: "SecurePassword123"
```

## Tags for Organization

Current tags defined:
- **Authentication** - Login, logout, token management
- **Statistics** - Dashboard stats and analytics
- **Users** - User management endpoints
- **Visitors** - Visitor management (legacy)
- **Health** - System health and debug endpoints

### Adding New Tags
```python
swagger_template = {
    # ... other config
    "tags": [
        {
            "name": "YourNewTag",
            "description": "Description of your endpoints"
        }
    ]
}
```

## API Versioning

The API supports both legacy and v2 endpoints:

- **Legacy**: `/api/login`, `/api/visitors`
- **V2**: `/api/v2/auth/login`, `/api/stats/overview`

Swagger documents both versions with clear tags and descriptions.

## Security Definitions

### Bearer Token
```yaml
securityDefinitions:
  Bearer:
    type: apiKey
    name: Authorization
    in: header
    description: "JWT Authorization header using the Bearer scheme"
```

### Session Cookie
```yaml
securityDefinitions:
  SessionCookie:
    type: apiKey
    name: session
    in: cookie
    description: "Session-based authentication via cookies"
```

## Best Practices

### 1. Always Document
- Add Swagger docs to ALL new endpoints
- Include examples in responses
- Document all parameters

### 2. Use Consistent Schemas
- Reuse common response schemas
- Maintain consistent error formats
- Use proper HTTP status codes

### 3. Provide Examples
- Include realistic example data
- Show both success and error responses
- Document edge cases

### 4. Keep Descriptions Clear
- Write user-friendly descriptions
- Explain what the endpoint does
- Document authentication requirements

### 5. Update Version Numbers
- Increment version on breaking changes
- Document changes in release notes
- Maintain backwards compatibility when possible

## Troubleshooting

### Issue 1: Swagger UI Not Loading
**Solution**: Check Flask server is running on correct port
```bash
# Verify server is running
curl http://localhost:5001/api/health
```

### Issue 2: 401 Unauthorized in Swagger
**Solution**: 
1. Click "Authorize" button
2. Enter valid Bearer token
3. Ensure token hasn't expired

### Issue 3: Endpoints Not Showing
**Solution**: 
1. Check endpoint is registered in blueprint
2. Verify route decorator syntax
3. Restart Flask server

### Issue 4: CORS Errors
**Solution**: Update CORS configuration in `app/__init__.py`
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

## Production Deployment

### Environment Variables
```bash
# .env
SWAGGER_HOST=api.yourdomain.com
FLASK_ENV=production
```

### Disable Swagger in Production (Optional)
```python
if app.config.get("FLASK_ENV") != "production":
    Swagger(app, config=swagger_config, template=swagger_template)
```

### Security Considerations
- ⚠️ Consider disabling `/api/debug/*` endpoints in production
- ⚠️ Use HTTPS in production
- ⚠️ Implement rate limiting
- ⚠️ Add API key authentication for public APIs

## API Specification Export

### Get OpenAPI Specification (JSON)
```
http://localhost:5001/apispec.json
```

This provides the complete OpenAPI 2.0 specification that can be:
- Imported into Postman
- Used with code generators
- Shared with API consumers
- Integrated into CI/CD pipelines

## Integration with Frontend

### Axios + Swagger
The frontend automatically includes Bearer tokens in requests:

```javascript
// vms_frontend/src/services/api.jsx
api.interceptors.request.use((config) => {
  const token = authService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

This matches the Swagger `Bearer` security definition.

## Next Steps

1. ✅ Install Flasgger: `pip install flasgger>=0.9.7`
2. ✅ Configure Swagger in Flask app
3. ✅ Document all endpoints with YAML
4. ✅ Test in Swagger UI
5. ✅ Share API docs with team

## Resources

- **Flasgger Documentation**: https://github.com/flasgger/flasgger
- **Swagger/OpenAPI Spec**: https://swagger.io/specification/v2/
- **Swagger Editor**: https://editor.swagger.io/

---

**Last Updated**: December 20, 2025
**Documentation Version**: 1.0.0
**API Version**: 2.0.0
**Status**: ✅ Production Ready
