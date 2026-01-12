"""
Router de configuração do Tenant atual.

Endpoints para obter configuração, terminologia e branding do tenant.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.database import get_db, current_tenant_schema
from app.platform.models import Tenant

router = APIRouter(prefix="/tenant", tags=["tenant"])


# Terminologia por sector
SECTOR_TERMINOLOGY = {
    "real_estate": {
        "item": "imóvel",
        "items": "imóveis",
        "itemCapital": "Imóvel",
        "itemsCapital": "Imóveis",
        "agent": "agente",
        "agents": "agentes",
        "agentCapital": "Agente",
        "agentsCapital": "Agentes",
        "agentRole": "Agente Imobiliário",
        "searchPlaceholder": "Pesquisar imóveis...",
        "noItemsFound": "Nenhum imóvel encontrado",
        "newItem": "Novo Imóvel",
        "editItem": "Editar Imóvel",
        "menuItems": "Imóveis",
        "menuLeads": "Leads",
        "menuClients": "Clientes",
        "menuAgenda": "Agenda",
        "visit": "visita",
        "visits": "visitas",
        "proposal": "proposta",
        "proposals": "propostas",
    },
    "automotive": {
        "item": "veículo",
        "items": "veículos",
        "itemCapital": "Veículo",
        "itemsCapital": "Veículos",
        "agent": "comercial",
        "agents": "comerciais",
        "agentCapital": "Comercial",
        "agentsCapital": "Comerciais",
        "agentRole": "Comercial",
        "searchPlaceholder": "Pesquisar veículos...",
        "noItemsFound": "Nenhum veículo encontrado",
        "newItem": "Novo Veículo",
        "editItem": "Editar Veículo",
        "menuItems": "Veículos",
        "menuLeads": "Leads",
        "menuClients": "Clientes",
        "menuAgenda": "Agenda",
        "visit": "test drive",
        "visits": "test drives",
        "proposal": "proposta",
        "proposals": "propostas",
    },
    "boats": {
        "item": "embarcação",
        "items": "embarcações",
        "itemCapital": "Embarcação",
        "itemsCapital": "Embarcações",
        "agent": "consultor",
        "agents": "consultores",
        "agentCapital": "Consultor",
        "agentsCapital": "Consultores",
        "agentRole": "Consultor Náutico",
        "searchPlaceholder": "Pesquisar embarcações...",
        "noItemsFound": "Nenhuma embarcação encontrada",
        "newItem": "Nova Embarcação",
        "editItem": "Editar Embarcação",
        "menuItems": "Embarcações",
        "menuLeads": "Leads",
        "menuClients": "Clientes",
        "menuAgenda": "Agenda",
        "visit": "visita",
        "visits": "visitas",
        "proposal": "proposta",
        "proposals": "propostas",
    },
    "retail": {
        "item": "produto",
        "items": "produtos",
        "itemCapital": "Produto",
        "itemsCapital": "Produtos",
        "agent": "vendedor",
        "agents": "vendedores",
        "agentCapital": "Vendedor",
        "agentsCapital": "Vendedores",
        "agentRole": "Vendedor",
        "searchPlaceholder": "Pesquisar produtos...",
        "noItemsFound": "Nenhum produto encontrado",
        "newItem": "Novo Produto",
        "editItem": "Editar Produto",
        "menuItems": "Produtos",
        "menuLeads": "Leads",
        "menuClients": "Clientes",
        "menuAgenda": "Agenda",
        "visit": "atendimento",
        "visits": "atendimentos",
        "proposal": "orçamento",
        "proposals": "orçamentos",
    },
    "services": {
        "item": "serviço",
        "items": "serviços",
        "itemCapital": "Serviço",
        "itemsCapital": "Serviços",
        "agent": "consultor",
        "agents": "consultores",
        "agentCapital": "Consultor",
        "agentsCapital": "Consultores",
        "agentRole": "Consultor",
        "searchPlaceholder": "Pesquisar serviços...",
        "noItemsFound": "Nenhum serviço encontrado",
        "newItem": "Novo Serviço",
        "editItem": "Editar Serviço",
        "menuItems": "Serviços",
        "menuLeads": "Leads",
        "menuClients": "Clientes",
        "menuAgenda": "Agenda",
        "visit": "reunião",
        "visits": "reuniões",
        "proposal": "proposta",
        "proposals": "propostas",
    },
    "hospitality": {
        "item": "alojamento",
        "items": "alojamentos",
        "itemCapital": "Alojamento",
        "itemsCapital": "Alojamentos",
        "agent": "gestor",
        "agents": "gestores",
        "agentCapital": "Gestor",
        "agentsCapital": "Gestores",
        "agentRole": "Gestor de Reservas",
        "searchPlaceholder": "Pesquisar alojamentos...",
        "noItemsFound": "Nenhum alojamento encontrado",
        "newItem": "Novo Alojamento",
        "editItem": "Editar Alojamento",
        "menuItems": "Alojamentos",
        "menuLeads": "Reservas",
        "menuClients": "Hóspedes",
        "menuAgenda": "Agenda",
        "visit": "check-in",
        "visits": "check-ins",
        "proposal": "reserva",
        "proposals": "reservas",
    },
    "other": {
        "item": "item",
        "items": "itens",
        "itemCapital": "Item",
        "itemsCapital": "Itens",
        "agent": "colaborador",
        "agents": "colaboradores",
        "agentCapital": "Colaborador",
        "agentsCapital": "Colaboradores",
        "agentRole": "Colaborador",
        "searchPlaceholder": "Pesquisar...",
        "noItemsFound": "Nenhum item encontrado",
        "newItem": "Novo Item",
        "editItem": "Editar Item",
        "menuItems": "Itens",
        "menuLeads": "Leads",
        "menuClients": "Clientes",
        "menuAgenda": "Agenda",
        "visit": "evento",
        "visits": "eventos",
        "proposal": "proposta",
        "proposals": "propostas",
    },
}


class TenantConfigResponse(BaseModel):
    """Resposta com configuração completa do tenant"""
    slug: str
    name: str
    sector: str
    terminology: Dict[str, str]
    branding: Dict[str, Any]
    features: Dict[str, Any]
    plan: str


class TerminologyResponse(BaseModel):
    """Resposta apenas com terminologia"""
    sector: str
    terminology: Dict[str, str]


def get_current_tenant(db: Session) -> Optional[Tenant]:
    """Obtém o tenant atual baseado no schema activo"""
    schema = current_tenant_schema.get()
    if not schema or schema == "public":
        return None
    
    # Schema é "tenant_<slug>", extrair o slug
    if schema.startswith("tenant_"):
        slug = schema[7:]  # Remove "tenant_"
    else:
        slug = schema
    
    return db.query(Tenant).filter(Tenant.slug == slug).first()


@router.get("/config", response_model=TenantConfigResponse)
async def get_tenant_config(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Obter configuração completa do tenant actual.
    Inclui sector, terminologia, branding e features.
    """
    tenant = get_current_tenant(db)
    
    if not tenant:
        # Fallback para tenant default ou primeiro tenant
        tenant = db.query(Tenant).filter(Tenant.is_active == True).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    sector = tenant.sector or "real_estate"
    terminology = SECTOR_TERMINOLOGY.get(sector, SECTOR_TERMINOLOGY["real_estate"])
    
    # Se tiver terminologia customizada, fazer merge
    # if tenant.custom_terminology:
    #     terminology = {**terminology, **tenant.custom_terminology}
    
    return TenantConfigResponse(
        slug=tenant.slug,
        name=tenant.name,
        sector=sector,
        terminology=terminology,
        branding={
            "logo_url": tenant.logo_url,
            "primary_color": tenant.primary_color or "#00d9ff",
            "secondary_color": tenant.secondary_color or "#8b5cf6",
        },
        features=tenant.features or {},
        plan=tenant.plan or "basic",
    )


@router.get("/terminology", response_model=TerminologyResponse)
async def get_tenant_terminology(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Obter apenas a terminologia do tenant actual.
    Endpoint leve para apps mobile carregarem termos.
    """
    tenant = get_current_tenant(db)
    
    if not tenant:
        # Fallback para tenant default
        tenant = db.query(Tenant).filter(Tenant.is_active == True).first()
    
    sector = tenant.sector if tenant else "real_estate"
    terminology = SECTOR_TERMINOLOGY.get(sector, SECTOR_TERMINOLOGY["real_estate"])
    
    # Se tiver terminologia customizada, fazer merge
    # if tenant and tenant.custom_terminology:
    #     terminology = {**terminology, **tenant.custom_terminology}
    
    return TerminologyResponse(
        sector=sector,
        terminology=terminology,
    )


@router.get("/sectors")
async def list_available_sectors():
    """
    Listar todos os setores disponíveis e suas terminologias.
    Útil para configuração de novos tenants.
    """
    return {
        "sectors": list(SECTOR_TERMINOLOGY.keys()),
        "terminology_by_sector": SECTOR_TERMINOLOGY,
    }
