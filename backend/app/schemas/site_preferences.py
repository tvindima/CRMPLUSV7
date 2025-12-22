"""
Schemas para preferências do site montra individual do agente
"""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


class SitePreferencesBase(BaseModel):
    """Schema base para preferências do site"""
    theme: Optional[str] = Field(default="dark", description="Tema do site: 'dark' ou 'light'")
    primary_color: Optional[str] = Field(default="#ef4444", description="Cor primária em formato HEX")
    secondary_color: Optional[str] = Field(default="#ffffff", description="Cor secundária em formato HEX")
    hero_property_ids: Optional[List[int]] = Field(default=[], description="IDs dos imóveis em destaque (máx 3)")
    bio: Optional[str] = Field(default=None, description="Bio do agente")
    instagram: Optional[str] = Field(default=None, description="Username/URL do Instagram")
    facebook: Optional[str] = Field(default=None, description="Username/URL do Facebook")
    linkedin: Optional[str] = Field(default=None, description="Username/URL do LinkedIn")
    whatsapp: Optional[str] = Field(default=None, description="Número do WhatsApp")

    @field_validator('theme')
    @classmethod
    def validate_theme(cls, v):
        if v and v not in ['dark', 'light']:
            raise ValueError("theme deve ser 'dark' ou 'light'")
        return v
    
    @field_validator('primary_color', 'secondary_color')
    @classmethod
    def validate_color(cls, v):
        if v and not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError("Cor deve estar no formato HEX (#RRGGBB)")
        return v
    
    @field_validator('hero_property_ids')
    @classmethod
    def validate_hero_ids(cls, v):
        if v and len(v) > 3:
            raise ValueError("Máximo de 3 imóveis em destaque")
        return v or []


class SitePreferencesCreate(SitePreferencesBase):
    """Schema para criar preferências"""
    pass


class SitePreferencesUpdate(SitePreferencesBase):
    """Schema para atualizar preferências"""
    pass


class SitePreferencesOut(SitePreferencesBase):
    """Schema de resposta com dados do agente"""
    agent_id: int
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class SitePreferencesResponse(BaseModel):
    """Resposta padrão para operações de preferências"""
    success: bool
    message: str
    data: Optional[SitePreferencesOut] = None


# === Schemas para endpoint público ===

class AgentPublicInfo(BaseModel):
    """Info pública do agente"""
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    photo: Optional[str] = None


class PropertyPublicInfo(BaseModel):
    """Info pública de um imóvel"""
    id: int
    title: str
    reference: Optional[str] = None
    price: Optional[float] = None
    location: Optional[str] = None
    municipality: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[float] = None
    images: Optional[List[str]] = []
    property_type: Optional[str] = None
    business_type: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class AgentSitePublic(BaseModel):
    """Resposta completa do site público do agente"""
    agent: AgentPublicInfo
    site_preferences: SitePreferencesOut
    hero_properties: List[PropertyPublicInfo] = []
    properties: List[PropertyPublicInfo] = []
