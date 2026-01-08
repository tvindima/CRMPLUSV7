"""merge_all_heads_jan2026

Revision ID: 6a57cdd71c97
Revises: 20250107_theme, 20251230_agents_social, 20260107_175959, 20260107_platform, 20260107_tenant_status, 2026_01_07_001
Create Date: 2026-01-08 22:36:26.774237

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6a57cdd71c97'
down_revision = ('20250107_theme', '20251230_agents_social', '20260107_175959', '20260107_platform', '20260107_tenant_status', '2026_01_07_001')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
