"""Remove foreign key constraint from website_clients.assigned_agent_id

This FK was incorrectly added pointing to users table.
The assigned_agent_id should reference agents table (not users).
Since agents and users have different IDs, we remove the FK.

Revision ID: 20251229_remove_fk
Revises: merge_heads_20251227
Create Date: 2025-12-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '20251229_remove_fk'
down_revision = 'merge_heads_20251227'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remove FK constraint if it exists"""
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Check if table exists
    tables = inspector.get_table_names()
    if 'website_clients' not in tables:
        print("Table website_clients doesn't exist, skipping...")
        return
    
    # Get foreign keys
    fks = inspector.get_foreign_keys('website_clients')
    
    for fk in fks:
        if 'assigned_agent_id' in fk.get('constrained_columns', []):
            fk_name = fk.get('name')
            if fk_name:
                print(f"Removing FK constraint: {fk_name}")
                op.drop_constraint(fk_name, 'website_clients', type_='foreignkey')
                print(f"FK constraint {fk_name} removed successfully")
            else:
                # Try with standard naming
                try:
                    op.drop_constraint('website_clients_assigned_agent_id_fkey', 'website_clients', type_='foreignkey')
                    print("FK constraint removed with standard name")
                except Exception as e:
                    print(f"Could not remove FK: {e}")


def downgrade() -> None:
    """We don't want to re-add the incorrect FK"""
    pass
