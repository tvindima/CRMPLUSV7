"""add lead website integration fields

Revision ID: ac7ce239a904
Revises: 20251214_draft_ingestion
Create Date: 2025-01-20

"""

# Alembic identifiers
revision = 'ac7ce239a904'
down_revision = '20251214_draft_ingestion'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from datetime import datetime


def upgrade():
    # Criar tabela leads completa com foreign keys inline
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('origin', sa.String(length=255), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id'), nullable=True),
        sa.Column('action_type', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, default='NEW'),
        sa.Column('assigned_agent_id', sa.Integer(), sa.ForeignKey('agents.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
    )
    
    # Criar índices para melhor performance
    op.create_index('ix_leads_property_id', 'leads', ['property_id'])
    op.create_index('ix_leads_source', 'leads', ['source'])
    op.create_index('ix_leads_status', 'leads', ['status'])
    op.create_index('ix_leads_assigned_agent_id', 'leads', ['assigned_agent_id'])
    op.create_index('ix_leads_email', 'leads', ['email'])


def downgrade():
    # Remover tabela leads
    op.drop_table('leads')
