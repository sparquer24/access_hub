"""
Enhanced system configuration management
"""

import os
from datetime import timedelta
from typing import Dict, Any


class BaseConfig:
    """Base configuration with common settings"""
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    WTF_CSRF_ENABLED = True
    
    # Database settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_timeout': 20,
        'pool_recycle': -1,
        'max_overflow': 0,
        'echo': False  # Set to True for SQL query logging
    }
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = 'HS256'
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    
    # CORS settings
    CORS_ORIGIN = os.environ.get('CORS_ORIGIN', 'http://localhost:5001')
    
    # Cache settings
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    
    # Upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}
    
    # Logging settings
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT', 'false').lower() == 'true'
    
    # Performance monitoring
    PERFORMANCE_MONITORING = True
    SLOW_QUERY_THRESHOLD = 1.0  # seconds
    SLOW_REQUEST_THRESHOLD = 2.0  # seconds
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # API settings
    API_VERSION = 'v2'
    API_TITLE = 'VMS API'
    API_DESCRIPTION = 'Visitor Management System API'
    
    # Pagination defaults
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Email settings (if implemented)
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@vms.com')
    
    # Backup settings
    BACKUP_ENABLED = os.environ.get('BACKUP_ENABLED', 'true').lower() == 'true'
    BACKUP_SCHEDULE = os.environ.get('BACKUP_SCHEDULE', 'daily')  # daily, weekly, monthly
    BACKUP_RETENTION_DAYS = int(os.environ.get('BACKUP_RETENTION_DAYS', 30))
    
    # Rate limiting
    RATELIMIT_ENABLED = os.environ.get('RATELIMIT_ENABLED', 'true').lower() == 'true'
    RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'memory://')
    
    # Feature flags
    FEATURES = {
        'ATTENDANCE_TRACKING': True,
        'LEAVE_MANAGEMENT': True,
        'VISITOR_MANAGEMENT': True,
        'PERFORMANCE_MONITORING': True,
        'AUDIT_LOGGING': True,
        'EXPORT_DATA': True,
        'BACKUP_RESTORE': True,
        'API_DOCUMENTATION': True,
        'HEALTH_CHECKS': True
    }
    
    # Organization settings
    MULTI_TENANT = True
    DEFAULT_ORGANIZATION = 'Default Organization'
    
    # Time zone and locale
    TIMEZONE = os.environ.get('TIMEZONE', 'UTC')
    LOCALE = os.environ.get('LOCALE', 'en_US')
    
    # File storage
    FILE_STORAGE_TYPE = os.environ.get('FILE_STORAGE_TYPE', 'local')  # local, s3, azure
    
    @classmethod
    def get_feature_flag(cls, feature_name: str) -> bool:
        """Get feature flag status"""
        return cls.FEATURES.get(feature_name, False)
    
    @classmethod
    def get_config_dict(cls) -> Dict[str, Any]:
        """Get configuration as dictionary"""
        config = {}
        for attr in dir(cls):
            if not attr.startswith('_') and not callable(getattr(cls, attr)):
                config[attr] = getattr(cls, attr)
        return config


class DevelopmentConfig(BaseConfig):
    """Development configuration"""
    
    DEBUG = True
    TESTING = False
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'dev.sqlite3')
    
    # Relaxed security for development
    SESSION_COOKIE_SECURE = False
    WTF_CSRF_ENABLED = False
    
    # Enhanced logging for development
    LOG_LEVEL = 'DEBUG'
    SQLALCHEMY_ENGINE_OPTIONS = {
        **BaseConfig.SQLALCHEMY_ENGINE_OPTIONS,
        'echo': True  # Enable SQL query logging
    }
    
    # Disable rate limiting in development
    RATELIMIT_ENABLED = False
    
    # Swagger settings
    SWAGGER_HOST = 'localhost:5000'


class TestingConfig(BaseConfig):
    """Testing configuration"""
    
    DEBUG = True
    TESTING = True
    
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable features that interfere with testing
    WTF_CSRF_ENABLED = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=1)  # Short expiry for testing
    CACHE_TYPE = 'null'  # Disable caching for testing
    
    # Fast password hashing for tests
    BCRYPT_LOG_ROUNDS = 4
    
    # Disable rate limiting in tests
    RATELIMIT_ENABLED = False
    
    # Disable performance monitoring in tests
    PERFORMANCE_MONITORING = False


class ProductionConfig(BaseConfig):
    """Production configuration"""
    
    DEBUG = False
    TESTING = False
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://user:password@localhost/vms_production'
    
    # Enhanced security for production
    SESSION_COOKIE_SECURE = True
    WTF_CSRF_ENABLED = True
    
    # Production logging
    LOG_LEVEL = 'INFO'
    LOG_TO_STDOUT = True
    
    # Production cache (Redis recommended)
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Rate limiting with Redis
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')
    
    # SSL/TLS settings
    PREFERRED_URL_SCHEME = 'https'
    
    # Database optimizations
    SQLALCHEMY_ENGINE_OPTIONS = {
        **BaseConfig.SQLALCHEMY_ENGINE_OPTIONS,
        'pool_size': 20,
        'max_overflow': 10,
        'pool_pre_ping': True
    }


class StagingConfig(BaseConfig):
    """Staging configuration"""
    
    DEBUG = False
    TESTING = False
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://user:password@localhost/vms_staging'
    
    # Staging-specific settings
    LOG_LEVEL = 'DEBUG'  # More verbose logging for staging
    
    # Use Redis for caching and rate limiting
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')


# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'staging': StagingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])


# Export the current configuration
Config = get_config()