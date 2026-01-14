"""
Router para gestão de Escrituras
CRUD + notificações + integração com agenda
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, extract, text
from typing import Optional, List
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
from decimal import Decimal
from app.database import get_db, get_tenant_schema, DATABASE_URL
from app.models.escritura import Escritura
from app.models.event import Event
from app.properties.models import Property
from app.security import get_current_user
from app.users.models import User, UserRole
from app.schemas.event import EventType


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


class PedidoFaturaRequest(BaseModel):
    """Schema para pedido de fatura vindo do agente"""
    nota: Optional[str] = None


def upsert_escritura_event(db: Session, escritura: Escritura):
    """Criar ou atualizar evento de agenda associado à escritura para aparecer na app mobile."""
    try:
        start_dt = escritura.data_escritura
        if escritura.hora_escritura:
            try:
                hours, minutes = escritura.hora_escritura.split(":")
                start_dt = start_dt.replace(hour=int(hours), minute=int(minutes), second=0, microsecond=0)
            except Exception:
                # Se hora inválida, mantém data original
                pass

        prop_ref = getattr(escritura.property, "reference", None)
        if not prop_ref and escritura.property_id:
            prop = db.query(Property).filter(Property.id == escritura.property_id).first()
            if prop:
                prop_ref = prop.reference

        title = "Escritura agendada"
        if prop_ref:
            title = f"Escritura - {prop_ref}"

        notes = f"Escritura #{escritura.id}"
        if escritura.local_escritura:
            notes = f"{notes} • {escritura.local_escritura}"

        existing = db.query(Event).filter(
            Event.agent_id == escritura.agent_id,
            Event.notes.ilike(f"%Escritura #{escritura.id}%"),
        ).first()

        if existing:
            existing.title = title
            existing.event_type = EventType.OTHER.value
            existing.scheduled_date = start_dt
            existing.duration_minutes = existing.duration_minutes or 60
            existing.location = escritura.local_escritura
            existing.property_id = escritura.property_id
            existing.notes = notes
            existing.status = "scheduled"
        else:
            new_event = Event(
                agent_id=escritura.agent_id,
                title=title,
                event_type=EventType.OTHER.value,
                scheduled_date=start_dt,
                duration_minutes=60,
                location=escritura.local_escritura,
                property_id=escritura.property_id,
                notes=notes,
                status="scheduled",
            )
            db.add(new_event)

        db.commit()
    except Exception as event_err:
        db.rollback()
        print(f"[ESCRITURA->AGENDA] Falha ao sincronizar evento: {event_err}")


def ensure_escrituras_table_for_tenant(db: Session):
    """Garantir que a tabela escrituras existe no schema do tenant (multi-tenant)."""
    if not DATABASE_URL:
        return  # SQLite/local dev: já gerido pelo Base.metadata.create_all

    schema = get_tenant_schema()
    if not schema or schema == "public":
        return  # No tenant or using public schema

    try:
        exists = db.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = :schema AND table_name = 'escrituras'
                );
                """
            ),
            {"schema": schema},
        ).scalar()

        if exists:
            return

        # Verificar se estrutura existe no public para copiar
        source_exists = db.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'escrituras'
                );
                """
            )
        ).scalar()

        if not source_exists:
            raise HTTPException(status_code=500, detail="Tabela escrituras não existe no schema público")

        # Criar tabela no schema do tenant copiando estrutura + dados do public
        db.execute(text(f'CREATE TABLE IF NOT EXISTS "{schema}"."escrituras" (LIKE public."escrituras" INCLUDING ALL)'))
        db.execute(text(f'INSERT INTO "{schema}"."escrituras" SELECT * FROM public."escrituras"'))
        db.commit()
        print(f"[ESCRITURAS] Tabela criada/copied no schema {schema}")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[ESCRITURAS] Erro ao garantir tabela para schema {schema}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao preparar tabela de escrituras para o tenant")


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
    ensure_escrituras_table_for_tenant(db)
    query = db.query(Escritura).options(
        joinedload(Escritura.property),
        joinedload(Escritura.pedido_fatura_user),
    )
    
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
    ensure_escrituras_table_for_tenant(db)
    hoje = datetime.now()
    fim = hoje + timedelta(days=dias)
    
    query = db.query(Escritura).options(
        joinedload(Escritura.property),
        joinedload(Escritura.pedido_fatura_user),
    ).filter(
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
    ensure_escrituras_table_for_tenant(db)
    query = db.query(Escritura).options(
        joinedload(Escritura.property),
        joinedload(Escritura.pedido_fatura_user),
    ).filter(
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
    ensure_escrituras_table_for_tenant(db)
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
    ensure_escrituras_table_for_tenant(db)
    escritura = db.query(Escritura).options(
        joinedload(Escritura.property),
        joinedload(Escritura.pedido_fatura_user),
    ).filter(Escritura.id == escritura_id).first()
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
    ensure_escrituras_table_for_tenant(db)
    property_obj = db.query(Property).filter(Property.id == data.property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Imóvel associado não encontrado")

    if property_obj.agent_id and property_obj.agent_id != data.agent_id:
        raise HTTPException(status_code=403, detail="Apenas o agente responsável pode agendar a escritura deste imóvel")

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

    # Criar/atualizar evento na agenda para aparecer no mobile
    upsert_escritura_event(db, escritura)
    
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
    ensure_escrituras_table_for_tenant(db)
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

    # Sincronizar evento na agenda (atualiza data/local se mudou)
    upsert_escritura_event(db, escritura)
    
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
    ensure_escrituras_table_for_tenant(db)
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
    ensure_escrituras_table_for_tenant(db)
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")
    
    escritura.documentacao_pronta = pronta
    if notas:
        escritura.notas_documentacao = notas
    
    db.commit()
    
    return {"success": True, "documentacao_pronta": pronta}


@router.post("/{escritura_id}/pedido-fatura")
def pedir_fatura(
    escritura_id: int,
    data: PedidoFaturaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registar pedido de fatura feito pelo agente"""
    ensure_escrituras_table_for_tenant(db)
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")

    if escritura.fatura_emitida:
        raise HTTPException(status_code=400, detail="Fatura já emitida para esta escritura")

    # Apenas admins/coordenadores podem pedir por qualquer agente
    is_admin = current_user.role in [UserRole.ADMIN.value, UserRole.COORDINATOR.value]
    if not is_admin and current_user.agent_id and escritura.agent_id != current_user.agent_id:
        raise HTTPException(status_code=403, detail="Não pode pedir fatura de uma escritura de outro agente")

    escritura.fatura_pedida = True
    escritura.pedido_fatura_nota = data.nota
    escritura.data_pedido_fatura = datetime.now()
    escritura.pedido_fatura_user_id = current_user.id

    db.commit()
    db.refresh(escritura)

    return {
        "success": True,
        "message": "Pedido de fatura registado",
        "escritura": escritura.to_dict(),
    }


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
    ensure_escrituras_table_for_tenant(db)
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
    ensure_escrituras_table_for_tenant(db)
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()
    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura não encontrada")
    
    if escritura.status == "realizada":
        raise HTTPException(status_code=400, detail="Não é possível eliminar escritura já realizada")
    
    db.delete(escritura)
    db.commit()
    
    return {"success": True, "message": "Escritura eliminada"}
