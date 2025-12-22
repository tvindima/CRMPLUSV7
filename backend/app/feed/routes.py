from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import services, schemas
from app.database import get_db

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/", response_model=list[schemas.FeedItemOut])
def list_feed(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_feed_items(db, skip=skip, limit=limit)


@router.get("/{feed_item_id}", response_model=schemas.FeedItemOut)
def get_feed_item(feed_item_id: int, db: Session = Depends(get_db)):
    item = services.get_feed_item(db, feed_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Feed item not found")
    return item


@router.post("/", response_model=schemas.FeedItemOut, status_code=201)
def create_feed_item(item: schemas.FeedItemCreate, db: Session = Depends(get_db)):
    return services.create_feed_item(db, item)


@router.put("/{feed_item_id}", response_model=schemas.FeedItemOut)
def update_feed_item(feed_item_id: int, item_update: schemas.FeedItemUpdate, db: Session = Depends(get_db)):
    item = services.update_feed_item(db, feed_item_id, item_update)
    if not item:
        raise HTTPException(status_code=404, detail="Feed item not found")
    return item


@router.delete("/{feed_item_id}", response_model=schemas.FeedItemOut)
def delete_feed_item(feed_item_id: int, db: Session = Depends(get_db)):
    item = services.delete_feed_item(db, feed_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Feed item not found")
    return item
