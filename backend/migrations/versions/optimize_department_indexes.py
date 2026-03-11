"""Optimize API query performance with indexes for departments, shifts, employees, locations

Revision ID: add_dept_indexes
Revises: 9acd645f3eff
Create Date: 2026-03-11 16:45:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_dept_indexes'
down_revision = '9acd645f3eff'
branch_labels = None
depends_on = None


def upgrade():
    """Add indexes to improve list query performance"""
    
    # Department indexes
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.create_index('ix_departments_name', ['name'], unique=False)
        batch_op.create_index('ix_departments_code', ['code'], unique=False)
        batch_op.create_index('ix_departments_is_active', ['is_active'], unique=False)
        batch_op.create_index('ix_departments_deleted_at', ['deleted_at'], unique=False)
        batch_op.create_index(
            'ix_departments_org_active_deleted',
            ['organization_id', 'is_active', 'deleted_at'],
            unique=False
        )
    
    # Shift indexes
    with op.batch_alter_table('shifts', schema=None) as batch_op:
        batch_op.create_index('ix_shifts_name', ['name'], unique=False)
        batch_op.create_index('ix_shifts_is_active', ['is_active'], unique=False)
        batch_op.create_index(
            'ix_shifts_org_active',
            ['organization_id', 'is_active'],
            unique=False
        )
    
    # Employee indexes
    with op.batch_alter_table('employees', schema=None) as batch_op:
        batch_op.create_index('ix_employees_employee_code', ['employee_code'], unique=False)
        batch_op.create_index('ix_employees_phone_number', ['phone_number'], unique=False)
        batch_op.create_index('ix_employees_employment_type', ['employment_type'], unique=False)
        batch_op.create_index('ix_employees_is_active', ['is_active'], unique=False)
        batch_op.create_index('ix_employees_deleted_at', ['deleted_at'], unique=False)
        batch_op.create_index(
            'ix_employees_org_active_deleted',
            ['organization_id', 'is_active', 'deleted_at'],
            unique=False
        )
        batch_op.create_index(
            'ix_employees_org_dept_active',
            ['organization_id', 'department_id', 'is_active'],
            unique=False
        )
    
    # Location indexes
    with op.batch_alter_table('locations', schema=None) as batch_op:
        batch_op.create_index('ix_locations_name', ['name'], unique=False)
        batch_op.create_index('ix_locations_location_type', ['location_type'], unique=False)
        batch_op.create_index('ix_locations_building', ['building'], unique=False)
        batch_op.create_index('ix_locations_area', ['area'], unique=False)
        batch_op.create_index('ix_locations_is_active', ['is_active'], unique=False)
        batch_op.create_index('ix_locations_deleted_at', ['deleted_at'], unique=False)
        batch_op.create_index(
            'ix_locations_org_active_deleted',
            ['organization_id', 'is_active', 'deleted_at'],
            unique=False
        )


def downgrade():
    """Remove all added indexes"""
    
    # Department indexes
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.drop_index('ix_departments_org_active_deleted')
        batch_op.drop_index('ix_departments_deleted_at')
        batch_op.drop_index('ix_departments_is_active')
        batch_op.drop_index('ix_departments_code')
        batch_op.drop_index('ix_departments_name')
    
    # Shift indexes
    with op.batch_alter_table('shifts', schema=None) as batch_op:
        batch_op.drop_index('ix_shifts_org_active')
        batch_op.drop_index('ix_shifts_is_active')
        batch_op.drop_index('ix_shifts_name')
    
    # Employee indexes
    with op.batch_alter_table('employees', schema=None) as batch_op:
        batch_op.drop_index('ix_employees_org_dept_active')
        batch_op.drop_index('ix_employees_org_active_deleted')
        batch_op.drop_index('ix_employees_deleted_at')
        batch_op.drop_index('ix_employees_is_active')
        batch_op.drop_index('ix_employees_employment_type')
        batch_op.drop_index('ix_employees_phone_number')
        batch_op.drop_index('ix_employees_employee_code')
    
    # Location indexes
    with op.batch_alter_table('locations', schema=None) as batch_op:
        batch_op.drop_index('ix_locations_org_active_deleted')
        batch_op.drop_index('ix_locations_deleted_at')
        batch_op.drop_index('ix_locations_is_active')
        batch_op.drop_index('ix_locations_area')
        batch_op.drop_index('ix_locations_building')
        batch_op.drop_index('ix_locations_location_type')
        batch_op.drop_index('ix_locations_name')
