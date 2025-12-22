"""
Revision ID: 20251214_draft_ingestion
Revises: 
Create Date: 2025-12-14
"""

# Alembic identifiers
revision = '20251214_draft_ingestion'
down_revision = None
branch_labels = None
depends_on = None
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'draft_properties',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('session_id', sa.String, index=True, nullable=False),
        sa.Column('status', sa.String, default='pending'),
        sa.Column('data', sa.JSON, default={}),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
    )
    op.create_table(
        'ingestion_files',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('draft_property_id', sa.Integer, sa.ForeignKey('draft_properties.id'), nullable=False),
        sa.Column('filename', sa.String, nullable=False),
        sa.Column('filetype', sa.String, nullable=False),
        sa.Column('url', sa.String, nullable=True),
        sa.Column('status', sa.String, default='uploaded'),
        sa.Column('meta', sa.JSON, default={}),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
    )

def downgrade():
    op.drop_table('ingestion_files')
    op.drop_table('draft_properties')
