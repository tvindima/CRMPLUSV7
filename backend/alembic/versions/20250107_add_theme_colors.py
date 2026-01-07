"""Add theme color columns to crm_settings

Revision ID: 20250107_theme
Revises: 
Create Date: 2025-01-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers
revision = '20250107_theme'
down_revision = None
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Adicionar novas colunas de tema se não existirem
    if not column_exists('crm_settings', 'secondary_color'):
        op.add_column('crm_settings', sa.Column('secondary_color', sa.String(), nullable=True, server_default='#C5C5C5'))
    
    if not column_exists('crm_settings', 'background_color'):
        op.add_column('crm_settings', sa.Column('background_color', sa.String(), nullable=True, server_default='#0B0B0D'))
    
    if not column_exists('crm_settings', 'background_secondary'):
        op.add_column('crm_settings', sa.Column('background_secondary', sa.String(), nullable=True, server_default='#1A1A1F'))
    
    if not column_exists('crm_settings', 'text_color'):
        op.add_column('crm_settings', sa.Column('text_color', sa.String(), nullable=True, server_default='#FFFFFF'))
    
    if not column_exists('crm_settings', 'text_muted'):
        op.add_column('crm_settings', sa.Column('text_muted', sa.String(), nullable=True, server_default='#9CA3AF'))
    
    if not column_exists('crm_settings', 'border_color'):
        op.add_column('crm_settings', sa.Column('border_color', sa.String(), nullable=True, server_default='#2A2A2E'))
    
    if not column_exists('crm_settings', 'accent_color'):
        op.add_column('crm_settings', sa.Column('accent_color', sa.String(), nullable=True, server_default='#E10600'))


def downgrade():
    # Remover colunas de tema
    op.drop_column('crm_settings', 'secondary_color')
    op.drop_column('crm_settings', 'background_color')
    op.drop_column('crm_settings', 'background_secondary')
    op.drop_column('crm_settings', 'text_color')
    op.drop_column('crm_settings', 'text_muted')
    op.drop_column('crm_settings', 'border_color')
    op.drop_column('crm_settings', 'accent_color')
