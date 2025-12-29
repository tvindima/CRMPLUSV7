from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from . import services, schemas
from app.database import get_db
from app.security import require_staff

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("/", response_model=list[schemas.LeadOut])
def list_leads(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    source: Optional[str] = None,
    assigned_agent_id: Optional[int] = None,
    property_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Listar leads com filtros opcionais:
    - status: NEW, CONTACTED, QUALIFIED, CONVERTED, LOST, etc
    - source: WEBSITE, PHONE, EMAIL, MANUAL, etc
    - assigned_agent_id: Filtrar por agente
    - property_id: Filtrar por propriedade
    """
    return services.get_leads(
        db,
        skip=skip,
        limit=limit,
        status=status,
        source=source,
        assigned_agent_id=assigned_agent_id,
        property_id=property_id
    )


@router.get("/stats", response_model=dict)
def get_lead_stats(db: Session = Depends(get_db)):
    """Estatísticas de leads por status"""
    return services.get_lead_stats(db)


@router.get("/analytics/conversion", response_model=dict)
def get_conversion_analytics(
    days: int = Query(30, description="Período em dias"),
    user=Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Analytics de conversão de leads.
    
    Retorna:
    - Taxa de conversão geral
    - Funil de vendas (quantas leads em cada status)
    - Conversão por origem (website, phone, email, etc)
    - Tempo médio até primeira contacto
    - Tempo médio até conversão
    """
    return services.get_conversion_analytics(db, days)


@router.get("/analytics/agent-performance", response_model=dict)
def get_agent_performance(
    days: int = Query(30, description="Período em dias"),
    user=Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Performance de agentes com leads.
    
    Retorna por agente:
    - Total de leads atribuídas
    - Taxa de conversão
    - Tempo médio de resposta
    - Leads ativas vs. convertidas vs. perdidas
    """
    return services.get_agent_performance(db, days)


@router.get("/analytics/funnel", response_model=dict)
def get_funnel_analytics(
    days: int = Query(30, description="Período em dias"),
    user=Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Funil de vendas completo.
    
    Mostra quantas leads estão em cada estágio:
    NEW → CONTACTED → QUALIFIED → PROPOSAL_SENT → VISIT_SCHEDULED → NEGOTIATION → CONVERTED
    """
    return services.get_funnel_analytics(db, days)


@router.get("/{lead_id}", response_model=schemas.LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = services.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/", response_model=schemas.LeadOut, status_code=201)
def create_lead(lead: schemas.LeadCreate, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Criar lead manualmente no backoffice"""
    return services.create_lead(db, lead)


@router.post("/from-website", response_model=schemas.LeadOut, status_code=201)
async def create_lead_from_website(lead_data: schemas.LeadCreateFromWebsite, db: Session = Depends(get_db)):
    """
    Endpoint PÚBLICO para receber leads do site montra.
    
    Automaticamente:
    - Atribui ao agente da propriedade
    - Define source=WEBSITE
    - Status inicial=NEW
    """
    return await services.create_lead_from_website(db, lead_data)


@router.put("/{lead_id}", response_model=schemas.LeadOut)
def update_lead(
    lead_id: int,
    lead_update: schemas.LeadUpdate,
    user=Depends(require_staff),
    db: Session = Depends(get_db)
):
    """Atualizar lead (status, dados, etc)"""
    lead = services.update_lead(db, lead_id, lead_update)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/{lead_id}/assign", response_model=schemas.LeadOut)
def assign_lead(
    lead_id: int,
    assignment: schemas.LeadAssign,
    user=Depends(require_staff),
    db: Session = Depends(get_db)
):
    """Atribuir lead a um agente específico"""
    lead = services.assign_lead_to_agent(db, lead_id, assignment.agent_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/distribute", response_model=dict)
def distribute_leads(
    lead_ids: list[int],
    strategy: str = Query("round_robin", description="Estratégia: round_robin, least_busy, manual"),
    target_agent_id: Optional[int] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Distribuir múltiplas leads de uma vez.
    
    Estratégias:
    - round_robin: Distribui igualmente entre agentes ativos
    - least_busy: Atribui ao agente com menos leads ativas
    - manual: Atribui todas ao target_agent_id especificado
    """
    result = services.distribute_leads(db, lead_ids, strategy, target_agent_id)
    return result


@router.delete("/{lead_id}", response_model=schemas.LeadOut)
def delete_lead(lead_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    lead = services.delete_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead
