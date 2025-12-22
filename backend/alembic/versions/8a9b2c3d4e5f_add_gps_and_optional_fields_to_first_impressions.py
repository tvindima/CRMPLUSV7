"""add_gps_and_optional_fields_to_first_impressions

Revision ID: 8a9b2c3d4e5f
Revises: 27eef89f1974
Create Date: 2025-12-22 01:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '8a9b2c3d4e5f'
down_revision = '27eef89f1974'
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
    # Skip if table doesn't exist
    if not table_exists('first_impressions'):
        print("[MIGRATION] Skipping - first_impressions table does not exist yet")
        return
    
    # Adicionar novos campos (only if they don't exist)
    if not column_exists('first_impressions', 'referred_by'):
        op.add_column('first_impressions', 
            sa.Column('referred_by', sa.String(length=255), nullable=True))
    
    if not column_exists('first_impressions', 'latitude'):
        op.add_column('first_impressions', 
            sa.Column('latitude', sa.DECIMAL(precision=10, scale=7), nullable=True))
    
    if not column_exists('first_impressions', 'longitude'):
        op.add_column('first_impressions', 
            sa.Column('longitude', sa.DECIMAL(precision=10, scale=7), nullable=True))
    
    if not column_exists('first_impressions', 'location'):
        op.add_column('first_impressions', 
            sa.Column('location', sa.String(length=500), nullable=True))
    
    if not column_exists('first_impressions', 'estado_conservacao'):
        op.add_column('first_impressions', 
            sa.Column('estado_conservacao', sa.String(length=100), nullable=True))
    
    if not column_exists('first_impressions', 'valor_estimado'):
        op.add_column('first_impressions', 
            sa.Column('valor_estimado', sa.DECIMAL(precision=15, scale=2), nullable=True))
    
    if not column_exists('first_impressions', 'photos'):
        op.add_column('first_impressions', 
            sa.Column('photos', sa.Text(), nullable=True))  # JSON as text for SQLite compatibility
    
    if not column_exists('first_impressions', 'attachments'):
        op.add_column('first_impressions', 
            sa.Column('attachments', sa.Text(), nullable=True))  # JSON as text for SQLite compatibility
    
    print("[MIGRATION] 8a9b2c3d4e5f completed")


def downgrade() -> None:
    if not table_exists('first_impressions'):
        return
    
    for col in ['attachments', 'photos', 'valor_estimado', 'estado_conservacao', 
                'location', 'longitude', 'latitude', 'referred_by']:
        if column_exists('first_impressions', col):
            op.drop_column('first_impressions', col)
