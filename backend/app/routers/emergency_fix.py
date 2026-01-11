"""
Endpoint temporário para executar a migração SQL diretamente
PROTEGIDO - Requer header X-Admin-Key
"""
import os
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/emergency", tags=["Emergency Fix"])

# Chave de admin para proteger endpoints sensíveis
ADMIN_SETUP_KEY = os.environ.get("ADMIN_SETUP_KEY", "dev_admin_key_change_in_production")


def verify_admin_key(x_admin_key: str = Header(..., description="Chave de administração")):
    """Verificar chave de admin para acesso a endpoints protegidos."""
    if x_admin_key != ADMIN_SETUP_KEY:
        raise HTTPException(status_code=403, detail="Chave de administração inválida")
    return True


@router.get("/list-tables/{schema_name}")
def list_tables(
    schema_name: str,
    _: bool = Depends(verify_admin_key)
):
    """
    Listar todas as tabelas num schema.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    import os
    from sqlalchemy import create_engine
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = :schema 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """), {"schema": schema_name})
        tables = [row[0] for row in result]
    
    engine.dispose()
    return {"schema": schema_name, "tables": tables, "count": len(tables)}


@router.post("/migrate-schema")
def migrate_schema(
    source_schema: str,
    target_schema: str,
    _: bool = Depends(verify_admin_key)
):
    """
    Migrar/copiar tabelas de um schema para outro.
    COPIA os dados (não move) - seguro para produção.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    import os
    from sqlalchemy import create_engine
    
    # Tabelas a migrar (excluindo tabelas de sistema e multi-tenant)
    TABLES_TO_MIGRATE = [
        "properties", "agents", "users", "leads", "teams", "agencies",
        "calendar_events", "notifications", "first_impressions", 
        "pre_angariacoes", "contratos_mediacao", "clients", "client_transacoes",
        "escrituras", "feed_items", "match_plus_configs", "match_plus_results"
    ]
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    results = []
    
    with engine.connect() as conn:
        # Verificar schemas existem
        for schema in [source_schema, target_schema]:
            check = conn.execute(text("""
                SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema)
            """), {"schema": schema})
            if not check.scalar():
                engine.dispose()
                raise HTTPException(status_code=400, detail=f"Schema '{schema}' não existe")
        
        # Listar tabelas disponíveis no source
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = :schema AND table_type = 'BASE TABLE'
        """), {"schema": source_schema})
        available_tables = [row[0] for row in result]
        
        for table in TABLES_TO_MIGRATE:
            if table not in available_tables:
                results.append({"table": table, "status": "skipped", "reason": "não existe no source"})
                continue
            
            try:
                # Verificar se tabela já existe no target
                check = conn.execute(text("""
                    SELECT EXISTS(
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = :schema AND table_name = :table
                    )
                """), {"schema": target_schema, "table": table})
                
                if check.scalar():
                    # Tabela existe - verificar se tem dados
                    count_result = conn.execute(text(f'SELECT COUNT(*) FROM "{target_schema}"."{table}"'))
                    target_count = count_result.scalar()
                    if target_count > 0:
                        results.append({"table": table, "status": "skipped", "reason": f"já tem {target_count} registos no target"})
                        continue
                else:
                    # Criar tabela no target (cópia da estrutura)
                    conn.execute(text(f'''
                        CREATE TABLE "{target_schema}"."{table}" (LIKE "{source_schema}"."{table}" INCLUDING ALL)
                    '''))
                    conn.commit()
                
                # Copiar dados
                conn.execute(text(f'''
                    INSERT INTO "{target_schema}"."{table}" 
                    SELECT * FROM "{source_schema}"."{table}"
                '''))
                conn.commit()
                
                # Contar registos copiados
                count_result = conn.execute(text(f'SELECT COUNT(*) FROM "{target_schema}"."{table}"'))
                copied = count_result.scalar()
                results.append({"table": table, "status": "success", "records_copied": copied})
                
            except Exception as e:
                results.append({"table": table, "status": "error", "error": str(e)})
    
    engine.dispose()
    
    success_count = len([r for r in results if r["status"] == "success"])
    return {
        "source_schema": source_schema,
        "target_schema": target_schema,
        "total_tables": len(results),
        "success": success_count,
        "results": results
    }


