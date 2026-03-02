from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Date, DateTime, Boolean
import uuid
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '7425744c1783'
down_revision = 'a868bbacb5d5'
branch_labels = None
depends_on = None


def upgrade():
    # Create visitor_history_details table
    op.create_table(
        'visitor_history_details',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('visitor_id', sa.String(length=36), sa.ForeignKey('visitors.id'), nullable=False, index=True),
        sa.Column('organization_id', sa.String(length=36), sa.ForeignKey('organizations.id'), nullable=False, index=True),
        sa.Column('visitor_type', sa.String(length=50), nullable=False, server_default='guest'),
        sa.Column('host_name', sa.String(length=255), nullable=True),
        sa.Column('host_number', sa.String(length=20), nullable=True),
        sa.Column('purpose_of_visit', sa.String(length=500), nullable=False),
        sa.Column('allowed_floor', sa.String(length=100), nullable=False),
        sa.Column('allowed_tower', sa.String(length=100), nullable=True),
        sa.Column('from_date', sa.Date(), nullable=False),
        sa.Column('to_date', sa.Date(), nullable=True),
        sa.Column('check_in_time', sa.DateTime(), nullable=True),
        sa.Column('check_out_time', sa.DateTime(), nullable=True),
        sa.Column('is_checked_in', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('current_floor', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    op.execute('CREATE INDEX IF NOT EXISTS ix_visitor_history_details_visitor_id ON visitor_history_details (visitor_id)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_visitor_history_details_organization_id ON visitor_history_details (organization_id)')

    # Add new core columns to visitors
    op.add_column('visitors', sa.Column('name', sa.String(length=255), nullable=True))
    op.add_column('visitors', sa.Column('phone', sa.String(length=20), nullable=True))
    op.add_column('visitors', sa.Column('gender', sa.String(length=50), nullable=True))
    op.execute('CREATE INDEX IF NOT EXISTS ix_visitors_email ON visitors (email)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_visitors_phone ON visitors (phone)')

    # Migrate data from old columns to new columns and visitor_history_details
    conn = op.get_bind()
    visitors_tbl = sa.table(
        'visitors',
        sa.column('id', String(36)),
        sa.column('organization_id', String(36)),
        sa.column('visitor_name', String(255)),
        sa.column('mobile_number', String(20)),
        sa.column('visitor_type', String(50)),
        sa.column('host_name', String(255)),
        sa.column('host_phone', String(20)),
        sa.column('purpose_of_visit', String(500)),
        sa.column('allowed_floor', String(100)),
        sa.column('current_floor', String(100)),
        sa.column('check_in_time', DateTime),
        sa.column('check_out_time', DateTime),
        sa.column('created_at', DateTime),
        sa.column('updated_at', DateTime),
    )
    sel = sa.select(
        visitors_tbl.c.id,
        visitors_tbl.c.organization_id,
        visitors_tbl.c.visitor_name,
        visitors_tbl.c.mobile_number,
        visitors_tbl.c.visitor_type,
        visitors_tbl.c.host_name,
        visitors_tbl.c.host_phone,
        visitors_tbl.c.purpose_of_visit,
        visitors_tbl.c.allowed_floor,
        visitors_tbl.c.current_floor,
        visitors_tbl.c.check_in_time,
        visitors_tbl.c.check_out_time,
        visitors_tbl.c.created_at,
        visitors_tbl.c.updated_at,
    )
    rows = conn.execute(sel).fetchall()
    ins_hist = sa.text("""
        INSERT INTO visitor_history_details
        (id, visitor_id, organization_id, visitor_type, host_name, host_number, purpose_of_visit, allowed_floor, allowed_tower, from_date, to_date, check_in_time, check_out_time, is_checked_in, current_floor, created_at, updated_at)
        VALUES (:id, :visitor_id, :organization_id, :visitor_type, :host_name, :host_number, :purpose_of_visit, :allowed_floor, NULL, :from_date, :to_date, :check_in_time, :check_out_time, :is_checked_in, :current_floor, :created_at, :updated_at)
    """)
    upd_vis_name = sa.text("UPDATE visitors SET name = :name, phone = :phone WHERE id = :id")

    for r in rows:
        check_in = r.check_in_time
        check_out = r.check_out_time
        from_date = (check_in.date() if check_in else (r.created_at.date() if r.created_at else datetime.utcnow().date()))
        to_date = (check_out.date() if check_out else None)
        conn.execute(ins_hist, {
            'id': str(uuid.uuid4()),
            'visitor_id': r.id,
            'organization_id': r.organization_id,
            'visitor_type': r.visitor_type or 'guest',
            'host_name': r.host_name,
            'host_number': r.host_phone,
            'purpose_of_visit': r.purpose_of_visit or '',
            'allowed_floor': r.allowed_floor or '',
            'from_date': from_date,
            'to_date': to_date,
            'check_in_time': check_in,
            'check_out_time': check_out,
            'is_checked_in': bool(check_in and not check_out),
            'current_floor': r.current_floor,
            'created_at': r.created_at or datetime.utcnow(),
            'updated_at': r.updated_at or datetime.utcnow(),
        })
        conn.execute(upd_vis_name, {
            'id': r.id,
            'name': r.visitor_name,
            'phone': r.mobile_number,
        })

    # Drop old columns from visitors no longer in model
    drop_cols = [
        'visitor_name', 'mobile_number', 'purpose_of_visit', 'allowed_floor', 'visitor_type',
        'is_vip', 'is_recurring', 'visit_frequency', 'last_visit_date', 'host_name', 'host_phone',
        'company_name', 'company_address', 'is_pre_registered', 'pre_registration_status',
        'scheduled_arrival_time', 'scheduled_departure_time', 'check_in_time', 'check_out_time',
        'is_checked_in', 'expected_duration_hours', 'actual_duration_hours', 'current_floor',
        'badge_number', 'badge_status', 'badge_printed_at', 'group_visit_id', 'id_proof_type',
        'id_proof_number', 'id_proof_image_path', 'photo_path', 'emergency_contact_name',
        'emergency_contact_phone', 'temperature', 'health_declaration_status', 'vaccination_verified',
        'nda_signed', 'nda_signed_at', 'assets_carried', 'work_completed_proof', 'delivery_package_count',
        'delivery_recipient_name', 'special_instructions', 'vehicle_number', 'vehicle_type',
        'vehicle_model', 'parking_slot', 'vehicle_check_status', 'material_declaration', 'vehicle_photos',
        'feedback_rating', 'feedback_comments',
    ]
    for c in drop_cols:
        try:
            op.drop_column('visitors', c)
        except Exception:
            # Ignore if column already dropped or doesn't exist
            pass


def downgrade():
    # Recreate dropped visitor columns (minimal placeholders)
    op.add_column('visitors', sa.Column('visitor_name', sa.String(length=255), nullable=True))
    op.add_column('visitors', sa.Column('mobile_number', sa.String(length=20), nullable=True))
    op.add_column('visitors', sa.Column('purpose_of_visit', sa.String(length=500), nullable=True))
    op.add_column('visitors', sa.Column('allowed_floor', sa.String(length=100), nullable=True))
    op.add_column('visitors', sa.Column('visitor_type', sa.String(length=50), nullable=True))
    op.add_column('visitors', sa.Column('check_in_time', sa.DateTime(), nullable=True))
    op.add_column('visitors', sa.Column('check_out_time', sa.DateTime(), nullable=True))
    op.add_column('visitors', sa.Column('is_checked_in', sa.Boolean(), nullable=True))
    op.add_column('visitors', sa.Column('current_floor', sa.String(length=100), nullable=True))

    # Drop new core columns
    op.execute('DROP INDEX IF EXISTS ix_visitors_phone')
    op.execute('DROP INDEX IF EXISTS ix_visitors_email')
    op.drop_column('visitors', 'gender')
    op.drop_column('visitors', 'phone')
    op.drop_column('visitors', 'name')

    # Drop visitor_history_details
    op.execute('DROP INDEX IF EXISTS ix_visitor_history_details_organization_id')
    op.execute('DROP INDEX IF EXISTS ix_visitor_history_details_visitor_id')
    op.drop_table('visitor_history_details')
