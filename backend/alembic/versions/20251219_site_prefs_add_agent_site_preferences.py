"""add agent_site_preferences table

Revision ID: 20251219_site_prefs
Revises: f1a9e30a05df
Create Date: 2025-12-19

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers
revision = '20251219_site_prefs'
down_revision = 'f1a9e30a05df'
branch_labels = None
depends_on = None


def table_exists(table_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade():
    """
    Criar tabela agent_site_preferences para personalização
    do site montra individual de cada agente.
    """
    # Skip if agents table doesn't exist (dependencies not met)
    if not table_exists('agents'):
        print("[MIGRATION] Skipping - agents table does not exist yet")
        return
    
    # Skip if table already exists
    if table_exists('agent_site_preferences'):
        print("[MIGRATION] Skipping - agent_site_preferences already exists")
        return
    
    op.create_table(
        'agent_site_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        
        # Tema
        sa.Column('theme', sa.String(20), nullable=True, server_default='dark'),
        
        # Cores personalizadas
        sa.Column('primary_color', sa.String(7), nullable=True, server_default='#ef4444'),
        sa.Column('secondary_color', sa.String(7), nullable=True, server_default='#ffffff'),
        
        # Hero Properties - JSON string para compatibilidade SQLite/PostgreSQL
        sa.Column('hero_property_ids_json', sa.Text(), nullable=True, server_default='[]'),
        
        # Bio e Redes Sociais
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('instagram', sa.String(255), nullable=True),
        sa.Column('facebook', sa.String(255), nullable=True),
        sa.Column('linkedin', sa.String(255), nullable=True),
        sa.Column('whatsapp', sa.String(50), nullable=True),
        
        # Metadados
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('agent_id')
    )
    
    # Índice para busca rápida por agent_id
    op.create_index(
        'idx_agent_site_preferences_agent_id',
        'agent_site_preferences',
        ['agent_id']
    )
    print("[MIGRATION] 20251219_site_prefs completed")


def downgrade():
    """Remove tabela agent_site_preferences"""
    if table_exists('agent_site_preferences'):
        op.drop_index('idx_agent_site_preferences_agent_id', 'agent_site_preferences')
        op.drop_table('agent_site_preferences')
