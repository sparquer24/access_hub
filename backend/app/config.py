
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    db_url: str = Field(..., validation_alias="DATABASE_URL")
    
    # JWT
    jwt_secret_key: str = Field(..., env=["JWT_SECRET_KEY", "jwt_secret_key"])
    jwt_access_token_expires_hours: int = Field(1, env=["JWT_ACCESS_TOKEN_EXPIRES_HOURS"])
    jwt_refresh_token_expires_days: int = Field(30, env=["JWT_REFRESH_TOKEN_EXPIRES_DAYS"])

    # File storage
    upload_folder: str = Field("./uploads", env=["UPLOAD_FOLDER"])
    
    # Model path for YOLO detector
    model_path: Optional[str] = Field(None, env=["MODEL_PATH"])
    
    # Environment
    environment: str = Field("dev", env=["ENVIRONMENT", "environment"])

    # Other secrets
    secret_key: str = Field(..., env=["SECRET_KEY", "secret_key"])

    # Optional
    redis_url: Optional[str] = Field(None, env=["REDIS_URL"])
    cors_origin: Optional[str] = Field("http://localhost:5001", env=["CORS_ORIGIN"])
    csrf_cookie_name: Optional[str] = Field("csrf_token", env=["CSRF_COOKIE_NAME"])
    session_cookie_name: Optional[str] = Field("vms_session", env=["SESSION_COOKIE_NAME"])
    session_cookie_samesite: Optional[str] = Field("Lax", env=["SESSION_COOKIE_SAMESITE"])
    session_cookie_secure: Optional[bool] = Field(False, env=["SESSION_COOKIE_SECURE"])
    
    # Swagger
    swagger_host: Optional[str] = Field("localhost:5001", env=["SWAGGER_HOST"])


    @field_validator("environment")
    @classmethod
    def validate_env(cls, value):
        if value not in ("dev", "stage", "prod"):
            raise ValueError("ENVIRONMENT must be one of: dev, stage, prod")
        return value

    @field_validator("secret_key")
    @classmethod
    def check_secret_key(cls, value, info):
        # Only enforce strict validation in production
        environment = info.data.get("environment", "dev")
        if environment == "prod":
            if not value or value.startswith("dev-") or value == "change-this-to-a-random-secret-key-in-production":
                raise ValueError("secret_key must be set to a secure value in production!")
        elif not value:
            raise ValueError("secret_key cannot be empty!")
        return value

    @field_validator("jwt_secret_key")
    @classmethod
    def check_jwt_secret_key(cls, value, info):
        # Only enforce strict validation in production
        environment = info.data.get("environment", "dev")
        if environment == "prod":
            if not value or value.startswith("dev-") or value == "change-this-to-a-random-secret-key-in-production":
                raise ValueError("jwt_secret_key must be set to a secure value in production!")
        elif not value:
            raise ValueError("jwt_secret_key cannot be empty!")
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",  # Allow extra fields in .env file that aren't defined in the model
        case_sensitive=False  # Make environment variable names case-insensitive
    )

settings = Settings()


# Flask Config class (for app.config.from_object)
class Config:
    """Flask application configuration from Pydantic settings"""
    
    # Database
    SQLALCHEMY_DATABASE_URI = settings.db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = settings.jwt_secret_key
    JWT_ACCESS_TOKEN_EXPIRES = settings.jwt_access_token_expires_hours * 3600  # Convert to seconds
    JWT_REFRESH_TOKEN_EXPIRES = settings.jwt_refresh_token_expires_days * 86400  # Convert to seconds
    
    # Session and security
    SECRET_KEY = settings.secret_key
    SESSION_COOKIE_NAME = settings.session_cookie_name
    SESSION_COOKIE_SAMESITE = settings.session_cookie_samesite
    SESSION_COOKIE_SECURE = settings.session_cookie_secure
    
    # CORS
    CORS_ORIGIN = settings.cors_origin
    
    # CSRF
    CSRF_COOKIE_NAME = settings.csrf_cookie_name
    
    # Upload
    UPLOAD_FOLDER = settings.upload_folder
    
    # Model path for YOLO detector
    MODEL_PATH = settings.model_path
    
    # Redis (optional)
    REDIS_URL = settings.redis_url

    # Swagger
    SWAGGER_HOST = settings.swagger_host
    
    # Cache configuration
    CACHE_TYPE = "redis" if settings.redis_url else "SimpleCache"
    CACHE_REDIS_URL = settings.redis_url
    CACHE_DEFAULT_TIMEOUT = 300