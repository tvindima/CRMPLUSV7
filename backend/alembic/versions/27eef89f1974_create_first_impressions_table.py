"""create first_impressions table

Revision ID: 27eef89f1974
Revises: 6ff0c4d3c0a7
Create Date: 2025-12-21 22:54:53.886638

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '27eef89f1974'
down_revision = '6ff0c4d3c0a7'
branch_labels = None
depends_on = None


def table_exists(table_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade():
    """Criar tabela first_impressions"""
    
    # Skip if dependencies don't exist
    if not table_exists('agents'):
        print("[MIGRATION] Skipping - agents table does not exist yet")
        return
    
    # Skip if already exists
    if table_exists('first_impressions'):
        print("[MIGRATION] Skipping - first_impressions already exists")
        return
    
    op.create_table(
        'first_impressions',
        
        # === IDs & Relationships ===
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=True),
        sa.Column('lead_id', sa.Integer(), nullable=True),
        
        # === Dados CMI (Caderneta Predial) ===
        sa.Column('artigo_matricial', sa.String(50), nullable=True),
        sa.Column('freguesia', sa.String(255), nullable=True),
        sa.Column('concelho', sa.String(255), nullable=True),
        sa.Column('distrito', sa.String(255), nullable=True),
        sa.Column('area_bruta', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('area_util', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('tipologia', sa.String(50), nullable=True),  # Ex: T3, T2
        sa.Column('ano_construcao', sa.Integer(), nullable=True),
        sa.Column('valor_patrimonial', sa.DECIMAL(15, 2), nullable=True),
        
        # === Dados do Cliente ===
        sa.Column('client_name', sa.String(255), nullable=False),
        sa.Column('client_nif', sa.String(20), nullable=True),
        sa.Column('client_phone', sa.String(50), nullable=False),
        sa.Column('client_email', sa.String(255), nullable=True),
        
        # === Observações ===
        sa.Column('observations', sa.Text(), nullable=True),
        
        # === Assinatura Digital ===
        sa.Column('signature_image', sa.Text(), nullable=True),  # base64 PNG
        sa.Column('signature_date', sa.DateTime(timezone=True), nullable=True),
        
        # === PDF Gerado ===
        sa.Column('pdf_url', sa.String(500), nullable=True),
        sa.Column('pdf_generated_at', sa.DateTime(timezone=True), nullable=True),
        
        # === Status & Metadata ===
        sa.Column('status', sa.String(50), server_default='draft', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        # === Constraints ===
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='SET NULL'),
        
        # Status válidos: draft, signed, completed, cancelled
        sa.CheckConstraint(
            "status IN ('draft', 'signed', 'completed', 'cancelled')",
            name='check_first_impressions_status'
        ),
    )
    
    # === Índices para Performance ===
    op.create_index('ix_first_impressions_agent_id', 'first_impressions', ['agent_id'])
    op.create_index('ix_first_impressions_property_id', 'first_impressions', ['property_id'])
    op.create_index('ix_first_impressions_lead_id', 'first_impressions', ['lead_id'])
    op.create_index('ix_first_impressions_status', 'first_impressions', ['status'])
    op.create_index('ix_first_impressions_created_at', 'first_impressions', ['created_at'])
    op.create_index('ix_first_impressions_client_nif', 'first_impressions', ['client_nif'])
    
    print("[MIGRATION] 27eef89f1974 first_impressions created")


def downgrade():
    """Remover tabela first_impressions"""
    
    if not table_exists('first_impressions'):
        return
    
    op.drop_index('ix_first_impressions_client_nif', 'first_impressions')
    op.drop_index('ix_first_impressions_created_at', 'first_impressions')
    op.drop_index('ix_first_impressions_status', 'first_impressions')
    op.drop_index('ix_first_impressions_lead_id', 'first_impressions')
    op.drop_index('ix_first_impressions_property_id', 'first_impressions')
    op.drop_index('ix_first_impressions_agent_id', 'first_impressions')
    op.drop_table('first_impressions')
