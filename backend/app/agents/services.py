from sqlalchemy.orm import Session
from .models import Agent
from .schemas import AgentCreate, AgentUpdate
from app.models.agent_site_preferences import AgentSitePreferences


def enrich_agent_with_preferences(db: Session, agent: Agent) -> Agent:
    """
    Enriquece os dados do agente com as preferências do site (bio, redes sociais).
    Os dados da tabela agent_site_preferences sobrepõem os campos do agente.
    """
    if not agent:
        return agent
    
    prefs = db.query(AgentSitePreferences).filter(
        AgentSitePreferences.agent_id == agent.id
    ).first()
    
    if prefs:
        # Sobrepor campos com dados das preferências se existirem
        if prefs.bio:
            agent.bio = prefs.bio
        if prefs.instagram:
            agent.instagram = prefs.instagram
        if prefs.facebook:
            agent.facebook = prefs.facebook
        if prefs.linkedin:
            agent.linkedin = prefs.linkedin
        if prefs.twitter:
            agent.twitter = prefs.twitter
        if prefs.tiktok:
            agent.tiktok = prefs.tiktok
        if prefs.whatsapp:
            agent.whatsapp = prefs.whatsapp
    
    return agent


def get_agents(db: Session, skip: int = 0, limit: int = 100):
    agents = db.query(Agent).offset(skip).limit(limit).all()
    # Enriquecer cada agente com dados de preferências
    return [enrich_agent_with_preferences(db, agent) for agent in agents]


def get_agent(db: Session, agent_id: int):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    return enrich_agent_with_preferences(db, agent)


def create_agent(db: Session, agent: AgentCreate):
    db_agent = Agent(**agent.model_dump())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


def update_agent(db: Session, agent_id: int, agent_update: AgentUpdate):
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return None
    for key, value in agent_update.model_dump(exclude_unset=True).items():
        setattr(db_agent, key, value)
    db.commit()
    db.refresh(db_agent)
    return db_agent


def delete_agent(db: Session, agent_id: int):
    db_agent = get_agent(db, agent_id)
    if db_agent:
        db.delete(db_agent)
        db.commit()
    return db_agent
