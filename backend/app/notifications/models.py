from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)
    recipient_id = Column(Integer, nullable=True)
    delivered = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False)
