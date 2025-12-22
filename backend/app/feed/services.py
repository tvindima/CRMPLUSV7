from sqlalchemy.orm import Session
from .models import FeedItem
from .schemas import FeedItemCreate, FeedItemUpdate


def get_feed_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(FeedItem).order_by(FeedItem.created_at.desc()).offset(skip).limit(limit).all()


def get_feed_item(db: Session, feed_item_id: int):
    return db.query(FeedItem).filter(FeedItem.id == feed_item_id).first()


def create_feed_item(db: Session, item: FeedItemCreate):
    db_item = FeedItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_feed_item(db: Session, feed_item_id: int, item_update: FeedItemUpdate):
    db_item = get_feed_item(db, feed_item_id)
    if not db_item:
        return None
    for key, value in item_update.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_feed_item(db: Session, feed_item_id: int):
    db_item = get_feed_item(db, feed_item_id)
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item
