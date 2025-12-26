"""add works_for_agent_id to users

Revision ID: 20251226_works_for
Revises: 
Create Date: 2025-12-26

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251226_works_for'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar coluna works_for_agent_id à tabela users
    op.add_column('users', sa.Column('works_for_agent_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_users_works_for_agent',
        'users', 'agents',
        ['works_for_agent_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_users_works_for_agent', 'users', type_='foreignkey')
    op.drop_column('users', 'works_for_agent_id')
