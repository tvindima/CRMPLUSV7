"""merge_all_heads

Revision ID: 32443c837910
Revises: 20251222_ingestion, 20251223_social, 20251223_contratos_mediacao, 20251223_crm_settings_watermark, 20251223_pre_angariacoes, add_cmi_options
Create Date: 2025-12-26 18:23:01.395791

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '32443c837910'
down_revision = ('20251222_ingestion', '20251223_social', '20251223_contratos_mediacao', '20251223_crm_settings_watermark', '20251223_pre_angariacoes', 'add_cmi_options')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
