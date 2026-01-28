"""Add gifting mode support: pickup locations, time slots, and gift images

Revision ID: 0016_add_gifting_support
Revises: 0015_add_event_management
Create Date: 2024-01-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0016_add_gifting_support'
down_revision = '0015_add_event_management'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add gift_image_url column to event_options
    op.add_column('event_options', sa.Column('gift_image_url', sa.String(500), nullable=True))
    
    # Create event_pickup_locations table
    op.create_table(
        'event_pickup_locations',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False, index=True),
        sa.Column('event_id', sa.String(36), nullable=False),
        sa.Column('location_name', sa.String(255), nullable=False),
        sa.Column('location_code', sa.String(50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('floor_number', sa.Integer(), nullable=True),
        sa.Column('building', sa.String(100), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_event_pickup_locations_tenant_id'), 'event_pickup_locations', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_event_pickup_locations_event_id'), 'event_pickup_locations', ['event_id'], unique=False)
    
    # Create event_time_slots table
    op.create_table(
        'event_time_slots',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False, index=True),
        sa.Column('location_id', sa.String(36), nullable=False),
        sa.Column('event_id', sa.String(36), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('slot_label', sa.String(100), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('registered_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['location_id'], ['event_pickup_locations.id'], ),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_event_time_slots_tenant_id'), 'event_time_slots', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_event_time_slots_location_id'), 'event_time_slots', ['location_id'], unique=False)
    op.create_index(op.f('ix_event_time_slots_event_id'), 'event_time_slots', ['event_id'], unique=False)


def downgrade() -> None:
    # Drop time slots table
    op.drop_index(op.f('ix_event_time_slots_event_id'), table_name='event_time_slots')
    op.drop_index(op.f('ix_event_time_slots_location_id'), table_name='event_time_slots')
    op.drop_index(op.f('ix_event_time_slots_tenant_id'), table_name='event_time_slots')
    op.drop_table('event_time_slots')
    
    # Drop pickup locations table
    op.drop_index(op.f('ix_event_pickup_locations_event_id'), table_name='event_pickup_locations')
    op.drop_index(op.f('ix_event_pickup_locations_tenant_id'), table_name='event_pickup_locations')
    op.drop_table('event_pickup_locations')
    
    # Drop gift_image_url column
    op.drop_column('event_options', 'gift_image_url')
