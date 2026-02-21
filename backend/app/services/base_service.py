"""
Base service class with common CRUD operations.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.exc import IntegrityError
from flask import g
from ..extensions import db
from ..utils.exceptions import ResourceNotFound, ConflictError, ValidationError
from ..middleware.tenant_middleware import TenantMiddleware


class BaseService:
    """Base service with common database operations"""
    
    model = None  # Override in subclass
    
    @classmethod
    def get_by_id(cls, id: str, organization_id: Optional[str] = None) -> Any:
        """
        Get a single record by ID.
        
        Args:
            id: Record ID
            organization_id: Optional organization filter
        
        Returns:
            Model instance
        
        Raises:
            ResourceNotFound: If record not found
        """
        query = cls.model.query.filter_by(id=id)
        
        # Apply tenant isolation
        if organization_id and hasattr(cls.model, 'organization_id'):
            query = query.filter_by(organization_id=organization_id)
        elif hasattr(cls.model, 'organization_id'):
            query = TenantMiddleware.enforce_tenant_isolation(query, cls.model)
        
        record = query.first()
        if not record:
            raise ResourceNotFound(f"{cls.model.__name__} not found")
        
        return record
    
    @classmethod
    def get_all(cls, filters: Optional[Dict] = None, page: int = 1, per_page: int = 20) -> tuple:
        """
        Get all records with optional filtering and pagination.
        
        Args:
            filters: Optional filter dictionary
            page: Page number (1-indexed)
            per_page: Items per page
        
        Returns:
            Tuple of (items, total_count)
        """
        query = cls.model.query
        
        # Apply tenant isolation
        if hasattr(cls.model, 'organization_id'):
            query = TenantMiddleware.enforce_tenant_isolation(query, cls.model)
        
        # Apply additional filters
        if filters:
            for key, value in filters.items():
                if hasattr(cls.model, key):
                    query = query.filter(getattr(cls.model, key) == value)
        
        # Filter out soft-deleted records
        if hasattr(cls.model, 'deleted_at'):
            query = query.filter(cls.model.deleted_at.is_(None))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return items, total
    
    @classmethod
    def create(cls, data: Dict) -> Any:
        """
        Create a new record.
        
        Args:
            data: Dictionary of field values
        
        Returns:
            Created model instance
        
        Raises:
            ValidationError: If validation fails
            ConflictError: If duplicate record exists
        """
        try:
            record = cls.model(**data)
            
            # Set organization context if applicable
            TenantMiddleware.set_organization_context(record)
            
            db.session.add(record)
            db.session.commit()
            db.session.refresh(record)
            
            return record
        
        except IntegrityError as e:
            db.session.rollback()
            raise ConflictError(f"{cls.model.__name__} already exists or constraint violation")
        except Exception as e:
            db.session.rollback()
            raise ValidationError(f"Failed to create {cls.model.__name__}: {str(e)}")
    
    @classmethod
    def update(cls, id: str, data: Dict, organization_id: Optional[str] = None) -> Any:
        """
        Update an existing record.
        
        Args:
            id: Record ID
            data: Dictionary of field values to update
            organization_id: Optional organization filter
        
        Returns:
            Updated model instance
        
        Raises:
            ResourceNotFound: If record not found
            ValidationError: If validation fails
        """
        record = cls.get_by_id(id, organization_id)
        
        try:
            for key, value in data.items():
                if hasattr(record, key) and key != 'id':
                    setattr(record, key, value)
            
            db.session.commit()
            db.session.refresh(record)
            
            return record
        
        except IntegrityError:
            db.session.rollback()
            raise ConflictError(f"{cls.model.__name__} update violates constraints")
        except Exception as e:
            db.session.rollback()
            raise ValidationError(f"Failed to update {cls.model.__name__}: {str(e)}")
    
    @classmethod
    def delete(cls, id: str, soft_delete: bool = True, organization_id: Optional[str] = None) -> bool:
        """
        Delete a record (soft or hard delete).
        
        Args:
            id: Record ID
            soft_delete: If True, set deleted_at; if False, physically delete
            organization_id: Optional organization filter
        
        Returns:
            True if successful
        
        Raises:
            ResourceNotFound: If record not found
        """
        record = cls.get_by_id(id, organization_id)
        
        try:
            if soft_delete and hasattr(record, 'deleted_at'):
                from datetime import datetime
                record.deleted_at = datetime.utcnow()
                db.session.commit()
            else:
                db.session.delete(record)
                db.session.commit()
            
            return True
        
        except Exception as e:
            db.session.rollback()
            raise ValidationError(f"Failed to delete {cls.model.__name__}: {str(e)}")
    
    @classmethod
    def exists(cls, filters: Dict) -> bool:
        """
        Check if a record exists with given filters.
        
        Args:
            filters: Filter dictionary
        
        Returns:
            True if exists, False otherwise
        """
        query = cls.model.query
        
        for key, value in filters.items():
            if hasattr(cls.model, key):
                query = query.filter(getattr(cls.model, key) == value)
        
        # Filter out soft-deleted records
        if hasattr(cls.model, 'deleted_at'):
            query = query.filter(cls.model.deleted_at.is_(None))
        
        return query.first() is not None
