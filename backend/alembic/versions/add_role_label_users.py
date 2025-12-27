"""add role_label to users

Revision ID: add_role_label_users
Revises: 
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_role_label_users'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Verificar se a coluna já existe antes de adicionar
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'role_label' not in columns:
        op.add_column('users', sa.Column('role_label', sa.String(), nullable=True))
        print("Coluna role_label adicionada com sucesso")
    else:
        print("Coluna role_label já existe, pulando...")


def downgrade() -> None:
    # Verificar se a coluna existe antes de remover
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'role_label' in columns:
        op.drop_column('users', 'role_label')
