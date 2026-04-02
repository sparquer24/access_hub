"""Add stream_url to cameras

Revision ID: add_stream_url
Revises: add_stream_url
Create Date: 2026-04-01 17:45:00

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_stream_url'
down_revision = 'add_stream_url'
branch_labels = None
depends_on = None


def upgrade():
    """Add stream_url column to cameras table"""
    op.add_column('cameras', 
                  sa.Column('stream_url', sa.String(512), nullable=True))


def downgrade():
    """Remove stream_url column from cameras table"""
    op.drop_column('cameras', 'stream_url')
