"""
Schemas Pydantic para Events (Agenda Universal)
Validação de dados de entrada/saída da API
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime, timezone, timedelta
from enum import Enum


class EventType(str, Enum):
    """Tipos de eventos suportados"""
    VISIT = "visit"              # Visita a imóvel
    MEETING = "meeting"          # Reunião (cliente, equipa)
    TASK = "task"                # Tarefa (preparar docs, follow-up)
    PERSONAL = "personal"        # Pessoal (almoço, dentista)
    CALL = "call"                # Chamada telefónica
    OTHER = "other"              # Outro


class EventStatus(str, Enum):
    """Status de eventos"""
    SCHEDULED = "scheduled"      # Agendado
    COMPLETED = "completed"      # Concluído
    CANCELLED = "cancelled"      # Cancelado
    NO_SHOW = "no_show"          # Cliente não compareceu


class EventCreate(BaseModel):
    """Schema para criar evento"""
    title: str = Field(..., min_length=3, max_length=255, description="Título do evento")
    event_type: EventType = Field(EventType.OTHER, description="Tipo de evento")
    scheduled_date: datetime = Field(..., description="Data/hora início (ISO 8601)")
    duration_minutes: int = Field(60, ge=15, le=480, description="Duração em minutos")
    location: Optional[str] = Field(None, max_length=500, description="Local do evento")
    notes: Optional[str] = Field(None, description="Notas/descrição")
    
    # Relações opcionais
    property_id: Optional[int] = Field(None, description="ID do imóvel (obrigatório se event_type=visit)")
    lead_id: Optional[int] = Field(None, description="ID do lead (opcional)")
    
    # GPS opcional
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    @field_validator('scheduled_date')
    @classmethod
    def validate_date(cls, v: datetime) -> datetime:
        """Validar data com margem de tolerância de 5 minutos"""
        if v is None:
            return v
        
        now = datetime.now(timezone.utc)
        
        # Garantir timezone-aware
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        
        # Margem de 5 minutos (tolerância timezone/clock skew)
        threshold = now - timedelta(minutes=5)
        
        if v < threshold:
            raise ValueError(
                f'Data do evento muito antiga. '
                f'Deve ser posterior a {threshold.isoformat()}'
            )
        
        return v
    
    @model_validator(mode='after')
    def validate_visit_requires_property(self):
        """Se event_type=visit, property_id é obrigatório"""
        if self.event_type == EventType.VISIT and not self.property_id:
            raise ValueError('Eventos do tipo "visit" requerem property_id')
        return self


class EventUpdate(BaseModel):
    """Schema para atualizar evento (todos campos opcionais)"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    event_type: Optional[EventType] = None
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    location: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    status: Optional[EventStatus] = None
    property_id: Optional[int] = None
    lead_id: Optional[int] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


class EventOut(BaseModel):
    """Schema de resposta da API"""
    id: int
    agent_id: int
    title: str
    event_type: str
    scheduled_date: datetime
    duration_minutes: int
    location: Optional[str]
    notes: Optional[str]
    property_id: Optional[int]
    lead_id: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