@router.post("/setup-luisgaspar-data")
def setup_luisgaspar_data(
    _: bool = Depends(verify_admin_key)
):
    """
    Inserir dados do Luis Gaspar no schema tenant_luisgaspar.
    Dados migrados do backend antigo.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    import os
    from sqlalchemy import create_engine
    from datetime import datetime
    
    schema = "tenant_luisgaspar"
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    results = []
    
    with engine.connect() as conn:
        try:
            # 1. Inserir agente Luis Gaspar
            check = conn.execute(text(f'SELECT COUNT(*) FROM "{schema}".agents WHERE email = :email'), 
                                {"email": "Luis.carlos@zome.pt"})
            if check.scalar() == 0:
                conn.execute(text(f'''
                    INSERT INTO "{schema}".agents (name, email, phone, nif, whatsapp)
                    VALUES (:name, :email, :phone, :nif, :whatsapp)
                '''), {
                    "name": "Luis Gaspar",
                    "email": "Luis.carlos@zome.pt", 
                    "phone": "+351 917 339 778",
                    "nif": "222947837",
                    "whatsapp": "+351 917 339 778"
                })
                conn.commit()
                results.append({"item": "agent", "status": "created", "name": "Luis Gaspar"})
            else:
                results.append({"item": "agent", "status": "already_exists", "name": "Luis Gaspar"})
            
            # Obter ID do agente
            agent_result = conn.execute(text(f'SELECT id FROM "{schema}".agents WHERE email = :email'), 
                                       {"email": "Luis.carlos@zome.pt"})
            agent_id = agent_result.scalar()
            
            # 2. Inserir propriedade T3 O Menino
            check = conn.execute(text(f'SELECT COUNT(*) FROM "{schema}".properties WHERE reference = :ref'),
                                {"ref": "LG1"})
            if check.scalar() == 0:
                images = [
                    "https://res.cloudinary.com/dtpk4oqoa/image/upload/v1767889711/crm-plus/properties/1/WhatsApp%20Image%202026-01-08%20at%2016.26.30%20%282%29_large.webp",
                    "https://res.cloudinary.com/dtpk4oqoa/image/upload/v1767889714/crm-plus/properties/1/WhatsApp%20Image%202026-01-08%20at%2016.26.31%20%283%29_large.webp"
                ]
                import json
                conn.execute(text(f'''
                    INSERT INTO "{schema}".properties (
                        reference, title, business_type, property_type, typology,
                        description, price, usable_area, location, municipality, parish,
                        condition, energy_certificate, images, is_published, is_featured,
                        status, agent_id, created_at, updated_at
                    ) VALUES (
                        :reference, :title, :business_type, :property_type, :typology,
                        :description, :price, :usable_area, :location, :municipality, :parish,
                        :condition, :energy_certificate, :images, :is_published, :is_featured,
                        :status, :agent_id, :created_at, :updated_at
                    )
                '''), {
                    "reference": "LG1",
                    "title": "T3 O Menino",
                    "business_type": "Venda",
                    "property_type": "Apartamento",
                    "typology": "T3",
                    "description": "T3 Renovado a 5 minutos do centro da cidade de Leiria",
                    "price": 225000.0,
                    "usable_area": 100.0,
                    "location": "Leiria (Marrazes e Barosa), Leiria, Leiria",
                    "municipality": "Leiria",
                    "parish": "Leiria (Marrazes e Barosa)",
                    "condition": "Renovado",
                    "energy_certificate": "Em curso",
                    "images": json.dumps(images),
                    "is_published": 1,
                    "is_featured": 1,
                    "status": "AVAILABLE",
                    "agent_id": agent_id,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                })
                conn.commit()
                results.append({"item": "property", "status": "created", "reference": "LG1", "title": "T3 O Menino"})
            else:
                results.append({"item": "property", "status": "already_exists", "reference": "LG1"})
            
            # 3. Criar user para o agente (se não existir)
            check = conn.execute(text(f'SELECT COUNT(*) FROM "{schema}".users WHERE email = :email'),
                                {"email": "Luis.carlos@zome.pt"})
            if check.scalar() == 0:
                from app.users.services import hash_password
                hashed = hash_password("LuisGaspar2026!")
                
                conn.execute(text(f'''
                    INSERT INTO "{schema}".users (email, hashed_password, full_name, role, agent_id, is_active)
                    VALUES (:email, :password, :full_name, :role, :agent_id, :is_active)
                '''), {
                    "email": "Luis.carlos@zome.pt",
                    "password": hashed,
                    "full_name": "Luis Gaspar",
                    "role": "agent",
                    "agent_id": agent_id,
                    "is_active": True
                })
                conn.commit()
                results.append({"item": "user", "status": "created", "email": "Luis.carlos@zome.pt", "temp_password": "LuisGaspar2026!"})
            else:
                results.append({"item": "user", "status": "already_exists", "email": "Luis.carlos@zome.pt"})
            
        except Exception as e:
            engine.dispose()
            raise HTTPException(status_code=500, detail=str(e))
    
    engine.dispose()
    return {
        "success": True,
        "schema": schema,
        "results": results
    }


@router.get("/list-users/{schema_name}")
def list_users(
    schema_name: str,
    _: bool = Depends(verify_admin_key)
):
    """
    Listar users de um schema específico.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    import os
    from sqlalchemy import create_engine
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        try:
            result = conn.execute(text(f'''
                SELECT id, email, full_name, role, is_active, agent_id 
                FROM "{schema_name}".users
            '''))
            users = [{"id": r[0], "email": r[1], "full_name": r[2], "role": r[3], "is_active": r[4], "agent_id": r[5]} for r in result]
        except Exception as e:
            engine.dispose()
            return {"error": str(e)}
    
    engine.dispose()
    return {"schema": schema_name, "users": users, "count": len(users)}


