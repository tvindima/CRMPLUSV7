from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from .models import LeadStatus, LeadSource


class LeadBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None  # Email opcional para suportar leads mobile
    phone: Optional[str] = None
    message: Optional[str] = None
    source: Optional[LeadSource] = LeadSource.MANUAL
    origin: Optional[str] = None
    property_id: Optional[int] = None
    action_type: Optional[str] = None


class LeadCreate(LeadBase):
    """Schema para criar lead (pode ser do site ou manual)"""
    assigned_agent_id: Optional[int] = None


class LeadCreateMobile(BaseModel):
    """Schema específico para criar lead via mobile app"""
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None  # Email opcional no mobile
    origin: Optional[str] = None  # Ex: "Feira Imobiliária", "Indicação"
    budget: Optional[int] = None  # Orçamento do cliente
    notes: Optional[str] = None  # Interesse, preferências
    source: Optional[LeadSource] = LeadSource.MANUAL


class LeadCreateFromWebsite(BaseModel):
    """Schema específico para leads do site montra"""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: Optional[str] = None
    property_id: int  # Obrigatório para leads do site
    action_type: str  # "info_request", "visit_request", "contact"


class LeadUpdate(BaseModel):
    """Schema para atualizar lead"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    status: Optional[LeadStatus] = None
    assigned_agent_id: Optional[int] = None


class LeadAssign(BaseModel):
    """Schema para atribuir lead a agente"""
    agent_id: int


class LeadOut(LeadBase):
    id: int
    status: LeadStatus
    assigned_agent_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
