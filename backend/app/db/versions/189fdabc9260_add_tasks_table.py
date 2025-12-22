"""add_tasks_table

Revision ID: 189fdabc9260
Revises: ac7ce239a904
Create Date: 2025-12-16 21:06:42.278881

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '189fdabc9260'
down_revision = 'ac7ce239a904'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Criar tabela de tarefas
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, autoincrement=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        
        # Tipo e status
        sa.Column('task_type', sa.Enum('VISIT', 'CALL', 'MEETING', 'FOLLOWUP', 'OTHER', name='tasktype'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE', name='taskstatus'), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'URGENT', name='taskpriority'), nullable=False),
        
        # Datas
        sa.Column('due_date', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('reminder_sent', sa.Boolean(), default=False),
        
        # Foreign Keys
        sa.Column('lead_id', sa.Integer(), sa.ForeignKey('leads.id', ondelete='SET NULL'), nullable=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id', ondelete='SET NULL'), nullable=True),
        sa.Column('assigned_agent_id', sa.Integer(), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    
    # Criar índices para performance
    op.create_index('ix_tasks_id', 'tasks', ['id'])
    op.create_index('ix_tasks_task_type', 'tasks', ['task_type'])
    op.create_index('ix_tasks_status', 'tasks', ['status'])
    op.create_index('ix_tasks_priority', 'tasks', ['priority'])
    op.create_index('ix_tasks_due_date', 'tasks', ['due_date'])
    op.create_index('ix_tasks_lead_id', 'tasks', ['lead_id'])
    op.create_index('ix_tasks_property_id', 'tasks', ['property_id'])
    op.create_index('ix_tasks_assigned_agent_id', 'tasks', ['assigned_agent_id'])


def downgrade() -> None:
    # Remover índices
    op.drop_index('ix_tasks_assigned_agent_id', table_name='tasks')
    op.drop_index('ix_tasks_property_id', table_name='tasks')
    op.drop_index('ix_tasks_lead_id', table_name='tasks')
    op.drop_index('ix_tasks_due_date', table_name='tasks')
    op.drop_index('ix_tasks_priority', table_name='tasks')
    op.drop_index('ix_tasks_status', table_name='tasks')
    op.drop_index('ix_tasks_task_type', table_name='tasks')
    op.drop_index('ix_tasks_id', table_name='tasks')
    
    # Remover tabela
    op.drop_table('tasks')
    
    # Remover enums apenas se for PostgreSQL
    # SQLite não usa tipos ENUM separados
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute('DROP TYPE IF EXISTS tasktype')
        op.execute('DROP TYPE IF EXISTS taskstatus')
        op.execute('DROP TYPE IF EXISTS taskpriority')