@router.post("/test-auth/{schema_name}")
def test_auth(
    schema_name: str,
    email: str,
    password: str,
    _: bool = Depends(verify_admin_key)
):
    """
    Testar autenticação num schema específico.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    import os
    from sqlalchemy import create_engine
    from app.users.services import verify_password
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        try:
            # Buscar user
            result = conn.execute(text(f'''
                SELECT id, email, hashed_password, is_active 
                FROM "{schema_name}".users 
                WHERE LOWER(email) = LOWER(:email)
            '''), {"email": email})
            row = result.first()
            
            if not row:
                engine.dispose()
                return {"success": False, "error": "User não encontrado", "email_searched": email.lower()}
            
            user_id, user_email, hashed_password, is_active = row
            
            # Verificar password
            password_valid = verify_password(password, hashed_password) if hashed_password else False
            
            engine.dispose()
            return {
                "success": password_valid and is_active,
                "user_id": user_id,
                "email": user_email,
                "is_active": is_active,
                "has_password": bool(hashed_password),
                "password_valid": password_valid
            }
        except Exception as e:
            engine.dispose()
            return {"error": str(e)}


@router.post("/reset-password/{schema_name}")
def reset_password(
    schema_name: str,
    email: str,
    new_password: str,
    _: bool = Depends(verify_admin_key)
):
    """
    Resetar password de um user.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    import os
    from sqlalchemy import create_engine
    from app.users.services import hash_password
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        try:
            hashed = hash_password(new_password)
            conn.execute(text(f'''
                UPDATE "{schema_name}".users 
                SET hashed_password = :password 
                WHERE LOWER(email) = LOWER(:email)
            '''), {"email": email, "password": hashed})
            conn.commit()
            engine.dispose()
            return {"success": True, "email": email, "message": "Password resetada"}
        except Exception as e:
            engine.dispose()
            return {"error": str(e)}


