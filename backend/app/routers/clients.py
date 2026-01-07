"""
Router para gestão de Clientes
CRUD completo + auto-criação via angariações + lembretes aniversários
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, extract, func
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.client import Client, ClientTransacao


router = APIRouter(prefix="/clients", tags=["clients"])


# === Pydantic Schemas ===

class DocumentoSchema(BaseModel):
    """Schema para documento"""
    tipo: str  # cc_frente, cc_verso, nif, comprovativo_morada, procuracao, etc.
    nome: str
    url: str
    data_upload: Optional[str] = None


class ClientCreate(BaseModel):
    """Schema para criar cliente"""
    nome: str = Field(..., min_length=2)
    client_type: str = Field(default="lead")  # vendedor, comprador, investidor, etc.
    origin: str = Field(default="manual")
    is_empresa: bool = Field(default=False)
    
    # Dados pessoais (opcionais)
    nif: Optional[str] = None
    cc: Optional[str] = None
    cc_validade: Optional[date] = None
    data_nascimento: Optional[date] = None
    naturalidade: Optional[str] = None
    nacionalidade: Optional[str] = None
    profissao: Optional[str] = None
    entidade_empregadora: Optional[str] = None
    
    # Estado civil
    estado_civil: Optional[str] = None
    regime_casamento: Optional[str] = None
    data_casamento: Optional[date] = None
    
    # Dados cônjuge
    conjuge_nome: Optional[str] = None
    conjuge_nif: Optional[str] = None
    conjuge_cc: Optional[str] = None
    conjuge_cc_validade: Optional[date] = None
    conjuge_data_nascimento: Optional[date] = None
    conjuge_naturalidade: Optional[str] = None
    conjuge_nacionalidade: Optional[str] = None
    conjuge_profissao: Optional[str] = None
    conjuge_email: Optional[str] = None
    conjuge_telefone: Optional[str] = None
    
    # Dados empresa
    empresa_nome: Optional[str] = None
    empresa_nipc: Optional[str] = None
    empresa_sede: Optional[str] = None
    empresa_capital_social: Optional[Decimal] = None
    empresa_conservatoria: Optional[str] = None
    empresa_matricula: Optional[str] = None
    empresa_cargo: Optional[str] = None
    empresa_poderes: Optional[str] = None
    
    # Contactos
    email: Optional[str] = None
    telefone: Optional[str] = None
    telefone_alt: Optional[str] = None
    
    # Morada
    morada: Optional[str] = None
    numero_porta: Optional[str] = None
    andar: Optional[str] = None
    codigo_postal: Optional[str] = None
    localidade: Optional[str] = None
    concelho: Optional[str] = None
    distrito: Optional[str] = None
    pais: Optional[str] = "Portugal"
    
    # Documentos
    documentos: Optional[List[DocumentoSchema]] = []
    
    # CRM
    notas: Optional[str] = None
    tags: Optional[List[str]] = []
    preferencias: Optional[Dict[str, Any]] = {}
    
    # Relações
    angariacao_id: Optional[int] = None
    property_id: Optional[int] = None
    lead_id: Optional[int] = None


class ClientUpdate(BaseModel):
    """Schema para atualizar cliente"""
    nome: Optional[str] = None
    client_type: Optional[str] = None
    is_empresa: Optional[bool] = None
    
    # Dados pessoais
    nif: Optional[str] = None
    cc: Optional[str] = None
    cc_validade: Optional[date] = None
    data_nascimento: Optional[date] = None
    naturalidade: Optional[str] = None
    nacionalidade: Optional[str] = None
    profissao: Optional[str] = None
    entidade_empregadora: Optional[str] = None
    
    # Estado civil
    estado_civil: Optional[str] = None
    regime_casamento: Optional[str] = None
    data_casamento: Optional[date] = None
    
    # Dados cônjuge
    conjuge_nome: Optional[str] = None
    conjuge_nif: Optional[str] = None
    conjuge_cc: Optional[str] = None
    conjuge_cc_validade: Optional[date] = None
    conjuge_data_nascimento: Optional[date] = None
    conjuge_naturalidade: Optional[str] = None
    conjuge_nacionalidade: Optional[str] = None
    conjuge_profissao: Optional[str] = None
    conjuge_email: Optional[str] = None
    conjuge_telefone: Optional[str] = None
    
    # Dados empresa
    empresa_nome: Optional[str] = None
    empresa_nipc: Optional[str] = None
    empresa_sede: Optional[str] = None
    empresa_capital_social: Optional[Decimal] = None
    empresa_conservatoria: Optional[str] = None
    empresa_matricula: Optional[str] = None
    empresa_cargo: Optional[str] = None
    empresa_poderes: Optional[str] = None
    
    # Contactos
    email: Optional[str] = None
    telefone: Optional[str] = None
    telefone_alt: Optional[str] = None
    
    # Morada
    morada: Optional[str] = None
    numero_porta: Optional[str] = None
    andar: Optional[str] = None
    codigo_postal: Optional[str] = None
    localidade: Optional[str] = None
    concelho: Optional[str] = None
    distrito: Optional[str] = None
    pais: Optional[str] = None
    
    # Documentos
    documentos: Optional[List[DocumentoSchema]] = None
    
    # CRM
    notas: Optional[str] = None
    tags: Optional[List[str]] = None
    preferencias: Optional[Dict[str, Any]] = None
    proxima_acao: Optional[str] = None
    proxima_acao_data: Optional[datetime] = None
    
    # Estado
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class TransacaoCreate(BaseModel):
    """Schema para criar transação"""
    tipo: str  # venda, compra, arrendamento_senhorio, arrendamento_inquilino
    descricao: Optional[str] = None
    referencia_imovel: Optional[str] = None
    property_id: Optional[int] = None
    valor: Optional[Decimal] = None
    comissao: Optional[Decimal] = None
    data: date
    data_contrato: Optional[date] = None
    outra_parte_nome: Optional[str] = None
    outra_parte_nif: Optional[str] = None
    notas: Optional[str] = None
    documentos: Optional[List[DocumentoSchema]] = []


class ClientResponse(BaseModel):
    """Schema de resposta"""
    id: int
    agent_id: int
    agency_id: Optional[int]
    client_type: str
    origin: str
    is_empresa: bool
    
    # Dados pessoais
    nome: str
    nif: Optional[str]
    cc: Optional[str]
    cc_validade: Optional[date]
    data_nascimento: Optional[date]
    naturalidade: Optional[str]
    nacionalidade: Optional[str]
    profissao: Optional[str]
    entidade_empregadora: Optional[str]
    
    # Estado civil
    estado_civil: Optional[str]
    regime_casamento: Optional[str]
    data_casamento: Optional[date]
    
    # Dados cônjuge
    conjuge_nome: Optional[str]
    conjuge_nif: Optional[str]
    conjuge_cc: Optional[str]
    conjuge_cc_validade: Optional[date]
    conjuge_data_nascimento: Optional[date]
    conjuge_naturalidade: Optional[str]
    conjuge_nacionalidade: Optional[str]
    conjuge_profissao: Optional[str]
    conjuge_email: Optional[str]
    conjuge_telefone: Optional[str]
    
    # Dados empresa
    empresa_nome: Optional[str]
    empresa_nipc: Optional[str]
    empresa_sede: Optional[str]
    empresa_capital_social: Optional[Decimal]
    empresa_conservatoria: Optional[str]
    empresa_matricula: Optional[str]
    empresa_cargo: Optional[str]
    empresa_poderes: Optional[str]
    
    # Contactos
    email: Optional[str]
    telefone: Optional[str]
    telefone_alt: Optional[str]
    
    # Morada completa
    morada: Optional[str]
    numero_porta: Optional[str]
    andar: Optional[str]
    codigo_postal: Optional[str]
    localidade: Optional[str]
    concelho: Optional[str]
    distrito: Optional[str]
    pais: Optional[str]
    
    # CRM
    notas: Optional[str]
    tags: List[str]
    documentos: Optional[List[DocumentoSchema]]
    preferencias: Optional[Dict[str, Any]]
    is_verified: bool
    
    # Atividade
    ultima_interacao: Optional[datetime]
    proxima_acao: Optional[str]
    proxima_acao_data: Optional[datetime]
    
    # Relações
    angariacao_id: Optional[int]
    property_id: Optional[int]
    lead_id: Optional[int]
    is_active: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# === Endpoints ===

@router.get("/")
def list_clients(
    agent_id: Optional[int] = Query(None, description="Filtrar por agente"),
    agency_id: Optional[int] = Query(None, description="Filtrar por agência (admin)"),
    client_type: Optional[str] = Query(None, description="Filtrar por tipo: vendedor, comprador, etc."),
    search: Optional[str] = Query(None, description="Pesquisar por nome, NIF ou telefone"),
    is_active: Optional[bool] = Query(True, description="Filtrar por estado ativo"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    """
    Listar clientes com filtros
    - Agente: vê apenas os seus clientes
    - Admin agência: vê todos os clientes da agência
    """
    query = db.query(Client)
    
    # Filtros
    if agent_id:
        query = query.filter(Client.agent_id == agent_id)
    if agency_id:
        query = query.filter(Client.agency_id == agency_id)
    if client_type:
        query = query.filter(Client.client_type == client_type)
    if is_active is not None:
        query = query.filter(Client.is_active == is_active)
    
    # Pesquisa
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Client.nome.ilike(search_term),
                Client.nif.ilike(search_term),
                Client.telefone.ilike(search_term),
                Client.email.ilike(search_term)
            )
        )
    
    # Ordenar por nome
    query = query.order_by(Client.nome.asc())
    
    total = query.count()
    clients = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [c.to_dict() for c in clients]
    }


@router.get("/with-leads")
def list_clients_with_leads(
    agent_id: Optional[int] = Query(None, description="Filtrar por agente"),
    agency_id: Optional[int] = Query(None, description="Filtrar por agência (admin)"),
    include_leads: bool = Query(True, description="Incluir leads do site não sincronizadas"),
    search: Optional[str] = Query(None, description="Pesquisar por nome ou telefone"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    """
    Listar clientes + leads do site não sincronizadas.
    
    - Admin: vê todos os clientes + todas as leads
    - Agente: vê apenas os seus clientes + as suas leads atribuídas
    
    Leads aparecem como clientes virtuais com source="website_lead"
    """
    # Import local para evitar importação circular
    from app.leads.models import Lead
    
    results = []
    
    # 1. Buscar clientes
    client_query = db.query(Client).filter(Client.is_active == True)
    
    if agent_id:
        client_query = client_query.filter(Client.agent_id == agent_id)
    if agency_id:
        client_query = client_query.filter(Client.agency_id == agency_id)
    
    if search:
        search_term = f"%{search}%"
        client_query = client_query.filter(
            or_(
                Client.nome.ilike(search_term),
                Client.telefone.ilike(search_term),
                Client.email.ilike(search_term)
            )
        )
    
    clients = client_query.order_by(Client.nome.asc()).all()
    
    # IDs de leads já sincronizadas
    synced_lead_ids = set(c.lead_id for c in clients if c.lead_id)
    
    for client in clients:
        results.append({
            **client.to_dict(),
            "source_type": "client"
        })
    
    # 2. Buscar leads do site não sincronizadas
    if include_leads:
        lead_query = db.query(Lead)
        
        # Excluir leads já sincronizadas
        if synced_lead_ids:
            lead_query = lead_query.filter(~Lead.id.in_(synced_lead_ids))
        
        if agent_id:
            lead_query = lead_query.filter(Lead.assigned_agent_id == agent_id)
        
        if search:
            search_term = f"%{search}%"
            lead_query = lead_query.filter(
                or_(
                    Lead.name.ilike(search_term),
                    Lead.phone.ilike(search_term),
                    Lead.email.ilike(search_term)
                )
            )
        
        leads = lead_query.order_by(Lead.created_at.desc()).all()
        
        for lead in leads:
            # Converter lead para formato de cliente
            results.append({
                "id": f"lead_{lead.id}",  # Prefixo para distinguir
                "lead_id": lead.id,
                "agent_id": lead.assigned_agent_id,
                "agency_id": None,
                "nome": lead.name,
                "email": lead.email,
                "telefone": lead.phone,
                "notas": lead.message,
                "client_type": "lead",
                "origin": "website",
                "source_type": "website_lead",  # Identificador especial
                "property_id": lead.property_id,
                "status": lead.status,
                "created_at": lead.created_at.isoformat() if lead.created_at else None,
                "is_active": True,
                # Campos vazios para compatibilidade
                "nif": None,
                "cc": None,
                "cc_validade": None,
                "data_nascimento": None,
                "telefone_alt": None,
                "morada": None,
                "codigo_postal": None,
                "localidade": None,
                "distrito": None,
                "tags": [],
            })
    
    # Ordenar resultados por nome
    results.sort(key=lambda x: x.get("nome", "").lower())
    
    total = len(results)
    paginated = results[skip:skip + limit]
    
    return {
        "total": total,
        "items": paginated,
        "clients_count": len([r for r in results if r.get("source_type") == "client"]),
        "leads_count": len([r for r in results if r.get("source_type") == "website_lead"])
    }


@router.get("/birthdays")
def get_upcoming_birthdays(
    agent_id: Optional[int] = Query(None),
    agency_id: Optional[int] = Query(None),
    days_ahead: int = Query(7, description="Dias à frente para verificar"),
    db: Session = Depends(get_db)
):
    """
    Obter clientes com aniversário nos próximos X dias
    Para gerar lembretes e notificações
    """
    today = date.today()
    
    query = db.query(Client).filter(
        Client.is_active == True,
        Client.data_nascimento.isnot(None)
    )
    
    if agent_id:
        query = query.filter(Client.agent_id == agent_id)
    if agency_id:
        query = query.filter(Client.agency_id == agency_id)
    
    clients = query.all()
    
    # Filtrar clientes com aniversário nos próximos X dias
    birthdays = []
    for client in clients:
        if client.data_nascimento:
            # Criar data de aniversário este ano
            birthday_this_year = client.data_nascimento.replace(year=today.year)
            
            # Se já passou este ano, verificar para o próximo ano
            if birthday_this_year < today:
                birthday_this_year = birthday_this_year.replace(year=today.year + 1)
            
            days_until = (birthday_this_year - today).days
            
            if 0 <= days_until <= days_ahead:
                age = today.year - client.data_nascimento.year
                if birthday_this_year.year > today.year:
                    age += 1
                    
                birthdays.append({
                    **client.to_dict(),
                    "days_until_birthday": days_until,
                    "birthday_date": birthday_this_year.isoformat(),
                    "age": age
                })
    
    # Ordenar por dias até aniversário
    birthdays.sort(key=lambda x: x["days_until_birthday"])
    
    return {
        "total": len(birthdays),
        "items": birthdays
    }


@router.get("/birthdays/calendar")
def get_birthdays_as_calendar_events(
    agent_id: Optional[int] = Query(None),
    agency_id: Optional[int] = Query(None),
    mes: int = Query(None, description="Mês (1-12)"),
    ano: int = Query(None, description="Ano"),
    db: Session = Depends(get_db)
):
    """
    Obter aniversários formatados como eventos de calendário.
    Para integração com a agenda do agente.
    
    Retorna eventos no formato compatível com CalendarEvent.
    """
    ano = ano or date.today().year
    mes = mes or date.today().month
    
    query = db.query(Client).filter(
        Client.is_active == True,
        Client.data_nascimento.isnot(None)
    )
    
    if agent_id:
        query = query.filter(Client.agent_id == agent_id)
    if agency_id:
        query = query.filter(Client.agency_id == agency_id)
    
    clients = query.all()
    
    events = []
    for client in clients:
        if client.data_nascimento:
            # Verificar se o aniversário é no mês solicitado
            if client.data_nascimento.month == mes:
                # Criar data do aniversário este ano
                birthday_date = date(ano, mes, client.data_nascimento.day)
                age = ano - client.data_nascimento.year
                
                events.append({
                    "id": f"birthday_{client.id}",
                    "type": "birthday",
                    "title": f"🎂 Aniversário: {client.nome}",
                    "description": f"{client.nome} faz {age} anos",
                    "date": birthday_date.isoformat(),
                    "start_time": "09:00",  # Lembrete de manhã
                    "all_day": True,
                    "color": "#f59e0b",  # Amarelo/dourado
                    "client_id": client.id,
                    "client_name": client.nome,
                    "client_phone": client.telefone,
                    "client_email": client.email,
                    "age": age,
                    "agent_id": client.agent_id,
                })
    
    # Ordenar por dia do mês
    events.sort(key=lambda x: x["date"])
    
    return {
        "total": len(events),
        "mes": mes,
        "ano": ano,
        "events": events
    }


@router.get("/stats")
def get_client_stats(
    agent_id: Optional[int] = Query(None),
    agency_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Estatísticas de clientes por tipo
    """
    query = db.query(Client).filter(Client.is_active == True)
    
    if agent_id:
        query = query.filter(Client.agent_id == agent_id)
    if agency_id:
        query = query.filter(Client.agency_id == agency_id)
    
    # Contar por tipo
    stats = db.query(
        Client.client_type,
        func.count(Client.id).label("count")
    ).filter(Client.is_active == True)
    
    if agent_id:
        stats = stats.filter(Client.agent_id == agent_id)
    if agency_id:
        stats = stats.filter(Client.agency_id == agency_id)
    
    stats = stats.group_by(Client.client_type).all()
    
    by_type = {s[0]: s[1] for s in stats}
    total = sum(by_type.values())
    
    return {
        "total": total,
        "by_type": by_type,
        "vendedores": by_type.get("vendedor", 0),
        "compradores": by_type.get("comprador", 0),
        "investidores": by_type.get("investidor", 0),
        "arrendatarios": by_type.get("arrendatario", 0),
        "senhorios": by_type.get("senhorio", 0),
        "leads": by_type.get("lead", 0),
    }


