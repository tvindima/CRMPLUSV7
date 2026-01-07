#!/usr/bin/env python3
"""
Script para criar o primeiro Super Admin da plataforma.

Uso:
    python create_super_admin.py

O script irá pedir email, nome e password.
"""

import sys
import os
import getpass

# Adicionar path do app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.platform.models import SuperAdmin, Tenant, PlatformSettings

def hash_password(password: str) -> str:
    """Hash password com bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def create_tables_if_needed():
    """Criar tabelas se não existirem"""
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if 'super_admins' not in tables or 'tenants' not in tables:
        print("⚠️  Tabelas da plataforma não existem.")
        print("   Execute a migração primeiro: alembic upgrade head")
        print("   Ou crie manualmente via SQL.")
        return False
    return True


def main():
    print("\n" + "="*50)
    print("🔐 CRIAR SUPER ADMIN - CRM PLUS PLATFORM")
    print("="*50 + "\n")
    
    db = SessionLocal()
    
    try:
        # Verificar se tabelas existem
        if not create_tables_if_needed():
            # Tentar criar via SQL directo
            print("\n🔧 Tentando criar tabelas via SQL...")
            from sqlalchemy import text
            
            # Criar tabela super_admins se não existir
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS super_admins (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(200) UNIQUE NOT NULL,
                    password_hash VARCHAR(200) NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    permissions JSONB DEFAULT '{}',
                    last_login_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            
            # Criar tabela tenants se não existir
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS tenants (
                    id SERIAL PRIMARY KEY,
                    slug VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    email VARCHAR(200),
                    phone VARCHAR(50),
                    primary_domain VARCHAR(200),
                    backoffice_domain VARCHAR(200),
                    api_subdomain VARCHAR(200),
                    database_url TEXT,
                    plan VARCHAR(50) DEFAULT 'basic',
                    features JSONB DEFAULT '{}',
                    max_agents INTEGER DEFAULT 10,
                    max_properties INTEGER DEFAULT 100,
                    is_active BOOLEAN DEFAULT true,
                    is_trial BOOLEAN DEFAULT false,
                    trial_ends_at TIMESTAMP WITH TIME ZONE,
                    logo_url VARCHAR(500),
                    primary_color VARCHAR(20),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            
            # Criar tabela platform_settings se não existir
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS platform_settings (
                    id SERIAL PRIMARY KEY,
                    platform_name VARCHAR(100) DEFAULT 'CRM Plus',
                    platform_logo_url VARCHAR(500),
                    support_email VARCHAR(200) DEFAULT 'suporte@crmplus.pt',
                    default_plan VARCHAR(50) DEFAULT 'basic',
                    trial_days INTEGER DEFAULT 14,
                    maintenance_mode BOOLEAN DEFAULT false,
                    registration_enabled BOOLEAN DEFAULT true,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            
            db.commit()
            print("✅ Tabelas criadas com sucesso!")
        
        # Verificar se já existe super admin
        existing = db.query(SuperAdmin).first()
        if existing:
            print(f"ℹ️  Já existe um super admin: {existing.email}")
            choice = input("\nDeseja criar outro super admin? (s/n): ").strip().lower()
            if choice != 's':
                print("\nOperação cancelada.")
                return
        
        # Pedir dados
        print("\n📝 Dados do Super Admin:\n")
        
        email = input("Email: ").strip()
        if not email or '@' not in email:
            print("❌ Email inválido!")
            return
        
        # Verificar se email já existe
        if db.query(SuperAdmin).filter(SuperAdmin.email == email).first():
            print(f"❌ Email '{email}' já está registado!")
            return
        
        name = input("Nome completo: ").strip()
        if not name:
            print("❌ Nome é obrigatório!")
            return
        
        password = getpass.getpass("Password: ")
        if len(password) < 8:
            print("❌ Password deve ter pelo menos 8 caracteres!")
            return
        
        password_confirm = getpass.getpass("Confirmar password: ")
        if password != password_confirm:
            print("❌ Passwords não coincidem!")
            return
        
        # Criar super admin
        super_admin = SuperAdmin(
            email=email,
            name=name,
            password_hash=hash_password(password),
            is_active=True
        )
        
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        
        print("\n" + "="*50)
        print("✅ SUPER ADMIN CRIADO COM SUCESSO!")
        print("="*50)
        print(f"\n   ID: {super_admin.id}")
        print(f"   Email: {super_admin.email}")
        print(f"   Nome: {super_admin.name}")
        print(f"\n🔗 Login em: /platform/auth/login")
        print("="*50 + "\n")
        
        # Verificar/criar tenant default
        default_tenant = db.query(Tenant).filter(Tenant.slug == 'imoveismais').first()
        if not default_tenant:
            print("📦 Criando tenant default 'imoveismais'...")
            default_tenant = Tenant(
                slug='imoveismais',
                name='Imóveis Mais',
                email='geral@imoveismais.com',
                primary_domain='imoveismais.com',
                backoffice_domain='backoffice.imoveismais.com',
                plan='enterprise',
                max_agents=50,
                max_properties=1000
            )
            db.add(default_tenant)
            db.commit()
            print("✅ Tenant 'imoveismais' criado!")
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
