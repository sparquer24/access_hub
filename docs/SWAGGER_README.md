# 📚 VMS API Documentation with Swagger

## 🎉 What's New?

Your VMS backend now includes **comprehensive Swagger/OpenAPI documentation**! This means you can:

- 🔍 **Browse** all API endpoints in an interactive UI
- 🧪 **Test** endpoints directly from your browser
- 📖 **Understand** request/response formats with examples
- 🔐 **Authenticate** and try protected endpoints
- 📥 **Export** API specification for other tools

## 🚀 Quick Start (30 seconds)

### 1. Install Dependencies
```bash
cd vms_backend
pip install -r requirements.txt
```

### 2. Start Server
```bash
python manage.py run
```

### 3. Open Swagger UI
```
http://localhost:5001/api/docs/
```

**That's it!** 🎊 You now have full API documentation.

## 📸 What You'll See

```
┌─────────────────────────────────────────────────────┐
│  VMS API Documentation v2.0.0                       │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  [Authorize 🔒]                    [Explore 🔍]     │
│                                                      │
│  ▼ Statistics                                       │
│    GET  /api/stats/overview                         │
│    GET  /api/stats/visitors/count                   │
│                                                      │
│  ▼ Health                                           │
│    GET  /api/health                                 │
│    GET  /api/debug/token                            │
│                                                      │
│  ▼ Authentication (coming soon)                     │
│  ▼ Users (coming soon)                              │
│  ▼ Visitors (coming soon)                           │
└─────────────────────────────────────────────────────┘
```

## 🔐 Authentication

Swagger supports two authentication methods:

### Method 1: Bearer Token (Recommended)

1. **Get Token**:
   ```bash
   curl -X POST http://localhost:5001/api/v2/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"superadmin@vms.com","password":"admin123"}'
   ```

2. **Copy access_token** from response

3. **In Swagger UI**:
   - Click "Authorize" button (🔒)
   - Enter: `Bearer <your_token>`
   - Click "Authorize"

### Method 2: Session Cookie

- Login via browser at `http://localhost:3000/login`
- Navigate to Swagger UI
- Cookies automatically included

## 📚 Documented Endpoints

### Statistics (New!)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/stats/overview` | GET | ✅ | Dashboard statistics |
| `/api/stats/visitors/count` | GET | ✅ | Legacy visitor count |

### Health & Debug
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | ❌ | System health check |
| `/api/debug/token` | GET | ✅ | Verify JWT token |

### More endpoints coming soon...

## 🧪 Testing Example

### 1. Test Without Auth
```
GET /api/health
```
**Try in Swagger**:
1. Expand `GET /api/health`
2. Click "Try it out"
3. Click "Execute"

**Response**:
```json
{
  "status": "healthy",
  "version": "2.0"
}
```

### 2. Test With Auth
```
GET /api/stats/overview
```
**Try in Swagger**:
1. Authorize with Bearer token (see above)
2. Expand `GET /api/stats/overview`
3. Click "Try it out"
4. Click "Execute"

**Response**:
```json
{
  "organizations": {"total": 10, "active": 8},
  "employees": {"total": 150, "active": 142},
  "cameras": {"total": 20, "online": 18},
  ...
}
```

## 📥 Export API Specification

Get the OpenAPI specification in JSON:
```
http://localhost:5001/apispec.json
```

Use this to:
- Import into **Postman**
- Generate client code
- Share with API consumers
- Integrate into CI/CD

## 🛠️ For Developers

### Adding Documentation to New Endpoints

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
            message:
              type: string
              example: "Success!"
    """
    return jsonify({"message": "Success!"}), 200
```

### Available Tags
- `Statistics` - Dashboard and analytics
- `Health` - System health and debug
- `Authentication` - Login, logout, tokens
- `Users` - User management
- `Visitors` - Visitor management

## 🎯 Benefits

### For Developers
✅ Interactive testing without writing curl commands
✅ Clear documentation in code
✅ Automatic updates when code changes
✅ Type-safe API specification

### For Frontend Team
✅ Know exactly what endpoints are available
✅ See request/response formats
✅ Test without backend running
✅ Generate TypeScript types

### For QA Team
✅ Test all endpoints easily
✅ Verify authentication flows
✅ Check error responses
✅ No Postman setup needed

### For DevOps
✅ API monitoring and health checks
✅ Integration testing
✅ API versioning support
✅ Export spec for documentation sites

## 🔧 Configuration

Located in `vms_backend/app/__init__.py`:

```python
swagger_config = {
    "specs_route": "/api/docs/",  # Swagger UI URL
    "swagger_ui": True,            # Enable UI
}

swagger_template = {
    "info": {
        "title": "VMS API Documentation",
        "version": "2.0.0",
        "description": "Comprehensive API for VMS"
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

## 🚦 Status

| Component | Status | Documentation |
|-----------|--------|---------------|
| Statistics API | ✅ Complete | ✅ Fully documented |
| Health API | ✅ Complete | ✅ Fully documented |
| Auth API | 🚧 Partial | 📝 In progress |
| Users API | 🚧 Partial | 📝 In progress |
| Visitors API | 🚧 Partial | 📝 In progress |

## 📖 More Resources

- **Quick Setup**: See `SWAGGER_SETUP.md`
- **Complete Guide**: See `../SWAGGER_DOCUMENTATION_GUIDE.md`
- **Testing Guide**: See `../TEST_DASHBOARD_API.md`
- **Flasgger Docs**: https://github.com/flasgger/flasgger

## 🆘 Troubleshooting

### Swagger UI not loading?
```bash
# Check server is running
curl http://localhost:5001/api/health
```

### Can't authenticate?
- Ensure token starts with "Bearer "
- Check token hasn't expired
- Verify you're logged in

### Endpoints missing?
- Restart Flask server
- Check endpoint is registered
- Clear browser cache

## 🎓 Next Steps

1. ✅ Explore Swagger UI
2. ✅ Test endpoints
3. ✅ Add docs to your endpoints
4. ✅ Share with your team
5. 📝 Document remaining endpoints

---

**Happy API Exploring! 🚀**

*Swagger integration added: December 20, 2025*
