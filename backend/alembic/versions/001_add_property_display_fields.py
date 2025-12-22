"""add property display fields

Revision ID: 001_add_property_display_fields
Revises: 
Create Date: 2025-12-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '001_add_property_display_fields'
down_revision = None
branch_labels = None
depends_on = None


def table_exists(table_name):
    """Check if table exists in database"""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def column_exists(table_name, column_name):
    """Check if column exists in table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c['name'] for c in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Skip if properties table doesn't exist (will be created by SQLAlchemy models)
    if not table_exists('properties'):
        print("[MIGRATION] Skipping - properties table does not exist yet")
        return
    
    # Add new columns to properties table (only if they don't exist)
    if not column_exists('properties', 'is_published'):
        op.add_column('properties', sa.Column('is_published', sa.Integer(), nullable=True, server_default='1'))
    if not column_exists('properties', 'is_featured'):
        op.add_column('properties', sa.Column('is_featured', sa.Integer(), nullable=True, server_default='0'))
    if not column_exists('properties', 'latitude'):
        op.add_column('properties', sa.Column('latitude', sa.Float(), nullable=True))
    if not column_exists('properties', 'longitude'):
        op.add_column('properties', sa.Column('longitude', sa.Float(), nullable=True))
    if not column_exists('properties', 'bedrooms'):
        op.add_column('properties', sa.Column('bedrooms', sa.Integer(), nullable=True))
    if not column_exists('properties', 'bathrooms'):
        op.add_column('properties', sa.Column('bathrooms', sa.Integer(), nullable=True))
    if not column_exists('properties', 'parking_spaces'):
        op.add_column('properties', sa.Column('parking_spaces', sa.Integer(), nullable=True))
    
    print("[MIGRATION] 001_add_property_display_fields completed")


def downgrade() -> None:
    if not table_exists('properties'):
        return
    
    # Remove added columns (only if they exist)
    if column_exists('properties', 'parking_spaces'):
        op.drop_column('properties', 'parking_spaces')
    if column_exists('properties', 'bathrooms'):
        op.drop_column('properties', 'bathrooms')
    if column_exists('properties', 'bedrooms'):
        op.drop_column('properties', 'bedrooms')
    if column_exists('properties', 'longitude'):
        op.drop_column('properties', 'longitude')
    if column_exists('properties', 'latitude'):
        op.drop_column('properties', 'latitude')
    if column_exists('properties', 'is_featured'):
        op.drop_column('properties', 'is_featured')
    if column_exists('properties', 'is_published'):
        op.drop_column('properties', 'is_published')
