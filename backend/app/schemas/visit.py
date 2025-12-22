"""
Schemas Pydantic para sistema de visitas
Validação de requests e serialização de responses
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, timezone
from app.models.visit import VisitStatus, InterestLevel


# =====================================================
# BASE SCHEMAS
# =====================================================

class VisitBase(BaseModel):
    """Schema base para visita"""
    property_id: int = Field(..., description="ID da propriedade")
    lead_id: Optional[int] = Field(None, description="ID do lead (opcional)")
    scheduled_date: datetime = Field(..., description="Data/hora agendada")
    duration_minutes: int = Field(30, ge=15, le=180, description="Duração em minutos")
    notes: Optional[str] = Field(None, max_length=1000, description="Notas do agente")


# =====================================================
# CREATE SCHEMAS
# =====================================================

class VisitCreate(VisitBase):
    """Schema para criar nova visita"""
    pass
    
    @validator('scheduled_date')
    def validate_future_date(cls, v):
        """
        Validar que data é futura e timezone-aware
        
        Mobile envia: 2025-12-21T15:30:00Z ou 2025-12-21T15:30:00+00:00
        Backend precisa comparar com datetime também timezone-aware
        """
        if v is None:
            return v
        
        # Obter now com timezone UTC
        now = datetime.now(timezone.utc)
        
        # Se v não tem timezone, assumir UTC
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        
        # Comparar (ambos timezone-aware)
        if v < now:
            raise ValueError('Data da visita deve ser no futuro')
        
        return v


# =====================================================
# UPDATE SCHEMAS
# =====================================================

class VisitUpdate(BaseModel):
    """Schema para atualizar visita"""
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=180)
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[VisitStatus] = None
    
    @validator('scheduled_date')
    def validate_future_date(cls, v):
        """Validar que data é futura (timezone-aware)"""
        if v is None:
            return v
        
        # Usar datetime com timezone UTC
        now = datetime.now(timezone.utc)
        
        # Se v não tem timezone, assumir UTC
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        
        # Comparar (ambos timezone-aware)
        if v < now:
            raise ValueError('Data da visita deve ser no futuro')
        
        return v


class VisitStatusUpdate(BaseModel):
    """Schema para atualização rápida de status"""
    status: VisitStatus = Field(..., description="Novo status")
    notes: Optional[str] = Field(None, max_length=500)


# =====================================================
# CHECK-IN/OUT SCHEMAS
# =====================================================

class VisitCheckIn(BaseModel):
    """Schema para check-in em visita"""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude GPS")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude GPS")
    accuracy_meters: Optional[float] = Field(None, ge=0, description="Precisão do GPS em metros")


class VisitCheckOut(BaseModel):
    """Schema para check-out com feedback"""
    rating: Optional[int] = Field(None, ge=1, le=5, description="Avaliação 1-5 estrelas")
    interest_level: Optional[InterestLevel] = Field(None, description="Nível de interesse do cliente")
    feedback_notes: Optional[str] = Field(None, max_length=1000, description="Notas de feedback")
    will_return: Optional[bool] = Field(None, description="Cliente pretende retornar")
    next_steps: Optional[str] = Field(None, max_length=500, description="Próximos passos")


class VisitFeedback(BaseModel):
    """Schema para feedback pós-visita (standalone)"""
    rating: Optional[int] = Field(None, ge=1, le=5)
    interest_level: Optional[InterestLevel] = None
    feedback_notes: Optional[str] = Field(None, max_length=1000)
    will_return: Optional[bool] = None


# =====================================================
# OUTPUT SCHEMAS
# =====================================================

class PropertySummary(BaseModel):
    """Resumo de propriedade para visita"""
    id: int
    reference: str
    location: Optional[str]
    property_type: Optional[str]
    photos: Optional[str] = None
    
    class Config:
        from_attributes = True


class LeadSummary(BaseModel):
    """Resumo de lead para visita"""
    id: int
    name: str
    phone: Optional[str]
    email: str
    
    class Config:
        from_attributes = True


class AgentSummary(BaseModel):
    """Resumo de agente para visita"""
    id: int
    name: str
    phone: Optional[str]
    photo: Optional[str]
    
    class Config:
        from_attributes = True


class VisitOut(VisitBase):
    """Schema de output para visita completa"""
    id: int
    agent_id: int
    status: str
    
    # Check-in/out
    checked_in_at: Optional[datetime]
    checked_out_at: Optional[datetime]
    checkin_latitude: Optional[float]
    checkin_longitude: Optional[float]
    distance_from_property_meters: Optional[float]
    
    # Feedback
    rating: Optional[int]
    interest_level: Optional[str]
    feedback_notes: Optional[str]
    will_return: Optional[bool]
    next_steps: Optional[str]
    
    # Metadata
    reminder_sent: bool
    confirmation_sent: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Relationships (opcional - incluir com detail=true)
    property: Optional[PropertySummary] = None
    lead: Optional[LeadSummary] = None
    agent: Optional[AgentSummary] = None
    
    class Config:
        from_attributes = True


class VisitTodayWidget(BaseModel):
    """Schema para widget de visitas de hoje"""
    id: int
    property_reference: str
    property_location: Optional[str]
    lead_name: Optional[str]
    scheduled_time: str  # HH:MM format
    status: str
    is_next: bool = False
    
    class Config:
        from_attributes = True


class VisitTodayResponse(BaseModel):
    """Response para GET /mobile/visits/today"""
    visits: list[VisitTodayWidget]
    count: int
    next_visit: Optional[dict] = None


class CheckInResponse(BaseModel):
    """Response para check-in"""
    success: bool
    checked_in_at: datetime
    distance_from_property_meters: Optional[float]
    status: str
    message: str


class CheckOutResponse(BaseModel):
    """Response para check-out"""
    success: bool
    checked_out_at: datetime
    duration_minutes: Optional[int]
    status: str
    message: str


# =====================================================
# PAGINATION
# =====================================================

class VisitListResponse(BaseModel):
    """Response paginada para lista de visitas"""
    visits: list[VisitOut]
    total: int
    page: int
    per_page: int
    pages: int
