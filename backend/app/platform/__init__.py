"""
Platform Module - Super Admin & Multi-Tenant Management

Este módulo gere:
- Tenants (imobiliárias/empresas)
- Super Admins (administradores da plataforma)
- Configurações globais da plataforma
"""

from app.platform.models import Tenant, SuperAdmin, PlatformSettings
from app.platform.routes import router as platform_router

__all__ = ["Tenant", "SuperAdmin", "PlatformSettings", "platform_router"]
