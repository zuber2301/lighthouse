"""add avatar_url to users

Revision ID: f912cc625248
Revises: 9f2bc16f329e
Create Date: 2026-01-26 06:43:31.801036

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f912cc625248'
down_revision = '9f2bc16f329e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('avatar_url', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'avatar_url')
