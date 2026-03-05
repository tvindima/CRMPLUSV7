import os
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.leads.routes import router as leads_router
from app.properties.routes import router as properties_router
from app.agents.routes import router as agents_router
from app.teams.routes import router as teams_router
from app.agencies.routes import router as agencies_router
from app.calendar.routes import router as calendar_router
from app.feed.routes import router as feed_router
from app.match_plus.routes import router as match_plus_router
from app.assistant.routes import router as assistant_router
from app.notifications.routes import router as notifications_router
from app.billing.routes import router as billing_router
from app.reports.routes import router as reports_router
from app.users.routes import router as users_router
from app.mobile.routes import router as mobile_router

from app.api.ingestion import router as ingestion_router
from app.api.health_db import router as health_db_router
from app.api.v1.health import router as health_router, heath_router
from app.api.v1.auth import router as auth_router
from app.api.v1.auth_mobile import router as auth_mobile_router
from app.api.admin import router as admin_router
from app.api.avatars import router as avatars_router
from app.api.dashboard import router as dashboard_router
from app.api.admin_migration import router as admin_migration_router
from app.routers.first_impressions import router as first_impressions_router
from app.routers.pre_angariacoes import router as pre_angariacoes_router
from app.routers.contratos_mediacao import router as cmi_router
from app.routers.website_auth import router as website_auth_router
from app.routers.website_clients import router as website_clients_router
from app.routers.clients import router as clients_router  # BD de clientes por agente
from app.routers.escrituras import router as escrituras_router  # Agendamento de escrituras
from app.routers.emergency_fix import router as emergency_fix_router  # Fix emergência
from app.routers.opportunities import router as opportunities_router  # Pipeline de oportunidades
from app.routers.proposals import router as proposals_router  # Propostas de negócio
from app.routers.tenant import router as tenant_router  # Configuração do tenant (terminologia, branding)
from app.api.admin_setup import setup_router as admin_setup_router
from app.api.migrate_agents import migrate_router as migrate_agents_router
from app.api.fix_properties import router as fix_properties_router
from app.platform.routes import router as platform_router  # Platform / Super Admin
try:
    from app.extranet.router_admin import router as extranet_admin_router
    from app.extranet.router_partners import router as extranet_partners_router
    from app.extranet.router_share import router as extranet_share_router
except Exception as extranet_import_error:
    print(f"[EXTRANET] Disabled at startup: {extranet_import_error}")
    extranet_admin_router = None
    extranet_partners_router = None
    extranet_share_router = None
from app.portals.routes import router as portals_router

# Multi-tenant middleware
from app.middleware.tenant import TenantMiddleware

# Debug endpoint to check database connection
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, DATABASE_URL, engine


# ========================================
# LIFESPAN CONTEXT (startup/shutdown)
# ========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerenciar ciclo de vida da aplicação
    - Startup: inicializar recursos
    - Shutdown: limpar recursos
    """
    # Startup
    print("🚀 [LIFESPAN] Aplicação iniciada")
    
    # Verificar/criar tabelas clients e escrituras se não existirem
    try:
        from sqlalchemy import text
        db = next(get_db())
        
        # Tabela clients
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'clients'
            )
        """))
        exists = result.scalar()
        if not exists:
            print("📊 [LIFESPAN] Tabela 'clients' não existe. Criando...")
            from app.models.client import Client, ClientTransacao
            from app.database import Base, engine
            Base.metadata.create_all(bind=engine, tables=[Client.__table__, ClientTransacao.__table__])
            print("✅ [LIFESPAN] Tabela 'clients' criada com sucesso!")
        
        # Tabela client_transacoes
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'client_transacoes'
            )
        """))
        exists = result.scalar()
        if not exists:
            print("📊 [LIFESPAN] Tabela 'client_transacoes' não existe. Criando...")
            from app.models.client import ClientTransacao
            from app.database import Base, engine
            Base.metadata.create_all(bind=engine, tables=[ClientTransacao.__table__])
            print("✅ [LIFESPAN] Tabela 'client_transacoes' criada com sucesso!")
        
        # Tabela escrituras
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'escrituras'
            )
        """))
        exists = result.scalar()
        if not exists:
            print("📊 [LIFESPAN] Tabela 'escrituras' não existe. Criando...")
            from app.models.escritura import Escritura
            from app.database import Base, engine
            Base.metadata.create_all(bind=engine, tables=[Escritura.__table__])
            print("✅ [LIFESPAN] Tabela 'escrituras' criada com sucesso!")
        
        # Tornar client_name nullable em first_impressions (migração)
        try:
            result = db.execute(text("""
                SELECT is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'first_impressions' AND column_name = 'client_name'
            """))
            is_nullable = result.scalar()
            if is_nullable == 'NO':
                print("📊 [LIFESPAN] Tornando client_name nullable em first_impressions...")
                db.execute(text("ALTER TABLE first_impressions ALTER COLUMN client_name DROP NOT NULL"))
                db.commit()
                print("✅ [LIFESPAN] client_name agora é nullable!")
        except Exception as e:
            print(f"⚠️ [LIFESPAN] Erro ao alterar client_name: {e}")
        
        db.close()
    except Exception as e:
        print(f"⚠️ [LIFESPAN] Erro ao verificar tabelas: {e}")
    
    yield
    
    # Shutdown
    print("🔴 [LIFESPAN] Aplicação encerrando...")


