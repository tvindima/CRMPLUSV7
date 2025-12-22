from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from . import services

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/leads")
def leads_summary(db: Session = Depends(get_db)):
    return services.get_leads_summary(db)


@router.get("/properties")
def properties_summary(db: Session = Depends(get_db)):
    return services.get_properties_summary(db)


@router.get("/agents")
def agents_summary(db: Session = Depends(get_db)):
    return services.get_agents_summary(db)
