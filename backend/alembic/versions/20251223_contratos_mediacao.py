"""add contratos_mediacao table (CMI)

Revision ID: 20251223_contratos_mediacao
Create Date: 2025-12-23

Tabela para Contratos de Mediação Imobiliária (CMI)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


revision = '20251223_contratos_mediacao'
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
    """Criar tabela contratos_mediacao"""
    if table_exists('contratos_mediacao'):
        print("[MIGRATION] Skipping - contratos_mediacao already exists")
        return
    
    print("[MIGRATION] Creating contratos_mediacao table...")
    
    op.create_table(
        'contratos_mediacao',
        
        # IDs
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('agent_id', sa.Integer(), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('first_impression_id', sa.Integer(), sa.ForeignKey('first_impressions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('pre_angariacao_id', sa.Integer(), sa.ForeignKey('pre_angariacoes.id', ondelete='SET NULL'), nullable=True),
        
        # Número contrato
        sa.Column('numero_contrato', sa.String(50), nullable=False, unique=True),
        
        # MEDIADOR
        sa.Column('mediador_nome', sa.String(255), nullable=False),
        sa.Column('mediador_licenca_ami', sa.String(50), nullable=False),
        sa.Column('mediador_nif', sa.String(20), nullable=False),
        sa.Column('mediador_morada', sa.Text(), nullable=True),
        sa.Column('mediador_codigo_postal', sa.String(20), nullable=True),
        sa.Column('mediador_telefone', sa.String(50), nullable=True),
        sa.Column('mediador_email', sa.String(255), nullable=True),
        sa.Column('agente_nome', sa.String(255), nullable=True),
        sa.Column('agente_carteira_profissional', sa.String(100), nullable=True),
        
        # CLIENTE
        sa.Column('cliente_nome', sa.String(255), nullable=False),
        sa.Column('cliente_estado_civil', sa.String(50), nullable=True),
        sa.Column('cliente_nif', sa.String(20), nullable=True),
        sa.Column('cliente_cc', sa.String(30), nullable=True),
        sa.Column('cliente_cc_validade', sa.Date(), nullable=True),
        sa.Column('cliente_morada', sa.Text(), nullable=True),
        sa.Column('cliente_codigo_postal', sa.String(20), nullable=True),
        sa.Column('cliente_localidade', sa.String(255), nullable=True),
        sa.Column('cliente_telefone', sa.String(50), nullable=True),
        sa.Column('cliente_email', sa.String(255), nullable=True),
        sa.Column('cliente2_nome', sa.String(255), nullable=True),
        sa.Column('cliente2_nif', sa.String(20), nullable=True),
        sa.Column('cliente2_cc', sa.String(30), nullable=True),
        
        # IMÓVEL
        sa.Column('imovel_tipo', sa.String(100), nullable=True),
        sa.Column('imovel_tipologia', sa.String(50), nullable=True),
        sa.Column('imovel_morada', sa.Text(), nullable=True),
        sa.Column('imovel_codigo_postal', sa.String(20), nullable=True),
        sa.Column('imovel_localidade', sa.String(255), nullable=True),
        sa.Column('imovel_freguesia', sa.String(255), nullable=True),
        sa.Column('imovel_concelho', sa.String(255), nullable=True),
        sa.Column('imovel_distrito', sa.String(255), nullable=True),
        sa.Column('imovel_artigo_matricial', sa.String(100), nullable=True),
        sa.Column('imovel_fraccao', sa.String(20), nullable=True),
        sa.Column('imovel_conservatoria', sa.String(255), nullable=True),
        sa.Column('imovel_numero_descricao', sa.String(100), nullable=True),
        sa.Column('imovel_area_bruta', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('imovel_area_util', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('imovel_area_terreno', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('imovel_ano_construcao', sa.Integer(), nullable=True),
        sa.Column('imovel_estado_conservacao', sa.String(100), nullable=True),
        sa.Column('imovel_certificado_energetico', sa.String(10), nullable=True),
        
        # CONDIÇÕES
        sa.Column('tipo_contrato', sa.String(50), nullable=False, server_default='exclusivo'),
        sa.Column('tipo_negocio', sa.String(50), nullable=False, server_default='venda'),
        sa.Column('valor_pretendido', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('valor_minimo', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('comissao_percentagem', sa.DECIMAL(5, 2), nullable=True),
        sa.Column('comissao_valor_fixo', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('comissao_iva_incluido', sa.Boolean(), server_default='false'),
        sa.Column('comissao_observacoes', sa.Text(), nullable=True),
        sa.Column('data_inicio', sa.Date(), nullable=True),
        sa.Column('data_fim', sa.Date(), nullable=True),
        sa.Column('prazo_meses', sa.Integer(), server_default='6'),
        sa.Column('renovacao_automatica', sa.Boolean(), server_default='true'),
        
        # DOCUMENTOS
        sa.Column('documentos_entregues', JSON, nullable=True, server_default='[]'),
        sa.Column('documentos_fotos', JSON, nullable=True, server_default='[]'),
        
        # ASSINATURAS
        sa.Column('assinatura_cliente', sa.Text(), nullable=True),
        sa.Column('assinatura_cliente_data', sa.DateTime(timezone=True), nullable=True),
        sa.Column('assinatura_cliente2', sa.Text(), nullable=True),
        sa.Column('assinatura_cliente2_data', sa.DateTime(timezone=True), nullable=True),
        sa.Column('assinatura_mediador', sa.Text(), nullable=True),
        sa.Column('assinatura_mediador_data', sa.DateTime(timezone=True), nullable=True),
        sa.Column('local_assinatura', sa.String(255), nullable=True),
        
        # CLÁUSULAS
        sa.Column('clausulas_especiais', sa.Text(), nullable=True),
        
        # PDF
        sa.Column('pdf_url', sa.String(500), nullable=True),
        sa.Column('pdf_generated_at', sa.DateTime(timezone=True), nullable=True),
        
        # STATUS & META
        sa.Column('status', sa.String(50), nullable=False, server_default='rascunho'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Índices
    op.create_index('idx_contratos_mediacao_agent_id', 'contratos_mediacao', ['agent_id'])
    op.create_index('idx_contratos_mediacao_numero', 'contratos_mediacao', ['numero_contrato'])
    op.create_index('idx_contratos_mediacao_status', 'contratos_mediacao', ['status'])
    op.create_index('idx_contratos_mediacao_created', 'contratos_mediacao', ['created_at'])
    
    print("[MIGRATION] contratos_mediacao table created successfully!")


def downgrade():
    """Remove tabela"""
    if table_exists('contratos_mediacao'):
        op.drop_index('idx_contratos_mediacao_created', 'contratos_mediacao')
        op.drop_index('idx_contratos_mediacao_status', 'contratos_mediacao')
        op.drop_index('idx_contratos_mediacao_numero', 'contratos_mediacao')
        op.drop_index('idx_contratos_mediacao_agent_id', 'contratos_mediacao')
        op.drop_table('contratos_mediacao')
        print("[MIGRATION] contratos_mediacao table dropped")
