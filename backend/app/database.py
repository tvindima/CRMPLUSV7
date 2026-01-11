"""
PostgreSQL-compatible database configuration with Multi-Tenant Schema Isolation.
Auto-detects DATABASE_URL (PostgreSQL) or falls back to SQLite.

Multi-tenant: cada tenant tem o seu próprio schema PostgreSQL.
O schema é selecionado via SET search_path baseado no tenant do request.
"""
import os
from contextvars import ContextVar
from typing import Optional
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Context variable para armazenar o tenant atual por request
current_tenant_schema: ContextVar[Optional[str]] = ContextVar('current_tenant_schema', default=None)

# Schema default (público) - usado quando não há tenant específico
DEFAULT_SCHEMA = "public"

# Check for PostgreSQL DATABASE_URL (Railway, Heroku, etc.)
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # PostgreSQL mode
    if DATABASE_URL.startswith("postgres://"):
        # Fix old postgres:// URLs (Heroku/Railway old format)
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    print(f"[DATABASE] Using PostgreSQL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'remote'}")
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # Test connections before using
        echo=False
    )
    
    # Set search_path quando uma conexão é usada
    @event.listens_for(engine, "checkout")
    def set_search_path(dbapi_conn, connection_record, connection_proxy):
        """Define o search_path baseado no tenant atual"""
        schema = current_tenant_schema.get()
        if schema:
            cursor = dbapi_conn.cursor()
            cursor.execute(f'SET search_path TO "{schema}", public')
            cursor.close()
else:
    # SQLite fallback (local development)
    DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")
    if not os.path.exists(DB_PATH):
        DB_PATH = os.path.join(os.path.dirname(__file__), "..", "test.db")
    
    print(f"[DATABASE] Using SQLite: {DB_PATH}")
    print(f"[DATABASE] Exists: {os.path.exists(DB_PATH)}")
    
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    Dependency para obter sessão de BD.
    O schema é automaticamente selecionado baseado no tenant atual (via ContextVar).
    """
    db = SessionLocal()
    try:
        # Se temos um tenant definido, garantir que o search_path está correto
        schema = current_tenant_schema.get()
        print(f"[GET_DB] Schema from ContextVar: {schema}")
        if schema and DATABASE_URL:  # Só para PostgreSQL
            db.execute(text(f'SET search_path TO "{schema}", public'))
            print(f"[GET_DB] Set search_path to: {schema}")
        yield db
    finally:
        db.close()


def set_tenant_schema(schema: str):
    """Define o schema do tenant para o request atual"""
    current_tenant_schema.set(schema)


def get_tenant_schema() -> Optional[str]:
    """Obtém o schema do tenant atual"""
    return current_tenant_schema.get()


def create_tenant_schema(db: Session, schema_name: str) -> bool:
    """
    Cria um novo schema para um tenant.
    Retorna True se criado com sucesso, False se já existe.
    """
    if not DATABASE_URL:
        print(f"[SCHEMA] SQLite não suporta schemas - ignorando")
        return True
    
    try:
        # Verificar se schema já existe
        result = db.execute(text(
            "SELECT schema_name FROM information_schema.schemata WHERE schema_name = :schema"
        ), {"schema": schema_name})
        
        if result.fetchone():
            print(f"[SCHEMA] Schema '{schema_name}' já existe")
            return False
        
        # Criar schema
        db.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))
        db.commit()
        print(f"[SCHEMA] ✅ Schema '{schema_name}' criado com sucesso")
        return True
    except Exception as e:
        print(f"[SCHEMA] ❌ Erro ao criar schema '{schema_name}': {e}")
        db.rollback()
        raise


def copy_tables_to_schema(db: Session, schema_name: str) -> dict:
    """
    Copia a estrutura das tabelas do schema public para o novo schema.
    Útil para provisionar novos tenants.
    """
    if not DATABASE_URL:
        return {"status": "skipped", "reason": "SQLite não suporta schemas"}
    
    results = {"created": [], "errors": []}
    
    try:
        # Listar tabelas do schema public (exceto as de plataforma)
        platform_tables = ['tenants', 'super_admins', 'platform_settings', 'alembic_version']
        
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """))
        
        tables = [row[0] for row in result if row[0] not in platform_tables]
        
        for table in tables:
            try:
                # Criar tabela no novo schema copiando estrutura
                db.execute(text(f'''
                    CREATE TABLE IF NOT EXISTS "{schema_name}"."{table}" 
                    (LIKE public."{table}" INCLUDING ALL)
                '''))
                results["created"].append(table)
            except Exception as e:
                results["errors"].append(f"{table}: {str(e)}")
        
        db.commit()
        print(f"[SCHEMA] Tabelas copiadas para '{schema_name}': {len(results['created'])} sucesso, {len(results['errors'])} erros")
        return results
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
