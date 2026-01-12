"""
Router para gestão de Propostas
CRUD completo + geração de documentos + assinaturas
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.proposal import Proposal
from app.security import get_current_user, get_effective_agent_id


router = APIRouter(prefix="/proposals", tags=["proposals"])


# === Pydantic Schemas ===

class ProposalCreate(BaseModel):
    """Schema para criar proposta"""
    opportunity_id: int
    property_id: Optional[int] = None
    client_id: Optional[int] = None
    lead_id: Optional[int] = None
    proposal_type: str = Field(default="purchase")
    proposed_value: Decimal
    deposit_value: Optional[Decimal] = None
    deposit_percentage: Optional[Decimal] = None
    commission_percentage: Optional[Decimal] = None
    conditions: Optional[str] = None
    financing_type: Optional[str] = None
    financing_bank: Optional[str] = None
    financing_amount: Optional[Decimal] = None
    valid_until: Optional[date] = None
    cpcv_date: Optional[date] = None
    deed_date: Optional[date] = None
    internal_notes: Optional[str] = None
    tags: Optional[List[str]] = []


class ProposalUpdate(BaseModel):
    """Schema para atualizar proposta"""
    status: Optional[str] = None
    proposed_value: Optional[Decimal] = None
    deposit_value: Optional[Decimal] = None
    deposit_percentage: Optional[Decimal] = None
    commission_percentage: Optional[Decimal] = None
    commission_value: Optional[Decimal] = None
    conditions: Optional[str] = None
    financing_type: Optional[str] = None
    financing_bank: Optional[str] = None
    financing_approved: Optional[bool] = None
    financing_amount: Optional[Decimal] = None
    valid_until: Optional[date] = None
    cpcv_date: Optional[date] = None
    deed_date: Optional[date] = None
    internal_notes: Optional[str] = None
    client_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    tags: Optional[List[str]] = None


class ProposalResponse(BaseModel):
    """Schema de resposta"""
    id: int
    agent_id: int
    opportunity_id: int
    property_id: Optional[int]
    client_id: Optional[int]
    lead_id: Optional[int]
    proposal_number: str
    proposal_type: str
    status: str
    version: int
    proposed_value: Decimal
    deposit_value: Optional[Decimal]
    deposit_percentage: Optional[Decimal]
    commission_percentage: Optional[Decimal]
    commission_value: Optional[Decimal]
    conditions: Optional[str]
    financing_type: Optional[str]
    financing_bank: Optional[str]
    financing_approved: Optional[bool]
    financing_amount: Optional[Decimal]
    valid_until: Optional[date]
    cpcv_date: Optional[date]
    deed_date: Optional[date]
    pdf_url: Optional[str]
    signed_pdf_url: Optional[str]
    internal_notes: Optional[str]
    client_notes: Optional[str]
    rejection_reason: Optional[str]
    is_counter_offer: bool
    parent_proposal_id: Optional[int]
    counter_offer_value: Optional[Decimal]
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime]
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True


# === Helper Functions ===

def generate_proposal_number(db: Session) -> str:
    """Gera número único de proposta: PROP-YYYY-NNNN"""
    year = datetime.now().year
    
    # Contar propostas do ano atual
    count = db.query(Proposal).filter(
        Proposal.proposal_number.like(f"PROP-{year}-%")
    ).count()
    
    return f"PROP-{year}-{str(count + 1).zfill(4)}"


# === Endpoints ===

@router.get("/", response_model=List[ProposalResponse])
def list_proposals(
    agent_id: Optional[int] = Query(None, description="Filtrar por agente"),
    opportunity_id: Optional[int] = Query(None, description="Filtrar por oportunidade"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    property_id: Optional[int] = Query(None, description="Filtrar por imóvel"),
    client_id: Optional[int] = Query(None, description="Filtrar por cliente"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Listar propostas com filtros"""
    query = db.query(Proposal)
    
    # Filtrar por agente
    effective_agent_id = get_effective_agent_id(None, db) if not agent_id else agent_id
    if effective_agent_id and current_user.role != "admin":
        query = query.filter(Proposal.agent_id == effective_agent_id)
    elif agent_id:
        query = query.filter(Proposal.agent_id == agent_id)
    
    # Filtros
    if opportunity_id:
        query = query.filter(Proposal.opportunity_id == opportunity_id)
    if status:
        query = query.filter(Proposal.status == status)
    if property_id:
        query = query.filter(Proposal.property_id == property_id)
    if client_id:
        query = query.filter(Proposal.client_id == client_id)
    
    # Ordenar por data de criação (mais recentes primeiro)
    query = query.order_by(desc(Proposal.created_at))
    
    return query.offset(skip).limit(limit).all()


