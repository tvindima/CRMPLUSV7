"""Add multi-tenant fields to tenants table

Revision ID: 20260110_tenant_mt
Revises: 6a57cdd71c97
Create Date: 2026-01-10

Novos campos para suportar:
- Sector de atividade (imobiliário, automóvel, serviços, etc.)
- Gestão de admin do tenant
- Onboarding tracking
- Custom domains
- Stripe billing
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20260110_tenant_mt'
down_revision = '6a57cdd71c97'
branch_labels = None
depends_on = None


def upgrade():
    # Verificar se tabela tenants existe
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'tenants'
        )
    """)).scalar()
    
    if not result:
        print("[MIGRATION] Tabela tenants não existe, skipping...")
        return
    
    # Adicionar novos campos com IF NOT EXISTS
    columns_to_add = [
        ("secondary_color", "VARCHAR(20)", None),
        ("sector", "VARCHAR(50)", "'real_estate'"),
        ("admin_email", "VARCHAR(200)", None),
        ("admin_created", "BOOLEAN", "false"),
        ("onboarding_completed", "BOOLEAN", "false"),
        ("onboarding_step", "INTEGER", "0"),
        ("custom_domain_verified", "BOOLEAN", "false"),
        ("domain_verification_token", "VARCHAR(100)", None),
        ("stripe_customer_id", "VARCHAR(100)", None),
        ("stripe_subscription_id", "VARCHAR(100)", None),
        ("billing_email", "VARCHAR(200)", None),
    ]
    
    for col_name, col_type, default in columns_to_add:
        # Verificar se coluna já existe
        exists = conn.execute(sa.text(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tenants' AND column_name = '{col_name}'
            )
        """)).scalar()
        
        if not exists:
            default_clause = f" DEFAULT {default}" if default else ""
            conn.execute(sa.text(f"""
                ALTER TABLE tenants 
                ADD COLUMN {col_name} {col_type}{default_clause}
            """))
            print(f"[MIGRATION] ✅ Added column: tenants.{col_name}")
        else:
            print(f"[MIGRATION] ⏭️  Column already exists: tenants.{col_name}")
    
    # Criar índice no sector para queries rápidas
    try:
        conn.execute(sa.text("""
            CREATE INDEX IF NOT EXISTS idx_tenants_sector 
            ON tenants(sector)
        """))
        print("[MIGRATION] ✅ Created index: idx_tenants_sector")
    except Exception as e:
        print(f"[MIGRATION] ⏭️  Index might already exist: {e}")
    
    # Criar índice no status para dashboard
    try:
        conn.execute(sa.text("""
            CREATE INDEX IF NOT EXISTS idx_tenants_status 
            ON tenants(status)
        """))
        print("[MIGRATION] ✅ Created index: idx_tenants_status")
    except Exception as e:
        print(f"[MIGRATION] ⏭️  Index might already exist: {e}")


def downgrade():
    conn = op.get_bind()
    
    # Verificar se tabela existe
    result = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'tenants'
        )
    """)).scalar()
    
    if not result:
        return
    
    # Remover índices
    conn.execute(sa.text("DROP INDEX IF EXISTS idx_tenants_sector"))
    conn.execute(sa.text("DROP INDEX IF EXISTS idx_tenants_status"))
    
    # Remover colunas (ordem inversa)
    columns_to_remove = [
        "billing_email",
        "stripe_subscription_id", 
        "stripe_customer_id",
        "domain_verification_token",
        "custom_domain_verified",
        "onboarding_step",
        "onboarding_completed",
        "admin_created",
        "admin_email",
        "sector",
        "secondary_color",
    ]
    
    for col_name in columns_to_remove:
        try:
            conn.execute(sa.text(f"""
                ALTER TABLE tenants DROP COLUMN IF EXISTS {col_name}
            """))
            print(f"[MIGRATION] ✅ Dropped column: tenants.{col_name}")
        except Exception as e:
            print(f"[MIGRATION] ⚠️  Error dropping {col_name}: {e}")
