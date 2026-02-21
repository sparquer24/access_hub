"""
Audit log service for tracking system actions.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import and_, or_, desc
from .base_service import BaseService
from ..models.audit_log import AuditLog
from ..extensions import db
from ..utils.exceptions import ResourceNotFound


class AuditService(BaseService):
    """Service for audit log operations"""
    
    model = AuditLog
    
    @classmethod
    def create_audit_log(
        cls,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
        organization_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Create an audit log entry.
        
        Args:
            user_id: ID of user performing the action
            action: Action performed (create, update, delete, login, etc.)
            entity_type: Type of entity affected (model name)
            entity_id: ID of the affected entity
            old_values: Previous values (for updates/deletes)
            new_values: New values (for creates/updates)
            organization_id: Organization context
            ip_address: IP address of the request
            user_agent: User agent string
            
        Returns:
            Created AuditLog instance
        """
        data = {
            'user_id': user_id,
            'action': action,
            'entity_type': entity_type,
            'entity_id': entity_id,
            'old_values': old_values,
            'new_values': new_values,
            'organization_id': organization_id,
            'ip_address': ip_address,
            'user_agent': user_agent
        }
        
        return cls.create(data)
    
    @classmethod
    def list_audit_logs(cls, filters: Optional[Dict] = None):
        """
        List audit logs with optional filters.
        
        Args:
            filters: Optional filter dictionary
            
        Returns:
            Query object
        """
        query = AuditLog.query
        
        if filters:
            # Filter by user
            if 'user_id' in filters:
                query = query.filter(AuditLog.user_id == filters['user_id'])
            
            # Filter by organization
            if 'organization_id' in filters:
                query = query.filter(AuditLog.organization_id == filters['organization_id'])
            
            # Filter by action
            if 'action' in filters:
                query = query.filter(AuditLog.action == filters['action'])
            
            # Filter by entity type
            if 'entity_type' in filters:
                query = query.filter(AuditLog.entity_type == filters['entity_type'])
            
            # Filter by entity ID
            if 'entity_id' in filters:
                query = query.filter(AuditLog.entity_id == filters['entity_id'])
            
            # Filter by date range
            if 'start_date' in filters:
                query = query.filter(AuditLog.created_at >= filters['start_date'])
            
            if 'end_date' in filters:
                query = query.filter(AuditLog.created_at <= filters['end_date'])
            
            # Search in action or entity type
            if 'search' in filters:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        AuditLog.action.ilike(search_term),
                        AuditLog.entity_type.ilike(search_term)
                    )
                )
        
        # Order by created_at descending (most recent first)
        query = query.order_by(desc(AuditLog.created_at))
        
        return query
    
    @classmethod
    def get_audit_log(cls, log_id: str) -> AuditLog:
        """
        Get audit log by ID.
        
        Args:
            log_id: Audit log ID
            
        Returns:
            AuditLog instance
            
        Raises:
            ResourceNotFound: If audit log not found
        """
        log = AuditLog.query.filter_by(id=log_id).first()
        if not log:
            raise ResourceNotFound("Audit log not found")
        return log
    
    @classmethod
    def get_user_audit_logs(cls, user_id: str, filters: Optional[Dict] = None):
        """
        Get audit logs for a specific user.
        
        Args:
            user_id: User ID
            filters: Optional additional filters
            
        Returns:
            Query object
        """
        if filters is None:
            filters = {}
        filters['user_id'] = user_id
        
        return cls.list_audit_logs(filters)
    
    @classmethod
    def get_entity_audit_logs(cls, entity_type: str, entity_id: str, filters: Optional[Dict] = None):
        """
        Get audit logs for a specific entity.
        
        Args:
            entity_type: Entity type (model name)
            entity_id: Entity ID
            filters: Optional additional filters
            
        Returns:
            Query object
        """
        if filters is None:
            filters = {}
        filters['entity_type'] = entity_type
        filters['entity_id'] = entity_id
        
        return cls.list_audit_logs(filters)
    
    @classmethod
    def get_organization_audit_logs(cls, organization_id: str, filters: Optional[Dict] = None):
        """
        Get audit logs for a specific organization.
        
        Args:
            organization_id: Organization ID
            filters: Optional additional filters
            
        Returns:
            Query object
        """
        if filters is None:
            filters = {}
        filters['organization_id'] = organization_id
        
        return cls.list_audit_logs(filters)
    
    @classmethod
    def get_action_statistics(cls, organization_id: Optional[str] = None) -> Dict:
        """
        Get statistics about actions in the system.
        
        Args:
            organization_id: Optional organization filter
            
        Returns:
            Dictionary with action statistics
        """
        query = db.session.query(
            AuditLog.action,
            db.func.count(AuditLog.id).label('count')
        )
        
        if organization_id:
            query = query.filter(AuditLog.organization_id == organization_id)
        
        query = query.group_by(AuditLog.action)
        
        results = query.all()
        
        return {
            action: count for action, count in results
        }
    
    @classmethod
    def get_recent_activity(cls, limit: int = 10, organization_id: Optional[str] = None):
        """
        Get recent activity logs.
        
        Args:
            limit: Number of logs to return
            organization_id: Optional organization filter
            
        Returns:
            List of recent AuditLog instances
        """
        query = AuditLog.query
        
        if organization_id:
            query = query.filter(AuditLog.organization_id == organization_id)
        
        query = query.order_by(desc(AuditLog.created_at)).limit(limit)
        
        return query.all()
