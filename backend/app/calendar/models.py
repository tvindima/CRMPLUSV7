from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

# Importar modelos dependentes ANTES de definir Task para evitar circular imports
from app.teams.models import Team  # noqa: F401
from app.agencies.models import Agency  # noqa: F401
from app.properties.models import Property  # noqa: F401
from app.agents.models import Agent  # noqa: F401
from app.leads.models import Lead  # noqa: F401


class TaskType(str, enum.Enum):
    """Tipos de tarefas disponíveis"""
    VISIT = "visit"  # Visita a propriedade
    CALL = "call"  # Chamada telefónica
    MEETING = "meeting"  # Reunião
    FOLLOWUP = "followup"  # Follow-up com lead
    OTHER = "other"  # Outros tipos


class TaskStatus(str, enum.Enum):
    """Status de uma tarefa"""
    PENDING = "pending"  # Pendente/agendada
    IN_PROGRESS = "in_progress"  # Em andamento
    COMPLETED = "completed"  # Concluída
    CANCELLED = "cancelled"  # Cancelada
    OVERDUE = "overdue"  # Atrasada


class TaskPriority(str, enum.Enum):
    """Prioridade de uma tarefa"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    """
    Modelo de Tarefa/Evento para gestão de agenda.
    Suporta tarefas como visitas, chamadas, reuniões e follow-ups,
    podendo ser associadas a leads, propriedades e agentes.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Tipo e status da tarefa
    task_type = Column(SQLEnum(TaskType), nullable=False, default=TaskType.OTHER, index=True)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.PENDING, index=True)
    priority = Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM, index=True)
    
    # Datas e horários
    due_date = Column(DateTime, nullable=False, index=True)  # Data/hora de vencimento
    completed_at = Column(DateTime, nullable=True)  # Data/hora de conclusão
    reminder_sent = Column(Boolean, default=False)  # Se lembrete foi enviado
    
    # Relacionamentos com outras entidades
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    
    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    lead = relationship("Lead", back_populates="tasks", foreign_keys=[lead_id])
    property = relationship("Property", foreign_keys=[property_id])  # back_populates comentado temporariamente
    assigned_agent = relationship("Agent", back_populates="tasks", foreign_keys=[assigned_agent_id])
    created_by = relationship("Agent", foreign_keys=[created_by_id])


# Manter modelo antigo para compatibilidade (será deprecated)
class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    agent_id = Column(Integer, nullable=True)
