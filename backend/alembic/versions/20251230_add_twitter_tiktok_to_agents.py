"""add twitter and tiktok columns to agents table

Revision ID: 20251230_agents_social
Revises: 20251229_remove_fk
Create Date: 2025-12-30

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251230_agents_social'
down_revision = '20251229_remove_fk'
branch_labels = None
depends_on = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Verifica se uma coluna existe na tabela"""
    bind = op.get_bind()
    result = bind.execute(sa.text(
        f"SELECT column_name FROM information_schema.columns "
        f"WHERE table_name='{table_name}' AND column_name='{column_name}'"
    ))
    return result.fetchone() is not None


def upgrade():
    """Adicionar colunas twitter e tiktok à tabela agents"""
    
    # Adicionar twitter se não existir
    if not column_exists('agents', 'twitter'):
        op.add_column('agents', 
            sa.Column('twitter', sa.String(255), nullable=True))
        print("[MIGRATION] Added twitter column to agents")
    else:
        print("[MIGRATION] agents.twitter column already exists, skipping")
    
    # Adicionar tiktok se não existir
    if not column_exists('agents', 'tiktok'):
        op.add_column('agents', 
            sa.Column('tiktok', sa.String(255), nullable=True))
        print("[MIGRATION] Added tiktok column to agents")
    else:
        print("[MIGRATION] agents.tiktok column already exists, skipping")


def downgrade():
    """Remover colunas twitter e tiktok da tabela agents"""
    if column_exists('agents', 'twitter'):
        op.drop_column('agents', 'twitter')
    if column_exists('agents', 'tiktok'):
        op.drop_column('agents', 'tiktok')
