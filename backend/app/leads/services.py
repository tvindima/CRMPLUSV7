from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from .models import Lead
from .schemas import LeadCreate, LeadUpdate, LeadCreateFromWebsite
from app.properties.models import Property
from app.agents.models import Agent
from datetime import datetime, timedelta


def get_leads(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    source: Optional[str] = None,
    assigned_agent_id: Optional[int] = None,
    property_id: Optional[int] = None
):
    """Buscar leads com filtros opcionais"""
    query = db.query(Lead)
    
    if status:
        query = query.filter(Lead.status == status)
    if source:
        query = query.filter(Lead.source == source)
    if assigned_agent_id:
        query = query.filter(Lead.assigned_agent_id == assigned_agent_id)
    if property_id:
        query = query.filter(Lead.property_id == property_id)
    
    return query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()


def get_lead_stats(db: Session):
    """Estatísticas de leads por status"""
    stats = db.query(
        Lead.status,
        func.count(Lead.id).label('count')
    ).group_by(Lead.status).all()
    
    total = db.query(Lead).count()
    
    return {
        "total": total,
        "by_status": {status.value: count for status, count in stats},
        "new_today": db.query(Lead).filter(
            func.date(Lead.created_at) == datetime.utcnow().date()
        ).count()
    }


def get_lead(db: Session, lead_id: int):
    return db.query(Lead).filter(Lead.id == lead_id).first()


def create_lead(db: Session, lead: LeadCreate):
    """Criar lead manualmente no backoffice"""
    db_lead = Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


async def create_lead_from_website(db: Session, lead_data: LeadCreateFromWebsite):
    """
    Criar lead vinda do site montra.
    Automaticamente atribui ao agente responsável pela propriedade.
    """
    # Buscar a propriedade
    property_obj = db.query(Property).filter(Property.id == lead_data.property_id).first()
    
    if not property_obj:
        raise ValueError(f"Property {lead_data.property_id} not found")
    
    # Criar lead com atribuição automática ao agente da propriedade
    db_lead = Lead(
        name=lead_data.name,
        email=lead_data.email,
        phone=lead_data.phone,
        message=lead_data.message,
        source=LeadSource.WEBSITE,
        origin=f"Site Montra - Propriedade {property_obj.reference}",
        property_id=lead_data.property_id,
        action_type=lead_data.action_type,
        assigned_agent_id=property_obj.agent_id,  # Atribuição automática!
        status=LeadStatus.NEW
    )
    
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    return db_lead


def update_lead(db: Session, lead_id: int, lead_update: LeadUpdate):
    """Atualizar lead"""
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    
    for key, value in lead_update.model_dump(exclude_unset=True).items():
        setattr(db_lead, key, value)
    
    db_lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_lead)
    return db_lead


def assign_lead_to_agent(db: Session, lead_id: int, agent_id: int):
    """Atribuir lead a um agente específico"""
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    
    # Verificar se agente existe
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise ValueError(f"Agent {agent_id} not found")
    
    db_lead.assigned_agent_id = agent_id
    db_lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_lead)
    return db_lead


def distribute_leads(
    db: Session,
    lead_ids: list[int],
    strategy: str = "round_robin",
    target_agent_id: Optional[int] = None
):
    """
    Distribuir múltiplas leads entre agentes.
    
    Estratégias:
    - round_robin: Distribui igualmente entre agentes ativos
    - least_busy: Atribui ao agente com menos leads ativas
    - manual: Atribui todas ao target_agent_id
    """
    
    # Buscar leads
    leads = db.query(Lead).filter(Lead.id.in_(lead_ids)).all()
    if not leads:
        return {"distributed": 0, "errors": ["No leads found"]}
    
    if strategy == "manual":
        if not target_agent_id:
            return {"distributed": 0, "errors": ["target_agent_id required for manual strategy"]}
        
        # Verificar se agente existe
        agent = db.query(Agent).filter(Agent.id == target_agent_id).first()
        if not agent:
            return {"distributed": 0, "errors": [f"Agent {target_agent_id} not found"]}
        
        # Atribuir todas ao agente especificado
        for lead in leads:
            lead.assigned_agent_id = target_agent_id
            lead.updated_at = datetime.utcnow()
        
        db.commit()
        return {
            "distributed": len(leads),
            "strategy": "manual",
            "assigned_to": {
                "agent_id": target_agent_id,
                "agent_name": agent.name,
                "count": len(leads)
            }
        }
    
    # Buscar agentes ativos (que possuem propriedades ou leads)
    active_agents = db.query(Agent).filter(Agent.id.isnot(None)).all()
    
    if not active_agents:
        return {"distributed": 0, "errors": ["No active agents found"]}
    
    if strategy == "round_robin":
        # Distribuir igualmente
        distributed = 0
        for i, lead in enumerate(leads):
            agent = active_agents[i % len(active_agents)]
            lead.assigned_agent_id = agent.id
            lead.updated_at = datetime.utcnow()
            distributed += 1
        
        db.commit()
        return {
            "distributed": distributed,
            "strategy": "round_robin",
            "agents_count": len(active_agents)
        }
    
    elif strategy == "least_busy":
        # Atribuir ao agente com menos leads ativas
        agent_loads = {}
        for agent in active_agents:
            count = db.query(Lead).filter(
                Lead.assigned_agent_id == agent.id,
                Lead.status.in_([LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED])
            ).count()
            agent_loads[agent.id] = count
        
        # Ordenar agentes por carga (menor primeiro)
        sorted_agents = sorted(active_agents, key=lambda a: agent_loads.get(a.id, 0))
        
        distributed = 0
        for i, lead in enumerate(leads):
            agent = sorted_agents[i % len(sorted_agents)]
            lead.assigned_agent_id = agent.id
            lead.updated_at = datetime.utcnow()
            distributed += 1
        
        db.commit()
        return {
            "distributed": distributed,
            "strategy": "least_busy",
            "agent_loads": {a.id: agent_loads.get(a.id, 0) for a in sorted_agents}
        }
    
    return {"distributed": 0, "errors": [f"Unknown strategy: {strategy}"]}


