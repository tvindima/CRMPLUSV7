"""Add message column to leads table

Revision ID: 20251227_message_leads
Revises: add_role_label_users
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '20251227_message_leads'
down_revision = 'add_role_label_users'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Verificar se a coluna já existe antes de adicionar
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('leads')]
    
    if 'message' not in columns:
        op.add_column('leads', sa.Column('message', sa.Text(), nullable=True))
        print("Coluna message adicionada com sucesso")
    else:
        print("Coluna message já existe, pulando...")


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('leads')]
    
    if 'message' in columns:
        op.drop_column('leads', 'message')
