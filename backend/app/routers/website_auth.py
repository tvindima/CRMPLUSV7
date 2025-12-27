"""
Rotas de autenticação para clientes do website (compradores/interessados)
Endpoints PÚBLICOS - sem autenticação de agente
Inclui sistema de distribuição round-robin de leads por tipo
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List
import jwt
import os

from app.database import get_db
from app.models.website_client import WebsiteClient, LeadDistributionCounter
from app.users.models import User
from app.schemas.website_client import (
    WebsiteClientRegister,
    WebsiteClientLogin,
    WebsiteClientOut,
    WebsiteClientUpdate,
    WebsiteClientToken,
    WebsiteClientListItem,
    AgentForSelection
)
from app.users.services import hash_password, verify_password

router = APIRouter(prefix="/website/auth", tags=["Website Client Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "crmplusv7-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30  # Token válido por 30 dias para clientes

# ID da Marisa Barosa (agente de arrendamento)
RENTAL_AGENT_ID = 39  # Marisa Barosa


def create_client_token(client_id: int, email: str) -> str:
    """Criar JWT token para cliente do website"""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(client_id),
        "email": email,
        "type": "website_client",
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_client(token: str, db: Session) -> WebsiteClient:
    """Validar token e retornar cliente"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "website_client":
            raise HTTPException(status_code=401, detail="Token inválido")
        client_id = int(payload.get("sub"))
        client = db.query(WebsiteClient).filter(WebsiteClient.id == client_id).first()
        if not client or not client.is_active:
            raise HTTPException(status_code=401, detail="Cliente não encontrado")
        return client
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")


def get_sales_agents(db: Session) -> List[User]:
    """Obter lista de agentes de venda (excluindo Marisa Barosa)"""
    return db.query(User).filter(
        User.role == "agent",
        User.is_active == True,
        User.id != RENTAL_AGENT_ID  # Excluir agente de arrendamento
    ).order_by(User.id).all()


def get_next_agent_round_robin(db: Session, client_type: str) -> int:
    """
    Obter próximo agente usando round-robin.
    Filas separadas para investidores e pontuais.
    """
    # Buscar ou criar contador para este tipo
    counter = db.query(LeadDistributionCounter).filter(
        LeadDistributionCounter.counter_type == client_type
    ).first()
    
    if not counter:
        counter = LeadDistributionCounter(
            counter_type=client_type,
            last_agent_index=0
        )
        db.add(counter)
        db.commit()
        db.refresh(counter)
    
    # Obter lista de agentes de venda
    agents = get_sales_agents(db)
    
    if not agents:
        return None
    
    # Calcular próximo índice (round-robin)
    next_index = (counter.last_agent_index + 1) % len(agents)
    
    # Atualizar contador
    counter.last_agent_index = next_index
    counter.updated_at = datetime.utcnow()
    db.commit()
    
    return agents[next_index].id


def assign_agent_to_client(db: Session, interest_type: str, client_type: str, selected_agent_id: int = None) -> tuple:
    """
    Atribuir agente ao cliente baseado no tipo de interesse e cliente.
    Retorna (agent_id, selected_by_client)
    """
    # Se cliente escolheu um agente específico, usar esse
    if selected_agent_id:
        agent = db.query(User).filter(User.id == selected_agent_id, User.is_active == True).first()
        if agent:
            return (agent.id, True)
    
    # Arrendamento → Marisa Barosa
    if interest_type == "arrendamento":
        return (RENTAL_AGENT_ID, False)
    
    # Compra → Round-robin por tipo de cliente
    agent_id = get_next_agent_round_robin(db, client_type)
    return (agent_id, False)


