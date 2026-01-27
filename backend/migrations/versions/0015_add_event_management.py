"""Add events, event_options, and event_registrations tables for event management

Revision ID: 0015_add_event_management
Revises: 0014_add_tenant_budgets
Create Date: 2024-01-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0015_add_event_management'
down_revision = '0014'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create event_type ENUM
    event_type_enum = postgresql.ENUM('ANNUAL_DAY', 'GIFTING', name='event_type', create_type=True)
    event_type_enum.create(op.get_bind())
    
    # Create registration_status ENUM
    registration_status_enum = postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', name='registration_status', create_type=True)
    registration_status_enum.create(op.get_bind())
    
    # Create events table
    op.create_table(
        'events',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_type', sa.Enum('ANNUAL_DAY', 'GIFTING', name='event_type'), nullable=False),
        sa.Column('event_budget_amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('budget_committed', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('registration_start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('registration_end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_by', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_events_tenant_id'), 'events', ['tenant_id'], unique=False)
    
    # Create event_options table
    op.create_table(
        'event_options',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False, index=True),
        sa.Column('event_id', sa.String(36), nullable=False),
        sa.Column('option_name', sa.String(255), nullable=False),
        sa.Column('option_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('total_available', sa.Integer(), nullable=False),
        sa.Column('committed_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('cost_per_unit', sa.Numeric(10, 2), nullable=True),
        sa.Column('is_active', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_event_options_tenant_id'), 'event_options', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_event_options_event_id'), 'event_options', ['event_id'], unique=False)
    
    # Create event_registrations table
    op.create_table(
        'event_registrations',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('tenant_id', sa.String(36), nullable=False, index=True),
        sa.Column('event_id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('event_option_id', sa.String(36), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', name='registration_status'), nullable=False, server_default='PENDING'),
        sa.Column('qr_token', sa.String(255), nullable=True, unique=True),
        sa.Column('preferred_pickup_slot', sa.String(100), nullable=True),
        sa.Column('assigned_pickup_slot', sa.String(100), nullable=True),
        sa.Column('amount_committed', sa.Numeric(12, 2), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approved_by', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['event_option_id'], ['event_options.id'], ),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_event_registrations_tenant_id'), 'event_registrations', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_event_registrations_event_id'), 'event_registrations', ['event_id'], unique=False)
    op.create_index(op.f('ix_event_registrations_user_id'), 'event_registrations', ['user_id'], unique=False)
    op.create_index(op.f('ix_event_registrations_qr_token'), 'event_registrations', ['qr_token'], unique=True)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_event_registrations_qr_token'), table_name='event_registrations')
    op.drop_index(op.f('ix_event_registrations_user_id'), table_name='event_registrations')
    op.drop_index(op.f('ix_event_registrations_event_id'), table_name='event_registrations')
    op.drop_index(op.f('ix_event_registrations_tenant_id'), table_name='event_registrations')
    op.drop_table('event_registrations')
    
    op.drop_index(op.f('ix_event_options_event_id'), table_name='event_options')
    op.drop_index(op.f('ix_event_options_tenant_id'), table_name='event_options')
    op.drop_table('event_options')
    
    op.drop_index(op.f('ix_events_tenant_id'), table_name='events')
    op.drop_table('events')
    
    # Drop ENUMs
    sa.Enum('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', name='registration_status').drop(op.get_bind())
    sa.Enum('ANNUAL_DAY', 'GIFTING', name='event_type').drop(op.get_bind())