@router.get("/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    """Obter detalhes de um cliente"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client.to_dict()


@router.post("/", response_model=ClientResponse)
def create_client(
    data: ClientCreate,
    agent_id: int = Query(..., description="ID do agente"),
    agency_id: Optional[int] = Query(None, description="ID da agência"),
    db: Session = Depends(get_db)
):
    """
    Criar novo cliente manualmente
    """
    client = Client(
        agent_id=agent_id,
        agency_id=agency_id,
        nome=data.nome,
        client_type=data.client_type,
        origin=data.origin,
        is_empresa=data.is_empresa,
        
        # Dados pessoais
        nif=data.nif,
        cc=data.cc,
        cc_validade=data.cc_validade,
        data_nascimento=data.data_nascimento,
        naturalidade=data.naturalidade,
        nacionalidade=data.nacionalidade,
        profissao=data.profissao,
        entidade_empregadora=data.entidade_empregadora,
        
        # Estado civil
        estado_civil=data.estado_civil,
        regime_casamento=data.regime_casamento,
        data_casamento=data.data_casamento,
        
        # Dados cônjuge
        conjuge_nome=data.conjuge_nome,
        conjuge_nif=data.conjuge_nif,
        conjuge_cc=data.conjuge_cc,
        conjuge_cc_validade=data.conjuge_cc_validade,
        conjuge_data_nascimento=data.conjuge_data_nascimento,
        conjuge_naturalidade=data.conjuge_naturalidade,
        conjuge_nacionalidade=data.conjuge_nacionalidade,
        conjuge_profissao=data.conjuge_profissao,
        conjuge_email=data.conjuge_email,
        conjuge_telefone=data.conjuge_telefone,
        
        # Dados empresa
        empresa_nome=data.empresa_nome,
        empresa_nipc=data.empresa_nipc,
        empresa_sede=data.empresa_sede,
        empresa_capital_social=data.empresa_capital_social,
        empresa_conservatoria=data.empresa_conservatoria,
        empresa_matricula=data.empresa_matricula,
        empresa_cargo=data.empresa_cargo,
        empresa_poderes=data.empresa_poderes,
        
        # Contactos
        email=data.email,
        telefone=data.telefone,
        telefone_alt=data.telefone_alt,
        
        # Morada
        morada=data.morada,
        numero_porta=data.numero_porta,
        andar=data.andar,
        codigo_postal=data.codigo_postal,
        localidade=data.localidade,
        concelho=data.concelho,
        distrito=data.distrito,
        pais=data.pais,
        
        # CRM
        notas=data.notas,
        tags=data.tags or [],
        preferencias=data.preferencias or {},
        documentos=data.documentos or [],
        
        # Relações
        angariacao_id=data.angariacao_id,
        property_id=data.property_id,
        lead_id=data.lead_id,
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return client


@router.put("/{client_id}")
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualizar dados de um cliente
    Inclui atualização de notas
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Atualizar apenas campos fornecidos
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)
    
    # Atualizar timestamp de interação se houver mudanças relevantes
    if update_data:
        client.ultima_interacao = datetime.utcnow()
    
    db.commit()
    db.refresh(client)
    
    return client.to_dict()


@router.patch("/{client_id}/notes")
def update_client_notes(
    client_id: int,
    notas: str = Query(..., description="Notas do cliente"),
    db: Session = Depends(get_db)
):
    """
    Atualizar apenas as notas de um cliente
    Endpoint simplificado para edição rápida
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    client.notas = notas
    client.ultima_interacao = datetime.utcnow()
    
    db.commit()
    db.refresh(client)
    
    return {"success": True, "notas": client.notas}


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    """
    Eliminar cliente (soft delete - marca como inativo)
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    client.is_active = False
    db.commit()
    
    return {"success": True, "message": "Cliente removido"}


@router.post("/sync-from-leads")
def sync_leads_to_clients(
    agent_id: Optional[int] = Query(None, description="Sincronizar leads de um agente específico"),
    db: Session = Depends(get_db)
):
    """
    Sincronizar leads do site para o sistema de clientes.
    Cria clientes a partir de leads que ainda não foram convertidos.
    
    - Admin: sincroniza todas as leads
    - Agente: sincroniza apenas as suas leads
    """
    # Import local para evitar importação circular
    from app.leads.models import Lead
    
    query = db.query(Lead)
    
    if agent_id:
        query = query.filter(Lead.assigned_agent_id == agent_id)
    
    leads = query.all()
    
    created = 0
    updated = 0
    skipped = 0
    
    for lead in leads:
        # Verificar se já existe cliente com esta lead_id
        existing_by_lead = db.query(Client).filter(
            Client.lead_id == lead.id
        ).first()
        
        if existing_by_lead:
            skipped += 1
            continue
        
        # Verificar se já existe cliente com mesmo email ou telefone para o mesmo agente
        existing = None
        if lead.email:
            existing = db.query(Client).filter(
                Client.agent_id == lead.assigned_agent_id,
                Client.email == lead.email,
                Client.is_active == True
            ).first()
        
        if not existing and lead.phone:
            existing = db.query(Client).filter(
                Client.agent_id == lead.assigned_agent_id,
                Client.telefone == lead.phone,
                Client.is_active == True
            ).first()
        
        if existing:
            # Atualizar cliente existente com lead_id
            existing.lead_id = lead.id
            existing.ultima_interacao = datetime.utcnow()
            updated += 1
        else:
            # Criar novo cliente a partir da lead
            client = Client(
                agent_id=lead.assigned_agent_id,
                lead_id=lead.id,
                nome=lead.name,
                email=lead.email,
                telefone=lead.phone,
                notas=lead.message,
                client_type="lead",
                origin="website" if lead.source == "WEBSITE" else (lead.source.lower() if lead.source else "website"),
                property_id=lead.property_id,
            )
            db.add(client)
            created += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Sincronização concluída",
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "total_processed": created + updated + skipped
    }