@router.get("/agents", response_model=List[AgentForSelection])
def get_available_agents(
    interest_type: str = "compra",
    db: Session = Depends(get_db)
):
    """
    Listar agentes disponíveis para o cliente escolher.
    Filtrado por tipo de interesse (compra/arrendamento).
    """
    if interest_type == "arrendamento":
        # Para arrendamento, só mostrar Marisa Barosa
        agent = db.query(User).filter(User.id == RENTAL_AGENT_ID, User.is_active == True).first()
        if agent:
            return [AgentForSelection(
                id=agent.id,
                name=agent.display_name or f"{agent.first_name} {agent.last_name}".strip() or agent.email,
                avatar_url=agent.avatar,
                specialty="arrendamento"
            )]
        return []
    else:
        # Para compra, mostrar agentes de venda
        agents = get_sales_agents(db)
        return [
            AgentForSelection(
                id=a.id,
                name=a.display_name or f"{a.first_name} {a.last_name}".strip() or a.email,
                avatar_url=a.avatar,
                specialty="venda"
            )
            for a in agents
        ]


@router.post("/register", response_model=WebsiteClientToken, status_code=201)
def register_client(
    data: WebsiteClientRegister,
    db: Session = Depends(get_db)
):
    """
    Registar novo cliente do website.
    Endpoint PÚBLICO.
    Atribui agente automaticamente ou usa o escolhido pelo cliente.
    """
    # Verificar se email já existe
    existing = db.query(WebsiteClient).filter(
        WebsiteClient.email == data.email.lower()
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Este email já está registado. Tente fazer login."
        )
    
    # Validar password
    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="A password deve ter pelo menos 6 caracteres"
        )
    
    # Determinar tipo de cliente
    # Se for arrendamento, client_type não é relevante
    client_type = data.client_type if data.interest_type == "compra" else "arrendamento"
    
    # Atribuir agente
    agent_id, selected_by_client = assign_agent_to_client(
        db, 
        data.interest_type, 
        client_type,
        data.selected_agent_id
    )
    
    # Criar cliente
    client = WebsiteClient(
        name=data.name,
        email=data.email.lower(),
        phone=data.phone,
        hashed_password=hash_password(data.password),
        interest_type=data.interest_type,
        client_type=client_type,
        assigned_agent_id=agent_id,
        agent_selected_by_client=selected_by_client,
        is_active=True,
        is_verified=False,
        last_login=datetime.utcnow()
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)
    
    # Buscar nome do agente
    agent_name = None
    if agent_id:
        agent = db.query(User).filter(User.id == agent_id).first()
        if agent:
            agent_name = agent.display_name or f"{agent.first_name} {agent.last_name}".strip()
    
    # Gerar token
    token = create_client_token(client.id, client.email)
    
    # Criar resposta com dados adicionais
    client_out = WebsiteClientOut(
        id=client.id,
        name=client.name,
        email=client.email,
        phone=client.phone,
        client_type=client.client_type,
        interest_type=client.interest_type,
        assigned_agent_id=client.assigned_agent_id,
        assigned_agent_name=agent_name,
        agent_selected_by_client=client.agent_selected_by_client,
        is_active=client.is_active,
        is_verified=client.is_verified,
        receive_alerts=client.receive_alerts,
        created_at=client.created_at,
        last_login=client.last_login
    )
    
    return WebsiteClientToken(
        access_token=token,
        client=client_out
    )


@router.post("/login", response_model=WebsiteClientToken)
def login_client(
    data: WebsiteClientLogin,
    db: Session = Depends(get_db)
):
    """
    Login de cliente do website.
    Endpoint PÚBLICO.
    """
    # Buscar cliente
    client = db.query(WebsiteClient).filter(
        WebsiteClient.email == data.email.lower()
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=401,
            detail="Email ou password incorretos"
        )
    
    # Verificar password
    if not verify_password(data.password, client.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Email ou password incorretos"
        )
    
    # Verificar se está ativo
    if not client.is_active:
        raise HTTPException(
            status_code=403,
            detail="Conta desativada. Contacte o suporte."
        )
    
    # Atualizar último login
    client.last_login = datetime.utcnow()
    db.commit()
    
    # Buscar nome do agente
    agent_name = None
    if client.assigned_agent_id:
        agent = db.query(User).filter(User.id == client.assigned_agent_id).first()
        if agent:
            agent_name = agent.display_name or f"{agent.first_name} {agent.last_name}".strip()
    
    # Gerar token
    token = create_client_token(client.id, client.email)
    
    client_out = WebsiteClientOut(
        id=client.id,
        name=client.name,
        email=client.email,
        phone=client.phone,
        client_type=getattr(client, 'client_type', 'pontual'),
        interest_type=getattr(client, 'interest_type', 'compra'),
        assigned_agent_id=client.assigned_agent_id,
        assigned_agent_name=agent_name,
        agent_selected_by_client=getattr(client, 'agent_selected_by_client', False),
        is_active=client.is_active,
        is_verified=client.is_verified,
        receive_alerts=client.receive_alerts,
        created_at=client.created_at,
        last_login=client.last_login
    )
    
    return WebsiteClientToken(
        access_token=token,
        client=client_out
    )