app = FastAPI(
    title="CRM PLUS Backend",
    description="API principal do sistema CRM PLUS para gestão imobiliária inteligente.",
    version="1.0.0",
    lifespan=lifespan,
)

# ========================================
# CORS CONFIGURATION
# ========================================

# Domínios base permitidos em produção (todos os tenants conhecidos)
BASE_PRODUCTION_ORIGINS = [
    # CRM Plus Platform (site-montra)
    "https://crmplus.trioto.tech",
    "https://www.crmplus.trioto.tech",
    # Super Admin
    "https://admin.crmplus.trioto.tech",
    # Imóveis Mais
    "https://backoffice.imoveismais.com",
    "https://www.imoveismais.com",
    "https://imoveismais.com",
    "https://montra.imoveismais.com",
    "https://app.imoveismais.com",
    "https://crmplusv7-production.up.railway.app",
    # Luis Carlos Gaspar
    "https://backoffice.luiscarlosgaspar.com",
    "https://www.luiscarlosgaspar.com",
    "https://luiscarlosgaspar.com",
    "https://app.luiscarlosgaspar.com",
    "https://luisgasparteam-backend-production.up.railway.app",
    # Vercel preview/production URLs (fallback)
    "https://backoffice-three-opal.vercel.app",
    "https://imoveismais-web.vercel.app",
    "https://luisgaspar-web.vercel.app",
    "https://luisgaspar-backoffice.vercel.app",
]

# Em produção, usar domínios específicos + regex para Vercel previews
CORS_ORIGINS_ENV = os.environ.get("CORS_ORIGINS", "")

if os.environ.get("RAILWAY_ENVIRONMENT"):
    # Em Railway/produção: usar lista base + domínios da variável de ambiente
    ALLOWED_ORIGINS = BASE_PRODUCTION_ORIGINS.copy()
    
    # Adicionar domínios da variável CORS_ORIGINS (se definida)
    if CORS_ORIGINS_ENV:
        extra_origins = [origin.strip() for origin in CORS_ORIGINS_ENV.split(",") if origin.strip()]
        ALLOWED_ORIGINS.extend(extra_origins)
    
    ALLOW_CREDENTIALS = True
    # SECURITY: Restringir regex para apenas subdomínios conhecidos do Vercel
    # Permite: *-toinos-projects.vercel.app, *-tvindima.vercel.app, crmplusv7-*.vercel.app
    # Também permite tenants auto-gerados:
    #   https://{slug}.crmplus.trioto.tech
    #   https://{slug}.bo.crmplus.trioto.tech
    ALLOW_ORIGIN_REGEX = (
        r"https://([a-z0-9-]+)\.(crmplus\.trioto\.tech|bo\.crmplus\.trioto\.tech)"
        r"|https://(.*-(toinos-projects|tvindima)|crmplusv7-.*|backoffice-.*|imoveismais-.*|luisgaspar-.*)\.vercel\.app"
    )
    
    print(f"[CORS] 🔒 Railway detected - Production mode")
    print(f"[CORS] ✅ Allowed origins: {ALLOWED_ORIGINS}")
    print(f"[CORS] ✅ Regex pattern: {ALLOW_ORIGIN_REGEX}")
    print(f"[CORS] ✅ Credentials: {ALLOW_CREDENTIALS}")
elif CORS_ORIGINS_ENV == "*":
    ALLOWED_ORIGINS = ["*"]
    ALLOW_CREDENTIALS = False
    ALLOW_ORIGIN_REGEX = None
else:
    # Desenvolvimento local
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4173",
        "http://localhost:5173",
    ]
    ALLOW_CREDENTIALS = True
    ALLOW_ORIGIN_REGEX = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOW_ORIGIN_REGEX,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# =====================================================
