"""merge_all_heads_final

Revision ID: e1fe89ed5e1d
Revises: 20260110_consolidate, 6c921ded76fd
Create Date: 2026-01-10 21:23:17.952720

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e1fe89ed5e1d'
down_revision = ('20260110_consolidate', '6c921ded76fd')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
