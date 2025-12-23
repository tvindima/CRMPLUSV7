"""
Endpoint para migrar agent_ids das properties e limpar duplicados
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.agents.models import Agent
from app.properties.models import Property
from app.users.models import User
import bcrypt

migrate_router = APIRouter(prefix="/admin/migrate", tags=["admin-migrate"])


# Mapeamento: ID duplicado → ID correto (baseado nos nomes)
AGENT_ID_MAP = {
    24: 5,   # António Silva
    25: 6,   # Hugo Belo
    26: 7,   # Bruno Libânio
    27: 8,   # Nélson Neto
    28: 9,   # João Paiva
    29: 10,  # Marisa Barosa
    30: 11,  # Eduardo Coelho
    31: 12,  # João Silva
    32: 13,  # Hugo Mota
    33: 14,  # João Pereira
    34: 15,  # João Carvalho
    35: 16,  # Tiago Vindima
    39: 1,   # Nuno Faria
    40: 2,   # Pedro Olaio
    41: 3,   # João Olaio
}

# Agentes reais (IDs 1-19) com iniciais para passwords
AGENTES_REAIS = [
    {"id": 1, "initials": "NF"},   # Nuno Faria
    {"id": 2, "initials": "PO"},   # Pedro Olaio
    {"id": 3, "initials": "JO"},   # João Olaio
    {"id": 4, "initials": "FP"},   # Fábio Passos
    {"id": 5, "initials": "AS"},   # António Silva
    {"id": 6, "initials": "HB"},   # Hugo Belo
    {"id": 7, "initials": "BL"},   # Bruno Libânio
    {"id": 8, "initials": "NN"},   # Nélson Neto
    {"id": 9, "initials": "JP"},   # João Paiva
    {"id": 10, "initials": "MB"},  # Marisa Barosa
    {"id": 11, "initials": "EC"},  # Eduardo Coelho
    {"id": 12, "initials": "JS"},  # João Silva
    {"id": 13, "initials": "HM"},  # Hugo Mota
    {"id": 14, "initials": "JPe"}, # João Pereira
    {"id": 15, "initials": "JC"},  # João Carvalho
    {"id": 16, "initials": "TV"},  # Tiago Vindima
    {"id": 17, "initials": "MS"},  # Mickael Soares
    {"id": 18, "initials": "PR"},  # Paulo Rodrigues
    {"id": 19, "initials": "IL"},  # Imóveis Mais Leiria (coordenador)
]


def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


@migrate_router.post("/fix-agent-ids")
def fix_agent_ids(db: Session = Depends(get_db)):
    """
    1. Migra properties de IDs 24-41 para IDs 1-19
    2. Elimina agentes duplicados (24-41)
    """
    results = {
        "properties_updated": 0,
        "properties_by_old_id": {},
        "agents_deleted": [],
        "errors": []
    }
    
    try:
        # 1. Migrar properties
        for old_id, new_id in AGENT_ID_MAP.items():
            count = db.query(Property).filter(Property.agent_id == old_id).count()
            if count > 0:
                db.query(Property).filter(Property.agent_id == old_id).update(
                    {"agent_id": new_id},
                    synchronize_session=False
                )
                results["properties_by_old_id"][f"{old_id} → {new_id}"] = count
                results["properties_updated"] += count
        
        db.commit()
        
        # 2. Eliminar agentes duplicados (IDs 24-41)
        for old_id in AGENT_ID_MAP.keys():
            agent = db.query(Agent).filter(Agent.id == old_id).first()
            if agent:
                db.delete(agent)
                results["agents_deleted"].append(old_id)
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Migradas {results['properties_updated']} properties, eliminados {len(results['agents_deleted'])} agentes duplicados",
            "details": results
        }
        
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e), "details": results}


@migrate_router.post("/create-users")
def create_users_for_agents(db: Session = Depends(get_db)):
    """
    Cria users para os 19 agentes reais (IDs 1-19)
    Password: {iniciais}crmtest
    """
    results = {
        "users_created": [],
        "users_updated": [],
        "errors": []
    }
    
    for agent_data in AGENTES_REAIS:
        try:
            agent = db.query(Agent).filter(Agent.id == agent_data["id"]).first()
            if not agent:
                results["errors"].append(f"Agent {agent_data['id']} não encontrado")
                continue
            
            email = agent.email.lower()
            password_plain = f"{agent_data['initials'].lower()}crmtest"
            password_hash = hash_password(password_plain)
            
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                user.hashed_password = password_hash
                user.agent_id = agent_data["id"]
                user.is_active = True
                user.full_name = agent.name
                results["users_updated"].append(f"{email} → {password_plain}")
            else:
                new_user = User(
                    email=email,
                    hashed_password=password_hash,
                    role="agent",
                    agent_id=agent_data["id"],
                    is_active=True,
                    full_name=agent.name
                )
                db.add(new_user)
                results["users_created"].append(f"{email} → {password_plain}")
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            results["errors"].append(f"Agent {agent_data['id']}: {str(e)}")
    
    # Garantir que tvindima é admin
    admin = db.query(User).filter(User.email == "tvindima@imoveismais.pt").first()
    if admin:
        admin.role = "admin"
        admin.agent_id = 16
        db.commit()
    
    return {
        "success": True,
        "message": f"Criados {len(results['users_created'])} users, atualizados {len(results['users_updated'])}",
        "details": results
    }


@migrate_router.get("/status")
def migration_status(db: Session = Depends(get_db)):
    """Ver estado atual de agentes, properties e users"""
    
    # Contar agentes por range de ID
    agents_1_19 = db.query(Agent).filter(Agent.id <= 19).count()
    agents_20_plus = db.query(Agent).filter(Agent.id > 19).count()
    
    # Contar properties por agent_id range
    props_1_19 = db.query(Property).filter(Property.agent_id <= 19).count()
    props_20_plus = db.query(Property).filter(Property.agent_id > 19).count()
    
    # Contar users
    users_count = db.query(User).count()
    
    # Listar agent_ids únicos usados em properties
    from sqlalchemy import distinct
    agent_ids_in_props = db.query(distinct(Property.agent_id)).all()
    agent_ids_list = sorted([x[0] for x in agent_ids_in_props if x[0]])
    
    return {
        "agents": {
            "ids_1_to_19": agents_1_19,
            "ids_20_plus": agents_20_plus,
            "total": agents_1_19 + agents_20_plus
        },
        "properties": {
            "with_agent_1_to_19": props_1_19,
            "with_agent_20_plus": props_20_plus,
            "total": props_1_19 + props_20_plus,
            "agent_ids_used": agent_ids_list
        },
        "users": {
            "total": users_count
        }
    }
