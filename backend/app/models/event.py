"""
Modelo para Events (Agenda Universal)
Suporta visitas, reuniões, tarefas, eventos pessoais, etc
"""

from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Dados básicos
    title = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False, default="other", index=True)
    
    # Data/hora
    scheduled_date = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, default=60)
    
    # Localização
    location = Column(String(500))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    
    # Relações opcionais
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"))
    
    # Notas
    notes = Column(Text)
    
    # Status
    status = Column(String(50), default="scheduled", index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    agent = relationship("Agent", back_populates="events")
    property = relationship("Property", back_populates="events")
    lead = relationship("Lead", back_populates="events")
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('visit', 'meeting', 'task', 'personal', 'call', 'other')",
            name='check_event_type'
        ),
        CheckConstraint(
            "status IN ('scheduled', 'completed', 'cancelled', 'no_show')",
            name='check_status'
        ),
    )
    
    def __repr__(self):
        return f"<Event(id={self.id}, title='{self.title}', type='{self.event_type}', date='{self.scheduled_date}')>"
