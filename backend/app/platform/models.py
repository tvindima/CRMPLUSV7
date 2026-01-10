"""
Platform Models - Tenant Registry & Super Admin

Modelos para gestão multi-tenant da plataforma CRM Plus.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.database import Base


class Tenant(Base):
    """
    Representa uma imobiliária/empresa na plataforma.
    
    Cada tenant tem:
    - Identificação única (slug)
    - Configuração de domínios
    - Plano de subscrição
    - Estado activo/inactivo
    
    Nota: Na fase inicial, todos os dados estão na mesma BD.
    Na fase multi-DB, cada tenant terá a sua própria BD e este
    registo guardará o database_url.
    """
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificação
    slug = Column(String(50), unique=True, nullable=False, index=True)  # ex: 'imoveismais'
    name = Column(String(200), nullable=False)  # ex: 'Imóveis Mais'
    
    # Contacto
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Domínios (para routing e CORS)
    primary_domain = Column(String(200), nullable=True)      # ex: 'imoveismais.com'
    backoffice_domain = Column(String(200), nullable=True)   # ex: 'backoffice.imoveismais.com'
    api_subdomain = Column(String(200), nullable=True)       # ex: 'api.imoveismais.com' (futuro)
    
    # Base de dados (para fase multi-DB)
    database_url = Column(Text, nullable=True)  # Connection string (encriptado em produção)
    
    # Plano e features
    plan = Column(String(50), default='basic')  # 'basic', 'pro', 'enterprise'
    features = Column(JSON, default={})  # Feature flags específicos
    max_agents = Column(Integer, default=10)
    max_properties = Column(Integer, default=100)
    
    # Estado
    is_active = Column(Boolean, default=True)
    is_trial = Column(Boolean, default=False)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    
    # Provisioning status - estados: pending, provisioning, ready, failed
    status = Column(String(20), default='pending', nullable=False)
    provisioning_error = Column(Text, nullable=True)
    provisioned_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Schema tracking
    schema_name = Column(String(100), nullable=True)  # ex: 'tenant_imoveismais'
    schema_revision = Column(String(100), nullable=True)  # última migration aplicada
    
    # Branding override (se diferente do padrão)
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(20), nullable=True)
    secondary_color = Column(String(20), nullable=True)
    
    # Setor de atividade
    sector = Column(String(50), default='real_estate')  # real_estate, automotive, services, etc.
    sub_sector = Column(String(100), nullable=True)  # Sub-categoria: 'law_firm', 'training', 'consulting', etc.
    
    # Terminologia personalizada (override do sector padrão)
    # Exemplo: {"item": "Curso", "items": "Cursos", "visit": "Formação"}
    custom_terminology = Column(JSON, nullable=True)
    
    # Admin inicial do tenant
    admin_email = Column(String(200), nullable=True)
    admin_created = Column(Boolean, default=False)
    
    # Onboarding
    onboarding_completed = Column(Boolean, default=False)
    onboarding_step = Column(Integer, default=0)
    
    # Verificação de domínio customizado
    custom_domain_verified = Column(Boolean, default=False)
    domain_verification_token = Column(String(100), nullable=True)
    
    # Billing (para futuro Stripe)
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    billing_email = Column(String(200), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Status helpers
    @property
    def is_ready(self) -> bool:
        return self.status == 'ready'
    
    @property
    def is_failed(self) -> bool:
        return self.status == 'failed'
    
    @property
    def needs_provisioning(self) -> bool:
        return self.status in ('pending', 'failed')
    
    def __repr__(self):
        return f"<Tenant {self.slug}: {self.name} ({self.status})>"


class SuperAdmin(Base):
    """
    Administrador da plataforma (não de um tenant específico).
    
    Super admins podem:
    - Criar/editar/desactivar tenants
    - Ver métricas globais
    - Gerir planos e billing
    - Aceder a qualquer tenant (impersonation)
    """
    __tablename__ = "super_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    name = Column(String(200), nullable=False)
    
    is_active = Column(Boolean, default=True)
    
    # Permissões granulares (futuro)
    permissions = Column(JSON, default={})
    
    # Metadata
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<SuperAdmin {self.email}>"


class PlatformSettings(Base):
    """
    Configurações globais da plataforma.
    
    Singleton - apenas 1 registo.
    """
    __tablename__ = "platform_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Branding da plataforma (não do tenant)
    platform_name = Column(String(100), default="CRM Plus")
    platform_logo_url = Column(String(500), nullable=True)
    support_email = Column(String(200), default="suporte@crmplus.pt")
    
    # Defaults para novos tenants
    default_plan = Column(String(50), default='basic')
    trial_days = Column(Integer, default=14)
    
    # Feature flags globais
    maintenance_mode = Column(Boolean, default=False)
    registration_enabled = Column(Boolean, default=True)
    
    # Metadata
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
