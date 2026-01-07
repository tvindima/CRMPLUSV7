"""
Endpoint temporário para setup de agentes e users
PROTEGIDO - Requer header X-Admin-Key

Adicionar ao main.py e chamar via curl POST
"""

import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
import bcrypt

from app.database import get_db
from app.agents.models import Agent
from app.users.models import User

setup_router = APIRouter(prefix="/admin/setup", tags=["admin-setup"])

# Chave de admin para proteger endpoints sensíveis
# Em produção, definir via variável de ambiente ADMIN_SETUP_KEY
ADMIN_SETUP_KEY = os.environ.get("ADMIN_SETUP_KEY", "dev_admin_key_change_in_production")


def verify_admin_key(x_admin_key: str = Header(..., description="Chave de administração")):
    """
    Verificar chave de admin para acesso a endpoints protegidos.
    Requer header: X-Admin-Key
    """
    if x_admin_key != ADMIN_SETUP_KEY:
        raise HTTPException(
            status_code=403,
            detail="Chave de administração inválida"
        )
    return True


# Dados dos 19 agentes reais
AGENTES = [
    {"id": 24, "name": "António Silva", "email": "asilva@imoveismais.pt", "initials": "AS"},
    {"id": 25, "name": "Hugo Belo", "email": "hbelo@imoveismais.pt", "initials": "HB"},
    {"id": 26, "name": "Bruno Libânio", "email": "blibanio@imoveismais.pt", "initials": "BL"},
    {"id": 27, "name": "Nélson Neto", "email": "nneto@imoveismais.pt", "initials": "NN"},
    {"id": 28, "name": "João Paiva", "email": "jpaiva@imoveismais.pt", "initials": "JP"},
    {"id": 29, "name": "Marisa Barosa", "email": "arrendamentosleiria@imoveismais.pt", "initials": "MB"},
    {"id": 30, "name": "Eduardo Coelho", "email": "ecoelho@imoveismais.pt", "initials": "EC"},
    {"id": 31, "name": "João Silva", "email": "jsilva@imoveismais.pt", "initials": "JS"},
    {"id": 32, "name": "Hugo Mota", "email": "hmota@imoveismais.pt", "initials": "HM"},
    {"id": 33, "name": "João Pereira", "email": "jpereira@imoveismais.pt", "initials": "JPe"},
    {"id": 34, "name": "João Carvalho", "email": "jcarvalho@imoveismais.pt", "initials": "JC"},
    {"id": 35, "name": "Tiago Vindima", "email": "tvindima@imoveismais.pt", "initials": "TV"},
    {"id": 36, "name": "Mickael Soares", "email": "msoares@imoveismais.pt", "initials": "MS"},
    {"id": 37, "name": "Paulo Rodrigues", "email": "prodrigues@imoveismais.pt", "initials": "PR"},
    {"id": 38, "name": "Imóveis Mais Leiria", "email": "leiria@imoveismais.pt", "initials": "IL"},
    {"id": 39, "name": "Nuno Faria", "email": "nfaria@imoveismais.pt", "initials": "NF"},
    {"id": 40, "name": "Pedro Olaio", "email": "polaio@imoveismais.pt", "initials": "PO"},
    {"id": 41, "name": "João Olaio", "email": "jolaio@imoveismais.pt", "initials": "JO"},
    {"id": 42, "name": "Fábio Passos", "email": "fpassos@imoveismais.pt", "initials": "FP"},
]


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


@setup_router.post("/agents-users")
def setup_agents_and_users(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Setup completo de agentes e users:
    1. Atualiza dados dos agentes (nome, email)
    2. Cria users para cada agente com password: {iniciais}crmtest
    
    PROTEGIDO - Requer header: X-Admin-Key
    """
    results = {
        "agents_updated": [],
        "users_created": [],
        "users_updated": [],
        "errors": []
    }
    
    try:
        # 1. Atualizar/Criar agentes UM A UM
        for agent_data in AGENTES:
            try:
                agent = db.query(Agent).filter(Agent.id == agent_data["id"]).first()
                
                if agent:
                    # Verificar se email já existe em outro agente
                    existing_email = db.query(Agent).filter(
                        Agent.email == agent_data["email"],
                        Agent.id != agent_data["id"]
                    ).first()
                    
                    if existing_email:
                        # Email já existe noutro agente, usar email alternativo
                        agent.name = agent_data["name"]
                        results["agents_updated"].append(f"{agent_data['id']}: {agent_data['name']} (email mantido: {agent.email})")
                    else:
                        agent.name = agent_data["name"]
                        agent.email = agent_data["email"]
                        results["agents_updated"].append(f"{agent_data['id']}: {agent_data['name']}")
                else:
                    # Criar novo agente
                    new_agent = Agent(
                        id=agent_data["id"],
                        name=agent_data["name"],
                        email=agent_data["email"]
                    )
                    db.add(new_agent)
                    results["agents_updated"].append(f"{agent_data['id']}: {agent_data['name']} (NOVO)")
                
                db.commit()
            except Exception as e:
                db.rollback()
                results["errors"].append(f"Agent {agent_data['id']}: {str(e)}")
        
        # 2. Criar/Atualizar users
        for agent_data in AGENTES:
            try:
                # Buscar o agente para pegar o email atual dele
                agent = db.query(Agent).filter(Agent.id == agent_data["id"]).first()
                if not agent:
                    results["errors"].append(f"Agent {agent_data['id']} não encontrado para criar user")
                    continue
                
                email = agent.email.lower()  # Usar email do agente na BD
                password_plain = f"{agent_data['initials'].lower()}crmtest"
                password_hash = hash_password(password_plain)
                
                user = db.query(User).filter(User.email == email).first()
                
                if user:
                    # Atualizar existente
                    user.hashed_password = password_hash
                    user.agent_id = agent_data["id"]
                    user.is_active = True
                    user.full_name = agent.name  # Adicionar full_name
                    results["users_updated"].append(f"{email} → {password_plain}")
                else:
                    # Criar novo user
                    new_user = User(
                        email=email,
                        hashed_password=password_hash,
                        role="agent",
                        agent_id=agent_data["id"],
                        is_active=True,
                        full_name=agent.name  # Adicionar full_name
                    )
                    db.add(new_user)
                    results["users_created"].append(f"{email} → {password_plain}")
                
                db.commit()
            except Exception as e:
                db.rollback()
                results["errors"].append(f"User {agent_data['email']}: {str(e)}")
        
        db.commit()
        
        # Também atualizar o admin tvindima para ter agent_id=35
        admin = db.query(User).filter(User.email == "tvindima@imoveismais.pt").first()
        if admin and admin.role == "admin":
            admin.agent_id = 35
            db.commit()
        
        return {
            "success": True,
            "message": f"Setup completo! {len(results['agents_updated'])} agentes, {len(results['users_created'])} users criados, {len(results['users_updated'])} users atualizados",
            "details": results
        }
        
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "error": str(e),
            "details": results
        }


@setup_router.get("/test-logins")
def test_agent_logins(_: bool = Depends(verify_admin_key)):
    """Lista todos os logins de teste configurados - PROTEGIDO"""
    logins = []
    for agent in AGENTES:
        password_plain = f"{agent['initials'].lower()}crmtest"
        logins.append({
            "name": agent["name"],
            "email": agent["email"],
            "password": password_plain,
            "agent_id": agent["id"]
        })
    return {"logins": logins}


@setup_router.post("/add-works-for-column")
def add_works_for_agent_column(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Adicionar coluna works_for_agent_id à tabela users - PROTEGIDO"""
    try:
        # Verificar se coluna já existe
        result = db.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'works_for_agent_id'
        """))
        if result.fetchone():
            return {"success": True, "message": "Coluna já existe"}
        
        # Adicionar coluna
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN works_for_agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL
        """))
        db.commit()
        return {"success": True, "message": "Coluna works_for_agent_id adicionada"}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


