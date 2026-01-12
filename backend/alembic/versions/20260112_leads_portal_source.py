"""Add portal_name to leads and PORTAL source type

Revision ID: 20260112_leads_portal_source
Revises: 
Create Date: 2026-01-12

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260112_leads_portal_source'
down_revision = None  # Will be set by alembic
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add portal_name column for external portal leads (Idealista, Imovirtual, etc.)."""
    
    # Add portal_name column to leads table
    op.add_column(
        'leads',
        sa.Column('portal_name', sa.String(length=100), nullable=True)
    )
    
    # Create index for filtering by portal
    op.create_index('ix_leads_portal_name', 'leads', ['portal_name'], unique=False)
    
    # Create index for filtering by source (if not exists)
    # This helps with filtering leads by origin channel
    try:
        op.create_index('ix_leads_source', 'leads', ['source'], unique=False)
    except Exception:
        pass  # Index may already exist


def downgrade() -> None:
    """Remove portal_name column."""
    op.drop_index('ix_leads_portal_name', table_name='leads')
    op.drop_column('leads', 'portal_name')
