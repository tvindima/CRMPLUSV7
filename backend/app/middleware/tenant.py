"""
Middleware de resolução de Tenant para Multi-tenancy.

Resolve o tenant baseado em:
1. Header X-Tenant-Slug (para chamadas API diretas)
2. Domínio do request (Host header)
3. Subdomínio (ex: imoveismais.api.crmplus.pt)

Define o schema correto na BD para cada request.
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import re

from app.database import get_db, set_tenant_schema, DEFAULT_SCHEMA


# Cache de domínios -> tenant slug (para evitar queries repetidas)
_domain_cache: dict[str, str] = {}

# Rotas que não precisam de tenant (públicas/plataforma)
PUBLIC_ROUTES = [
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/platform/",
    "/public/",
    "/admin/setup/",  # Admin protegido por chave
    "/emergency/",     # Emergency protegido por chave
]


def is_public_route(path: str) -> bool:
    """Verifica se a rota é pública (não requer tenant)"""
    for route in PUBLIC_ROUTES:
        if path.startswith(route):
            return True
    return False


def resolve_tenant_from_domain(host: str, db: Session) -> Optional[str]:
    """
    Resolve o slug do tenant a partir do domínio.
    Procura na tabela tenants por primary_domain ou backoffice_domain.
    """
    # Remover porta se existir
    host = host.split(":")[0].lower()
    
    # Verificar cache
    if host in _domain_cache:
        return _domain_cache[host]
    
    try:
        from app.platform.models import Tenant
        
        tenant = db.query(Tenant).filter(
            (Tenant.primary_domain == host) | 
            (Tenant.backoffice_domain == host) |
            (Tenant.api_subdomain == host)
        ).first()
        
        if tenant and tenant.is_active:
            _domain_cache[host] = tenant.slug
            return tenant.slug
        
        # Tentar extrair subdomínio (ex: imoveismais.backoffice.vercel.app)
        parts = host.split(".")
        if len(parts) >= 3:
            potential_slug = parts[0].lower()
            # Verificar se este slug existe
            tenant = db.query(Tenant).filter(Tenant.slug == potential_slug).first()
            if tenant and tenant.is_active:
                _domain_cache[host] = tenant.slug
                return tenant.slug
        
        return None
    except Exception as e:
        print(f"[TENANT] Erro ao resolver tenant para '{host}': {e}")
        return None


def clear_domain_cache():
    """Limpa o cache de domínios (usar após atualizar tenants)"""
    global _domain_cache
    _domain_cache = {}


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware que resolve o tenant para cada request e define o schema da BD.
    """
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Rotas públicas não precisam de tenant
        if is_public_route(path):
            set_tenant_schema(DEFAULT_SCHEMA)
            return await call_next(request)
        
        # Tentar resolver tenant
        tenant_slug = None
        
        # 1. Header explícito (prioridade máxima)
        tenant_slug = request.headers.get("X-Tenant-Slug")
        
        # 2. Domínio do request
        if not tenant_slug:
            host = request.headers.get("Host", "")
            if host:
                # Criar sessão temporária para query
                db = next(get_db())
                try:
                    tenant_slug = resolve_tenant_from_domain(host, db)
                finally:
                    db.close()
        
        # 3. Default para 'public' se não encontrado (backwards compatible)
        if not tenant_slug:
            # Em produção, podemos querer rejeitar requests sem tenant
            # Por agora, usar schema public para backwards compatibility
            tenant_slug = None
        
        # Definir schema
        if tenant_slug:
            # Schema do tenant usa o slug como nome
            # Ex: tenant 'imoveismais' -> schema 'imoveismais'
            schema_name = tenant_slug.lower().replace("-", "_")
            set_tenant_schema(schema_name)
            
            # Adicionar tenant ao request state para uso nos endpoints
            request.state.tenant_slug = tenant_slug
            request.state.tenant_schema = schema_name
        else:
            # Sem tenant, usar schema public
            set_tenant_schema(DEFAULT_SCHEMA)
            request.state.tenant_slug = None
            request.state.tenant_schema = DEFAULT_SCHEMA
        
        response = await call_next(request)
        return response


def get_current_tenant(request: Request) -> Optional[str]:
    """
    Dependency para obter o tenant atual do request.
    Retorna o slug do tenant ou None se não houver.
    """
    return getattr(request.state, 'tenant_slug', None)


def require_tenant(request: Request) -> str:
    """
    Dependency que requer um tenant válido.
    Levanta HTTPException se não houver tenant.
    """
    tenant = get_current_tenant(request)
    if not tenant:
        raise HTTPException(
            status_code=400,
            detail="Tenant não identificado. Use header X-Tenant-Slug ou aceda via domínio do tenant."
        )
    return tenant
