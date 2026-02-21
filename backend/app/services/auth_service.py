"""
Authentication service for user login, registration, and token management.
"""
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token, create_refresh_token
from ..extensions import db, bcrypt, cache
from werkzeug.security import check_password_hash as werkzeug_check_password_hash
from ..models import User, Role, Employee
from ..utils.exceptions import AuthenticationError, ValidationError, ConflictError
from ..utils.validators import validate_email
from ..middleware.auth_middleware import create_jwt_payload


class AuthService:
    """Authentication and authorization service"""
    
    @staticmethod
    def login(username_or_email: str, password: str) -> dict:
        """
        Authenticate user and generate JWT tokens.
        
        Args:
            username_or_email: Username or email
            password: Plain text password
        
        Returns:
            dict: User info and tokens
        
        Raises:
            AuthenticationError: If authentication fails
        """
        # Find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            raise AuthenticationError("Invalid credentials")
        
        # Check if user is active
        if not user.is_active:
            raise AuthenticationError("Account is inactive")
        
        # Verify password using flask-bcrypt; if the stored hash is in a
        # different format (e.g. generated with werkzeug), fall back to
        # werkzeug's check and re-hash with flask-bcrypt for future logins.
        password_ok = False
        try:
            if bcrypt.check_password_hash(user.password_hash, password):
                password_ok = True
        except ValueError:
            # bcrypt raised invalid salt => try werkzeug format
            password_ok = False

        if not password_ok:
            # Try werkzeug fallback
            try:
                if werkzeug_check_password_hash(user.password_hash, password):
                    # Re-hash with flask-bcrypt to standardize storage
                    user.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
                    db.session.commit()
                    password_ok = True
            except Exception:
                password_ok = False

        if not password_ok:
            raise AuthenticationError("Invalid credentials")
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create JWT tokens with claims
        claims = create_jwt_payload(user)
        access_token = create_access_token(identity=user.id, additional_claims=claims)
        refresh_token = create_refresh_token(identity=user.id, additional_claims=claims)
        
        return {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    
    @staticmethod
    def register_user(data: dict) -> User:
        """
        Register a new user (used for creating org admins and employees).
        
        Args:
            data: User registration data
        
        Returns:
            Created User instance
        
        Raises:
            ValidationError: If validation fails
            ConflictError: If user already exists
        """
        # Validate required fields
        required_fields = ['email', 'username', 'password', 'role_id']
        for field in required_fields:
            if field not in data:
                raise ValidationError(f"Missing required field: {field}")
        
        # Validate email format
        if not validate_email(data['email']):
            raise ValidationError("Invalid email format")
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            raise ConflictError("Email already registered")
        
        if User.query.filter_by(username=data['username']).first():
            raise ConflictError("Username already taken")
        
        # Hash password
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        # Create user
        user = User(
            email=data['email'],
            username=data['username'],
            password_hash=password_hash,
            role_id=data['role_id'],
            organization_id=data.get('organization_id'),
        )
        
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        
        return user
    
    @staticmethod
    def change_password(user_id: str, old_password: str, new_password: str) -> bool:
        """
        Change user password.
        
        Args:
            user_id: User ID
            old_password: Current password
            new_password: New password
        
        Returns:
            True if successful
        
        Raises:
            AuthenticationError: If old password is incorrect
        """
        user = User.query.get(user_id)
        if not user:
            raise AuthenticationError("User not found")
        
        # Verify old password
        if not bcrypt.check_password_hash(user.password_hash, old_password):
            raise AuthenticationError("Current password is incorrect")
        
        # Hash and set new password
        user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        
        return True
    
    @staticmethod
    def reset_password(email: str) -> bool:
        """
        Initiate password reset process.
        
        Args:
            email: User email
        
        Returns:
            True if reset email sent (or user not found - don't reveal)
        """
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Don't reveal if user exists
            return True
        
        # TODO: Generate reset token and send email
        # For now, just return True
        return True
    
    @staticmethod
    def refresh_token(user_id: str) -> dict:
        """
        Generate new access token from refresh token.
        
        Args:
            user_id: User ID from refresh token
        
        Returns:
            dict: New tokens
        """
        user = User.query.get(user_id)
        if not user or not user.is_active:
            raise AuthenticationError("Invalid user")
        
        # Create new tokens
        claims = create_jwt_payload(user)
        access_token = create_access_token(identity=user.id, additional_claims=claims)
        refresh_token = create_refresh_token(identity=user.id, additional_claims=claims)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    
    @staticmethod
    def get_current_user(user_id: str) -> User:
        """
        Get current user details.
        
        Args:
            user_id: User ID from JWT
        
        Returns:
            User instance
        """
        user = User.query.get(user_id)
        if not user:
            raise AuthenticationError("User not found")
        
        return user
    
    @staticmethod
    def logout(user_id: str, token_jti: str) -> bool:
        """
        Logout user (blacklist token).
        
        Args:
            user_id: User ID
            token_jti: JWT ID to blacklist
        
        Returns:
            True if successful
        """
        # Add token to blacklist in cache
        # JTI is stored for the remaining lifetime of the token
        cache.set(f"blacklist:{token_jti}", "true", timeout=3600)  # 1 hour
        
        return True
