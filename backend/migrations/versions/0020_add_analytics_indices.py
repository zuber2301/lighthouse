"""Phase 6: Post-Event Analytics indices for performance

Revision ID: 0020_add_analytics_indices
Revises: 0019_initial_schema
Create Date: 2026-01-29

This migration adds performance indices for analytics queries.
These indices speed up the expensive grouping and filtering operations
used in analytics calculations (participation, budget, timeline).
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0020_add_analytics_indices"
down_revision = "0019_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create indices for analytics queries"""
    
    # Speedup participation aggregation by department
    op.create_index(
        "idx_approval_requests_event_department",
        "approval_requests",
        ["event_id", "user_id"],
        unique=False,
    )
    
    # Speedup budget calculations by option
    op.create_index(
        "idx_approval_requests_event_option",
        "approval_requests",
        ["event_id", "option_id"],
        unique=False,
    )
    
    # Speedup timeline (hourly collection) queries
    op.create_index(
        "idx_approval_requests_collected_at",
        "approval_requests",
        ["event_id", "collected_at"],
        unique=False,
    )
    
    # Speedup collection status filtering
    op.create_index(
        "idx_approval_requests_event_collected",
        "approval_requests",
        ["event_id", "is_collected"],
        unique=False,
    )


def downgrade() -> None:
    """Drop analytics indices"""
    op.drop_index("idx_approval_requests_event_collected")
    op.drop_index("idx_approval_requests_collected_at")
    op.drop_index("idx_approval_requests_event_option")
    op.drop_index("idx_approval_requests_event_department")