@router.post("/cleanup-public-schema")
def cleanup_public_schema(
    confirm: str,
    _: bool = Depends(verify_admin_key)
):
    """
    Limpar dados de negócio duplicados do schema public.
    Mantém tabelas de sistema (tenants, super_admins, platform_settings, alembic_version).
    PROTEGIDO - Requer header: X-Admin-Key e confirm=YES_DELETE_DATA
    """
    if confirm != "YES_DELETE_DATA":
        return {"error": "Confirmação necessária. Use confirm=YES_DELETE_DATA"}
    
    import os
    from sqlalchemy import create_engine
    
    # Tabelas a LIMPAR (dados de negócio duplicados)
    TABLES_TO_TRUNCATE = [
        "properties", "agents", "users", "leads", "teams", "agencies",
        "calendar_events", "notifications", "first_impressions", 
        "pre_angariacoes", "contratos_mediacao", "clients", "client_transacoes",
        "escrituras", "feed_items", "crm_settings", "draft_properties",
        "events", "tasks", "visits", "website_clients", "refresh_tokens",
        "agent_site_preferences", "billing_records", "ingestion_files",
        "lead_distribution_counters", "lead_property_matches"
    ]
    
    # Tabelas a MANTER (sistema multi-tenant)
    KEEP_TABLES = ["tenants", "super_admins", "platform_settings", "alembic_version", "billing_plans"]
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    results = []
    
    with engine.connect() as conn:
        for table in TABLES_TO_TRUNCATE:
            try:
                # Verificar se tabela existe
                check = conn.execute(text("""
                    SELECT EXISTS(
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = :table
                    )
                """), {"table": table})
                if not check.scalar():
                    results.append({"table": table, "status": "skipped", "reason": "não existe"})
                    continue
                
                # Contar registos antes
                count_before = conn.execute(text(f'SELECT COUNT(*) FROM public."{table}"')).scalar()
                
                # Truncar tabela
                conn.execute(text(f'TRUNCATE TABLE public."{table}" CASCADE'))
                conn.commit()
                
                results.append({"table": table, "status": "truncated", "records_deleted": count_before})
            except Exception as e:
                results.append({"table": table, "status": "error", "error": str(e)})
    
    engine.dispose()
    
    success_count = len([r for r in results if r["status"] == "truncated"])
    total_deleted = sum([r.get("records_deleted", 0) for r in results])
    
    return {
        "success": True,
        "tables_cleaned": success_count,
        "total_records_deleted": total_deleted,
        "tables_kept": KEEP_TABLES,
        "results": results
    }


@router.post("/fix-clients-table")
def fix_clients_table(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Endpoint de emergência para adicionar colunas faltantes na tabela clients
    PROTEGIDO - Requer header: X-Admin-Key
    """
    sql_statements = [
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_empresa BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_id INTEGER;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_id INTEGER;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS cc VARCHAR(30);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS cc_validade DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_nascimento DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(100);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS profissao VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS entidade_empregadora VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_casamento VARCHAR(50);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_casamento DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nome VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nif VARCHAR(20);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_cc VARCHAR(30);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_cc_validade DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_data_nascimento DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_naturalidade VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nacionalidade VARCHAR(100);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_profissao VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_email VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_telefone VARCHAR(50);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_nome VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_nipc VARCHAR(20);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_sede VARCHAR(500);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_capital_social DECIMAL(15, 2);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_conservatoria VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_matricula VARCHAR(50);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_cargo VARCHAR(100);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_poderes TEXT;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero_porta VARCHAR(20);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS andar VARCHAR(20);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS localidade VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS concelho VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS distrito VARCHAR(100);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'Portugal';",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'::jsonb;",
    ]
    
    results = []
    for i, sql in enumerate(sql_statements, 1):
        try:
            db.execute(text(sql))
            db.commit()
            results.append(f"✅ {i}/{len(sql_statements)}")
        except Exception as e:
            results.append(f"⚠️ {i}/{len(sql_statements)}: {str(e)}")
    
    # Verificar colunas
    result = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        ORDER BY ordinal_position
    """))
    columns = [row[0] for row in result]
    
    return {
        "status": "completed",
        "total_commands": len(sql_statements),
        "results": results,
        "total_columns": len(columns),
        "columns": columns
    }


@router.get("/debug-schemas")
def debug_schemas(
    _: bool = Depends(verify_admin_key)
):
    """
    Debug: Ver dados de crm_settings em cada schema.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    import os
    from sqlalchemy import create_engine
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    results = {}
    
    for schema in ["tenant_imoveismais", "tenant_luisgaspar", "public"]:
        with engine.connect() as conn:
            try:
                # Verificar se o schema existe
                schema_check = conn.execute(text("""
                    SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema)
                """), {"schema": schema})
                schema_exists = schema_check.scalar()
                
                if not schema_exists:
                    results[schema] = {"error": "schema does not exist", "schema_exists": False}
                    continue
                
                # Verificar se tabela existe
                check = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = :schema AND table_name = 'crm_settings'
                    )
                """), {"schema": schema})
                table_exists = check.scalar()
                
                if not table_exists:
                    results[schema] = {"error": "table crm_settings does not exist", "schema_exists": True, "table_exists": False}
                    continue
                
                result = conn.execute(text(f'SELECT agency_name, agency_slogan FROM "{schema}".crm_settings LIMIT 1'))
                row = result.first()
                if row:
                    results[schema] = {"agency_name": row[0], "agency_slogan": row[1], "schema_exists": True, "table_exists": True}
                else:
                    results[schema] = {"error": "no data in crm_settings", "schema_exists": True, "table_exists": True}
            except Exception as e:
                results[schema] = {"error": str(e)}
    
    engine.dispose()
    return results