# TENANT MIDDLEWARE (MULTI-TENANCY COM SCHEMA ISOLATION)
# =====================================================
# Resolve o tenant a partir do header X-Tenant-Slug ou domínio
# e configura o schema do PostgreSQL para a requisição
app.add_middleware(TenantMiddleware)

# Extranet/Partners/Share routers (feature-guarded inside)
if extranet_admin_router is not None:
    app.include_router(extranet_admin_router)
if extranet_partners_router is not None:
    app.include_router(extranet_partners_router)
if extranet_share_router is not None:
    app.include_router(extranet_share_router)
app.include_router(portals_router)


# =====================================================
# ENDPOINT PÚBLICO DE BRANDING (SEM AUTENTICAÇÃO)
# =====================================================
# Este endpoint é público para que os frontends possam 
# obter o branding da agência sem necessidade de login

def _sanitize_branding_logo_for_tenant(tenant_slug: str, logo_url: str | None) -> str | None:
    """
    Hotfix de isolamento:
    - Bloqueia URL legacy global (sem namespace de tenant) para tenants afetados
      pelo cruzamento de branding.
    """
    if not logo_url:
        return None

    # Caminho legacy partilhado usado antes do isolamento por tenant no storage.
    is_legacy_global_logo = "/crm-plus/crm-branding/" in logo_url and "/crm-plus/imoveismais/" not in logo_url and "/crm-plus/luisgaspar/" not in logo_url

    # Incidente conhecido: imoveismais estava a receber logo de outro tenant via URL global.
    if tenant_slug == "imoveismais" and is_legacy_global_logo:
        print("[BRANDING] Legacy shared logo blocked for tenant imoveismais")
        return None

    return logo_url

@app.get("/public/branding")
def get_public_branding(request: Request, db: Session = Depends(get_db)):
    """
    Obter configurações de branding e tema da agência.
    
    PÚBLICO - Não requer autenticação.
    Usado pelos frontends (web, backoffice) para exibir logo, nome e cores do tema.
    Respeita o X-Tenant-Slug header para multi-tenant.
    """
    from app.platform.models import Tenant
    from sqlalchemy import text, create_engine as sa_create_engine
    import os
    
    # Defaults do tema escuro
    defaults = {
        "agency_name": "CRM Plus",
        "agency_slogan": "O seu negócio, simplificado",
        "agency_logo_url": None,
        "primary_color": "#E10600",
        "secondary_color": "#C5C5C5",
        "background_color": "#0B0B0D",
        "background_secondary": "#1A1A1F",
        "text_color": "#FFFFFF",
        "text_muted": "#9CA3AF",
        "border_color": "#2A2A2E",
        "accent_color": "#E10600",
        "sector": "real_estate"
    }
    
    # Obter tenant do header
    tenant_slug = request.headers.get("X-Tenant-Slug")
    
    # Se não tem tenant slug, retornar defaults (CRM Plus)
    if not tenant_slug:
        print(f"[BRANDING] No X-Tenant-Slug header, returning CRM Plus defaults")
        return defaults
    
    # Verificar se tenant existe (usando DB normal para lookup)
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        print(f"[BRANDING] Tenant '{tenant_slug}' not found in database, returning defaults")
        return defaults
    
    if not tenant.schema_name:
        print(f"[BRANDING] Tenant '{tenant_slug}' has no schema_name, returning defaults")
        return defaults
    
    try:
        # Criar engine completamente isolado sem event listeners
        db_url = os.environ.get("DATABASE_URL", "")
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        
        isolated_engine = sa_create_engine(db_url, pool_pre_ping=True)
        
        with isolated_engine.connect() as conn:
            # Definir search_path nesta conexão isolada
            conn.execute(text(f'SET search_path TO "{tenant.schema_name}", public'))
            print(f"[BRANDING] Using schema {tenant.schema_name} for tenant {tenant_slug}")
            
            # Buscar settings directamente com SQL para evitar problemas de ORM
            result = conn.execute(text("""
                SELECT agency_name, agency_slogan, agency_logo_url, 
                       primary_color, secondary_color, background_color,
                       background_secondary, text_color, text_muted,
                       border_color, accent_color
                FROM crm_settings 
                LIMIT 1
            """))
            row = result.first()
            
            if not row:
                print(f"[BRANDING] No CRMSettings in schema {tenant.schema_name}, returning defaults")
                isolated_engine.dispose()
                return defaults
            
            print(f"[BRANDING] Found settings for {tenant_slug}: {row[0]}")
            
            result_data = {
                "agency_name": row[0] or defaults["agency_name"],
                "agency_slogan": row[1] or defaults["agency_slogan"],
                "agency_logo_url": _sanitize_branding_logo_for_tenant(tenant_slug, row[2]),
                "primary_color": row[3] or defaults["primary_color"],
                "secondary_color": row[4] or defaults["secondary_color"],
                "background_color": row[5] or defaults["background_color"],
                "background_secondary": row[6] or defaults["background_secondary"],
                "text_color": row[7] or defaults["text_color"],
                "text_muted": row[8] or defaults["text_muted"],
                "border_color": row[9] or defaults["border_color"],
                "accent_color": row[10] or defaults["accent_color"],
                "sector": tenant.sector or "real_estate"
            }
            
        isolated_engine.dispose()
        return result_data
    except Exception as e:
        print(f"[BRANDING] Error fetching settings: {e}")
        return defaults


