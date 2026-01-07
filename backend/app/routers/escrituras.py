"""
Router para gestão de Escrituras
CRUD + notificações + integração com agenda
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, extract
from typing import Optional, List
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
from decimal import Decimal
from app.database import get_db
from app.models.escritura import Escritura


router = APIRouter(prefix="/escrituras", tags=["escrituras"])


# === Pydantic Schemas ===

class EscrituraCreate(BaseModel):
    """Schema para agendar escritura"""
    property_id: int
    agent_id: int
    agency_id: Optional[int] = None
    client_id: Optional[int] = None
    
    # Data e local
    data_escritura: datetime
    hora_escritura: Optional[str] = None
    local_escritura: Optional[str] = None
    morada_cartorio: Optional[str] = None
    
    # Partes
    nome_comprador: Optional[str] = None
    nif_comprador: Optional[str] = None
    nome_vendedor: Optional[str] = None
    nif_vendedor: Optional[str] = None
    
    # Valores
    valor_venda: float
    valor_comissao: Optional[float] = None
    percentagem_comissao: Optional[float] = None
    valor_comissao_agente: Optional[float] = None
    
    notas: Optional[str] = None


class EscrituraUpdate(BaseModel):
    """Schema para atualizar escritura"""
    data_escritura: Optional[datetime] = None
    hora_escritura: Optional[str] = None
    local_escritura: Optional[str] = None
    morada_cartorio: Optional[str] = None
    
    nome_comprador: Optional[str] = None
    nif_comprador: Optional[str] = None
    nome_vendedor: Optional[str] = None
    nif_vendedor: Optional[str] = None
    
    valor_venda: Optional[float] = None
    valor_comissao: Optional[float] = None
    percentagem_comissao: Optional[float] = None
    valor_comissao_agente: Optional[float] = None
    
    status: Optional[str] = None
    documentacao_pronta: Optional[bool] = None
    notas_documentacao: Optional[str] = None
    notas: Optional[str] = None


class EscrituraFaturar(BaseModel):
    """Schema para emitir fatura"""
    numero_fatura: str


# === Endpoints ===

@router.get("/")
def list_escrituras(
    agent_id: Optional[int] = Query(None, description="Filtrar por agente"),
    agency_id: Optional[int] = Query(None, description="Filtrar por agência"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    data_inicio: Optional[date] = Query(None, description="Data início"),
    data_fim: Optional[date] = Query(None, description="Data fim"),
    pendentes_documentacao: bool = Query(False, description="Apenas pendentes de documentação"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    """
    Listar escrituras com filtros
    - Agente: vê as suas escrituras
    - Admin/Backoffice: vê todas (para preparar documentação)
    """
    query = db.query(Escritura)
    
    if agent_id:
        query = query.filter(Escritura.agent_id == agent_id)
    if agency_id:
        query = query.filter(Escritura.agency_id == agency_id)
    if status:
        query = query.filter(Escritura.status == status)
    if data_inicio:
        query = query.filter(Escritura.data_escritura >= datetime.combine(data_inicio, datetime.min.time()))
    if data_fim:
        query = query.filter(Escritura.data_escritura <= datetime.combine(data_fim, datetime.max.time()))
    if pendentes_documentacao:
        query = query.filter(
            Escritura.documentacao_pronta == False,
            Escritura.status.in_(["agendada", "confirmada"])
        )
    
    # Ordenar por data (próximas primeiro)
    query = query.order_by(Escritura.data_escritura.asc())
    
    total = query.count()
    escrituras = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [e.to_dict() for e in escrituras]
    }


@router.get("/proximas")
def get_proximas_escrituras(
    dias: int = Query(30, description="Dias à frente"),
    agent_id: Optional[int] = Query(None),
    agency_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Escrituras nos próximos X dias
    Para dashboard e alertas
    """
    hoje = datetime.now()
    fim = hoje + timedelta(days=dias)
    
    query = db.query(Escritura).filter(
        Escritura.data_escritura >= hoje,
        Escritura.data_escritura <= fim,
        Escritura.status.in_(["agendada", "confirmada"])
    )
    
    if agent_id:
        query = query.filter(Escritura.agent_id == agent_id)
    if agency_id:
        query = query.filter(Escritura.agency_id == agency_id)
    
    escrituras = query.order_by(Escritura.data_escritura.asc()).all()
    
    # Agrupar por urgência
    urgentes = []  # Próximos 7 dias
    proximas = []  # 8-30 dias
    
    for e in escrituras:
        dias_ate = (e.data_escritura.date() - hoje.date()).days
        item = {
            **e.to_dict(),
            "dias_ate_escritura": dias_ate,
            "urgente": dias_ate <= 7
        }
        if dias_ate <= 7:
            urgentes.append(item)
        else:
            proximas.append(item)
    
    return {
        "total": len(escrituras),
        "urgentes": urgentes,
        "proximas": proximas,
        "pendentes_documentacao": len([e for e in escrituras if not e.documentacao_pronta])
    }


