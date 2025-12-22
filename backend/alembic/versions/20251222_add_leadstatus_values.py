"""add missing leadstatus enum values (lowercase, idempotent)

Revision ID: 20251222_leadstatus
Revises: 53fbb0057a36
Create Date: 2025-12-22 17:00:00

"""
from alembic import op
from sqlalchemy import text

revision = '20251222_leadstatus'
down_revision = '53fbb0057a36'
branch_labels = None
depends_on = None


def upgrade():
    """
    Ensure leadstatus enum has all required lowercase values.
    Idempotent: safe to run multiple times.
    """
    conn = op.get_bind()
    
    # Skip if not PostgreSQL
    if conn.dialect.name != 'postgresql':
        print(f"⚠️ Skipping - database is {conn.dialect.name}")
        return
    
    # 1. Check if enum exists
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'leadstatus'
        )
    """))
    
    if not result.scalar():
        print("⚠️ leadstatus enum doesn't exist - will be created by SQLAlchemy")
        return
    
    # 2. Get current enum values
    result = conn.execute(text("""
        SELECT enumlabel::text 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'leadstatus'
        ORDER BY enumlabel
    """))
    
    current_values = [row[0] for row in result.fetchall()]
    print(f"Current enum values: {current_values}")
    
    # 3. Check if uppercase
    has_uppercase = any(v.isupper() or ('_' in v and v.split('_')[0].isupper()) for v in current_values if v)
    
    required_lowercase = {
        'new', 'contacted', 'qualified', 
        'negotiation', 'visit_scheduled', 'converted', 'lost'
    }
    
    # 4. If uppercase, convert to lowercase
    if has_uppercase:
        print("⚠️ Enum has UPPERCASE values, converting to lowercase...")
        
        conn.execute(text("""
            -- Create new enum with lowercase
            CREATE TYPE leadstatus_new AS ENUM (
                'new', 'contacted', 'qualified',
                'negotiation', 'visit_scheduled', 'converted', 'lost'
            );
            
            -- Migrate data
            ALTER TABLE leads 
            ALTER COLUMN status TYPE leadstatus_new 
            USING LOWER(status::text)::leadstatus_new;
            
            -- Replace enum
            DROP TYPE leadstatus;
            ALTER TYPE leadstatus_new RENAME TO leadstatus;
        """))
        
        print("✅ Enum converted to lowercase")
        return
    
    # 5. If lowercase, add missing values
    current_lowercase = set(v.lower() for v in current_values)
    missing = required_lowercase - current_lowercase
    
    if missing:
        print(f"Adding missing values: {missing}")
        for value in sorted(missing):
            conn.execute(text(f"""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_enum 
                        WHERE enumlabel = '{value}'
                        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'leadstatus')
                    ) THEN
                        ALTER TYPE leadstatus ADD VALUE '{value}';
                        RAISE NOTICE '✅ Added {value}';
                    END IF;
                END $$;
            """))
    else:
        print("✓ All required values already exist")


def downgrade():
    """Cannot safely remove enum values (would corrupt data)"""
    pass
