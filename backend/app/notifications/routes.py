from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import services, schemas
from app.database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[schemas.NotificationOut])
def list_notifications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_notifications(db, skip=skip, limit=limit)


@router.get("/{notification_id}", response_model=schemas.NotificationOut)
def get_notification(notification_id: int, db: Session = Depends(get_db)):
    notif = services.get_notification(db, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif


@router.post("/", response_model=schemas.NotificationOut, status_code=201)
def create_notification(notif: schemas.NotificationCreate, db: Session = Depends(get_db)):
    return services.create_notification(db, notif)


@router.put("/{notification_id}", response_model=schemas.NotificationOut)
def update_notification(notification_id: int, notif_update: schemas.NotificationUpdate, db: Session = Depends(get_db)):
    notif = services.update_notification(db, notification_id, notif_update)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif


@router.delete("/{notification_id}", response_model=schemas.NotificationOut)
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    notif = services.delete_notification(db, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif
