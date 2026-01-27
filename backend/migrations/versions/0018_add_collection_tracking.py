"""Add collection tracking fields (Phase 5: Day-of-Event Logistics)

Revision ID: 0018_add_collection_tracking
Revises: 0017_add_approvals
Create Date: 2026-01-27 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0018_add_collection_tracking'
down_revision = '0017_add_approvals'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add collection tracking columns to approval_requests table
    op.add_column(
        'approval_requests',
        sa.Column('is_collected', sa.Integer, nullable=False, server_default='0')
    )
    op.add_column(
        'approval_requests',
        sa.Column('collected_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'approval_requests',
        sa.Column('collected_by', sa.String(36), nullable=True)
    )
    
    # Add foreign key for collected_by
    op.create_foreign_key(
        'fk_approval_requests_collected_by',
        'approval_requests', 'users',
        ['collected_by'], ['id']
    )
    
    # Add index for collection status queries
    op.create_index(
        'idx_approval_requests_is_collected',
        'approval_requests',
        ['is_collected']
    )


def downgrade() -> None:
    # Remove index
    op.drop_index('idx_approval_requests_is_collected')
    
    # Remove foreign key
    op.drop_constraint('fk_approval_requests_collected_by', 'approval_requests')
    
    # Remove columns
    op.drop_column('approval_requests', 'collected_by')
    op.drop_column('approval_requests', 'collected_at')
    op.drop_column('approval_requests', 'is_collected')
