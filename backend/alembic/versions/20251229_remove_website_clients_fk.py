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
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '20251229_remove_fk'
down_revision = 'merge_heads_20251227'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remove FK constraint using raw SQL"""
    conn = op.get_bind()
    
    # Try to drop the FK constraint directly with SQL
    try:
        conn.execute(text("""
            ALTER TABLE website_clients 
            DROP CONSTRAINT IF EXISTS website_clients_assigned_agent_id_fkey
        """))
        print("FK constraint dropped successfully via SQL")
    except Exception as e:
        print(f"Could not drop FK via SQL: {e}")
        
    # Also try with CASCADE
    try:
        conn.execute(text("""
            ALTER TABLE website_clients 
            DROP CONSTRAINT IF EXISTS website_clients_assigned_agent_id_fkey CASCADE
        """))
        print("FK constraint dropped with CASCADE")
    except Exception as e2:
        print(f"Could not drop FK with CASCADE: {e2}")


def downgrade() -> None:
    """We don't want to re-add the incorrect FK"""
    pass
