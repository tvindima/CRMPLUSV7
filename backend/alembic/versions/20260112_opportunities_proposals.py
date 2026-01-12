"""Add opportunities and proposals tables

Revision ID: 20260112_opportunities_proposals
Revises: 
Create Date: 2026-01-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260112_opportunities_proposals'
down_revision = None  # Will be set by alembic
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create opportunities and proposals tables for CRM pipeline management."""
    
    # Create opportunities table
    op.create_table(
        'opportunities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('titulo', sa.String(length=255), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('property_id', sa.Integer(), nullable=True),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='novo'),
        sa.Column('valor_estimado', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('probabilidade', sa.Integer(), nullable=True),
        sa.Column('data_prevista_fecho', sa.DateTime(), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on status for pipeline filtering
    op.create_index('ix_opportunities_status', 'opportunities', ['status'], unique=False)
    op.create_index('ix_opportunities_agent_id', 'opportunities', ['agent_id'], unique=False)
    
    # Create proposals table
    op.create_table(
        'proposals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('opportunity_id', sa.Integer(), nullable=False),
        sa.Column('valor_proposta', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('tipo_proposta', sa.String(length=50), nullable=False, server_default='compra'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pendente'),
        sa.Column('condicoes', sa.Text(), nullable=True),
        sa.Column('data_validade', sa.DateTime(), nullable=True),
        sa.Column('parent_proposal_id', sa.Integer(), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_proposal_id'], ['proposals.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for proposals
    op.create_index('ix_proposals_status', 'proposals', ['status'], unique=False)
    op.create_index('ix_proposals_opportunity_id', 'proposals', ['opportunity_id'], unique=False)


def downgrade() -> None:
    """Drop opportunities and proposals tables."""
    op.drop_index('ix_proposals_opportunity_id', table_name='proposals')
    op.drop_index('ix_proposals_status', table_name='proposals')
    op.drop_table('proposals')
    
    op.drop_index('ix_opportunities_agent_id', table_name='opportunities')
    op.drop_index('ix_opportunities_status', table_name='opportunities')
    op.drop_table('opportunities')
