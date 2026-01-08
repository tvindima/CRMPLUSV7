"""add tipo_imovel to first_impressions and pre_angariacoes

Revision ID: add_tipo_imovel
Revises: 
Create Date: 2025-01-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_tipo_imovel'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    Adicionar campo tipo_imovel (Apartamento, Moradia, Terreno, etc.)
    às tabelas first_impressions e pre_angariacoes
    """
    # Adicionar tipo_imovel a first_impressions
    op.execute("""
        ALTER TABLE first_impressions 
        ADD COLUMN IF NOT EXISTS tipo_imovel VARCHAR(100) NULL;
    """)
    
    # Adicionar tipo_imovel a pre_angariacoes
    op.execute("""
        ALTER TABLE pre_angariacoes 
        ADD COLUMN IF NOT EXISTS tipo_imovel VARCHAR(100) NULL;
    """)
    
    print("✅ Campo tipo_imovel adicionado a first_impressions e pre_angariacoes")


def downgrade():
    """Remover campo tipo_imovel"""
    op.execute("""
        ALTER TABLE first_impressions 
        DROP COLUMN IF EXISTS tipo_imovel;
    """)
    
    op.execute("""
        ALTER TABLE pre_angariacoes 
        DROP COLUMN IF EXISTS tipo_imovel;
    """)
