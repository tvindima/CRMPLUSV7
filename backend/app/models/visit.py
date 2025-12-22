"""
Model para sistema de visitas a propriedades
Gestão completa de agendamentos, check-in/out com GPS, e feedback
"""
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class VisitStatus(str, PyEnum):
    """Status possíveis de uma visita"""
    SCHEDULED = "scheduled"        # Agendada
    CONFIRMED = "confirmed"        # Confirmada pelo lead/agente
    IN_PROGRESS = "in_progress"    # Em andamento (checked-in)
    COMPLETED = "completed"        # Concluída com sucesso
    CANCELLED = "cancelled"        # Cancelada
    NO_SHOW = "no_show"           # Cliente não compareceu


class InterestLevel(str, PyEnum):
    """Nível de interesse do cliente após visita"""
    VERY_LOW = "muito_baixo"
    LOW = "baixo"
    MEDIUM = "medio"
    HIGH = "alto"
    VERY_HIGH = "muito_alto"


class Visit(Base):
    """
    Model para gestão de visitas a propriedades
    
    Funcionalidades:
    - Agendamento de visitas com lead e propriedade
    - Check-in/out com GPS tracking
    - Feedback e rating pós-visita
    - Histórico completo de interações
    """
    __tablename__ = "visits"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False, index=True)
    
    # Agendamento
    scheduled_date = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=30)
    
    # Status
    status = Column(String, default=VisitStatus.SCHEDULED.value, index=True)
    
    # Check-in/out
    checked_in_at = Column(DateTime, nullable=True)
    checked_out_at = Column(DateTime, nullable=True)
    checkin_latitude = Column(Float, nullable=True)
    checkin_longitude = Column(Float, nullable=True)
    checkin_accuracy_meters = Column(Float, nullable=True)
    distance_from_property_meters = Column(Float, nullable=True)
    
    # Feedback pós-visita
    rating = Column(Integer, nullable=True)  # 1-5 estrelas
    interest_level = Column(String, nullable=True)  # InterestLevel enum
    feedback_notes = Column(Text, nullable=True)
    will_return = Column(Boolean, nullable=True)
    next_steps = Column(Text, nullable=True)
    
    # Notas e observações
    notes = Column(Text, nullable=True)  # Notas do agente antes/durante visita
    cancellation_reason = Column(Text, nullable=True)
    
    # Notificações
    reminder_sent = Column(Boolean, default=False)
    confirmation_sent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    property_obj = relationship("Property", back_populates="visits")
    lead_obj = relationship("Lead", back_populates="visits")
    agent_obj = relationship("Agent", back_populates="visits")

    def __repr__(self):
        return f"<Visit(id={self.id}, property_id={self.property_id}, status={self.status})>"
    
    def get_property(self):
        """Retorna a propriedade associada"""
        return self.property_obj
    
    def get_lead(self):
        """Retorna o lead associado"""
        return self.lead_obj
    
    def get_agent(self):
        """Retorna o agente associado"""
        return self.agent_obj
    
    @property
    def is_active(self) -> bool:
        """Verifica se a visita está ativa (não cancelada/concluída)"""
        return self.status in [
            VisitStatus.SCHEDULED.value,
            VisitStatus.CONFIRMED.value,
            VisitStatus.IN_PROGRESS.value
        ]
    
    @property
    def duration_actual_minutes(self) -> int | None:
        """Calcula duração real da visita (se check-in/out realizados)"""
        if self.checked_in_at and self.checked_out_at:
            delta = self.checked_out_at - self.checked_in_at
            return int(delta.total_seconds() / 60)
        return None
