"""add pre_angariacoes table

Revision ID: 20251223_pre_angariacoes
Revises: 
Create Date: 2025-12-23

Tabela para Pré-Angariação - Dossier completo do processo de angariação
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers
revision = '20251223_pre_angariacoes'
down_revision = None
branch_labels = None
depends_on = None


def table_exists(table_name):
    """Verificar se tabela existe"""
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :name)"
    ), {"name": table_name})
    return result.scalar()


def upgrade():
    """
    Criar tabela pre_angariacoes para gerir processo de angariação
    """
    if table_exists('pre_angariacoes'):
        print("[MIGRATION] Skipping - pre_angariacoes already exists")
        return
    
    print("[MIGRATION] Creating pre_angariacoes table...")
    
    op.create_table(
        'pre_angariacoes',
        
        # IDs & Keys
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('agent_id', sa.Integer(), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('first_impression_id', sa.Integer(), sa.ForeignKey('first_impressions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True),
        
        # Referência interna
        sa.Column('referencia_interna', sa.String(50), nullable=True, unique=True),
        
        # Dados do Proprietário
        sa.Column('proprietario_nome', sa.String(255), nullable=False),
        sa.Column('proprietario_nif', sa.String(20), nullable=True),
        sa.Column('proprietario_telefone', sa.String(50), nullable=True),
        sa.Column('proprietario_email', sa.String(255), nullable=True),
        
        # Dados do Imóvel - Localização
        sa.Column('morada', sa.String(500), nullable=True),
        sa.Column('codigo_postal', sa.String(20), nullable=True),
        sa.Column('freguesia', sa.String(255), nullable=True),
        sa.Column('concelho', sa.String(255), nullable=True),
        sa.Column('distrito', sa.String(255), nullable=True),
        sa.Column('latitude', sa.DECIMAL(10, 7), nullable=True),
        sa.Column('longitude', sa.DECIMAL(10, 7), nullable=True),
        
        # Características
        sa.Column('tipologia', sa.String(50), nullable=True),
        sa.Column('area_bruta', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('area_util', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('ano_construcao', sa.Integer(), nullable=True),
        sa.Column('estado_conservacao', sa.String(100), nullable=True),
        
        # Valores
        sa.Column('valor_pretendido', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('valor_avaliacao', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('valor_final', sa.DECIMAL(15, 2), nullable=True),
        
        # JSON Fields
        sa.Column('documentos', JSON, nullable=True, server_default='[]'),
        sa.Column('fotos', JSON, nullable=True, server_default='[]'),
        sa.Column('checklist', JSON, nullable=True, server_default='[]'),
        
        # Notas
        sa.Column('notas', sa.Text(), nullable=True),
        
        # Status & Progresso
        sa.Column('status', sa.String(50), nullable=False, server_default='inicial'),
        sa.Column('progresso', sa.Integer(), nullable=False, server_default='0'),
        
        # Datas Importantes
        sa.Column('data_primeira_visita', sa.DateTime(timezone=True), nullable=True),
        sa.Column('data_contrato', sa.DateTime(timezone=True), nullable=True),
        sa.Column('data_activacao', sa.DateTime(timezone=True), nullable=True),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # Índices
    op.create_index('idx_pre_angariacoes_agent_id', 'pre_angariacoes', ['agent_id'])
    op.create_index('idx_pre_angariacoes_status', 'pre_angariacoes', ['status'])
    op.create_index('idx_pre_angariacoes_created_at', 'pre_angariacoes', ['created_at'])
    op.create_index('idx_pre_angariacoes_referencia', 'pre_angariacoes', ['referencia_interna'])
    
    print("[MIGRATION] pre_angariacoes table created successfully!")


def downgrade():
    """Remove tabela pre_angariacoes"""
    if table_exists('pre_angariacoes'):
        op.drop_index('idx_pre_angariacoes_referencia', 'pre_angariacoes')
        op.drop_index('idx_pre_angariacoes_created_at', 'pre_angariacoes')
        op.drop_index('idx_pre_angariacoes_status', 'pre_angariacoes')
        op.drop_index('idx_pre_angariacoes_agent_id', 'pre_angariacoes')
        op.drop_table('pre_angariacoes')
        print("[MIGRATION] pre_angariacoes table dropped")
