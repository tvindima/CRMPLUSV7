"""add twitter and tiktok social fields

Revision ID: 20251223_social
Revises: 
Create Date: 2025-12-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251223_social'
down_revision = None
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
    """Adicionar colunas twitter e tiktok à tabela agent_site_preferences"""
    
    # Adicionar twitter se não existir
    if not column_exists('agent_site_preferences', 'twitter'):
        op.add_column('agent_site_preferences', 
            sa.Column('twitter', sa.String(255), nullable=True))
        print("[MIGRATION] Added twitter column")
    else:
        print("[MIGRATION] twitter column already exists, skipping")
    
    # Adicionar tiktok se não existir
    if not column_exists('agent_site_preferences', 'tiktok'):
        op.add_column('agent_site_preferences', 
            sa.Column('tiktok', sa.String(255), nullable=True))
        print("[MIGRATION] Added tiktok column")
    else:
        print("[MIGRATION] tiktok column already exists, skipping")


def downgrade():
    """Remover colunas twitter e tiktok"""
    if column_exists('agent_site_preferences', 'twitter'):
        op.drop_column('agent_site_preferences', 'twitter')
    if column_exists('agent_site_preferences', 'tiktok'):
        op.drop_column('agent_site_preferences', 'tiktok')
