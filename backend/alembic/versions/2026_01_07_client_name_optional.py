"""Make client_name optional in first_impressions

Revision ID: 2026_01_07_001
Revises: 
Create Date: 2026-01-07 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2026_01_07_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Make client_name nullable in first_impressions
    op.alter_column('first_impressions', 'client_name',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=True)


def downgrade():
    # Revert - make client_name required (but first update NULL values)
    op.execute("UPDATE first_impressions SET client_name = 'Não Preenchido' WHERE client_name IS NULL")
    op.alter_column('first_impressions', 'client_name',
                    existing_type=sa.VARCHAR(length=255),
                    nullable=False)
