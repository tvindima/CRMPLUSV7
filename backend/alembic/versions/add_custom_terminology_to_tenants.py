"""add custom_terminology to tenants

Revision ID: add_custom_terminology
Revises: 
Create Date: 2026-01-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_custom_terminology'
down_revision = None  # Será atualizado pelo Alembic
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar coluna custom_terminology à tabela tenants
    op.add_column('tenants', 
        sa.Column('custom_terminology', postgresql.JSON(astext_type=sa.Text()), nullable=True)
    )
    
    # Adicionar coluna sub_sector para categorização mais específica
    op.add_column('tenants',
        sa.Column('sub_sector', sa.String(100), nullable=True)
    )


def downgrade():
    op.drop_column('tenants', 'sub_sector')
    op.drop_column('tenants', 'custom_terminology')
