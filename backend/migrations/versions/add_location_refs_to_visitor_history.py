"""Add location references to visitor history

Revision ID: add_location_refs
Revises: [previous_revision]
Create Date: 2026-03-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_location_refs'
down_revision = 'add_dept_indexes'
branch_labels = None
depends_on = None


def upgrade():
    """Add location reference columns to visitor_history_details table"""
    # Add foreign key columns for location references
    op.add_column('visitor_history_details', 
                  sa.Column('allowed_location_id', sa.String(36), nullable=True))
    op.add_column('visitor_history_details', 
                  sa.Column('current_location_id', sa.String(36), nullable=True))
    
    # Add foreign key constraints
    op.create_foreign_key(
        'fk_visitor_history_allowed_location',
        'visitor_history_details', 
        'locations',
        ['allowed_location_id'], 
        ['id']
    )
    op.create_foreign_key(
        'fk_visitor_history_current_location',
        'visitor_history_details', 
        'locations',
        ['current_location_id'], 
        ['id']
    )
    
    # Add indexes for better query performance
    op.create_index('ix_visitor_history_allowed_location_id', 
                   'visitor_history_details', ['allowed_location_id'])
    op.create_index('ix_visitor_history_current_location_id', 
                   'visitor_history_details', ['current_location_id'])
    
    # Make allowed_floor and allowed_tower nullable for backward compatibility
    # during transition period
    op.alter_column('visitor_history_details', 'allowed_floor',
                   existing_type=sa.String(100),
                   nullable=True)


def downgrade():
    """Remove location reference columns from visitor_history_details table"""
    # Drop indexes
    op.drop_index('ix_visitor_history_current_location_id', 'visitor_history_details')
    op.drop_index('ix_visitor_history_allowed_location_id', 'visitor_history_details')
    
    # Drop foreign key constraints  
    op.drop_constraint('fk_visitor_history_current_location', 'visitor_history_details', type_='foreignkey')
    op.drop_constraint('fk_visitor_history_allowed_location', 'visitor_history_details', type_='foreignkey')
    
    # Drop columns
    op.drop_column('visitor_history_details', 'current_location_id')
    op.drop_column('visitor_history_details', 'allowed_location_id')
    
    # Restore allowed_floor to not nullable
    op.alter_column('visitor_history_details', 'allowed_floor',
                   existing_type=sa.String(100),
                   nullable=False)