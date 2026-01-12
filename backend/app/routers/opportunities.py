"""
Router para gestão de Oportunidades
CRUD completo + pipeline de vendas
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.opportunity import Opportunity
from app.security import get_current_user, get_effective_agent_id


router = APIRouter(prefix="/opportunities", tags=["opportunities"])


# === Pydantic Schemas ===

class OpportunityCreate(BaseModel):
    """Schema para criar oportunidade"""
    lead_id: int
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    title: Optional[str] = None
    status: str = Field(default="new")
    priority: str = Field(default="medium")
    estimated_value: Optional[Decimal] = None
    proposed_value: Optional[Decimal] = None
    commission_percentage: Optional[Decimal] = None
    expected_close_date: Optional[datetime] = None
    next_action_date: Optional[datetime] = None
    next_action: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    tags: Optional[List[str]] = []


class OpportunityUpdate(BaseModel):
    """Schema para atualizar oportunidade"""
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    title: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    proposed_value: Optional[Decimal] = None
    commission_percentage: Optional[Decimal] = None
    expected_commission: Optional[Decimal] = None
    expected_close_date: Optional[datetime] = None
    last_contact_date: Optional[datetime] = None
    next_action_date: Optional[datetime] = None
    next_action: Optional[str] = None
    notes: Optional[str] = None
    loss_reason: Optional[str] = None
    tags: Optional[List[str]] = None


class OpportunityResponse(BaseModel):
    """Schema de resposta"""
    id: int
    agent_id: int
    lead_id: int
    property_id: Optional[int]
    client_id: Optional[int]
    title: Optional[str]
    status: str
    priority: str
    estimated_value: Optional[Decimal]
    proposed_value: Optional[Decimal]
    commission_percentage: Optional[Decimal]
    expected_commission: Optional[Decimal]
    expected_close_date: Optional[datetime]
    last_contact_date: Optional[datetime]
    next_action_date: Optional[datetime]
    next_action: Optional[str]
    notes: Optional[str]
    loss_reason: Optional[str]
    source: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True


# === Endpoints ===

@router.get("/", response_model=List[OpportunityResponse])
def list_opportunities(
    agent_id: Optional[int] = Query(None, description="Filtrar por agente"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    priority: Optional[str] = Query(None, description="Filtrar por prioridade"),
    lead_id: Optional[int] = Query(None, description="Filtrar por lead"),
    property_id: Optional[int] = Query(None, description="Filtrar por imóvel"),
    search: Optional[str] = Query(None, description="Pesquisar por título"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Listar oportunidades com filtros"""
    query = db.query(Opportunity)
    
    # Filtrar por agente (se especificado ou se não é admin)
    effective_agent_id = get_effective_agent_id(None, db) if not agent_id else agent_id
    if effective_agent_id and current_user.role != "admin":
        query = query.filter(Opportunity.agent_id == effective_agent_id)
    elif agent_id:
        query = query.filter(Opportunity.agent_id == agent_id)
    
    # Filtros
    if status:
        query = query.filter(Opportunity.status == status)
    if priority:
        query = query.filter(Opportunity.priority == priority)
    if lead_id:
        query = query.filter(Opportunity.lead_id == lead_id)
    if property_id:
        query = query.filter(Opportunity.property_id == property_id)
    if search:
        query = query.filter(Opportunity.title.ilike(f"%{search}%"))
    
    # Ordenar por data de criação (mais recentes primeiro)
    query = query.order_by(desc(Opportunity.created_at))
    
    return query.offset(skip).limit(limit).all()


