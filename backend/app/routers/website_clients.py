"""
Rotas para gestão de clientes do website no backoffice
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.website_client import WebsiteClient, LeadDistributionCounter
from app.users.models import User
from app.schemas.website_client import WebsiteClientListItem

router = APIRouter(prefix="/website/clients", tags=["Website Clients Management"])


@router.get("/", response_model=List[WebsiteClientListItem])
def list_website_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    client_type: Optional[str] = None,  # investidor, pontual, arrendamento
    interest_type: Optional[str] = None,  # compra, arrendamento
    assigned_agent_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Listar clientes registados no website.
    Filtros opcionais por tipo de cliente, interesse, agente e pesquisa.
    """
    query = db.query(WebsiteClient)
    
    # Filtros
    if client_type:
        query = query.filter(WebsiteClient.client_type == client_type)
    
    if interest_type:
        query = query.filter(WebsiteClient.interest_type == interest_type)
    
    if assigned_agent_id:
        query = query.filter(WebsiteClient.assigned_agent_id == assigned_agent_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (WebsiteClient.name.ilike(search_term)) |
            (WebsiteClient.email.ilike(search_term)) |
            (WebsiteClient.phone.ilike(search_term))
        )
    
    # Ordenar por mais recente
    query = query.order_by(desc(WebsiteClient.created_at))
    
    # Paginar
    total = query.count()
    clients = query.offset(skip).limit(limit).all()
    
    # Buscar nomes dos agentes
    agent_ids = list(set([c.assigned_agent_id for c in clients if c.assigned_agent_id]))
    agents_map = {}
    if agent_ids:
        agents = db.query(User).filter(User.id.in_(agent_ids)).all()
        agents_map = {
            a.id: a.display_name or f"{a.first_name} {a.last_name}".strip() or a.email
            for a in agents
        }
    
    # Construir resposta
    result = []
    for c in clients:
        result.append(WebsiteClientListItem(
            id=c.id,
            name=c.name,
            email=c.email,
            phone=c.phone,
            client_type=getattr(c, 'client_type', 'pontual'),
            interest_type=getattr(c, 'interest_type', 'compra'),
            assigned_agent_id=c.assigned_agent_id,
            assigned_agent_name=agents_map.get(c.assigned_agent_id),
            agent_selected_by_client=getattr(c, 'agent_selected_by_client', False),
            is_active=c.is_active,
            created_at=c.created_at,
            last_login=c.last_login
        ))
    
    return result


@router.get("/stats")
def get_clients_stats(db: Session = Depends(get_db)):
    """
    Obter estatísticas dos clientes registados.
    """
    total = db.query(func.count(WebsiteClient.id)).scalar() or 0
    
    # Por tipo de cliente
    by_client_type = db.query(
        WebsiteClient.client_type,
        func.count(WebsiteClient.id)
    ).group_by(WebsiteClient.client_type).all()
    
    # Por tipo de interesse
    by_interest_type = db.query(
        WebsiteClient.interest_type,
        func.count(WebsiteClient.id)
    ).group_by(WebsiteClient.interest_type).all()
    
    # Por agente
    by_agent = db.query(
        WebsiteClient.assigned_agent_id,
        func.count(WebsiteClient.id)
    ).filter(
        WebsiteClient.assigned_agent_id.isnot(None)
    ).group_by(WebsiteClient.assigned_agent_id).all()
    
    # Buscar nomes dos agentes
    agent_ids = [a[0] for a in by_agent if a[0]]
    agents_map = {}
    if agent_ids:
        agents = db.query(User).filter(User.id.in_(agent_ids)).all()
        agents_map = {
            a.id: a.display_name or f"{a.first_name} {a.last_name}".strip()
            for a in agents
        }
    
    # Contadores round-robin
    counters = db.query(LeadDistributionCounter).all()
    
    return {
        "total": total,
        "by_client_type": {t or "indefinido": c for t, c in by_client_type},
        "by_interest_type": {t or "indefinido": c for t, c in by_interest_type},
        "by_agent": [
            {
                "agent_id": agent_id,
                "agent_name": agents_map.get(agent_id, "Desconhecido"),
                "count": count
            }
            for agent_id, count in by_agent
        ],
        "round_robin_counters": [
            {
                "type": c.counter_type,
                "last_index": c.last_agent_index,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None
            }
            for c in counters
        ]
    }


@router.get("/{client_id}")
def get_website_client(client_id: int, db: Session = Depends(get_db)):
    """
    Obter detalhes de um cliente específico.
    """
    client = db.query(WebsiteClient).filter(WebsiteClient.id == client_id).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Buscar agente
    agent_name = None
    if client.assigned_agent_id:
        agent = db.query(User).filter(User.id == client.assigned_agent_id).first()
        if agent:
            agent_name = agent.display_name or f"{agent.first_name} {agent.last_name}".strip()
    
    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "client_type": getattr(client, 'client_type', 'pontual'),
        "interest_type": getattr(client, 'interest_type', 'compra'),
        "assigned_agent_id": client.assigned_agent_id,
        "assigned_agent_name": agent_name,
        "agent_selected_by_client": getattr(client, 'agent_selected_by_client', False),
        "is_active": client.is_active,
        "is_verified": client.is_verified,
        "receive_alerts": client.receive_alerts,
        "search_preferences": client.search_preferences,
        "created_at": client.created_at,
        "updated_at": client.updated_at,
        "last_login": client.last_login
    }


@router.put("/{client_id}/assign-agent")
def reassign_client_agent(
    client_id: int,
    agent_id: int,
    db: Session = Depends(get_db)
):
    """
    Reatribuir cliente a outro agente manualmente.
    """
    client = db.query(WebsiteClient).filter(WebsiteClient.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    agent = db.query(User).filter(User.id == agent_id, User.is_active == True).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente não encontrado")
    
    client.assigned_agent_id = agent_id
    client.agent_selected_by_client = False  # Reatribuído manualmente
    client.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Cliente reatribuído a {agent.display_name or agent.first_name}"
    }


@router.put("/{client_id}/toggle-active")
def toggle_client_active(client_id: int, db: Session = Depends(get_db)):
    """
    Ativar/desativar cliente.
    """
    client = db.query(WebsiteClient).filter(WebsiteClient.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    client.is_active = not client.is_active
    client.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "is_active": client.is_active
    }
