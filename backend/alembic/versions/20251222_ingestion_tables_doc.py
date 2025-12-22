"""create ingestion tables for draft properties and files

Revision ID: 20251222_ingestion
Revises: 20251222_leadstatus
Create Date: 2025-12-22 17:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

revision = '20251222_ingestion'
down_revision = '20251222_leadstatus'
branch_labels = None
depends_on = None


def upgrade():
    """
    Create draft_properties and ingestion_files tables.
    If they already exist, this is idempotent.
    """
    conn = op.get_bind()
    
    # Check if tables exist
    result = conn.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' 
          AND table_name IN ('draft_properties', 'ingestion_files')
        ORDER BY table_name
    """))
    
    existing = [row[0] for row in result.fetchall()]
    
    if 'draft_properties' in existing and 'ingestion_files' in existing:
        print("✓ Ingestion tables already exist - skipping creation")
        return
    
    # Create draft_properties table
    if 'draft_properties' not in existing:
        op.create_table(
            'draft_properties',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('session_id', sa.String(), nullable=False),
            sa.Column('status', sa.String(), nullable=True),
            sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_draft_properties_id', 'draft_properties', ['id'])
        op.create_index('ix_draft_properties_session_id', 'draft_properties', ['session_id'])
        print("✓ Created draft_properties table")
    
    # Create ingestion_files table
    if 'ingestion_files' not in existing:
        op.create_table(
            'ingestion_files',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('draft_property_id', sa.Integer(), nullable=False),
            sa.Column('filename', sa.String(), nullable=False),
            sa.Column('filetype', sa.String(), nullable=False),
            sa.Column('url', sa.String(), nullable=True),
            sa.Column('status', sa.String(), nullable=True),
            sa.Column('meta', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['draft_property_id'], ['draft_properties.id']),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_ingestion_files_id', 'ingestion_files', ['id'])
        print("✓ Created ingestion_files table with FK to draft_properties")


def downgrade():
    """Drop ingestion tables"""
    op.drop_table('ingestion_files')
    op.drop_table('draft_properties')