@router.post("/from-angariacao")
def create_client_from_angariacao(
    angariacao_id: int = Query(...),
    agent_id: int = Query(...),
    agency_id: Optional[int] = Query(None),
    nome: str = Query(...),
    nif: Optional[str] = Query(None),
    cc: Optional[str] = Query(None),
    cc_validade: Optional[date] = Query(None),
    data_nascimento: Optional[date] = Query(None),
    telefone: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    morada: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Criar cliente automaticamente a partir de uma angariação/CMI
    Chamado quando OCR detecta proprietário
    """
    # Verificar se já existe cliente com este NIF para este agente
    if nif:
        existing = db.query(Client).filter(
            Client.agent_id == agent_id,
            Client.nif == nif,
            Client.is_active == True
        ).first()
        
        if existing:
            # Atualizar dados existentes se necessário
            if cc and not existing.cc:
                existing.cc = cc
            if cc_validade and not existing.cc_validade:
                existing.cc_validade = cc_validade
            if data_nascimento and not existing.data_nascimento:
                existing.data_nascimento = data_nascimento
            if telefone and not existing.telefone:
                existing.telefone = telefone
            if email and not existing.email:
                existing.email = email
            if morada and not existing.morada:
                existing.morada = morada
            if angariacao_id:
                existing.angariacao_id = angariacao_id
            
            existing.ultima_interacao = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            
            return {
                "success": True,
                "action": "updated",
                "client": existing.to_dict()
            }
    
    # Criar novo cliente
    client = Client(
        agent_id=agent_id,
        agency_id=agency_id,
        angariacao_id=angariacao_id,
        nome=nome,
        nif=nif,
        cc=cc,
        cc_validade=cc_validade,
        data_nascimento=data_nascimento,
        telefone=telefone,
        email=email,
        morada=morada,
        client_type="vendedor",  # Proprietário = vendedor
        origin="angariacao",
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return {
        "success": True,
        "action": "created",
        "client": client.to_dict()
    }


# ====================================================
# TRANSAÇÕES DO CLIENTE
# ====================================================

@router.get("/{client_id}/transacoes")
def list_client_transacoes(
    client_id: int,
    tipo: Optional[str] = Query(None, description="Filtrar por tipo: venda, compra, etc."),
    db: Session = Depends(get_db)
):
    """
    Listar histórico de transações de um cliente
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    query = db.query(ClientTransacao).filter(ClientTransacao.client_id == client_id)
    
    if tipo:
        query = query.filter(ClientTransacao.tipo == tipo)
    
    transacoes = query.order_by(ClientTransacao.data.desc()).all()
    
    return {
        "client_id": client_id,
        "total": len(transacoes),
        "items": [t.to_dict() for t in transacoes]
    }


@router.post("/{client_id}/transacoes")
def create_client_transacao(
    client_id: int,
    data: TransacaoCreate,
    agent_id: int = Query(..., description="ID do agente"),
    db: Session = Depends(get_db)
):
    """
    Registar nova transação para um cliente
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    transacao = ClientTransacao(
        client_id=client_id,
        agent_id=agent_id,
        property_id=data.property_id,
        tipo=data.tipo,
        descricao=data.descricao,
        referencia_imovel=data.referencia_imovel,
        valor=data.valor,
        comissao=data.comissao,
        data=data.data,
        data_contrato=data.data_contrato,
        outra_parte_nome=data.outra_parte_nome,
        outra_parte_nif=data.outra_parte_nif,
        notas=data.notas,
        documentos=[d.model_dump() for d in data.documentos] if data.documentos else []
    )
    
    db.add(transacao)
    
    # Atualizar última interação do cliente
    client.ultima_interacao = datetime.utcnow()
    
    db.commit()
    db.refresh(transacao)
    
    return {
        "success": True,
        "message": "Transação registada com sucesso",
        "transacao": transacao.to_dict()
    }


@router.delete("/{client_id}/transacoes/{transacao_id}")
def delete_client_transacao(
    client_id: int,
    transacao_id: int,
    db: Session = Depends(get_db)
):
    """
    Eliminar transação de um cliente
    """
    transacao = db.query(ClientTransacao).filter(
        ClientTransacao.id == transacao_id,
        ClientTransacao.client_id == client_id
    ).first()
    
    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    db.delete(transacao)
    db.commit()
    
    return {"success": True, "message": "Transação eliminada"}


# ====================================================
# DOCUMENTOS DO CLIENTE
# ====================================================

@router.get("/{client_id}/documentos")
def list_client_documentos(
    client_id: int,
    db: Session = Depends(get_db)
):
    """
    Listar documentos de um cliente
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    return {
        "client_id": client_id,
        "documentos": client.documentos or []
    }


@router.post("/{client_id}/documentos")
def add_client_documento(
    client_id: int,
    documento: DocumentoSchema,
    db: Session = Depends(get_db)
):
    """
    Adicionar documento ao cliente
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Adicionar data de upload se não tiver
    doc_dict = documento.model_dump()
    if not doc_dict.get("data_upload"):
        doc_dict["data_upload"] = datetime.utcnow().isoformat()
    
    # Inicializar lista se for None
    if client.documentos is None:
        client.documentos = []
    
    # Verificar se já existe documento do mesmo tipo
    existing_idx = None
    for idx, d in enumerate(client.documentos):
        if d.get("tipo") == documento.tipo:
            existing_idx = idx
            break
    
    if existing_idx is not None:
        # Substituir documento existente
        client.documentos[existing_idx] = doc_dict
    else:
        # Adicionar novo
        client.documentos.append(doc_dict)
    
    # Marcar campo como modificado (necessário para JSON em SQLAlchemy)
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(client, "documentos")
    
    db.commit()
    db.refresh(client)
    
    return {
        "success": True,
        "message": "Documento adicionado",
        "documentos": client.documentos
    }


@router.delete("/{client_id}/documentos/{tipo}")
def remove_client_documento(
    client_id: int,
    tipo: str,
    db: Session = Depends(get_db)
):
    """
    Remover documento do cliente por tipo
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    if not client.documentos:
        raise HTTPException(status_code=404, detail="Cliente não tem documentos")
    
    # Filtrar documento pelo tipo
    original_len = len(client.documentos)
    client.documentos = [d for d in client.documentos if d.get("tipo") != tipo]
    
    if len(client.documentos) == original_len:
        raise HTTPException(status_code=404, detail=f"Documento do tipo '{tipo}' não encontrado")
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(client, "documentos")
    
    db.commit()
    
    return {"success": True, "message": f"Documento '{tipo}' removido"}


# ====================================================
# ESTATÍSTICAS DO CLIENTE
# ====================================================

@router.get("/{client_id}/stats")
def get_client_stats(
    client_id: int,
    db: Session = Depends(get_db)
):
    """
    Obter estatísticas de um cliente
    - Total de transações
    - Volume total negociado
    - Comissões geradas
    - Documentos pendentes
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    transacoes = db.query(ClientTransacao).filter(
        ClientTransacao.client_id == client_id
    ).all()
    
    total_vendas = sum(t.valor or 0 for t in transacoes if t.tipo == "venda")
    total_compras = sum(t.valor or 0 for t in transacoes if t.tipo == "compra")
    total_comissoes = sum(t.comissao or 0 for t in transacoes)
    
    # Verificar documentos obrigatórios
    docs_existentes = {d.get("tipo") for d in (client.documentos or [])}
    docs_obrigatorios = {"cc_frente", "cc_verso", "comprovativo_morada"}
    docs_pendentes = docs_obrigatorios - docs_existentes
    
    return {
        "client_id": client_id,
        "total_transacoes": len(transacoes),
        "transacoes_por_tipo": {
            "vendas": len([t for t in transacoes if t.tipo == "venda"]),
            "compras": len([t for t in transacoes if t.tipo == "compra"]),
            "arrendamentos": len([t for t in transacoes if "arrendamento" in t.tipo]),
            "outros": len([t for t in transacoes if t.tipo not in ["venda", "compra"] and "arrendamento" not in t.tipo])
        },
        "volume_vendas": float(total_vendas),
        "volume_compras": float(total_compras),
        "total_comissoes": float(total_comissoes),
        "documentos_total": len(client.documentos or []),
        "documentos_pendentes": list(docs_pendentes),
        "is_verified": client.is_verified,
        "estado_civil": client.estado_civil,
        "tem_conjuge": bool(client.conjuge_nome),
        "is_empresa": client.is_empresa,
    }