"""Optimize department query performance with indexes

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
    """Add indexes to improve department list query performance"""
    # Add indexes on columns used in filtering and search
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.create_index('ix_departments_name', ['name'], unique=False)
        batch_op.create_index('ix_departments_code', ['code'], unique=False)
        batch_op.create_index('ix_departments_is_active', ['is_active'], unique=False)
        batch_op.create_index('ix_departments_deleted_at', ['deleted_at'], unique=False)
        # Composite index for common filter combinations
        batch_op.create_index(
            'ix_departments_org_active_deleted',
            ['organization_id', 'is_active', 'deleted_at'],
            unique=False
        )


def downgrade():
    """Remove the added indexes"""
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.drop_index('ix_departments_org_active_deleted')
        batch_op.drop_index('ix_departments_deleted_at')
        batch_op.drop_index('ix_departments_is_active')
        batch_op.drop_index('ix_departments_code')
        batch_op.drop_index('ix_departments_name')
