"""
Fix: Criar admin para tenant luisgaspar
Executar com: railway run python fix_luisgaspar_admin.py
"""

import bcrypt
from sqlalchemy import text
from app.database import engine

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def fix_luisgaspar_admin():
    print("🔧 Fixing luisgaspar tenant admin...")
    
    with engine.connect() as conn:
        # Verificar se schema existe
        result = conn.execute(text("""
            SELECT schema_name FROM information_schema.schemata 
            WHERE schema_name = 'tenant_luisgaspar'
        """))
        
        if not result.fetchone():
            print("❌ Schema tenant_luisgaspar não existe!")
            return
        
        print("✅ Schema tenant_luisgaspar existe")
        
        # Mudar para o schema
        conn.execute(text('SET search_path TO "tenant_luisgaspar", public'))
        
        # Verificar se há users
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        print(f"   Users existentes: {user_count}")
        
        # Listar users existentes
        result = conn.execute(text("SELECT id, email, full_name, role, is_active FROM users"))
        users = result.fetchall()
        print("   Users no schema:")
        for u in users:
            print(f"     - {u[1]} ({u[2]}) - role: {u[3]}, active: {u[4]}")
        
        # Verificar se admin@luisgaspar.pt existe
        result = conn.execute(text("""
            SELECT id FROM users WHERE email = 'admin@luisgaspar.pt'
        """))
        
        if result.fetchone():
            # Update password
            print("   User admin@luisgaspar.pt existe, a atualizar password...")
            password_hash = hash_password("LuisGaspar2024!")
            conn.execute(text("""
                UPDATE users SET hashed_password = :pwd, is_active = true 
                WHERE email = 'admin@luisgaspar.pt'
            """), {"pwd": password_hash})
            conn.commit()
            print("✅ Password atualizada!")
        else:
            # Criar user
            print("   A criar user admin@luisgaspar.pt...")
            password_hash = hash_password("LuisGaspar2024!")
            conn.execute(text("""
                INSERT INTO users (email, hashed_password, full_name, role, is_active)
                VALUES ('admin@luisgaspar.pt', :pwd, 'Administrador', 'admin', true)
            """), {"pwd": password_hash})
            conn.commit()
            print("✅ User criado!")
        
        # Verificar se há agentes
        result = conn.execute(text("SELECT COUNT(*) FROM agents"))
        agent_count = result.scalar()
        print(f"   Agentes existentes: {agent_count}")
        
        # Verificar imóveis
        try:
            result = conn.execute(text("SELECT COUNT(*) FROM properties"))
            prop_count = result.scalar()
            print(f"   Imóveis existentes: {prop_count}")
        except:
            print("   Tabela properties não existe ou está vazia")
        
        print("\n🎉 Credenciais de acesso:")
        print("   Email: admin@luisgaspar.pt")
        print("   Password: LuisGaspar2024!")

if __name__ == "__main__":
    fix_luisgaspar_admin()
