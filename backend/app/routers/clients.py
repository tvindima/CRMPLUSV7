"""
Router para gestão de Clientes
CRUD completo + auto-criação via angariações + lembretes aniversários
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, extract, func
from typing import Optional, List
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.client import Client


router = APIRouter(prefix="/clients", tags=["clients"])


# === Pydantic Schemas ===

class ClientCreate(BaseModel):
    """Schema para criar cliente"""
    nome: str = Field(..., min_length=2)
    client_type: str = Field(default="lead")  # vendedor, comprador, investidor, etc.
    origin: str = Field(default="manual")
    
    # Dados pessoais (opcionais)
    nif: Optional[str] = None
    cc: Optional[str] = None
    cc_validade: Optional[date] = None
    data_nascimento: Optional[date] = None
    nacionalidade: Optional[str] = None
    estado_civil: Optional[str] = None
    profissao: Optional[str] = None
    
    # Contactos
    email: Optional[str] = None
    telefone: Optional[str] = None
    telefone_alt: Optional[str] = None
    
    # Morada
    morada: Optional[str] = None
    codigo_postal: Optional[str] = None
    localidade: Optional[str] = None
    distrito: Optional[str] = None
    
    # CRM
    notas: Optional[str] = None
    tags: Optional[List[str]] = []
    
    # Relações
    angariacao_id: Optional[int] = None
    property_id: Optional[int] = None
    lead_id: Optional[int] = None


class ClientUpdate(BaseModel):
    """Schema para atualizar cliente"""
    nome: Optional[str] = None
    client_type: Optional[str] = None
    
    # Dados pessoais
    nif: Optional[str] = None
    cc: Optional[str] = None
    cc_validade: Optional[date] = None
    data_nascimento: Optional[date] = None
    nacionalidade: Optional[str] = None
    estado_civil: Optional[str] = None
    profissao: Optional[str] = None
    
    # Contactos
    email: Optional[str] = None
    telefone: Optional[str] = None
    telefone_alt: Optional[str] = None
    
    # Morada
    morada: Optional[str] = None
    codigo_postal: Optional[str] = None
    localidade: Optional[str] = None
    distrito: Optional[str] = None
    
    # CRM
    notas: Optional[str] = None
    tags: Optional[List[str]] = None
    proxima_acao: Optional[str] = None
    proxima_acao_data: Optional[datetime] = None
    
    # Estado
    is_active: Optional[bool] = None


class ClientResponse(BaseModel):
    """Schema de resposta"""
    id: int
    agent_id: int
    agency_id: Optional[int]
    client_type: str
    origin: str
    nome: str
    nif: Optional[str]
    cc: Optional[str]
    cc_validade: Optional[date]
    data_nascimento: Optional[date]
    nacionalidade: Optional[str]
    estado_civil: Optional[str]
    profissao: Optional[str]
    email: Optional[str]
    telefone: Optional[str]
    telefone_alt: Optional[str]
    morada: Optional[str]
    codigo_postal: Optional[str]
    localidade: Optional[str]
    distrito: Optional[str]
    notas: Optional[str]
    tags: List[str]
    ultima_interacao: Optional[datetime]
    proxima_acao: Optional[str]
    proxima_acao_data: Optional[datetime]
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
        nif=data.nif,
        cc=data.cc,
        cc_validade=data.cc_validade,
        data_nascimento=data.data_nascimento,
        nacionalidade=data.nacionalidade,
        estado_civil=data.estado_civil,
        profissao=data.profissao,
        email=data.email,
        telefone=data.telefone,
        telefone_alt=data.telefone_alt,
        morada=data.morada,
        codigo_postal=data.codigo_postal,
        localidade=data.localidade,
        distrito=data.distrito,
        notas=data.notas,
        tags=data.tags or [],
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
