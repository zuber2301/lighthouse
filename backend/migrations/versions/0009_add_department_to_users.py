"""add department to users

Revision ID: 0009
Revises: 0008
Create Date: 2026-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0009'
down_revision = '0008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add column department to users table
    op.add_column('users', sa.Column('department', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove column department from users table
    op.drop_column('users', 'department')
