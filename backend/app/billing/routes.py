from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import services, schemas
from app.database import get_db

router = APIRouter(prefix="/billing", tags=["billing"])

# Plans CRUD
@router.get("/plans/", response_model=list[schemas.BillingPlanOut])
def list_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_plans(db, skip=skip, limit=limit)


@router.get("/plans/{plan_id}", response_model=schemas.BillingPlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = services.get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/plans/", response_model=schemas.BillingPlanOut, status_code=201)
def create_plan(plan: schemas.BillingPlanCreate, db: Session = Depends(get_db)):
    return services.create_plan(db, plan)


@router.delete("/plans/{plan_id}", response_model=schemas.BillingPlanOut)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = services.delete_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


# Records CRUD
@router.get("/records/", response_model=list[schemas.BillingRecordOut])
def list_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_records(db, skip=skip, limit=limit)


@router.get("/records/{record_id}", response_model=schemas.BillingRecordOut)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = services.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.post("/records/", response_model=schemas.BillingRecordOut, status_code=201)
def create_record(record: schemas.BillingRecordCreate, db: Session = Depends(get_db)):
    return services.create_record(db, record)


@router.delete("/records/{record_id}", response_model=schemas.BillingRecordOut)
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = services.delete_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record
