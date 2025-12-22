from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import services, schemas
from app.database import get_db

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/", response_model=list[schemas.TeamOut])
def list_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_teams(db, skip=skip, limit=limit)


@router.get("/{team_id}", response_model=schemas.TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = services.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.post("/", response_model=schemas.TeamOut, status_code=201)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    return services.create_team(db, team)


@router.put("/{team_id}", response_model=schemas.TeamOut)
def update_team(team_id: int, team_update: schemas.TeamUpdate, db: Session = Depends(get_db)):
    team = services.update_team(db, team_id, team_update)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.delete("/{team_id}", response_model=schemas.TeamOut)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = services.delete_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team
