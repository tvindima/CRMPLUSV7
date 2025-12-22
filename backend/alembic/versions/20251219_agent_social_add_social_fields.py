"""add social fields to agents table

Revision ID: 20251219_agent_social
Revises: 20251219_site_prefs
Create Date: 2025-12-19

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers
revision = '20251219_agent_social'
down_revision = '20251219_site_prefs'
branch_labels = None
depends_on = None


def table_exists(table_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def column_exists(table_name, column_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c['name'] for c in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    """
    Adicionar campos de bio e redes sociais à tabela agents.
    Estes campos ficam diretamente no agente para fácil acesso.
    """
    if not table_exists('agents'):
        print("[MIGRATION] Skipping - agents table does not exist yet")
        return
    
    if not column_exists('agents', 'license_ami'):
        op.add_column('agents', sa.Column('license_ami', sa.String(50), nullable=True))
    
    if not column_exists('agents', 'bio'):
        op.add_column('agents', sa.Column('bio', sa.Text(), nullable=True))
    
    if not column_exists('agents', 'instagram'):
        op.add_column('agents', sa.Column('instagram', sa.String(255), nullable=True))
    
    if not column_exists('agents', 'facebook'):
        op.add_column('agents', sa.Column('facebook', sa.String(255), nullable=True))
    
    if not column_exists('agents', 'linkedin'):
        op.add_column('agents', sa.Column('linkedin', sa.String(255), nullable=True))
    
    if not column_exists('agents', 'whatsapp'):
        op.add_column('agents', sa.Column('whatsapp', sa.String(50), nullable=True))
    
    print("[MIGRATION] 20251219_agent_social completed")


def downgrade():
    """Remove campos de redes sociais da tabela agents"""
    if not table_exists('agents'):
        return
    
    for col in ['whatsapp', 'linkedin', 'facebook', 'instagram', 'bio', 'license_ami']:
        if column_exists('agents', col):
            op.drop_column('agents', col)
