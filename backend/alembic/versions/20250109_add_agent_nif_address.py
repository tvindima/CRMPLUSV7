"""add nif and address to agents

Revision ID: add_agent_nif_address
Revises: 
Create Date: 2025-01-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_agent_nif_address'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """
    Adicionar campos nif e address à tabela agents
    """
    op.execute("""
        ALTER TABLE agents 
        ADD COLUMN IF NOT EXISTS nif VARCHAR(20) NULL;
    """)
    
    op.execute("""
        ALTER TABLE agents 
        ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL;
    """)
    
    print("✅ Campos nif e address adicionados à tabela agents")


def downgrade():
    """Remover campos"""
    op.execute("""
        ALTER TABLE agents 
        DROP COLUMN IF EXISTS nif;
    """)
    
    op.execute("""
        ALTER TABLE agents 
        DROP COLUMN IF EXISTS address;
    """)
