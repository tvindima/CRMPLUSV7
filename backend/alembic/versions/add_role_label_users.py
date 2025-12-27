"""add role_label to users

Revision ID: add_role_label_users
Revises: 
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_role_label_users'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Adicionar coluna role_label à tabela users (se não existir)
    try:
        op.add_column('users', sa.Column('role_label', sa.String(), nullable=True))
    except Exception as e:
        print(f"Coluna role_label pode já existir: {e}")


def downgrade() -> None:
    op.drop_column('users', 'role_label')
