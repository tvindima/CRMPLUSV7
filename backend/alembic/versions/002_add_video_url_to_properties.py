"""add video_url to properties

Revision ID: 002_add_video_url_to_properties
Revises: 001_add_property_display_fields
Create Date: 2025-12-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '002_add_video_url_to_properties'
down_revision = '001_add_property_display_fields'
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


def upgrade() -> None:
    if not table_exists('properties'):
        print("[MIGRATION] Skipping - properties table does not exist yet")
        return
    
    if not column_exists('properties', 'video_url'):
        op.add_column('properties', sa.Column('video_url', sa.String(length=500), nullable=True))
    print("[MIGRATION] 002_add_video_url_to_properties completed")


def downgrade() -> None:
    if table_exists('properties') and column_exists('properties', 'video_url'):
        op.drop_column('properties', 'video_url')
