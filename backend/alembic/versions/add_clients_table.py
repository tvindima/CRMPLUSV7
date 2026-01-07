"""add clients table

Revision ID: add_clients_table
Revises: 
Create Date: 2026-01-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_clients_table'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('agent_id', sa.Integer(), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('agency_id', sa.Integer(), nullable=True, index=True),
        
        # Relações
        sa.Column('angariacao_id', sa.Integer(), sa.ForeignKey('pre_angariacoes.id', ondelete='SET NULL'), nullable=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True),
        sa.Column('lead_id', sa.Integer(), sa.ForeignKey('leads.id', ondelete='SET NULL'), nullable=True),
        
        # Classificação
        sa.Column('client_type', sa.String(50), default='lead', index=True),
        sa.Column('origin', sa.String(50), default='manual'),
        
        # Dados pessoais
        sa.Column('nome', sa.String(255), nullable=False, index=True),
        sa.Column('nif', sa.String(20), nullable=True, index=True),
        sa.Column('cc', sa.String(30), nullable=True),
        sa.Column('cc_validade', sa.Date(), nullable=True),
        sa.Column('data_nascimento', sa.Date(), nullable=True),
        sa.Column('nacionalidade', sa.String(100), nullable=True),
        sa.Column('estado_civil', sa.String(50), nullable=True),
        sa.Column('profissao', sa.String(255), nullable=True),
        
        # Contactos
        sa.Column('email', sa.String(255), nullable=True, index=True),
        sa.Column('telefone', sa.String(50), nullable=True, index=True),
        sa.Column('telefone_alt', sa.String(50), nullable=True),
        
        # Morada
        sa.Column('morada', sa.String(500), nullable=True),
        sa.Column('codigo_postal', sa.String(20), nullable=True),
        sa.Column('localidade', sa.String(255), nullable=True),
        sa.Column('distrito', sa.String(100), nullable=True),
        
        # CRM / Notas
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), default=[]),
        
        # Tracking
        sa.Column('ultima_interacao', sa.DateTime(timezone=True), nullable=True),
        sa.Column('proxima_acao', sa.String(500), nullable=True),
        sa.Column('proxima_acao_data', sa.DateTime(timezone=True), nullable=True),
        
        # Meta
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Índices adicionais para pesquisa
    op.create_index('ix_clients_agent_type', 'clients', ['agent_id', 'client_type'])
    op.create_index('ix_clients_agency_type', 'clients', ['agency_id', 'client_type'])


def downgrade():
    op.drop_index('ix_clients_agency_type', 'clients')
    op.drop_index('ix_clients_agent_type', 'clients')
    op.drop_table('clients')
