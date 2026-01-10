"""merge_tenant_mt_and_tipo_imovel

Revision ID: 6c921ded76fd
Revises: add_tipo_imovel, 20260110_tenant_mt
Create Date: 2026-01-10 14:01:31.101243

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6c921ded76fd'
down_revision = ('add_tipo_imovel', '20260110_tenant_mt')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