def delete_lead(db: Session, lead_id: int):
    db_lead = get_lead(db, lead_id)
    if db_lead:
        db.delete(db_lead)
        db.commit()
    return db_lead


def get_conversion_analytics(db: Session, days: int = 30):
    """
    Analytics de conversão de leads.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Total de leads no período
    total_leads = db.query(Lead).filter(Lead.created_at >= cutoff_date).count()
    
    # Leads convertidas
    converted_leads = db.query(Lead).filter(
        Lead.created_at >= cutoff_date,
        Lead.status == LeadStatus.CONVERTED
    ).count()
    
    # Taxa de conversão
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Conversão por origem
    conversion_by_source = {}
    for source in LeadSource:
        source_total = db.query(Lead).filter(
            Lead.created_at >= cutoff_date,
            Lead.source == source
        ).count()
        
        source_converted = db.query(Lead).filter(
            Lead.created_at >= cutoff_date,
            Lead.source == source,
            Lead.status == LeadStatus.CONVERTED
        ).count()
        
        conversion_by_source[source.value] = {
            "total": source_total,
            "converted": source_converted,
            "rate": (source_converted / source_total * 100) if source_total > 0 else 0
        }
    
    # Tempo médio até conversão (em horas)
    converted = db.query(Lead).filter(
        Lead.created_at >= cutoff_date,
        Lead.status == LeadStatus.CONVERTED
    ).all()
    
    avg_time_to_conversion = 0
    if converted:
        times = [(lead.updated_at - lead.created_at).total_seconds() / 3600 for lead in converted]
        avg_time_to_conversion = sum(times) / len(times)
    
    return {
        "period_days": days,
        "total_leads": total_leads,
        "converted_leads": converted_leads,
        "conversion_rate": round(conversion_rate, 2),
        "conversion_by_source": conversion_by_source,
        "avg_hours_to_conversion": round(avg_time_to_conversion, 1)
    }


def get_agent_performance(db: Session, days: int = 30):
    """
    Performance de agentes com leads.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    agents = db.query(Agent).all()
    performance = []
    
    for agent in agents:
        # Leads atribuídas ao agente no período
        agent_leads = db.query(Lead).filter(
            Lead.assigned_agent_id == agent.id,
            Lead.created_at >= cutoff_date
        ).all()
        
        if not agent_leads:
            continue
        
        total = len(agent_leads)
        converted = sum(1 for lead in agent_leads if lead.status == LeadStatus.CONVERTED)
        lost = sum(1 for lead in agent_leads if lead.status == LeadStatus.LOST)
        active = total - converted - lost
        
        # Taxa de conversão
        conversion_rate = (converted / total * 100) if total > 0 else 0
        
        # Tempo médio de resposta (NEW → CONTACTED)
        contacted_leads = [l for l in agent_leads if l.status not in [LeadStatus.NEW]]
        avg_response_time = 0
        if contacted_leads:
            times = [(lead.updated_at - lead.created_at).total_seconds() / 3600 for lead in contacted_leads]
            avg_response_time = sum(times) / len(times)
        
        performance.append({
            "agent_id": agent.id,
            "agent_name": agent.name,
            "total_leads": total,
            "active_leads": active,
            "converted_leads": converted,
            "lost_leads": lost,
            "conversion_rate": round(conversion_rate, 2),
            "avg_response_hours": round(avg_response_time, 1)
        })
    
    # Ordenar por taxa de conversão
    performance.sort(key=lambda x: x["conversion_rate"], reverse=True)
    
    return {
        "period_days": days,
        "agents": performance
    }


def get_funnel_analytics(db: Session, days: int = 30):
    """
    Funil de vendas completo.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Contar leads em cada status
    funnel = {}
    for status in LeadStatus:
        count = db.query(Lead).filter(
            Lead.created_at >= cutoff_date,
            Lead.status == status
        ).count()
        funnel[status.value] = count
    
    # Total de leads
    total = sum(funnel.values())
    
    # Percentagens de cada estágio
    funnel_percentages = {}
    for status, count in funnel.items():
        funnel_percentages[status] = {
            "count": count,
            "percentage": round((count / total * 100) if total > 0 else 0, 1)
        }
    
    # Calcular drop-off entre estágios
    dropoff = {}
    status_order = [
        LeadStatus.NEW,
        LeadStatus.CONTACTED,
        LeadStatus.QUALIFIED,
        LeadStatus.PROPOSAL_SENT,
        LeadStatus.VISIT_SCHEDULED,
        LeadStatus.NEGOTIATION,
        LeadStatus.CONVERTED
    ]
    
    for i in range(len(status_order) - 1):
        current = status_order[i]
        next_status = status_order[i + 1]
        
        current_count = funnel[current.value]
        next_count = funnel[next_status.value]
        
        retention = (next_count / current_count * 100) if current_count > 0 else 0
        
        dropoff[f"{current.value}_to_{next_status.value}"] = {
            "retention_rate": round(retention, 1),
            "drop_off_rate": round(100 - retention, 1),
            "dropped": current_count - next_count
        }
    
    return {
        "period_days": days,
        "total_leads": total,
        "funnel": funnel_percentages,
        "dropoff_analysis": dropoff
    }
