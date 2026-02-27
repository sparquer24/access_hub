from flask import Flask, app, send_from_directory, jsonify, request
from .config import Config
from .extensions import db, migrate, bcrypt, socketio, jwt, cache
from flask_cors import CORS
from flasgger import Swagger
import os


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS Configuration - Properly handle preflight and cross-origin requests
    # For JWT-based APIs, we don't need credentials (cookies/sessions)
    # This prevents 'strict-origin-when-cross-origin' issues
    cors_origins = app.config["CORS_ORIGIN"]
    if cors_origins == "*":
        # Allow all origins in development (not recommended for production)
        cors_origins = "*"
    else:
        # Split multiple origins by comma if provided
        cors_origins = [origin.strip() for origin in cors_origins.split(",")]
    
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": cors_origins,
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
                "expose_headers": ["Content-Type", "Authorization"],
                "supports_credentials": False,  # JWT doesn't need cookies
                "max_age": 3600  # Cache preflight for 1 hour
            }
        }
    )

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cache.init_app(app)
    
    # Initialize Swagger
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": "apispec",
                "route": "/apispec.json",
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/api/docs/",
    }
    
    # Parse SWAGGER_HOST to separate scheme and host for Swagger config
    raw_swagger_host = app.config.get("SWAGGER_HOST", "localhost:5001")
    swagger_host_domain = raw_swagger_host
    if "://" in raw_swagger_host:
        _, swagger_host_domain = raw_swagger_host.split("://", 1)
    
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "VMS API Documentation",
            "description": "Visitor Management System - Comprehensive API Documentation",
            "version": "2.0.0",
            "contact": {
                "name": "VMS Development Team",
                "email": "support@vms.com"
            }
        },
        "host": swagger_host_domain,
        "basePath": "/",
        "schemes": ["http", "https"],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
            },
            "SessionCookie": {
                "type": "apiKey",
                "name": "session",
                "in": "cookie",
                "description": "Session-based authentication via cookies"
            }
        },
        "security": [
            {"Bearer": []},
            {"SessionCookie": []}
        ],
        "definitions": {
            "Error": {
                "type": "object",
                "properties": {
                    "success": {
                        "type": "boolean",
                        "example": False
                    },
                    "message": {
                        "type": "string",
                        "example": "An error occurred"
                    },
                    "errors": {
                        "type": "object",
                        "description": "Additional error details"
                    }
                }
            },
            "Success": {
                "type": "object",
                "properties": {
                    "success": {
                        "type": "boolean",
                        "example": True
                    },
                    "message": {
                        "type": "string",
                        "example": "Operation successful"
                    },
                    "data": {
                        "type": "object",
                        "description": "Response data"
                    }
                }
            },
            "User": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "example": "uuid-here"
                    },
                    "email": {
                        "type": "string",
                        "example": "user@vms.com"
                    },
                    "username": {
                        "type": "string",
                        "example": "username"
                    },
                    "role": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "name": {"type": "string", "example": "Employee"}
                        }
                    },
                    "organization_id": {
                        "type": "string",
                        "nullable": True
                    },
                    "is_active": {
                        "type": "boolean",
                        "example": True
                    }
                }
            }
        },
        "tags": [
            {
                "name": "Authentication",
                "description": "User authentication and authorization endpoints"
            },
            {
                "name": "Statistics",
                "description": "Dashboard statistics and analytics endpoints"
            },
            {
                "name": "Users",
                "description": "User management endpoints"
            },
            {
                "name": "Organizations",
                "description": "Organization management endpoints"
            },
            {
                "name": "Locations",
                "description": "Location management endpoints"
            },
            {
                "name": "Departments",
                "description": "Department management endpoints"
            },
            {
                "name": "Shifts",
                "description": "Shift management endpoints"
            },
            {
                "name": "Employees",
                "description": "Employee management endpoints"
            },
            {
                "name": "Cameras",
                "description": "Camera management endpoints"
            },
            {
                "name": "Attendance",
                "description": "Attendance tracking endpoints"
            },
            {
                "name": "Leave Requests",
                "description": "Leave request management endpoints"
            },
            {
                "name": "Attendance Change Requests",
                "description": "Attendance correction and change request management endpoints"
            },
            {
                "name": "Roles",
                "description": "Role-based access control (RBAC) management endpoints"
            },
            {
                "name": "Audit Logs",
                "description": "System audit trail and activity tracking endpoints"
            },
            {
                "name": "Visitors",
                "description": "Visitor management endpoints (legacy)"
            },
            {
                "name": "Health",
                "description": "System health check endpoints"
            },
            {
                "name": "Face Recognition",
                "description": "Face detection and enrollment endpoints for employee verification"
            },
            {
                "name": "LPR (License Plate Recognition)",
                "description": "Vehicle tracking and access control endpoints"
            },
            {
                "name": "Subscriptions",
                "description": "Subscription and feature access management endpoints"
            },
            {
                "name": "Manager",
                "description": "Manager-specific endpoints for team management and reporting"
            },
            {
                "name": "Images",
                "description": "Image storage and retrieval endpoints"
            }
        ],
        "responses": {
            "UnauthorizedError": {
                "description": "Authentication required or token invalid/expired",
                "schema": {"$ref": "#/definitions/Error"},
                "examples": {
                    "application/json": {
                        "success": False,
                        "message": "Unauthorized"
                    }
                }
            },
            "ForbiddenError": {
                "description": "Insufficient permissions",
                "schema": {"$ref": "#/definitions/Error"},
                "examples": {
                    "application/json": {
                        "success": False,
                        "message": "Forbidden"
                    }
                }
            },
            "NotFoundError": {
                "description": "Resource not found",
                "schema": {"$ref": "#/definitions/Error"},
                "examples": {
                    "application/json": {
                        "success": False,
                        "message": "Resource not found"
                    }
                }
            },
            "BadRequestError": {
                "description": "Invalid request data",
                "schema": {"$ref": "#/definitions/Error"},
                "examples": {
                    "application/json": {
                        "success": False,
                        "message": "Missing required fields"
                    }
                }
            },
            "InternalServerError": {
                "description": "Internal server error",
                "schema": {"$ref": "#/definitions/Error"},
                "examples": {
                    "application/json": {
                        "success": False,
                        "message": "Internal server error"
                    }
                }
            }
        }
    }
    
    Swagger(app, config=swagger_config, template=swagger_template)

    # Log swagger URLs for developers to easily open docs from console
    try:
        host = app.config.get("SWAGGER_HOST", "localhost:5001")
        if not str(host).startswith("http"):
            host = f"http://{host}"
        swagger_url = f"{host.rstrip('/')}/api/docs/"
        app.logger.info(f"Swagger UI available at: {swagger_url} (spec: /apispec.json)")
    except Exception:
        # Never fail app startup due to logging
        pass

    # Import models to ensure they're registered with SQLAlchemy
    with app.app_context():
        # Import new models package (app/models/)
        from . import models

        # Legacy models are exposed by the package initializer when needed.
        # Avoid loading the legacy `app/models.py` here to prevent double
        # registration of the same table names with SQLAlchemy.

    # Register error handlers
    register_error_handlers(app)

    # Register legacy API routes (v1 - for backward compatibility)
    from .api.legacy.auth import bp as auth_legacy_bp
    app.register_blueprint(auth_legacy_bp)

    from .api.legacy.users import bp as users_legacy_bp
    app.register_blueprint(users_legacy_bp)

    # Register new API v2 blueprints
    from .api.auth.routes import bp as auth_v2_bp
    app.register_blueprint(auth_v2_bp)
    
    from .api.organizations.routes import bp as organizations_v2_bp
    app.register_blueprint(organizations_v2_bp)
    
    from .api.locations.routes import bp as locations_v2_bp
    app.register_blueprint(locations_v2_bp)
    
    from .api.departments.routes import bp as departments_v2_bp
    app.register_blueprint(departments_v2_bp)
    
    from .api.shifts.routes import bp as shifts_v2_bp
    app.register_blueprint(shifts_v2_bp)
    
    from .api.employees.routes import bp as employees_v2_bp
    app.register_blueprint(employees_v2_bp)

    # Register legacy employee blueprint (singular) which exposes
    # endpoints like /api/employee/profile and attendance helper routes.
    try:
        from .api.employee.routes import bp as employee_bp
        app.register_blueprint(employee_bp)
    except Exception as _err:
        # Do not fail startup for optional legacy routes; log and continue
        try:
            app.logger.warning(f"Employee blueprint not registered: {_err}")
        except Exception:
            pass
    
    from .api.cameras.routes import bp as cameras_v2_bp
    app.register_blueprint(cameras_v2_bp)
    
    from .api.attendance.routes import bp as attendance_v2_bp
    app.register_blueprint(attendance_v2_bp)
    
    from .api.leaves.routes import bp as leaves_v2_bp
    app.register_blueprint(leaves_v2_bp)
    
    from .api.attendance_change_requests.routes import bp as attendance_change_requests_bp
    app.register_blueprint(attendance_change_requests_bp)
    
    from .api.roles.routes import bp as roles_v2_bp
    app.register_blueprint(roles_v2_bp)

    # Face enrollment endpoint for both employees and visitors
    from .api.embedding_gen.routes import face_enroll_bp
    app.register_blueprint(face_enroll_bp)
    
    from .api.manager.routes import bp as manager_v2_bp
    app.register_blueprint(manager_v2_bp)
    
    # from .api.employee.routes import bp as employee_v2_bp
    # app.register_blueprint(employee_v2_bp)
    
    from .api.audit.routes import bp as audit_v2_bp
    app.register_blueprint(audit_v2_bp)
    
    try:
        from .api.visitors.routes import bp as visitors_v2_bp
        app.register_blueprint(visitors_v2_bp)
    except Exception as _err:
        try:
            app.logger.warning(f"Visitors V2 blueprint not registered: {_err}")
        except Exception:
            pass
    
    try:
        from .api.images.routes import bp as images_v2_bp
        app.register_blueprint(images_v2_bp)
    except Exception as _err:
        try:
            app.logger.warning(f"Images V2 blueprint not registered: {_err}")
        except Exception:
            pass
    
    from .api.subscriptions.routes import bp as subscriptions_bp
    app.register_blueprint(subscriptions_bp)

    from .api.reports.routes import bp as reports_bp
    app.register_blueprint(reports_bp)

    from .api.lpr import bp as lpr_bp
    app.register_blueprint(lpr_bp, url_prefix='/api/v2/organizations')

    # Register documentation routes
    from .utils.documentation import create_documentation_routes
    create_documentation_routes(app)
    
    # Setup logging and performance monitoring
    from .utils.logging_config import setup_logging
    from .utils.performance import setup_request_monitoring
    from .utils.errors import register_error_handlers as register_enhanced_error_handlers
    
    
    # Initialize logging
    log_level = app.config.get('LOG_LEVEL', 'INFO')
    setup_logging(app, log_level)
    
    # Setup performance monitoring
    setup_request_monitoring(app)
    
    # Register enhanced error handlers
    register_enhanced_error_handlers(app)

    app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", os.path.join(os.getcwd(), "uploads"))
    app.config["ALLOWED_IMAGE_EXTS"] = {"jpg", "jpeg", "png"}

    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    @app.get("/uploads/<path:relpath>")
    def serve_upload(relpath):
        return send_from_directory(app.config["UPLOAD_FOLDER"], relpath)

    @app.get("/api/health")
    def health_check():
        """
        System health check
        ---
        tags:
          - Health
        responses:
          200:
            description: System is healthy
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: "healthy"
                version:
                  type: string
                  example: "2.0"
        """
        return jsonify({"status": "healthy", "version": "2.0"}), 200

    @app.after_request
    def set_security_headers(response):
        # Set a conservative referrer policy for cross-origin requests
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        
        # Ensure CORS headers are present for all API responses
        if request.path.startswith('/api/'):
            origin = request.headers.get('Origin')
            if origin and origin in cors_origins if isinstance(cors_origins, list) else True:
                response.headers['Access-Control-Allow-Origin'] = origin if cors_origins != "*" else "*"
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
        
        return response

    # socketio.init_app(app)

    return app


def register_error_handlers(app):
    """Register global error handlers"""
    from .utils.exceptions import APIException
    
    @app.errorhandler(APIException)
    def handle_api_exception(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "message": "Resource not found"
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500