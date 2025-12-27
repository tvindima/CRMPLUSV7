"""merge all heads december 2025

Revision ID: merge_heads_20251227
Revises: 20251226_works_for, 20251227_website_clients, 32443c837910, add_role_label_users
Create Date: 2025-12-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'merge_heads_20251227'
down_revision: Union[str, Sequence[str], None] = ('20251226_works_for', '20251227_website_clients', '32443c837910', 'add_role_label_users')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge migration - no changes needed"""
    pass


def downgrade() -> None:
    """Merge migration - no changes needed"""
    pass
