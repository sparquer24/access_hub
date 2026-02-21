"""
Role management service.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy import or_
from .base_service import BaseService
from ..models.role import Role
from ..extensions import db
from ..utils.exceptions import ResourceNotFound, ConflictError, ValidationError


class RoleService(BaseService):
    """Service for role management operations"""
    
    model = Role
    
    @classmethod
    def create_role(cls, data: Dict) -> Role:
        """
        Create a new role.
        
        Args:
            data: Role data dictionary
            
        Returns:
            Created Role instance
            
        Raises:
            ConflictError: If role with same name exists
        """
        # Check if role with same name exists
        existing_role = Role.query.filter_by(name=data.get('name')).first()
        if existing_role:
            raise ConflictError(f"Role with name '{data.get('name')}' already exists")
        
        return cls.create(data)
    
    @classmethod
    def list_roles(cls, filters: Optional[Dict] = None):
        """
        List all roles with optional filters.
        
        Args:
            filters: Optional filter dictionary
            
        Returns:
            Query object
        """
        query = Role.query
        
        if filters:
            # Search by name or description
            if 'search' in filters:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        Role.name.ilike(search_term),
                        Role.description.ilike(search_term)
                    )
                )
        
        # Order by name
        query = query.order_by(Role.name.asc())
        
        return query
    
    @classmethod
    def get_role(cls, role_id: str) -> Role:
        """
        Get role by ID.
        
        Args:
            role_id: Role ID
            
        Returns:
            Role instance
            
        Raises:
            ResourceNotFound: If role not found
        """
        role = Role.query.filter_by(id=role_id).first()
        if not role:
            raise ResourceNotFound(f"Role not found")
        return role
    
    @classmethod
    def update_role(cls, role_id: str, data: Dict) -> Role:
        """
        Update a role.
        
        Args:
            role_id: Role ID
            data: Update data dictionary
            
        Returns:
            Updated Role instance
            
        Raises:
            ResourceNotFound: If role not found
            ConflictError: If updated name conflicts
        """
        role = cls.get_role(role_id)
        
        # Check for name conflicts (if name is being changed)
        if 'name' in data and data['name'] != role.name:
            existing = Role.query.filter_by(name=data['name']).first()
            if existing:
                raise ConflictError(f"Role with name '{data['name']}' already exists")
        
        try:
            for key, value in data.items():
                if hasattr(role, key) and key != 'id':
                    setattr(role, key, value)
            
            db.session.commit()
            db.session.refresh(role)
            
            return role
        except Exception as e:
            db.session.rollback()
            raise ValidationError(f"Failed to update role: {str(e)}")
    
    @classmethod
    def delete_role(cls, role_id: str) -> bool:
        """
        Delete a role.
        
        Args:
            role_id: Role ID
            
        Returns:
            True if successful
            
        Raises:
            ResourceNotFound: If role not found
            ValidationError: If role has associated users
        """
        role = cls.get_role(role_id)
        
        # Check if role has users
        if role.users and len(role.users) > 0:
            raise ValidationError(
                f"Cannot delete role '{role.name}' as it has {len(role.users)} associated users"
            )
        
        try:
            db.session.delete(role)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise ValidationError(f"Failed to delete role: {str(e)}")
    
    @classmethod
    def update_role_permissions(cls, role_id: str, permissions: Dict) -> Role:
        """
        Update role permissions.
        
        Args:
            role_id: Role ID
            permissions: Permissions dictionary
            
        Returns:
            Updated Role instance
            
        Raises:
            ResourceNotFound: If role not found
        """
        role = cls.get_role(role_id)
        
        try:
            role.permissions = permissions
            db.session.commit()
            db.session.refresh(role)
            
            return role
        except Exception as e:
            db.session.rollback()
            raise ValidationError(f"Failed to update role permissions: {str(e)}")
    
    @classmethod
    def get_role_by_name(cls, name: str) -> Optional[Role]:
        """
        Get role by name.
        
        Args:
            name: Role name
            
        Returns:
            Role instance or None
        """
        return Role.query.filter_by(name=name).first()
