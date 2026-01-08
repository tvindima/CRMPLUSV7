"""
PostgreSQL-compatible database configuration with Multi-Tenant Database Isolation.
CADA TENANT TEM A SUA PRÓPRIA BASE DE DADOS NO RAILWAY.

Configuração via variáveis de ambiente:
- DATABASE_URL: BD default/fallback
- DATABASE_URL_LUIS_GASPAR: BD do tenant luis-gaspar (triumphant-energy)
- DATABASE_URL_IMOVEIS_MAIS: BD do tenant imoveis-mais (fortune-grace)
"""
import os
from contextvars import ContextVar
from typing import Optional, Dict
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import QueuePool

# Context variable para armazenar o tenant atual por request
current_tenant_slug: ContextVar[Optional[str]] = ContextVar('current_tenant_slug', default=None)

# Schema default - mantido para compatibilidade mas não usado para isolamento
DEFAULT_SCHEMA = "public"

# =============================================================================
# CONFIGURAÇÃO MULTI-DATABASE
# =============================================================================

def fix_postgres_url(url: str) -> str:
    """Corrige URLs postgres:// antigas para postgresql://"""
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

# URLs das bases de dados por tenant
DATABASE_URLS: Dict[str, str] = {}

# BD default (fallback)
DATABASE_URL = fix_postgres_url(os.environ.get("DATABASE_URL", ""))

# BD do tenant luis-gaspar (triumphant-energy)
DATABASE_URL_LUIS_GASPAR = fix_postgres_url(
    os.environ.get("DATABASE_URL_LUIS_GASPAR") or 
    os.environ.get("DATABASE_URL_TRIUMPHANT_ENERGY") or
    DATABASE_URL
)

# BD do tenant imoveis-mais (fortune-grace)
DATABASE_URL_IMOVEIS_MAIS = fix_postgres_url(
    os.environ.get("DATABASE_URL_IMOVEIS_MAIS") or 
    os.environ.get("DATABASE_URL_FORTUNE_GRACE") or
    DATABASE_URL
)

# Mapear slugs para URLs
DATABASE_URLS = {
    "luis-gaspar": DATABASE_URL_LUIS_GASPAR,
    "luis_gaspar": DATABASE_URL_LUIS_GASPAR,
    "imoveis-mais": DATABASE_URL_IMOVEIS_MAIS,
    "imoveis_mais": DATABASE_URL_IMOVEIS_MAIS,
}

# Log das configurações (sem expor passwords)
def safe_url_log(url: str) -> str:
    if not url:
        return "NOT SET"
    if "@" in url:
        return url.split("@")[1][:30] + "..."
    return "configured"

print(f"[DATABASE] Multi-tenant configuration:")
print(f"  - Default: {safe_url_log(DATABASE_URL)}")
print(f"  - luis-gaspar: {safe_url_log(DATABASE_URL_LUIS_GASPAR)}")
print(f"  - imoveis-mais: {safe_url_log(DATABASE_URL_IMOVEIS_MAIS)}")

# =============================================================================
# ENGINE POOL - Um engine por base de dados
# =============================================================================

_engines: Dict[str, any] = {}
_session_factories: Dict[str, sessionmaker] = {}

def get_engine_for_url(url: str):
    """Obtém ou cria engine para uma URL específica"""
    if not url:
        raise ValueError("DATABASE_URL não configurada")
    
    if url not in _engines:
        print(f"[DATABASE] Creating engine for: {safe_url_log(url)}")
        _engines[url] = create_engine(
            url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_recycle=300,
            echo=False
        )
        _session_factories[url] = sessionmaker(
            autocommit=False, 
            autoflush=False, 
            bind=_engines[url]
        )
    
    return _engines[url]

def get_session_factory_for_url(url: str) -> sessionmaker:
    """Obtém ou cria session factory para uma URL específica"""
    get_engine_for_url(url)  # Garante que engine existe
    return _session_factories[url]

def get_database_url_for_tenant(tenant_slug: Optional[str]) -> str:
    """Obtém a URL da BD para um tenant específico"""
    if tenant_slug:
        # Normalizar slug (suportar - e _)
        normalized = tenant_slug.lower().replace("_", "-")
        url = DATABASE_URLS.get(normalized) or DATABASE_URLS.get(tenant_slug)
        if url:
            return url
        print(f"[DATABASE] ⚠️ Tenant '{tenant_slug}' não tem BD configurada, usando default")
    
    return DATABASE_URL

# =============================================================================
# ENGINE E SESSION DEFAULT (para compatibilidade)
# =============================================================================

# Engine default - usado quando não há tenant
if DATABASE_URL:
    print(f"[DATABASE] PostgreSQL mode: {safe_url_log(DATABASE_URL)}")
    engine = get_engine_for_url(DATABASE_URL)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
else:
    # SQLite fallback (local development)
    DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")
    if not os.path.exists(DB_PATH):
        DB_PATH = os.path.join(os.path.dirname(__file__), "..", "test.db")
    
    print(f"[DATABASE] SQLite mode: {DB_PATH}")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# =============================================================================
# DEPENDENCY INJECTION
# =============================================================================

def get_db():
    """
    Dependency para obter sessão de BD.
    Seleciona automaticamente a BD baseado no tenant atual.
    """
    tenant_slug = current_tenant_slug.get()
    db_url = get_database_url_for_tenant(tenant_slug)
    
    # Usar session factory específica para o tenant
    if db_url and db_url != SQLALCHEMY_DATABASE_URL:
        session_factory = get_session_factory_for_url(db_url)
        db = session_factory()
    else:
        db = SessionLocal()
    
    try:
        yield db
    finally:
        db.close()


def set_tenant_schema(schema: str):
    """
    Define o tenant para o request atual.
    NOTA: Renomeado de 'schema' mas agora seleciona BD, não schema.
    Mantido para compatibilidade com middleware existente.
    """
    # Converter schema-style para slug-style
    tenant_slug = schema.replace("_", "-") if schema else None
    current_tenant_slug.set(tenant_slug)


def get_tenant_schema() -> Optional[str]:
    """Obtém o tenant atual (mantido para compatibilidade)"""
    return current_tenant_slug.get()


# =============================================================================
# FUNÇÕES UTILITÁRIAS (mantidas para compatibilidade)
# =============================================================================

def create_tenant_schema(db: Session, schema_name: str) -> bool:
    """DEPRECATED: Com BDs separadas, não precisamos criar schemas"""
    print(f"[DATABASE] create_tenant_schema chamado para '{schema_name}' - ignorado (usando BDs separadas)")
    return True


def copy_tables_to_schema(db: Session, schema_name: str) -> dict:
    """DEPRECATED: Com BDs separadas, não copiamos tabelas entre schemas"""
    return {"status": "skipped", "reason": "Usando BDs separadas por tenant"}