@router.get("/stats")
def get_proposal_stats(
    agent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Estatísticas de propostas"""
    query = db.query(Proposal)
    
    # Filtrar por agente se necessário
    effective_agent_id = get_effective_agent_id(None, db) if not agent_id else agent_id
    if effective_agent_id and current_user.role != "admin":
        query = query.filter(Proposal.agent_id == effective_agent_id)
    elif agent_id:
        query = query.filter(Proposal.agent_id == agent_id)
    
    total = query.count()
    
    # Contagem por status
    by_status = {}
    status_counts = db.query(
        Proposal.status, 
        func.count(Proposal.id)
    ).group_by(Proposal.status).all()
    for status, count in status_counts:
        by_status[status] = count
    
    # Valor total de propostas aceites
    accepted_value = db.query(func.sum(Proposal.proposed_value)).filter(
        Proposal.status == "accepted"
    ).scalar() or 0
    
    # Valor médio de propostas
    avg_value = db.query(func.avg(Proposal.proposed_value)).scalar() or 0
    
    # Taxa de aceitação
    accepted_count = by_status.get("accepted", 0)
    responded_count = accepted_count + by_status.get("rejected", 0)
    acceptance_rate = (accepted_count / responded_count * 100) if responded_count > 0 else 0
    
    return {
        "total": total,
        "by_status": by_status,
        "accepted_value": float(accepted_value),
        "avg_value": float(avg_value),
        "acceptance_rate": round(acceptance_rate, 1),
        "pending": by_status.get("sent", 0) + by_status.get("under_analysis", 0)
    }


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obter proposta por ID"""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")
    return proposal


@router.post("/", response_model=ProposalResponse)
def create_proposal(
    data: ProposalCreate,
    agent_id: int = Query(..., description="ID do agente"),
    agency_id: Optional[int] = Query(None, description="ID da agência"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Criar nova proposta"""
    # Gerar número de proposta
    proposal_number = generate_proposal_number(db)
    
    # Calcular comissão se percentagem fornecida
    commission_value = None
    if data.commission_percentage and data.proposed_value:
        commission_value = data.proposed_value * data.commission_percentage / 100
    
    proposal = Proposal(
        agent_id=agent_id,
        agency_id=agency_id,
        opportunity_id=data.opportunity_id,
        property_id=data.property_id,
        client_id=data.client_id,
        lead_id=data.lead_id,
        proposal_number=proposal_number,
        proposal_type=data.proposal_type,
        status="draft",
        proposed_value=data.proposed_value,
        deposit_value=data.deposit_value,
        deposit_percentage=data.deposit_percentage,
        commission_percentage=data.commission_percentage,
        commission_value=commission_value,
        conditions=data.conditions,
        financing_type=data.financing_type,
        financing_bank=data.financing_bank,
        financing_amount=data.financing_amount,
        valid_until=data.valid_until,
        cpcv_date=data.cpcv_date,
        deed_date=data.deed_date,
        internal_notes=data.internal_notes,
        tags=data.tags or []
    )
    
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    
    return proposal


@router.put("/{proposal_id}", response_model=ProposalResponse)
def update_proposal(
    proposal_id: int,
    data: ProposalUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Atualizar proposta"""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")
    
    # Não permitir editar propostas já aceites ou rejeitadas
    if proposal.status in ["accepted", "rejected"] and data.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Não é possível editar proposta fechada")
    
    # Atualizar campos
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(proposal, field, value)
    
    # Recalcular comissão se valores mudaram
    if proposal.commission_percentage and proposal.proposed_value:
        proposal.commission_value = proposal.proposed_value * proposal.commission_percentage / 100
    
    # Registar datas de eventos
    if data.status == "sent" and not proposal.sent_at:
        proposal.sent_at = datetime.utcnow()
    if data.status in ["accepted", "rejected"] and not proposal.responded_at:
        proposal.responded_at = datetime.utcnow()
    
    proposal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(proposal)
    
    return proposal


@router.patch("/{proposal_id}/status")
def update_proposal_status(
    proposal_id: int,
    status: str = Query(..., description="Novo status"),
    rejection_reason: Optional[str] = Query(None, description="Motivo se rejeitada"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Atualizar apenas o status da proposta"""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")
    
    proposal.status = status
    
    if status == "sent" and not proposal.sent_at:
        proposal.sent_at = datetime.utcnow()
    if status in ["accepted", "rejected"]:
        proposal.responded_at = datetime.utcnow()
        if rejection_reason:
            proposal.rejection_reason = rejection_reason
    
    proposal.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "status": status, "proposal_number": proposal.proposal_number}


@router.post("/{proposal_id}/counter-offer", response_model=ProposalResponse)
def create_counter_offer(
    proposal_id: int,
    counter_value: Decimal = Query(..., description="Valor da contraproposta"),
    conditions: Optional[str] = Query(None, description="Novas condições"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Criar contraproposta baseada numa proposta existente"""
    original = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Proposta original não encontrada")
    
    # Marcar original como tendo contraproposta
    original.status = "counter_offer"
    original.counter_offer_value = counter_value
    original.updated_at = datetime.utcnow()
    
    # Criar nova proposta como contraproposta
    new_proposal = Proposal(
        agent_id=original.agent_id,
        agency_id=original.agency_id,
        opportunity_id=original.opportunity_id,
        property_id=original.property_id,
        client_id=original.client_id,
        lead_id=original.lead_id,
        proposal_number=generate_proposal_number(db),
        proposal_type=original.proposal_type,
        status="draft",
        version=original.version + 1,
        proposed_value=counter_value,
        deposit_value=original.deposit_value,
        deposit_percentage=original.deposit_percentage,
        commission_percentage=original.commission_percentage,
        conditions=conditions or original.conditions,
        financing_type=original.financing_type,
        financing_bank=original.financing_bank,
        financing_amount=original.financing_amount,
        valid_until=original.valid_until,
        is_counter_offer=True,
        parent_proposal_id=original.id,
        tags=original.tags
    )
    
    # Calcular comissão
    if new_proposal.commission_percentage:
        new_proposal.commission_value = counter_value * new_proposal.commission_percentage / 100
    
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)
    
    return new_proposal


@router.delete("/{proposal_id}")
def delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar proposta (apenas rascunhos)"""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")
    
    if proposal.status != "draft":
        raise HTTPException(status_code=400, detail="Apenas propostas em rascunho podem ser eliminadas")
    
    db.delete(proposal)
    db.commit()
    
    return {"success": True, "message": "Proposta eliminada"}
