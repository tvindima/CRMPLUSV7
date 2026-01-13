from enum import Enum as PyEnum
from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base

if TYPE_CHECKING:
    from app.agents.models import Agent


class PropertyStatus(str, PyEnum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    SOLD = "SOLD"
    CANCELLED = "CANCELLED"


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, nullable=False, unique=True, index=True)
    title = Column(String, nullable=False)
    business_type = Column(String, nullable=True)  # venda/arrendamento
    property_type = Column(String, nullable=True)  # apartamento/moradia/etc
    typology = Column(String, nullable=True)  # T1, T2...
    description = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    usable_area = Column(Float, nullable=True)
    land_area = Column(Float, nullable=True)
    location = Column(String, nullable=True)
    municipality = Column(String, nullable=True)
    parish = Column(String, nullable=True)
    condition = Column(String, nullable=True)
    energy_certificate = Column(String, nullable=True)
    status = Column(String, default=PropertyStatus.AVAILABLE.value)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    images = Column(JSONB, nullable=True)
    
    # Campos novos para site montra
    is_published = Column(Integer, default=1)  # 1=publicado, 0=rascunho
    is_featured = Column(Integer, default=0)  # 1=destaque, 0=normal
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    bedrooms = Column(Integer, nullable=True)  # número de quartos
    bathrooms = Column(Integer, nullable=True)  # número de casas de banho
    parking_spaces = Column(Integer, nullable=True)  # lugares de estacionamento
    video_url = Column(String(500), nullable=True)  # URL do vídeo promocional
    
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    # Relationships
    agent = relationship("Agent", back_populates="properties")
    visits = relationship("Visit", back_populates="property_obj")
    events = relationship("Event", back_populates="property")
    first_impressions = relationship("FirstImpression", back_populates="property")
    # tasks = relationship("Task", back_populates="property", foreign_keys="Task.property_id")  # TEMPORARIAMENTE COMENTADO - Task model não está importado

