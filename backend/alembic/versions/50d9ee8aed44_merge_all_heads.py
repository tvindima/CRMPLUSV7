"""merge_all_heads

Revision ID: 50d9ee8aed44
Revises: 20260112_leads_portal_source, 20260112_opportunities_proposals, add_custom_terminology, e1fe89ed5e1d
Create Date: 2026-01-12 18:37:12.909126

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '50d9ee8aed44'
down_revision = ('20260112_leads_portal_source', '20260112_opportunities_proposals', 'add_custom_terminology', 'e1fe89ed5e1d')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
