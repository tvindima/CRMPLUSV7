from sqlalchemy.orm import Session
from .models import Notification
from .schemas import NotificationCreate, NotificationUpdate


def get_notifications(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_notification(db: Session, notification_id: int):
    return db.query(Notification).filter(Notification.id == notification_id).first()


def create_notification(db: Session, notif: NotificationCreate):
    db_notif = Notification(**notif.model_dump())
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif


def update_notification(db: Session, notification_id: int, notif_update: NotificationUpdate):
    db_notif = get_notification(db, notification_id)
    if not db_notif:
        return None
    for key, value in notif_update.model_dump(exclude_unset=True).items():
        setattr(db_notif, key, value)
    db.commit()
    db.refresh(db_notif)
    return db_notif


def delete_notification(db: Session, notification_id: int):
    db_notif = get_notification(db, notification_id)
    if db_notif:
        db.delete(db_notif)
        db.commit()
    return db_notif
