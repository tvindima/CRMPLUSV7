"""Add watermark_public_id column to crm_settings

Revision ID: 20260123_watermark_public_id
Revises: 
Create Date: 2026-01-23

Adiciona o campo watermark_public_id para suportar transformações Cloudinary
com isolamento rigoroso por tenant.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

# revision identifiers, used by Alembic.
revision = '20260123_watermark_public_id'
down_revision = None
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Verifica se uma coluna já existe na tabela"""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    """
    Adiciona coluna watermark_public_id à tabela crm_settings.
    Este campo guarda o Public ID do Cloudinary para uso em overlays.
    
    CRÍTICO PARA ISOLAMENTO MULTI-TENANT:
    Cada tenant terá um public_id único no formato:
    crm-plus/watermarks/{tenant_slug}/watermark
    """
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Verificar se tabela existe
    if 'crm_settings' not in inspector.get_table_names():
        print("[MIGRATION] Skipping - crm_settings table does not exist")
        return
    
    # Verificar se coluna já existe
    if column_exists('crm_settings', 'watermark_public_id'):
        print("[MIGRATION] Skipping - watermark_public_id already exists")
        return
    
    # Adicionar coluna
    op.add_column(
        'crm_settings',
        sa.Column('watermark_public_id', sa.String(), nullable=True)
    )
    
    print("[MIGRATION] Added watermark_public_id column to crm_settings")


def downgrade() -> None:
    """Remove a coluna watermark_public_id"""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'crm_settings' not in inspector.get_table_names():
        return
    
    if not column_exists('crm_settings', 'watermark_public_id'):
        return
    
    op.drop_column('crm_settings', 'watermark_public_id')
    print("[MIGRATION] Removed watermark_public_id column from crm_settings")
