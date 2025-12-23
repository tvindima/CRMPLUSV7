"""
Endpoint temporário para setup de agentes e users
Adicionar ao main.py e chamar via curl POST
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import bcrypt

from app.database import get_db
from app.agents.models import Agent
from app.users.models import User

setup_router = APIRouter(prefix="/admin/setup", tags=["admin-setup"])

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
def setup_agents_and_users(db: Session = Depends(get_db)):
    """
    Setup completo de agentes e users:
    1. Atualiza dados dos agentes (nome, email)
    2. Cria users para cada agente com password: {iniciais}crmtest
    
    Chamar: curl -X POST https://crmplusv7-production.up.railway.app/admin/setup/agents-users
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
def test_agent_logins():
    """Lista todos os logins de teste configurados"""
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
