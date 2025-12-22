from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class FeedItem(Base):
    __tablename__ = "feed_items"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # ex: 'new_lead', 'property_sold', etc
    message = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    user_id = Column(Integer, nullable=True)
