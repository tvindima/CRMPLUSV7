"""create events table for universal calendar

Revision ID: 6ff0c4d3c0a7
Revises: 20251219_agent_social
Create Date: 2025-12-21 21:12:44.923939

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '6ff0c4d3c0a7'
down_revision = '20251219_agent_social'
branch_labels = None
depends_on = None


def table_exists(table_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade():
    # Skip if dependencies don't exist
    if not table_exists('agents'):
        print("[MIGRATION] Skipping - agents table does not exist yet")
        return
    
    # Skip if already exists
    if table_exists('events'):
        print("[MIGRATION] Skipping - events table already exists")
        return
    
    # Criar tabela events
    op.create_table(
        'events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        
        # Dados básicos
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False, server_default='other'),
        
        # Data/hora
        sa.Column('scheduled_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), server_default='60'),
        
        # Localização
        sa.Column('location', sa.String(500), nullable=True),
        sa.Column('latitude', sa.DECIMAL(10, 8), nullable=True),
        sa.Column('longitude', sa.DECIMAL(11, 8), nullable=True),
        
        # Relações opcionais
        sa.Column('property_id', sa.Integer(), nullable=True),
        sa.Column('lead_id', sa.Integer(), nullable=True),
        
        # Notas
        sa.Column('notes', sa.Text(), nullable=True),
        
        # Status
        sa.Column('status', sa.String(50), server_default='scheduled'),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='SET NULL'),
        sa.CheckConstraint(
            "event_type IN ('visit', 'meeting', 'task', 'personal', 'call', 'other')",
            name='check_event_type'
        ),
        sa.CheckConstraint(
            "status IN ('scheduled', 'completed', 'cancelled', 'no_show')",
            name='check_status'
        )
    )
    
    # Índices
    op.create_index('ix_events_agent_date', 'events', ['agent_id', 'scheduled_date'])
    op.create_index('ix_events_type', 'events', ['event_type'])
    op.create_index('ix_events_status', 'events', ['status'])
    op.create_index('ix_events_property', 'events', ['property_id'])
    print("[MIGRATION] 6ff0c4d3c0a7 events table created")


def downgrade():
    if not table_exists('events'):
        return
    
    op.drop_index('ix_events_property', 'events')
    op.drop_index('ix_events_status', 'events')
    op.drop_index('ix_events_type', 'events')
    op.drop_index('ix_events_agent_date', 'events')
    op.drop_table('events')

