from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class LeadBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None  # Email opcional para suportar leads mobile
    phone: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = "manual"  # website, portal, phone, email, referral, social, manual, other
    origin: Optional[str] = None
    portal_name: Optional[str] = None  # Nome do portal externo (idealista, imovirtual, standvirtual, etc.)
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
    source: Optional[str] = "manual"  # String em vez de Enum


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
    status: Optional[str] = None  # String em vez de Enum
    assigned_agent_id: Optional[int] = None


class LeadAssign(BaseModel):
    """Schema para atribuir lead a agente"""
    agent_id: int


class LeadOut(LeadBase):
    id: int
    status: Optional[str] = None  # String - BD agora usa String em vez de Enum
    assigned_agent_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
