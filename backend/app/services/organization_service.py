"""
Business logic for Organization management.
"""

from sqlalchemy import or_, func
from ..extensions import db
from ..models import Organization, Employee, Camera, Location, Department
from ..utils.exceptions import NotFoundError, ConflictError
from datetime import datetime


class OrganizationService:
    """Service class for organization operations"""
    
    @staticmethod
    def create_organization(data):
        """Create a new organization"""
        # Check if organization with same code or name exists
        existing = Organization.query.filter(
            or_(
                Organization.code == data['code'],
                Organization.name == data['name']
            )
        ).first()
        
        if existing:
            if existing.code == data['code']:
                raise ConflictError(f"Organization with code '{data['code']}' already exists")
            raise ConflictError(f"Organization with name '{data['name']}' already exists")
        
        # Create organization
        organization = Organization(**data)
        db.session.add(organization)
        db.session.commit()
        
        return organization
    
    @staticmethod
    def get_organization(org_id):
        """Get organization by ID (returns Organization instance)."""
        organization = Organization.query.filter_by(
            id=org_id,
            deleted_at=None
        ).first()

        if not organization:
            raise NotFoundError('Organization')

        return organization
    
    @staticmethod
    def list_organizations(filters):
        """List organizations with filters and pagination"""
        # Build query with counts using subqueries
        employees_count = db.session.query(
            Employee.organization_id,
            func.count(Employee.id).label('count')
        ).filter(Employee.deleted_at.is_(None)).group_by(Employee.organization_id).subquery()
        
        cameras_count = db.session.query(
            Camera.organization_id,
            func.count(Camera.id).label('count')
        ).filter(Camera.deleted_at.is_(None)).group_by(Camera.organization_id).subquery()
        
        locations_count = db.session.query(
            Location.organization_id,
            func.count(Location.id).label('count')
        ).filter(Location.deleted_at.is_(None)).group_by(Location.organization_id).subquery()
        
        departments_count = db.session.query(
            Department.organization_id,
            func.count(Department.id).label('count')
        ).filter(Department.deleted_at.is_(None)).group_by(Department.organization_id).subquery()
        
        # Main query with counts using add_columns
        query = Organization.query.outerjoin(
            employees_count, Organization.id == employees_count.c.organization_id
        ).outerjoin(
            cameras_count, Organization.id == cameras_count.c.organization_id
        ).outerjoin(
            locations_count, Organization.id == locations_count.c.organization_id
        ).outerjoin(
            departments_count, Organization.id == departments_count.c.organization_id
        ).filter(Organization.deleted_at.is_(None)).add_columns(
            Organization.name.label('name'),
            Organization.code.label('code'),
            Organization.contact_email.label('contact_email'),
            Organization.id.label('id'),
            Organization.is_active.label('is_active'),
            func.coalesce(employees_count.c.count, 0).label('employees_count'),
            func.coalesce(cameras_count.c.count, 0).label('cameras_count'),
            func.coalesce(locations_count.c.count, 0).label('locations_count'),
            func.coalesce(departments_count.c.count, 0).label('departments_count')
        )
        
        # Apply filters
        if filters.get('search'):
            search = f"%{filters['search']}%"
            query = query.filter(
                or_(
                    Organization.name.ilike(search),
                    Organization.code.ilike(search)
                )
            )
        
        if filters.get('organization_type'):
            query = query.filter(Organization.organization_type == filters['organization_type'])
        
        if filters.get('is_active') is not None:
            query = query.filter(Organization.is_active == filters['is_active'])
        # we want the return the organization data along with counts
        
        # Order by created_at desc
        query = query.order_by(Organization.created_at.desc())
        
        return query
    
    @staticmethod
    def update_organization(org_id, data):
        """Update an organization"""
        organization = OrganizationService.get_organization(org_id)
        
        # Check if name is being changed and conflicts with another org
        if 'name' in data and data['name'] != organization.name:
            existing = Organization.query.filter_by(
                name=data['name'],
                deleted_at=None
            ).filter(Organization.id != org_id).first()
            
            if existing:
                raise ConflictError(f"Organization with name '{data['name']}' already exists")
        
        # Update fields
        for key, value in data.items():
            setattr(organization, key, value)
        
        organization.updated_at = datetime.utcnow()
        db.session.commit()
        
        return organization
    
    @staticmethod
    def delete_organization(org_id, soft_delete=True):
        """Delete an organization (soft delete by default)"""
        organization = OrganizationService.get_organization(org_id)
        
        if soft_delete:
            # Soft delete
            organization.deleted_at = datetime.utcnow()
            organization.is_active = False
            db.session.commit()
        else:
            # Hard delete (cascade will handle related records)
            db.session.delete(organization)
            db.session.commit()
        
        return True
    
    @staticmethod
    def get_organization_stats(org_id):
        """Get statistics for an organization"""
        organization = OrganizationService.get_organization(org_id)
        # Use explicit DB counts to exclude soft-deleted related records
        employees_count = db.session.query(func.count(Employee.id)).filter(
            Employee.organization_id == org_id,
            Employee.deleted_at.is_(None)
        ).scalar() or 0

        cameras_count = db.session.query(func.count(Camera.id)).filter(
            Camera.organization_id == org_id,
            Camera.deleted_at.is_(None)
        ).scalar() or 0

        locations_count = db.session.query(func.count(Location.id)).filter(
            Location.organization_id == org_id,
            Location.deleted_at.is_(None)
        ).scalar() or 0

        departments_count = db.session.query(func.count(Department.id)).filter(
            Department.organization_id == org_id,
            Department.deleted_at.is_(None)
        ).scalar() or 0

        stats = {
            'organization': organization.to_dict(),
            'departments_count': int(departments_count),
            'employees_count': int(employees_count),
            'locations_count': int(locations_count),
            'cameras_count': int(cameras_count),
        }

        return stats