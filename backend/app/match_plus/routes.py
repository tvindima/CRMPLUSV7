from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import services, schemas
from app.database import get_db

router = APIRouter(prefix="/match-plus", tags=["match_plus"])


@router.get("/", response_model=list[schemas.LeadPropertyMatchOut])
def list_matches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_matches(db, skip=skip, limit=limit)


@router.get("/{match_id}", response_model=schemas.LeadPropertyMatchOut)
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = services.get_match(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.post("/", response_model=schemas.LeadPropertyMatchOut, status_code=201)
def create_match(match: schemas.LeadPropertyMatchCreate, db: Session = Depends(get_db)):
    return services.create_match(db, match)


@router.delete("/{match_id}", response_model=schemas.LeadPropertyMatchOut)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    match = services.delete_match(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match