@app.get("/api/v1/tenant/config")
def get_tenant_config(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Obter configuração completa do tenant atual.
    
    PÚBLICO - Não requer autenticação.
    Usado pelos frontends para adaptar UI ao sector do tenant.
    """
    from app.platform.models import Tenant
    
    # Tentar obter tenant do middleware ou header
    tenant_slug = getattr(request.state, 'tenant_slug', None)
    if not tenant_slug:
        tenant_slug = request.headers.get('X-Tenant-Slug', '')
    
    # Se não tem slug, tentar extrair do host
    if not tenant_slug:
        host = request.headers.get('host', '')
        parts = host.split('.')
        if len(parts) >= 3:
            tenant_slug = parts[0]
    
    # Default config
    default_config = {
        "id": 0,
        "slug": tenant_slug or "default",
        "name": "CRM Plus",
        "sector": "real_estate",
        "plan": "basic",
        "primary_color": "#E10600",
        "secondary_color": "#C5C5C5",
        "logo_url": None,
        "features": [],
        "max_agents": 10,
        "max_properties": 100,
    }
    
    if not tenant_slug:
        return default_config
    
    try:
        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if not tenant:
            return default_config
        
        return {
            "id": tenant.id,
            "slug": tenant.slug,
            "name": tenant.name,
            "sector": tenant.sector or "real_estate",
            "plan": tenant.plan or "basic",
            "primary_color": tenant.primary_color or "#E10600",
            "secondary_color": tenant.secondary_color or "#C5C5C5",
            "logo_url": tenant.logo_url,
            "features": tenant.features or [],
            "max_agents": tenant.max_agents or 10,
            "max_properties": tenant.max_properties or 100,
        }
    except Exception as e:
        print(f"[TENANT CONFIG] Error: {e}")
        return default_config


app.include_router(leads_router)


# =====================================================
# EXCEPTION HANDLERS (FASE 2)
# =====================================================

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.exceptions import (
    BusinessRuleError,
    ResourceNotFoundError,
    UnauthorizedError,
    ConflictError,
    ValidationError,
    ExternalServiceError
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handler para erros de validação Pydantic (422)
    Retorna mensagem user-friendly ao invés de dump técnico
    """
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"] if x != "body")
        message = error["msg"]
        errors.append(f"{field}: {message}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Dados inválidos",
            "detail": " | ".join(errors),
            "fields": [str(e["loc"][-1]) for e in exc.errors()]
        }
    )


@app.exception_handler(ConflictError)
async def conflict_exception_handler(request: Request, exc: ConflictError):
    """Handler para erros de conflito (409)"""
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"error": "Conflito", "detail": exc.detail}
    )


