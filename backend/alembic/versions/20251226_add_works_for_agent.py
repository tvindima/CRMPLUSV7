"""add works_for_agent_id to users

Revision ID: 20251226_works_for
Revises: 20251227_website_clients
Create Date: 2025-12-26

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '20251226_works_for'
down_revision: Union[str, None] = '20251227_website_clients'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Verificar se a coluna já existe antes de adicionar
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'works_for_agent_id' not in columns:
        op.add_column('users', sa.Column('works_for_agent_id', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_users_works_for_agent',
            'users', 'agents',
            ['works_for_agent_id'], ['id'],
            ondelete='SET NULL'
        )
        print("Coluna works_for_agent_id adicionada com sucesso")
    else:
        print("Coluna works_for_agent_id já existe, pulando...")


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'works_for_agent_id' in columns:
        op.drop_constraint('fk_users_works_for_agent', 'users', type_='foreignkey')
        op.drop_column('users', 'works_for_agent_id')
