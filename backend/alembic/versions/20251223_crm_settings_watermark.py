"""Add CRM Settings table for watermark configuration

Revision ID: 20251223_crm_settings_watermark
Revises: 
Create Date: 2024-12-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '20251223_crm_settings_watermark'
down_revision = None
branch_labels = None
depends_on = None


def table_exists(table_name):
    """Verifica se uma tabela já existe"""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    """
    Criar tabela crm_settings para configurações globais da agência.
    Inclui watermark, branding e limites de upload.
    """
    # Verificar se tabela já existe (idempotente)
    if table_exists('crm_settings'):
        print("[MIGRATION] Skipping - crm_settings already exists")
        return
    
    op.create_table(
        'crm_settings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        
        # Watermark
        sa.Column('watermark_enabled', sa.Integer(), default=1, nullable=False),
        sa.Column('watermark_image_url', sa.String(), nullable=True),
        sa.Column('watermark_opacity', sa.Float(), default=0.6, nullable=False),
        sa.Column('watermark_scale', sa.Float(), default=0.15, nullable=False),
        sa.Column('watermark_position', sa.String(), default='bottom-right', nullable=False),
        
        # Branding
        sa.Column('agency_name', sa.String(), default='CRM Plus', nullable=False),
        sa.Column('agency_logo_url', sa.String(), nullable=True),
        sa.Column('primary_color', sa.String(), default='#E10600', nullable=False),
        
        # Limites upload
        sa.Column('max_photos_per_property', sa.Integer(), default=30, nullable=False),
        sa.Column('max_video_size_mb', sa.Integer(), default=100, nullable=False),
        sa.Column('max_image_size_mb', sa.Integer(), default=20, nullable=False),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Inserir registo inicial com valores default
    op.execute("""
        INSERT INTO crm_settings (
            watermark_enabled,
            watermark_opacity,
            watermark_scale,
            watermark_position,
            agency_name,
            primary_color,
            max_photos_per_property,
            max_video_size_mb,
            max_image_size_mb
        ) VALUES (
            1,
            0.6,
            0.15,
            'bottom-right',
            'CRM Plus',
            '#E10600',
            30,
            100,
            20
        )
    """)


def downgrade() -> None:
    op.drop_table('crm_settings')
