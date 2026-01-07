"""
Platform Schemas - Pydantic models for API
"""

from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime


# ===========================================
# TENANT SCHEMAS
# ===========================================

class TenantBase(BaseModel):
    """Base schema para Tenant"""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    primary_domain: Optional[str] = None
    backoffice_domain: Optional[str] = None


class TenantCreate(TenantBase):
    """Schema para criar novo tenant"""
    slug: str
    plan: str = "basic"
    max_agents: int = 10
    max_properties: int = 100
    is_trial: bool = False


class TenantUpdate(BaseModel):
    """Schema para actualizar tenant"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    primary_domain: Optional[str] = None
    backoffice_domain: Optional[str] = None
    plan: Optional[str] = None
    max_agents: Optional[int] = None
    max_properties: Optional[int] = None
    is_active: Optional[bool] = None
    is_trial: Optional[bool] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    features: Optional[Dict[str, Any]] = None


class TenantOut(TenantBase):
    """Schema de resposta para Tenant"""
    id: int
    slug: str
    plan: str
    max_agents: int
    max_properties: int
    is_active: bool
    is_trial: bool
    trial_ends_at: Optional[datetime] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    features: Dict[str, Any] = {}
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class TenantStats(BaseModel):
    """Estatísticas de um tenant"""
    tenant_id: int
    tenant_slug: str
    tenant_name: str
    agents_count: int
    properties_count: int
    leads_count: int
    users_count: int


# ===========================================
# SUPER ADMIN SCHEMAS
# ===========================================

class SuperAdminBase(BaseModel):
    """Base schema para SuperAdmin"""
    email: EmailStr
    name: str


class SuperAdminCreate(SuperAdminBase):
    """Schema para criar super admin"""
    password: str
    permissions: Optional[Dict[str, Any]] = None


class SuperAdminUpdate(BaseModel):
    """Schema para actualizar super admin"""
    name: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[Dict[str, Any]] = None


class SuperAdminOut(SuperAdminBase):
    """Schema de resposta para SuperAdmin"""
    id: int
    is_active: bool
    permissions: Optional[Dict[str, Any]] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class SuperAdminLogin(BaseModel):
    """Schema para login de super admin"""
    email: EmailStr
    password: str


class SuperAdminToken(BaseModel):
    """Token response para super admin"""
    access_token: str
    token_type: str = "bearer"
    super_admin: SuperAdminOut


# ===========================================
# PLATFORM SETTINGS SCHEMAS
# ===========================================

class PlatformSettingsUpdate(BaseModel):
    """Schema para actualizar configurações da plataforma"""
    platform_name: Optional[str] = None
    platform_logo_url: Optional[str] = None
    support_email: Optional[str] = None
    default_plan: Optional[str] = None
    trial_days: Optional[int] = None
    maintenance_mode: Optional[bool] = None
    registration_enabled: Optional[bool] = None


class PlatformSettingsOut(BaseModel):
    """Schema de resposta para configurações da plataforma"""
    platform_name: str
    platform_logo_url: Optional[str] = None
    support_email: str
    default_plan: str
    trial_days: int
    maintenance_mode: bool
    registration_enabled: bool
    
    model_config = ConfigDict(from_attributes=True)


# ===========================================
# DASHBOARD / STATS SCHEMAS
# ===========================================

class PlatformDashboard(BaseModel):
    """Dashboard global da plataforma"""
    total_tenants: int
    active_tenants: int
    trial_tenants: int
    total_agents: int
    total_properties: int
    total_leads: int
    tenants_by_plan: Dict[str, int]
