from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .models import TaskType, TaskStatus, TaskPriority


# Schemas para o novo sistema de tarefas
class TaskBase(BaseModel):
    """Schema base para tarefas"""
    title: str
    description: Optional[str] = None
    task_type: TaskType
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: datetime
    lead_id: Optional[int] = None
    property_id: Optional[int] = None


class TaskCreate(TaskBase):
    """Schema para criação de tarefa"""
    assigned_agent_id: int  # Obrigatório na criação


class TaskUpdate(BaseModel):
    """Schema para atualização de tarefa"""
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[TaskType] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    lead_id: Optional[int] = None
    property_id: Optional[int] = None
    assigned_agent_id: Optional[int] = None


class TaskComplete(BaseModel):
    """Schema para marcar tarefa como concluída"""
    notes: Optional[str] = None  # Notas ao concluir


class TaskOut(TaskBase):
    """Schema de saída para tarefa"""
    id: int
    status: TaskStatus
    completed_at: Optional[datetime] = None
    assigned_agent_id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskStats(BaseModel):
    """Estatísticas de tarefas"""
    total: int
    pending: int
    in_progress: int
    completed: int
    overdue: int
    today: int
    this_week: int


# Schemas antigos (manter compatibilidade)
class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    agent_id: Optional[int] = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(CalendarEventBase):
    pass


class CalendarEventOut(CalendarEventBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# =====================================================
# VISIT SCHEMAS (para app mobile)
# =====================================================

from app.models.visit import VisitStatus, InterestLevel


class VisitBase(BaseModel):
    """Schema base para visitas"""
    property_id: int
    lead_id: Optional[int] = None
    scheduled_date: datetime
    duration_minutes: int = 30
    notes: Optional[str] = None


class VisitCreate(VisitBase):
    """Schema para criação de visita"""
    pass


class VisitUpdate(BaseModel):
    """Schema para atualização de visita"""
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class VisitStatusUpdate(BaseModel):
    """Schema para atualizar apenas status"""
    status: str
    cancellation_reason: Optional[str] = None


class VisitCheckIn(BaseModel):
    """Schema para check-in numa visita"""
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None


class VisitCheckOut(BaseModel):
    """Schema para check-out de uma visita"""
    pass


class VisitFeedback(BaseModel):
    """Schema para feedback pós-visita"""
    rating: int  # 1-5
    interest_level: str  # InterestLevel
    feedback_notes: Optional[str] = None
    will_return: Optional[bool] = None
    next_steps: Optional[str] = None


class VisitOut(BaseModel):
    """Schema de saída para visita"""
    id: int
    property_id: int
    lead_id: Optional[int] = None
    agent_id: int
    scheduled_date: datetime
    duration_minutes: int
    status: str
    notes: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    checked_out_at: Optional[datetime] = None
    rating: Optional[int] = None
    interest_level: Optional[str] = None
    feedback_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Campos adicionais opcionais
    property_title: Optional[str] = None
    lead_name: Optional[str] = None
    reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UpcomingVisit(BaseModel):
    """Schema para próximas visitas (widget mobile)"""
    id: int
    property_title: str
    scheduled_at: datetime
    lead_name: Optional[str] = None
    reference: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class VisitListResponse(BaseModel):
    """Response para lista de visitas"""
    visits: List[VisitOut]
    total: int


class VisitTodayWidget(BaseModel):
    """Widget de visita de hoje"""
    id: int
    property_title: str
    scheduled_time: str
    lead_name: str
    status: str


class VisitTodayResponse(BaseModel):
    """Response para visitas de hoje"""
    visits: List[VisitTodayWidget]
    count: int
    next_visit: Optional[VisitTodayWidget] = None


class CheckInResponse(BaseModel):
    """Response para check-in"""
    success: bool
    message: str
    visit_id: int
    checked_in_at: datetime
    distance_meters: Optional[float] = None


class CheckOutResponse(BaseModel):
    """Response para check-out"""
    success: bool
    message: str
    visit_id: int
    checked_out_at: datetime
    duration_minutes: int