@router.post("/init-tenant-schema/{tenant_slug}")
def init_tenant_schema(
    tenant_slug: str,
    agency_name: str,
    agency_slogan: str = "A sua agência de confiança",
    _: bool = Depends(verify_admin_key)
):
    """
    Inicializar schema de um tenant: criar schema se não existir, criar tabela crm_settings e inserir dados.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    import os
    from sqlalchemy import create_engine
    from app.platform.models import Tenant
    from app.database import get_db
    
    db = next(get_db())
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"Tenant '{tenant_slug}' não encontrado")
    
    schema = tenant.schema_name
    if not schema:
        raise HTTPException(status_code=400, detail="Tenant não tem schema")
    
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        try:
            # Verificar se schema existe
            result = conn.execute(text("""
                SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema)
            """), {"schema": schema})
            schema_exists = result.scalar()
            
            if not schema_exists:
                # Criar schema
                conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
                conn.commit()
            
            # Criar tabela crm_settings no schema específico (com schema qualificado)
            conn.execute(text(f'''
                CREATE TABLE IF NOT EXISTS "{schema}".crm_settings (
                    id SERIAL PRIMARY KEY,
                    agency_name VARCHAR(255) DEFAULT 'CRM Plus',
                    agency_slogan VARCHAR(500),
                    agency_logo_url VARCHAR(500),
                    agency_watermark_url VARCHAR(500),
                    primary_color VARCHAR(20) DEFAULT '#E10600',
                    secondary_color VARCHAR(20) DEFAULT '#C5C5C5',
                    background_color VARCHAR(20) DEFAULT '#0B0B0D',
                    background_secondary VARCHAR(20) DEFAULT '#1A1A1F',
                    text_color VARCHAR(20) DEFAULT '#FFFFFF',
                    text_muted VARCHAR(20) DEFAULT '#9CA3AF',
                    border_color VARCHAR(20) DEFAULT '#2A2A2E',
                    accent_color VARCHAR(20) DEFAULT '#E10600',
                    contact_email VARCHAR(255),
                    contact_phone VARCHAR(50),
                    contact_address TEXT,
                    social_facebook VARCHAR(255),
                    social_instagram VARCHAR(255),
                    social_linkedin VARCHAR(255),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            '''))
            
            conn.commit()
            
            # Verificar se já tem dados (usando schema qualificado)
            result = conn.execute(text(f'SELECT COUNT(*) FROM "{schema}".crm_settings'))
            count = result.scalar()
            
            if count == 0:
                # Inserir dados
                conn.execute(text(f'''
                    INSERT INTO "{schema}".crm_settings (agency_name, agency_slogan, primary_color, secondary_color,
                        background_color, background_secondary, text_color, text_muted, border_color, accent_color)
                    VALUES (:name, :slogan, '#E10600', '#C5C5C5', '#0B0B0D', '#1A1A1F', '#FFFFFF', '#9CA3AF', '#2A2A2E', '#E10600')
                '''), {"name": agency_name, "slogan": agency_slogan})
            else:
                # Atualizar dados existentes
                conn.execute(text(f'''
                    UPDATE "{schema}".crm_settings SET agency_name = :name, agency_slogan = :slogan
                '''), {"name": agency_name, "slogan": agency_slogan})
            
            conn.commit()
            
            # Verificar resultado
            result = conn.execute(text(f'SELECT agency_name, agency_slogan FROM "{schema}".crm_settings LIMIT 1'))
            row = result.first()
            
        except Exception as e:
            engine.dispose()
            raise HTTPException(status_code=500, detail=str(e))
    
    engine.dispose()
    return {
        "success": True,
        "tenant": tenant_slug,
        "schema": schema,
        "agency_name": row[0] if row else agency_name,
        "agency_slogan": row[1] if row else agency_slogan
    }


@router.post("/add-missing-columns")
def add_missing_columns(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Adicionar colunas que faltaram: preferencias e is_verified
    PROTEGIDO - Requer header: X-Admin-Key
    """
    sql_statements = [
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferencias JSONB DEFAULT '{}'::jsonb;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;",
    ]
    
    results = []
    for i, sql in enumerate(sql_statements, 1):
        try:
            db.execute(text(sql))
            db.commit()
            results.append(f"✅ {i}/{len(sql_statements)}: Coluna adicionada")
        except Exception as e:
            results.append(f"⚠️ {i}/{len(sql_statements)}: {str(e)}")
    
    # Verificar se as colunas existem agora
    result = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name IN ('preferencias', 'is_verified')
        ORDER BY column_name
    """))
    columns = [row[0] for row in result]
    
    return {
        "status": "completed",
        "total_commands": len(sql_statements),
        "results": results,
        "columns_added": columns,
        "message": "Agora pode criar o cliente!"
    }


@router.put("/update-tenant-domains/{tenant_slug}")
def update_tenant_domains(
    tenant_slug: str,
    primary_domain: str,
    backoffice_domain: str,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Atualizar domínios de um tenant.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    from app.platform.models import Tenant
    
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"Tenant '{tenant_slug}' não encontrado")
    
    old_primary = tenant.primary_domain
    old_backoffice = tenant.backoffice_domain
    
    tenant.primary_domain = primary_domain
    tenant.backoffice_domain = backoffice_domain
    db.commit()
    db.refresh(tenant)
    
    # Limpar cache de domínios
    from app.middleware.tenant import clear_domain_cache
    clear_domain_cache()
    
    return {
        "success": True,
        "tenant": tenant_slug,
        "old_primary_domain": old_primary,
        "new_primary_domain": tenant.primary_domain,
        "old_backoffice_domain": old_backoffice,
        "new_backoffice_domain": tenant.backoffice_domain
    }


@router.post("/fix-tenant-branding/{tenant_slug}")
def fix_tenant_branding(
    tenant_slug: str,
    agency_name: str,
    agency_slogan: str = "A sua imobiliária de confiança",
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Corrigir branding de um tenant específico.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    from app.platform.models import Tenant
    from app.database import engine
    
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"Tenant '{tenant_slug}' não encontrado")
    
    if not tenant.schema_name:
        raise HTTPException(status_code=400, detail="Tenant não tem schema provisionado")
    
    try:
        # Usar conexão isolada para evitar contaminar outras queries
        with engine.connect() as conn:
            # Definir search_path para o schema do tenant
            conn.execute(text(f'SET search_path TO "{tenant.schema_name}", public'))
            
            # Verificar se existe CRMSettings
            result = conn.execute(text("SELECT COUNT(*) FROM crm_settings"))
            count = result.scalar()
            
            if count == 0:
                # Criar novo
                conn.execute(text("""
                    INSERT INTO crm_settings (
                        agency_name, agency_slogan, primary_color, secondary_color,
                        background_color, background_secondary, text_color, text_muted,
                        border_color, accent_color
                    ) VALUES (
                        :agency_name, :agency_slogan, '#E10600', '#C5C5C5',
                        '#0B0B0D', '#1A1A1F', '#FFFFFF', '#9CA3AF',
                        '#2A2A2E', '#E10600'
                    )
                """), {"agency_name": agency_name, "agency_slogan": agency_slogan})
            else:
                # Atualizar existente
                conn.execute(text("""
                    UPDATE crm_settings SET
                        agency_name = :agency_name,
                        agency_slogan = :agency_slogan
                """), {"agency_name": agency_name, "agency_slogan": agency_slogan})
            
            conn.commit()
            
            # Verificar resultado
            result = conn.execute(text("SELECT agency_name, agency_slogan FROM crm_settings"))
            row = result.first()
        
        return {
            "success": True,
            "tenant": tenant_slug,
            "schema": tenant.schema_name,
            "agency_name": row[0] if row else agency_name,
            "agency_slogan": row[1] if row else agency_slogan,
            "message": f"Branding atualizado para '{agency_name}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar branding: {str(e)}")
