from sqlalchemy.orm import Session
from .models import Team
from .schemas import TeamCreate, TeamUpdate


def get_teams(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Team).offset(skip).limit(limit).all()


def get_team(db: Session, team_id: int):
    return db.query(Team).filter(Team.id == team_id).first()


def create_team(db: Session, team: TeamCreate):
    db_team = Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


def update_team(db: Session, team_id: int, team_update: TeamUpdate):
    db_team = get_team(db, team_id)
    if not db_team:
        return None
    for key, value in team_update.model_dump(exclude_unset=True).items():
        setattr(db_team, key, value)
    db.commit()
    db.refresh(db_team)
    return db_team


def delete_team(db: Session, team_id: int):
    db_team = get_team(db, team_id)
    if db_team:
        db.delete(db_team)
        db.commit()
    return db_team