@router.get("/pendentes-faturacao")
def get_pendentes_faturacao(
    agency_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Escrituras realizadas mas não faturadas
    Para backoffice emitir faturas
    """
    query = db.query(Escritura).filter(
        Escritura.status == "realizada",
        Escritura.fatura_emitida == False
    )
    
    if agency_id:
        query = query.filter(Escritura.agency_id == agency_id)
    
    escrituras = query.order_by(Escritura.data_escritura.asc()).all()
    
    total_comissao = sum(e.valor_comissao or 0 for e in escrituras)
    
    return {
        "total": len(escrituras),
        "total_comissao_pendente": float(total_comissao),
        "items": [e.to_dict() for e in escrituras]
    }


@router.get("/stats")
def get_escrituras_stats(
    agent_id: Optional[int] = Query(None),
    agency_id: Optional[int] = Query(None),
    ano: int = Query(None),
    db: Session = Depends(get_db)
):
    """
    Estatísticas de escrituras
    """
    ano = ano or datetime.now().year
    
    query = db.query(Escritura).filter(
        extract('year', Escritura.data_escritura) == ano
    )
    
    if agent_id:
        query = query.filter(Escritura.agent_id == agent_id)
    if agency_id:
        query = query.filter(Escritura.agency_id == agency_id)
    
    escrituras = query.all()
    
    realizadas = [e for e in escrituras if e.status == "realizada"]
    agendadas = [e for e in escrituras if e.status in ["agendada", "confirmada"]]
    canceladas = [e for e in escrituras if e.status in ["cancelada", "adiada"]]
    
    return {
        "ano": ano,
        "total": len(escrituras),
        "realizadas": len(realizadas),
        "agendadas": len(agendadas),
        "canceladas": len(canceladas),
        "volume_vendas": float(sum(e.valor_venda or 0 for e in realizadas)),
        "total_comissoes": float(sum(e.valor_comissao or 0 for e in realizadas)),
        "comissao_media": float(sum(e.valor_comissao or 0 for e in realizadas) / len(realizadas)) if realizadas else 0,
    }


@router.get("/{escritura_id}")
def get_escritura(escritura_id: int, db: Session = Depends(get_db)):
    """Obter detalhes de uma escritura"""
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")
    return escritura.to_dict()


@router.post("/")
def create_escritura(
    data: EscrituraCreate,
    db: Session = Depends(get_db)
):
    """
    Agendar nova escritura
    Cria entrada na agenda automaticamente
    """
    escritura = Escritura(
        property_id=data.property_id,
        agent_id=data.agent_id,
        agency_id=data.agency_id,
        client_id=data.client_id,
        data_escritura=data.data_escritura,
        hora_escritura=data.hora_escritura,
        local_escritura=data.local_escritura,
        morada_cartorio=data.morada_cartorio,
        nome_comprador=data.nome_comprador,
        nif_comprador=data.nif_comprador,
        nome_vendedor=data.nome_vendedor,
        nif_vendedor=data.nif_vendedor,
        valor_venda=Decimal(str(data.valor_venda)),
        valor_comissao=Decimal(str(data.valor_comissao)) if data.valor_comissao else None,
        percentagem_comissao=Decimal(str(data.percentagem_comissao)) if data.percentagem_comissao else None,
        valor_comissao_agente=Decimal(str(data.valor_comissao_agente)) if data.valor_comissao_agente else None,
        notas=data.notas,
        status="agendada",
    )
    
    db.add(escritura)
    db.commit()
    db.refresh(escritura)
    
    # TODO: Criar evento no calendário do agente
    # TODO: Enviar notificação ao backoffice
    
    return {
        "success": True,
        "message": "Escritura agendada com sucesso",
        "escritura": escritura.to_dict()
    }


@router.put("/{escritura_id}")
def update_escritura(
    escritura_id: int,
    data: EscrituraUpdate,
    db: Session = Depends(get_db)
):
    """Atualizar escritura"""
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Converter floats para Decimal
    for field in ['valor_venda', 'valor_comissao', 'percentagem_comissao', 'valor_comissao_agente']:
        if field in update_data and update_data[field] is not None:
            update_data[field] = Decimal(str(update_data[field]))
    
    for key, value in update_data.items():
        setattr(escritura, key, value)
    
    db.commit()
    db.refresh(escritura)
    
    return {
        "success": True,
        "message": "Escritura atualizada",
        "escritura": escritura.to_dict()
    }


@router.patch("/{escritura_id}/status")
def update_escritura_status(
    escritura_id: int,
    status: str = Query(..., description="Novo status: agendada, confirmada, realizada, cancelada, adiada"),
    db: Session = Depends(get_db)
):
    """Atualizar status da escritura"""
    valid_statuses = ["agendada", "confirmada", "realizada", "cancelada", "adiada"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status inválido. Valores válidos: {valid_statuses}")
    
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")
    
    escritura.status = status
    db.commit()
    
    return {"success": True, "status": status}


@router.patch("/{escritura_id}/documentacao")
def update_documentacao(
    escritura_id: int,
    pronta: bool = Query(..., description="Documentação pronta"),
    notas: Optional[str] = Query(None, description="Notas sobre documentação"),
    db: Session = Depends(get_db)
):
    """Marcar documentação como pronta/pendente"""
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")
    
    escritura.documentacao_pronta = pronta
    if notas:
        escritura.notas_documentacao = notas
    
    db.commit()
    
    return {"success": True, "documentacao_pronta": pronta}


@router.post("/{escritura_id}/faturar")
def emitir_fatura(
    escritura_id: int,
    data: EscrituraFaturar,
    db: Session = Depends(get_db)
):
    """
    Registar emissão de fatura
    O backoffice emite a fatura e regista aqui
    """
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")
    
    if escritura.fatura_emitida:
        raise HTTPException(status_code=400, detail="Fatura já foi emitida")
    
    escritura.fatura_emitida = True
    escritura.numero_fatura = data.numero_fatura
    escritura.data_fatura = datetime.now()
    
    db.commit()
    db.refresh(escritura)
    
    return {
        "success": True,
        "message": "Fatura registada",
        "escritura": escritura.to_dict()
    }


@router.delete("/{escritura_id}")
def delete_escritura(escritura_id: int, db: Session = Depends(get_db)):
    """Eliminar escritura (apenas se ainda não realizada)"""
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")
    
    if escritura.status == "realizada":
        raise HTTPException(status_code=400, detail="Não é possível eliminar escritura já realizada")
    
    db.delete(escritura)
    db.commit()
    
    return {"success": True, "message": "Escritura eliminada"}
