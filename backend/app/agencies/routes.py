from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import services, schemas
from app.database import get_db

router = APIRouter(prefix="/agencies", tags=["agencies"])


@router.get("/", response_model=list[schemas.AgencyOut])
def list_agencies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_agencies(db, skip=skip, limit=limit)


@router.get("/{agency_id}", response_model=schemas.AgencyOut)
def get_agency(agency_id: int, db: Session = Depends(get_db)):
    agency = services.get_agency(db, agency_id)
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@router.post("/", response_model=schemas.AgencyOut, status_code=201)
def create_agency(agency: schemas.AgencyCreate, db: Session = Depends(get_db)):
    return services.create_agency(db, agency)


@router.put("/{agency_id}", response_model=schemas.AgencyOut)
def update_agency(agency_id: int, agency_update: schemas.AgencyUpdate, db: Session = Depends(get_db)):
    agency = services.update_agency(db, agency_id, agency_update)
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@router.delete("/{agency_id}", response_model=schemas.AgencyOut)
def delete_agency(agency_id: int, db: Session = Depends(get_db)):
    agency = services.delete_agency(db, agency_id)
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency
