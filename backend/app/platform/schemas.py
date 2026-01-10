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
    sector: str = "real_estate"


class TenantRegister(BaseModel):
    """Schema para registo self-service de novo tenant"""
    company_name: str
    sector: str = "real_estate"
    plan: str = "trial"
    admin_email: EmailStr
    admin_name: str
    admin_password: str
    phone: Optional[str] = None
    
    # Opcionais
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None


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
    secondary_color: Optional[str] = None
    sector: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    onboarding_completed: Optional[bool] = None
    billing_email: Optional[EmailStr] = None


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
    secondary_color: Optional[str] = None
    sector: Optional[str] = "real_estate"
    features: Dict[str, Any] = {}
    created_at: Optional[datetime] = None
    
    # Provisioning status
    status: str = "pending"
    provisioning_error: Optional[str] = None
    provisioned_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    schema_name: Optional[str] = None
    schema_revision: Optional[str] = None
    
    # Admin e onboarding
    admin_email: Optional[str] = None
    admin_created: bool = False
    onboarding_completed: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class TenantProvisioningStatus(BaseModel):
    """Status de provisionamento de um tenant"""
    tenant_id: int
    tenant_slug: str
    status: str  # pending, provisioning, ready, failed
    provisioning_error: Optional[str] = None
    provisioned_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    schema_name: Optional[str] = None
    schema_revision: Optional[str] = None
    
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


class SuperAdminOut(BaseModel):
    """Schema de resposta para SuperAdmin"""
    id: int
    email: EmailStr
    name: Optional[str] = None
    is_active: bool
    permissions: Optional[Dict[str, Any]] = None
    last_login: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def last_login_compat(self):
        return self.last_login_at or self.last_login


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
    tenants_by_sector: Dict[str, int] = {}


# ===========================================
# PROVISIONING SCHEMAS
# ===========================================

class TenantProvisionRequest(BaseModel):
    """Request para provisionar novo tenant via super-admin"""
    name: str
    sector: str = "real_estate"
    plan: str = "trial"
    admin_email: Optional[EmailStr] = None
    admin_name: Optional[str] = None
    admin_password: Optional[str] = None  # Se não fornecido, será gerado
    primary_domain: Optional[str] = None
    backoffice_domain: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None


class TenantProvisionResponse(BaseModel):
    """Resposta do provisionamento"""
    success: bool
    tenant: Optional[TenantOut] = None
    admin_email: Optional[str] = None
    admin_password: Optional[str] = None  # Apenas se foi gerada
    admin_created: bool = False
    urls: Dict[str, str] = {}
    logs: list = []
    errors: list = []


class SectorInfo(BaseModel):
    """Informação sobre um setor disponível"""
    slug: str
    name: str
    description: Optional[str] = None


class AvailableSectorsResponse(BaseModel):
    """Lista de setores disponíveis"""
    sectors: list[SectorInfo]


class PlanInfo(BaseModel):
    """Informação sobre um plano"""
    slug: str
    name: str
    max_agents: int
    max_properties: int
    price: Optional[float] = None
    features: list[str] = []


class AvailablePlansResponse(BaseModel):
    """Lista de planos disponíveis"""
    plans: list[PlanInfo]
