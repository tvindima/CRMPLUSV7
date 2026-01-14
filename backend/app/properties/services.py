from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from .models import Property, PropertyStatus
from .schemas import PropertyCreate, PropertyUpdate


def get_properties(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: str | None = None,
    is_published: int | None = None,
    agent_id: int | None = None,
    agent_ids: List[int] | None = None,
    hide_cancelled: bool = False,
):
    query = db.query(Property)
    
    # Filtro por lista de agentes (equipa) tem prioridade sobre agent_id único
    if agent_ids:
        query = query.filter(Property.agent_id.in_(agent_ids))
    elif agent_id:
        query = query.filter(Property.agent_id == agent_id)
    
    if search:
        like = f"%{search}%"
        query = query.filter(Property.title.ilike(like) | Property.reference.ilike(like) | Property.location.ilike(like))
    if status and status in {s.value for s in PropertyStatus}:
        query = query.filter(Property.status == PropertyStatus(status))
    if is_published is not None:
        query = query.filter(Property.is_published == is_published)
    if hide_cancelled:
        query = query.filter(Property.status != PropertyStatus.CANCELLED.value)
    return query.offset(skip).limit(limit).all()


def get_property(db: Session, property_id: int):
    return db.query(Property).filter(Property.id == property_id).first()


def create_property(db: Session, property: PropertyCreate):
    payload = property.model_dump()
    if not payload.get("title"):
        payload["title"] = payload.get("reference")
    if not payload.get("location"):
        muni = payload.get("municipality") or ""
        parish = payload.get("parish") or ""
        location = ", ".join([p for p in [muni, parish] if p])
        payload["location"] = location or None
    
    payload["created_at"] = datetime.now(timezone.utc)
    db_property = Property(**payload)
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property


def update_property(db: Session, property_id: int, property_update: PropertyUpdate):
    db_property = get_property(db, property_id)
    if not db_property:
        return None
    
    update_data = property_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_property, key, value)
    
    db_property.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_property)
    return db_property


def delete_property(db: Session, property_id: int):
    db_property = get_property(db, property_id)
    if db_property:
        db.delete(db_property)
        db.commit()
    return db_property