@router.get("/me", response_model=WebsiteClientOut)
def get_current_client_info(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Obter dados do cliente logado.
    Requer token no query param: /me?token=xxx
    """
    client = get_current_client(token, db)
    
    # Buscar nome do agente
    agent_name = None
    if client.assigned_agent_id:
        agent = db.query(User).filter(User.id == client.assigned_agent_id).first()
        if agent:
            agent_name = agent.display_name or f"{agent.first_name} {agent.last_name}".strip()
    
    return WebsiteClientOut(
        id=client.id,
        name=client.name,
        email=client.email,
        phone=client.phone,
        client_type=getattr(client, 'client_type', 'pontual'),
        interest_type=getattr(client, 'interest_type', 'compra'),
        assigned_agent_id=client.assigned_agent_id,
        assigned_agent_name=agent_name,
        agent_selected_by_client=getattr(client, 'agent_selected_by_client', False),
        is_active=client.is_active,
        is_verified=client.is_verified,
        receive_alerts=client.receive_alerts,
        created_at=client.created_at,
        last_login=client.last_login
    )


@router.put("/me", response_model=WebsiteClientOut)
def update_client_info(
    token: str,
    data: WebsiteClientUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualizar dados do cliente.
    Requer token no query param: /me?token=xxx
    """
    client = get_current_client(token, db)
    
    # Atualizar campos
    if data.name is not None:
        client.name = data.name
    if data.phone is not None:
        client.phone = data.phone
    if data.receive_alerts is not None:
        client.receive_alerts = data.receive_alerts
    if data.search_preferences is not None:
        client.search_preferences = data.search_preferences
    
    client.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(client)
    
    # Buscar nome do agente
    agent_name = None
    if client.assigned_agent_id:
        agent = db.query(User).filter(User.id == client.assigned_agent_id).first()
        if agent:
            agent_name = agent.display_name or f"{agent.first_name} {agent.last_name}".strip()
    
    return WebsiteClientOut(
        id=client.id,
        name=client.name,
        email=client.email,
        phone=client.phone,
        client_type=getattr(client, 'client_type', 'pontual'),
        interest_type=getattr(client, 'interest_type', 'compra'),
        assigned_agent_id=client.assigned_agent_id,
        assigned_agent_name=agent_name,
        agent_selected_by_client=getattr(client, 'agent_selected_by_client', False),
        is_active=client.is_active,
        is_verified=client.is_verified,
        receive_alerts=client.receive_alerts,
        created_at=client.created_at,
        last_login=client.last_login
    )


@router.post("/validate", response_model=WebsiteClientOut)
def validate_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Validar token e retornar dados do cliente.
    Endpoint PÚBLICO.
    """
    client = get_current_client(token, db)
    
    # Buscar nome do agente
    agent_name = None
    if client.assigned_agent_id:
        agent = db.query(User).filter(User.id == client.assigned_agent_id).first()
        if agent:
            agent_name = agent.display_name or f"{agent.first_name} {agent.last_name}".strip()
    
    return WebsiteClientOut(
        id=client.id,
        name=client.name,
        email=client.email,
        phone=client.phone,
        client_type=getattr(client, 'client_type', 'pontual'),
        interest_type=getattr(client, 'interest_type', 'compra'),
        assigned_agent_id=client.assigned_agent_id,
        assigned_agent_name=agent_name,
        agent_selected_by_client=getattr(client, 'agent_selected_by_client', False),
        is_active=client.is_active,
        is_verified=client.is_verified,
        receive_alerts=client.receive_alerts,
        created_at=client.created_at,
        last_login=client.last_login
    )
