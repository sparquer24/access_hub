"""add visitor_history_details table

Revision ID: b33c9a1d2f3
Revises: a868bbacb5d5
Create Date: 2026-02-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b33c9a1d2f3'
down_revision = 'a868bbacb5d5'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'visitor_history_details',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=False),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('adhar_number', sa.String(length=32), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('visitor_history_details', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_visitor_history_details_organization_id'), ['organization_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_visitor_history_details_phone_number'), ['phone_number'], unique=False)
        batch_op.create_index(batch_op.f('ix_visitor_history_details_adhar_number'), ['adhar_number'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_visitor_history_details_adhar_number'), table_name='visitor_history_details')
    op.drop_index(op.f('ix_visitor_history_details_phone_number'), table_name='visitor_history_details')
    op.drop_index(op.f('ix_visitor_history_details_organization_id'), table_name='visitor_history_details')
    op.drop_table('visitor_history_details')
