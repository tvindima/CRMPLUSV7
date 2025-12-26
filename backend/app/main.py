import os
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
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
from app.api.admin_setup import setup_router as admin_setup_router
from app.api.migrate_agents import migrate_router as migrate_agents_router
from app.api.fix_properties import router as fix_properties_router


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

# Ler de environment variable Railway (CORS_ORIGINS ou CRMPLUS_CORS_ORIGINS)
CORS_ORIGINS_ENV = os.environ.get("CORS_ORIGINS", os.environ.get("CRMPLUS_CORS_ORIGINS", ""))
# Fallback seguro para desenvolvimento e pré-visualizações Vercel
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4173",
    "http://localhost:5173",
    # Mobile web (Vercel)
    "https://crmplusv7-mobile.vercel.app",
    "https://crmplusv7-mobile-picdp19if-toinos-projects.vercel.app",
    "https://crmplusv7-mobile-bapejk48k-toinos-projects.vercel.app",
    "https://crmplusv7-mobile-fzh70hl4x-toinos-projects.vercel.app",
    # Backoffice (Vercel)
    "https://crmplusv7.vercel.app",
    "https://backoffice-git-main-toinos-projects.vercel.app",
    "https://backoffice-toinos-projects.vercel.app",
    # Web site-montra (Vercel)
    "https://web-steel-gamma-66.vercel.app",
]

if CORS_ORIGINS_ENV == "*":
    # Permitir todas origens (para evitar bloqueios de CORS em produção; tokens são Bearer)
    ALLOWED_ORIGINS = ["*"]
    ALLOW_CREDENTIALS = False  # Obrigatório com "*"
elif CORS_ORIGINS_ENV:
    # Usar origens específicas da env var
    ALLOWED_ORIGINS = [o.strip() for o in CORS_ORIGINS_ENV.split(",") if o.strip()]
    ALLOW_CREDENTIALS = True
else:
    # Fallback seguro: usar defaults + regex para Vercel previews
    ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS
    ALLOW_CREDENTIALS = True

# Regex para aceitar todos deployments Vercel (previews + produção) ou override via env
ALLOW_ORIGIN_REGEX = os.environ.get("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app|https://.*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOW_ORIGIN_REGEX,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

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
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Erro interno do servidor",
            "detail": "Ocorreu um erro inesperado. Por favor, tente novamente.",
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
app.include_router(admin_setup_router)
app.include_router(migrate_agents_router)
app.include_router(fix_properties_router)

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
    """Debug endpoint para verificar DB no Railway"""
    from app.database import SessionLocal
    try:
        db = SessionLocal()
        from app.properties.models import Property
        count = db.query(Property).count()
        db.close()
        return {"database": "connected", "properties_count": count}
    except Exception as e:
        return {"database": "error", "error": str(e), "type": type(e).__name__}
