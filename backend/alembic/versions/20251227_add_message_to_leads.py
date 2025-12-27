"""Add message column to leads table

Revision ID: 20251227_message_leads
Revises: 
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251227_message_leads'
down_revision = None  # Will be auto-merged
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add message column to leads table if it doesn't exist
    try:
        op.add_column('leads', sa.Column('message', sa.Text(), nullable=True))
    except Exception as e:
        print(f"Column message may already exist: {e}")


def downgrade() -> None:
    op.drop_column('leads', 'message')