@router.get("/stats")
def get_opportunity_stats(
    agent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Estatísticas do pipeline de oportunidades"""
    query = db.query(Opportunity)
    
    # Filtrar por agente se necessário
    effective_agent_id = get_effective_agent_id(None, db) if not agent_id else agent_id
    if effective_agent_id and current_user.role != "admin":
        query = query.filter(Opportunity.agent_id == effective_agent_id)
    elif agent_id:
        query = query.filter(Opportunity.agent_id == agent_id)
    
    total = query.count()
    
    # Contagem por status
    by_status = {}
    status_counts = db.query(
        Opportunity.status, 
        func.count(Opportunity.id)
    ).group_by(Opportunity.status).all()
    for status, count in status_counts:
        by_status[status] = count
    
    # Valor total em pipeline
    pipeline_value = db.query(func.sum(Opportunity.estimated_value)).filter(
        Opportunity.status.notin_(["lost", "rejected", "won"])
    ).scalar() or 0
    
    # Valor ganho
    won_value = db.query(func.sum(Opportunity.proposed_value)).filter(
        Opportunity.status == "won"
    ).scalar() or 0
    
    # Taxa de conversão
    won_count = by_status.get("won", 0)
    closed_count = won_count + by_status.get("lost", 0) + by_status.get("rejected", 0)
    conversion_rate = (won_count / closed_count * 100) if closed_count > 0 else 0
    
    return {
        "total": total,
        "by_status": by_status,
        "pipeline_value": float(pipeline_value),
        "won_value": float(won_value),
        "conversion_rate": round(conversion_rate, 1),
        "avg_deal_size": float(won_value / won_count) if won_count > 0 else 0
    }


@router.get("/{opportunity_id}", response_model=OpportunityResponse)
def get_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obter oportunidade por ID"""
    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada")
    return opportunity


@router.post("/", response_model=OpportunityResponse)
def create_opportunity(
    data: OpportunityCreate,
    agent_id: int = Query(..., description="ID do agente"),
    agency_id: Optional[int] = Query(None, description="ID da agência"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Criar nova oportunidade"""
    # Gerar título automático se não fornecido
    title = data.title
    if not title:
        from app.leads.models import Lead
        lead = db.query(Lead).filter(Lead.id == data.lead_id).first()
        if lead:
            title = f"{lead.name}"
            if data.property_id:
                from app.properties.models import Property
                prop = db.query(Property).filter(Property.id == data.property_id).first()
                if prop:
                    title += f" - {prop.title or prop.reference}"
    
    opportunity = Opportunity(
        agent_id=agent_id,
        agency_id=agency_id,
        lead_id=data.lead_id,
        property_id=data.property_id,
        client_id=data.client_id,
        title=title,
        status=data.status,
        priority=data.priority,
        estimated_value=data.estimated_value,
        proposed_value=data.proposed_value,
        commission_percentage=data.commission_percentage,
        expected_close_date=data.expected_close_date,
        next_action_date=data.next_action_date,
        next_action=data.next_action,
        notes=data.notes,
        source=data.source,
        tags=data.tags or []
    )
    
    # Calcular comissão esperada
    if opportunity.estimated_value and opportunity.commission_percentage:
        opportunity.expected_commission = opportunity.estimated_value * opportunity.commission_percentage / 100
    
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    
    return opportunity


@router.put("/{opportunity_id}", response_model=OpportunityResponse)
def update_opportunity(
    opportunity_id: int,
    data: OpportunityUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Atualizar oportunidade"""
    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada")
    
    # Atualizar campos
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(opportunity, field, value)
    
    # Recalcular comissão esperada se valores mudaram
    if opportunity.estimated_value and opportunity.commission_percentage:
        opportunity.expected_commission = opportunity.estimated_value * opportunity.commission_percentage / 100
    
    # Se mudou para status fechado, registar data
    if data.status in ["won", "lost", "rejected"] and not opportunity.closed_at:
        opportunity.closed_at = datetime.utcnow()
    
    opportunity.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(opportunity)
    
    return opportunity


@router.patch("/{opportunity_id}/status")
def update_opportunity_status(
    opportunity_id: int,
    status: str = Query(..., description="Novo status"),
    loss_reason: Optional[str] = Query(None, description="Motivo se perdida"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Atualizar apenas o status da oportunidade"""
    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada")
    
    opportunity.status = status
    
    if status in ["won", "lost", "rejected"]:
        opportunity.closed_at = datetime.utcnow()
        if loss_reason:
            opportunity.loss_reason = loss_reason
    
    opportunity.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "status": status}


@router.delete("/{opportunity_id}")
def delete_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar oportunidade"""
    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada")
    
    db.delete(opportunity)
    db.commit()
    
    return {"success": True, "message": "Oportunidade eliminada"}