@app.exception_handler(ExternalServiceError)
async def external_service_exception_handler(request: Request, exc: ExternalServiceError):
    """Handler para erros de serviços externos (503)"""
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "Serviço temporariamente indisponível",
            "detail": exc.detail,
            "retry": True
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handler genérico para erros não tratados (500)
    Evita expor stack traces ao cliente
    Adiciona headers CORS para que o browser possa ler o erro
    """
    import logging
    import traceback
    logger = logging.getLogger(__name__)
    error_detail = f"{type(exc).__name__}: {str(exc)}"
    stack_trace = traceback.format_exc()
    logger.error(f"Unhandled exception: {error_detail}\n{stack_trace}")
    
    # Determinar origin para CORS
    origin = request.headers.get("origin", "")
    cors_headers = {}
    
    # Verificar se a origem é permitida
    if origin in ALLOWED_ORIGINS or origin.endswith(".vercel.app"):
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    elif origin.startswith("http://localhost:"):
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        headers=cors_headers,
        content={
            "error": "Erro interno do servidor",
            # Em dev, mostrar o erro real para debug
            "detail": error_detail if os.environ.get("RAILWAY_ENVIRONMENT") else "Ocorreu um erro inesperado. Tente novamente ou contacte o suporte.",
            "support": "Se o problema persistir, contacte o suporte."
        }
    )


# =====================================================
# WEBSOCKET ENDPOINT (FASE 2)
# =====================================================

from fastapi import WebSocket, WebSocketDisconnect, Query
from app.core.websocket import connection_manager
from app.security import SECRET_KEY, ALGORITHM
import jwt

@app.websocket("/mobile/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access_token")
):
    """
    WebSocket endpoint para notificações real-time mobile
    
    Autenticação via query param: /mobile/ws?token=<jwt>
    
    Cliente recebe notificações de:
    - new_lead: Novo lead atribuído ao agente
    - visit_scheduled: Visita agendada confirmada
    - visit_reminder: Lembrete 30min antes da visita
    
    Formato mensagem:
    {
        "type": "new_lead",
        "title": "Novo Lead Recebido! 🎉",
        "body": "João Silva - Apartamento T2",
        "data": {...},
        "timestamp": "2024-01-22T10:30:00Z",
        "sound": "default"
    }
    """
    # Validar JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        agent_id = payload.get("agent_id")
        
        if not agent_id:
            await websocket.close(code=1008, reason="Token não contém agent_id")
            return
        
    except jwt.ExpiredSignatureError:
        await websocket.close(code=1008, reason="Token expirado")
        return
    except jwt.InvalidTokenError:
        await websocket.close(code=1008, reason="Token inválido")
        return
    
    # Conectar ao manager
    await connection_manager.connect(websocket, agent_id)
    
    try:
        # Loop para manter conexão aberta
        while True:
            # Receber mensagens do cliente (ping/pong para keep-alive)
            data = await websocket.receive_text()
            
            # Echo back (confirma que está online)
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
    
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, agent_id)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"WebSocket error: {str(e)}")
        connection_manager.disconnect(websocket, agent_id)


# =====================================================
# ROUTERS
# =====================================================

app.include_router(properties_router)
app.include_router(agents_router)
app.include_router(teams_router)
app.include_router(agencies_router)
app.include_router(calendar_router)
app.include_router(feed_router)
app.include_router(match_plus_router)
app.include_router(assistant_router)
app.include_router(notifications_router)
app.include_router(billing_router)
app.include_router(reports_router)
app.include_router(mobile_router)
app.include_router(users_router)

app.include_router(ingestion_router)
app.include_router(health_db_router)
app.include_router(health_router)
app.include_router(heath_router)
app.include_router(auth_router)
app.include_router(auth_mobile_router)
app.include_router(admin_router)  # Gestão de utilizadores
app.include_router(avatars_router)
app.include_router(dashboard_router)
app.include_router(admin_migration_router)
app.include_router(first_impressions_router)
app.include_router(pre_angariacoes_router)
app.include_router(cmi_router)
app.include_router(website_auth_router)  # Autenticação clientes do site
app.include_router(website_clients_router)  # Gestão de clientes do site
app.include_router(clients_router)  # BD de clientes por agente
app.include_router(escrituras_router)  # Agendamento de escrituras
app.include_router(opportunities_router)  # Pipeline de oportunidades
app.include_router(proposals_router)  # Propostas de negócio
app.include_router(tenant_router)  # Configuração do tenant (terminologia, branding)
app.include_router(emergency_fix_router)  # ENDPOINT DE EMERGÊNCIA PARA FIX
app.include_router(admin_setup_router)
app.include_router(migrate_agents_router)
app.include_router(fix_properties_router)
app.include_router(platform_router)  # Platform / Super Admin / Tenant Management

os.makedirs("media", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")


@app.get("/")
def root():
    return {
        "message": "CRM PLUS backend operacional.",
        "cors_origins": ALLOWED_ORIGINS,
        "cors_credentials": ALLOW_CREDENTIALS
    }


@app.get("/debug/db")
def debug_db():
    """Debug endpoint para verificar DB - PROTEGIDO em produção"""
    # SECURITY: Só acessível se ENABLE_DEBUG_ENDPOINTS estiver definido
    if os.environ.get("RAILWAY_ENVIRONMENT") and not os.environ.get("ENABLE_DEBUG_ENDPOINTS"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    
    from app.database import SessionLocal
    try:
        db = SessionLocal()
        from app.properties.models import Property
        count = db.query(Property).count()
        db.close()
        return {"database": "connected", "properties_count": count}
    except Exception as e:
        return {"database": "error", "error": str(e), "type": type(e).__name__}
