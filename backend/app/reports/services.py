from sqlalchemy import func
from sqlalchemy.orm import Session
from app.leads.models import Lead
from app.properties.models import Property
from app.agents.models import Agent


def get_leads_summary(db: Session):
    total_leads = db.query(Lead).count()
    by_status = db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status).all()
    return {
        "total_leads": total_leads,
        "status_breakdown": {status: count for status, count in by_status},
    }


def get_properties_summary(db: Session):
    total_properties = db.query(Property).count()
    by_status = db.query(Property.status, func.count(Property.id)).group_by(Property.status).all()
    return {
        "total_properties": total_properties,
        "status_breakdown": {status: count for status, count in by_status},
    }


def get_agents_summary(db: Session):
    total_agents = db.query(Agent).count()
    return {"total_agents": total_agents}
