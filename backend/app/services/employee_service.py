"""
Business logic for Employee management.
"""

from sqlalchemy import or_, and_
from ..extensions import db
from ..models import Employee, AttendanceRecord, User, Role
from .image_service import ImageService
from ..utils.exceptions import NotFoundError, ConflictError
from datetime import datetime
import uuid
from werkzeug.security import generate_password_hash


class EmployeeService:
    """Service class for employee operations"""
    
    @staticmethod
    def create_employee(data):
        """Create a new employee
        
        Handles automatic user creation if user_id doesn't exist in users table.
        If user_id is provided but doesn't exist, creates a new user.
        """
        # Check if employee with same employee_code exists in the same organization
        existing = Employee.query.filter(
            and_(
                Employee.organization_id == data['organization_id'],
                Employee.employee_code == data['employee_code'],
                Employee.deleted_at == None
            )
        ).first()
        
        if existing:
            raise ConflictError(f"Employee with code '{data['employee_code']}' already exists in this organization")
        
        user_id = data.get('user_id')
        
        # Check if user exists, if not create one
        user = User.query.filter_by(id=user_id).first() if user_id else None
        
        if not user and user_id:
            # Auto-create user if provided user_id doesn't exist
            # Get employee role (default role for employees)
            employee_role = Role.query.filter_by(name='Employee').first()
            if not employee_role:
                raise ConflictError("Employee role not found in system. Please contact administrator.")
            
            # Generate unique username from full_name and timestamp
            base_username = data.get('full_name', 'employee').lower().replace(' ', '.')
            username = f"{base_username}.{int(datetime.utcnow().timestamp())}"
            
            # Generate email from username
            email = f"{username}@employee.local"
            
            # Generate a temporary password
            temp_password = str(uuid.uuid4())[:12]
            
            try:
                user = User(
                    id=user_id,
                    email=email,
                    username=username,
                    password_hash=generate_password_hash(temp_password),
                    role_id=employee_role.id,
                    organization_id=data.get('organization_id'),
                    is_active=True
                )
                db.session.add(user)
                db.session.flush()  # Flush to ensure user is created before employee
            except Exception as e:
                db.session.rollback()
                raise ConflictError(f"Failed to create user for employee: {str(e)}")
        elif not user:
            # No user_id provided and no existing user, this is an error
            raise ConflictError("User ID is required to create an employee")
        
        # Check if user_id is already linked to another employee
        existing_user_emp = Employee.query.filter(
            and_(
                Employee.user_id == user_id,
                Employee.deleted_at == None
            )
        ).first()
        
        if existing_user_emp:
            raise ConflictError(f"User is already linked to another employee")
        
        # Handle photo_base64 separately so it is not passed to the Employee model
        photo_base64 = data.pop('photo_base64', None)

        # Create employee
        employee = Employee(**data)
        db.session.add(employee)
        db.session.flush()  # Flush to get the employee ID
        
        # Save employee photo to unified image storage if provided
        if photo_base64:
            try:
                ImageService.create_image(
                    entity_type='employee',
                    entity_id=employee.id,
                    organization_id=employee.organization_id,
                    image_base64=photo_base64,
                    image_type='photo',
                    capture_device='webcam',
                    primary=True
                )
            except Exception as e:
                # Log error but don't fail the employee creation
                print(f"Warning: Failed to save employee photo: {str(e)}")
        
        db.session.commit()
        
        return employee
    
    @staticmethod
    def get_employee(employee_id):
        """Get employee by ID"""
        employee = Employee.query.filter_by(
            id=employee_id,
            deleted_at=None
        ).first()
        
        if not employee:
            raise NotFoundError('Employee')
        
        return employee
    
    @staticmethod
    def list_employees(filters, organization_id=None):
        """List employees with filters and pagination"""
        from sqlalchemy.orm import joinedload
        
        query = Employee.query.options(
            joinedload(Employee.user),
            joinedload(Employee.department),
            joinedload(Employee.shift)
        ).filter_by(deleted_at=None)
        
        # Apply tenant isolation
        if organization_id:
            query = query.filter_by(organization_id=organization_id)
        
        # Apply filters
        if filters.get('search'):
            search = f"%{filters['search']}%"
            query = query.filter(
                or_(
                    Employee.full_name.ilike(search),
                    Employee.employee_code.ilike(search),
                    Employee.phone_number.ilike(search)
                )
            )
        
        if filters.get('organization_id'):
            query = query.filter_by(organization_id=filters['organization_id'])
        
        if filters.get('department_id'):
            query = query.filter_by(department_id=filters['department_id'])
        
        if filters.get('employment_type'):
            query = query.filter_by(employment_type=filters['employment_type'])
        
        if filters.get('is_active') is not None:
            query = query.filter_by(is_active=filters['is_active'])
        
        # Order by created_at desc
        query = query.order_by(Employee.created_at.desc())
        
        return query
    
    @staticmethod
    def update_employee(employee_id, data):
        """Update an employee"""
        employee = EmployeeService.get_employee(employee_id)
        
        # Employee code and user_id cannot be changed
        if 'employee_code' in data:
            del data['employee_code']
        if 'user_id' in data:
            del data['user_id']
        
        # Handle photo_base64 separately
        photo_base64 = data.pop('photo_base64', None)
        
        # Update fields
        for key, value in data.items():
            setattr(employee, key, value)
        
        # Save updated photo to image storage if provided
        if photo_base64:
            try:
                ImageService.create_image(
                    entity_type='employee',
                    entity_id=employee.id,
                    organization_id=employee.organization_id,
                    image_base64=photo_base64,
                    image_type='photo',
                    capture_device='webcam',
                    primary=True
                )
            except Exception as e:
                # Log error but don't fail the employee update
                print(f"Warning: Failed to save updated employee photo: {str(e)}")
        
        employee.updated_at = datetime.utcnow()
        db.session.commit()
        
        return employee
    
    @staticmethod
    def delete_employee(employee_id, soft_delete=True):
        """Delete an employee (soft delete by default)"""
        employee = EmployeeService.get_employee(employee_id)
        
        if soft_delete:
            # Soft delete
            employee.deleted_at = datetime.utcnow()
            employee.is_active = False
            db.session.commit()
        else:
            # Hard delete (cascade will handle related records)
            db.session.delete(employee)
            db.session.commit()
        
        return True
    
    @staticmethod
    def get_employee_attendance(employee_id, filters):
        """Get attendance records for an employee"""
        employee = EmployeeService.get_employee(employee_id)
        
        query = AttendanceRecord.query.filter_by(employee_id=employee_id)
        
        # Apply date filters
        if filters.get('start_date'):
            query = query.filter(AttendanceRecord.date >= filters['start_date'])
        
        if filters.get('end_date'):
            query = query.filter(AttendanceRecord.date <= filters['end_date'])
        
        if filters.get('status'):
            query = query.filter_by(status=filters['status'])
        
        # Order by date desc
        query = query.order_by(AttendanceRecord.date.desc())
        
        return query
