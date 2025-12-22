from sqlalchemy.orm import Session
from .models import BillingPlan, BillingRecord
from .schemas import BillingPlanCreate, BillingRecordCreate


def get_plans(db: Session, skip: int = 0, limit: int = 100):
    return db.query(BillingPlan).offset(skip).limit(limit).all()


def get_plan(db: Session, plan_id: int):
    return db.query(BillingPlan).filter(BillingPlan.id == plan_id).first()


def create_plan(db: Session, plan: BillingPlanCreate):
    db_plan = BillingPlan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


def get_records(db: Session, skip: int = 0, limit: int = 100):
    return db.query(BillingRecord).offset(skip).limit(limit).all()


def get_record(db: Session, record_id: int):
    return db.query(BillingRecord).filter(BillingRecord.id == record_id).first()


def create_record(db: Session, record: BillingRecordCreate):
    db_record = BillingRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def delete_plan(db: Session, plan_id: int):
    db_plan = get_plan(db, plan_id)
    if db_plan:
        db.delete(db_plan)
        db.commit()
    return db_plan


def delete_record(db: Session, record_id: int):
    db_record = get_record(db, record_id)
    if db_record:
        db.delete(db_record)
        db.commit()
    return db_record