# =====================================================
# ENDPOINT TEMPORÁRIO PARA CRIAR USERS SEM AUTH
# TODO: Remover quando backoffice tiver autenticação
# =====================================================

from pydantic import BaseModel, EmailStr
from typing import Optional

class CreateUserRequest(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    password: str
    role: str = "agent"  # agent, assistant, admin, coordinator
    agent_id: Optional[int] = None
    works_for_agent_id: Optional[int] = None


@setup_router.post("/create-user")
def create_user_no_auth(
    data: CreateUserRequest, 
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Criar user - PROTEGIDO com X-Admin-Key
    """
    # Verificar se email já existe
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    # Verificar se agent_id existe (se fornecido)
    if data.agent_id:
        agent = db.query(Agent).filter(Agent.id == data.agent_id).first()
        if not agent:
            raise HTTPException(status_code=400, detail=f"Agent ID {data.agent_id} não existe")
    
    # Verificar se works_for_agent_id existe (se fornecido)
    if data.works_for_agent_id:
        works_for = db.query(Agent).filter(Agent.id == data.works_for_agent_id).first()
        if not works_for:
            raise HTTPException(status_code=400, detail=f"Agent responsável ID {data.works_for_agent_id} não existe")
    
    # Criar user
    hashed = hash_password(data.password)
    user = User(
        email=data.email.lower(),
        hashed_password=hashed,
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
        agent_id=data.agent_id,
        works_for_agent_id=data.works_for_agent_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "agent_id": user.agent_id,
        "works_for_agent_id": user.works_for_agent_id,
        "message": "User criado com sucesso"
    }


@setup_router.get("/list-users")
def list_all_users(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Listar todos os users - PROTEGIDO"""
    users = db.query(User).all()
    return {
        "total": len(users),
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "agent_id": u.agent_id,
                "works_for_agent_id": u.works_for_agent_id,
                "is_active": u.is_active
            }
            for u in users
        ]
    }


@setup_router.get("/list-staff")
def list_staff_users(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Listar staff (não-agentes) - PROTEGIDO"""
    staff = db.query(User).filter(User.role != "agent", User.role != "admin").all()
    result = []
    for u in staff:
        agent_name = None
        if u.works_for_agent_id:
            agent = db.query(Agent).filter(Agent.id == u.works_for_agent_id).first()
            if agent:
                agent_name = agent.name
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role,
            "works_for_agent_id": u.works_for_agent_id,
            "works_for_agent_name": agent_name,
            "is_active": u.is_active
        })
    return {"total": len(result), "staff": result}


class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    works_for_agent_id: Optional[int] = None
    is_active: Optional[bool] = None


@setup_router.put("/update-user/{user_id}")
def update_user_no_auth(
    user_id: int, 
    data: UpdateUserRequest, 
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Atualizar user - PROTEGIDO"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User não encontrado")
    
    if data.email:
        user.email = data.email.lower()
    if data.full_name:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.password:
        user.hashed_password = hash_password(data.password)
    if data.role:
        user.role = data.role
    if data.works_for_agent_id is not None:
        user.works_for_agent_id = data.works_for_agent_id
    if data.is_active is not None:
        user.is_active = data.is_active
    
    db.commit()
    return {"success": True, "message": "User atualizado"}


@setup_router.delete("/delete-user/{user_id}")
def delete_user_no_auth(
    user_id: int, 
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """Eliminar user - PROTEGIDO"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User não encontrado")
    
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user_id} eliminado"}
