from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import datetime

class DraftProperty(Base):
    __tablename__ = "draft_properties"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    status = Column(String, default="pending")
    data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    ingestion_files = relationship("IngestionFile", back_populates="draft_property")

class IngestionFile(Base):
    __tablename__ = "ingestion_files"
    id = Column(Integer, primary_key=True, index=True)
    draft_property_id = Column(Integer, ForeignKey("draft_properties.id"), nullable=False)
    filename = Column(String, nullable=False)
    filetype = Column(String, nullable=False)
    url = Column(String, nullable=True)
    status = Column(String, default="uploaded")
    meta = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    draft_property = relationship("DraftProperty", back_populates="ingestion_files")
