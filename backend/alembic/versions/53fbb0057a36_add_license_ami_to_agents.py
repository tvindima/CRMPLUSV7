"""add_license_ami_to_agents

Revision ID: 53fbb0057a36
Revises: 8a9b2c3d4e5f
Create Date: 2025-12-22 02:24:42.076015

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '53fbb0057a36'
down_revision = '8a9b2c3d4e5f'
branch_labels = None
depends_on = None


def table_exists(table_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def column_exists(table_name, column_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c['name'] for c in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    if not table_exists('agents'):
        print("[MIGRATION] Skipping - agents table does not exist yet")
        return
    
    if not column_exists('agents', 'license_ami'):
        op.add_column('agents', 
            sa.Column('license_ami', sa.String(length=50), nullable=True)
        )
    print("[MIGRATION] 53fbb0057a36 completed")


def downgrade():
    if table_exists('agents') and column_exists('agents', 'license_ami'):
        op.drop_column('agents', 'license_ami')
