"""add award category and high fives

Revision ID: 9f2bc16f329e
Revises: aece7accab30
Create Date: 2026-01-26 06:35:52.784827

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9f2bc16f329e'
down_revision = 'aece7accab30'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the awardcategory enum type if it doesn't exist
    bind = op.get_bind()
    if bind.engine.name == 'postgresql':
        # Check if type exists
        res = bind.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'awardcategory'"))
        if not res.fetchone():
            awardcategory_enum = sa.Enum('GOLD', 'SILVER', 'BRONZE', 'ECARD', name='awardcategory')
            awardcategory_enum.create(bind)

    op.add_column('recognitions', sa.Column('award_category', sa.Enum('GOLD', 'SILVER', 'BRONZE', 'ECARD', name='awardcategory'), nullable=True))
    op.add_column('recognitions', sa.Column('high_five_count', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('recognitions', 'high_five_count')
    op.drop_column('recognitions', 'award_category')
    
    # Drop the awardcategory enum type
    # Note: Using op.get_bind().engine.name to check if we should drop the type
    # because SQLite handles enums differently than Postgres.
    bind = op.get_bind()
    if bind.engine.name == 'postgresql':
        sa.Enum(name='awardcategory').drop(bind)
