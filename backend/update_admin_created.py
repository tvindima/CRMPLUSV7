"""
Script para atualizar o campo admin_created nos tenants existentes
que já têm utilizadores staff criados.
"""
import os
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL não definido")
    sys.exit(1)

# Railway usa postgres:// mas SQLAlchemy precisa de postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Primeiro, ver os tenants
    result = conn.execute(text("SELECT id, slug, name, admin_email, admin_created FROM tenants ORDER BY id"))
    tenants = result.fetchall()
    
    print("\n📋 Tenants na BD:")
    print("-" * 80)
    for t in tenants:
        print(f"  ID: {t[0]}, Slug: {t[1]}, Name: {t[2]}, Admin: {t[3]}, Created: {t[4]}")
    
    # Verificar se existem staff users nos schemas
    print("\n🔍 Verificando staff users por schema...")
    print("-" * 80)
    
    for t in tenants:
        tenant_id = t[0]
        slug = t[1]
        schema_name = f"tenant_{slug}"
        
        try:
            # Verificar se schema existe
            schema_exists = conn.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.schemata 
                    WHERE schema_name = '{schema_name}'
                )
            """)).scalar()
            
            if not schema_exists:
                print(f"  ⚠️  {slug}: Schema '{schema_name}' não existe")
                continue
            
            # Verificar staff users no schema
            staff_result = conn.execute(text(f"""
                SELECT COUNT(*) FROM {schema_name}.staff_users
            """)).scalar()
            
            print(f"  ✅ {slug}: {staff_result} staff users no schema '{schema_name}'")
            
            # Se tem staff users mas admin_created é false, atualizar
            if staff_result > 0 and not t[4]:
                conn.execute(text(f"""
                    UPDATE tenants SET admin_created = true WHERE id = {tenant_id}
                """))
                print(f"     → Atualizado admin_created = true")
                
        except Exception as e:
            print(f"  ❌ {slug}: Erro - {e}")
    
    conn.commit()
    
    print("\n✅ Verificação completa!")
    
    # Mostrar estado final
    result = conn.execute(text("SELECT id, slug, admin_created FROM tenants ORDER BY id"))
    tenants = result.fetchall()
    print("\n📋 Estado final:")
    for t in tenants:
        print(f"  {t[1]}: admin_created = {t[2]}")

