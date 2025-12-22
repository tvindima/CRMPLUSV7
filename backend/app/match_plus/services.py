from sqlalchemy.orm import Session
from .models import LeadPropertyMatch
from .schemas import LeadPropertyMatchCreate


def get_matches(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(LeadPropertyMatch)
        .order_by(LeadPropertyMatch.score.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_match(db: Session, match_id: int):
    return db.query(LeadPropertyMatch).filter(LeadPropertyMatch.id == match_id).first()


def create_match(db: Session, match: LeadPropertyMatchCreate):
    db_match = LeadPropertyMatch(**match.model_dump())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match


def delete_match(db: Session, match_id: int):
    db_match = get_match(db, match_id)
    if db_match:
        db.delete(db_match)
        db.commit()
    return db_match
