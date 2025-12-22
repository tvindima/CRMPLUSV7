from sqlalchemy.orm import Session
from .models import Agency
from .schemas import AgencyCreate, AgencyUpdate


def get_agencies(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Agency).offset(skip).limit(limit).all()


def get_agency(db: Session, agency_id: int):
    return db.query(Agency).filter(Agency.id == agency_id).first()


def create_agency(db: Session, agency: AgencyCreate):
    db_agency = Agency(**agency.model_dump())
    db.add(db_agency)
    db.commit()
    db.refresh(db_agency)
    return db_agency


def update_agency(db: Session, agency_id: int, agency_update: AgencyUpdate):
    db_agency = get_agency(db, agency_id)
    if not db_agency:
        return None
    for key, value in agency_update.model_dump(exclude_unset=True).items():
        setattr(db_agency, key, value)
    db.commit()
    db.refresh(db_agency)
    return db_agency


def delete_agency(db: Session, agency_id: int):
    db_agency = get_agency(db, agency_id)
    if db_agency:
        db.delete(db_agency)
        db.commit()
    return db_agency
