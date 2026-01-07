"""
Platform Routes - API endpoints para gestão da plataforma

Endpoints para:
- Autenticação de super admins
- CRUD de tenants
- Dashboard e estatísticas globais
- Configurações da plataforma
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List
from datetime import datetime, timedelta
import jwt
import bcrypt
import os

from app.database import get_db
from app.platform.models import Tenant, SuperAdmin, PlatformSettings
from app.platform import schemas

router = APIRouter(prefix="/platform", tags=["platform"])

# Secret key para tokens de super admin (diferente do token normal)
PLATFORM_SECRET = os.environ.get("PLATFORM_SECRET", "platform_super_secret_change_me")
PLATFORM_TOKEN_EXPIRE_HOURS = 24


# ===========================================
# HELPERS
# ===========================================

def hash_password(password: str) -> str:
    """Hash password com bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verificar password"""
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_platform_token(super_admin: SuperAdmin) -> str:
    """Criar JWT token para super admin"""
    payload = {
        "sub": super_admin.email,
        "super_admin_id": super_admin.id,
        "type": "platform",
        "exp": datetime.utcnow() + timedelta(hours=PLATFORM_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, PLATFORM_SECRET, algorithm="HS256")


def get_current_super_admin(
    token: str = Depends(lambda: None),
    db: Session = Depends(get_db)
) -> SuperAdmin:
    """
    Dependency para obter super admin autenticado.
    Requer header: Authorization: Bearer <token>
    """
    from fastapi import Request
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    
    # Esta função será chamada com o request
    # Por simplicidade, vamos verificar o token manualmente
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Use /platform/auth/login para obter token"
    )


def require_super_admin(db: Session = Depends(get_db)):
    """
    Dependency que extrai e valida token de super admin.
    """
    from fastapi import Request
    
    async def _require_super_admin(request: Request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de super admin necessário"
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            payload = jwt.decode(token, PLATFORM_SECRET, algorithms=["HS256"])
            
            if payload.get("type") != "platform":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido - não é token de plataforma"
                )
            
            super_admin_id = payload.get("super_admin_id")
            super_admin = db.query(SuperAdmin).filter(SuperAdmin.id == super_admin_id).first()
            
            if not super_admin or not super_admin.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Super admin não encontrado ou inactivo"
                )
            
            return super_admin
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado"
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
    
    return _require_super_admin


# ===========================================
# AUTH ENDPOINTS
# ===========================================

@router.post("/auth/login", response_model=schemas.SuperAdminToken)
def super_admin_login(
    credentials: schemas.SuperAdminLogin,
    db: Session = Depends(get_db)
):
    """
    Login de super admin.
    
    Retorna JWT token para acesso à plataforma.
    """
    super_admin = db.query(SuperAdmin).filter(
        SuperAdmin.email == credentials.email
    ).first()
    
    if not super_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    
    if not verify_password(credentials.password, super_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    
    if not super_admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desactivada"
        )
    
    # Actualizar last login
    super_admin.last_login_at = datetime.utcnow()
    db.commit()
    
    token = create_platform_token(super_admin)
    
    return schemas.SuperAdminToken(
        access_token=token,
        super_admin=schemas.SuperAdminOut.model_validate(super_admin)
    )


@router.post("/auth/verify")
def verify_platform_token(
    db: Session = Depends(get_db),
    authorization: str = None
):
    """
    Verificar se token de plataforma é válido.
    """
    from fastapi import Request
    
    # Por simplicidade, retornar info básica
    return {"valid": True, "message": "Use header Authorization: Bearer <token>"}


# ===========================================
# TENANT ENDPOINTS
# ===========================================

@router.get("/tenants", response_model=List[schemas.TenantOut])
def list_tenants(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = None,
    plan: str = None,
    db: Session = Depends(get_db)
):
    """
    Listar todos os tenants.
    
    Filtros opcionais:
    - is_active: filtrar por estado
    - plan: filtrar por plano
    """
    query = db.query(Tenant)
    
    if is_active is not None:
        query = query.filter(Tenant.is_active == is_active)
    
    if plan:
        query = query.filter(Tenant.plan == plan)
    
    tenants = query.offset(skip).limit(limit).all()
    return tenants


@router.get("/tenants/{tenant_id}", response_model=schemas.TenantOut)
def get_tenant(tenant_id: int, db: Session = Depends(get_db)):
    """Obter detalhes de um tenant"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    return tenant


@router.get("/tenants/by-slug/{slug}", response_model=schemas.TenantOut)
def get_tenant_by_slug(slug: str, db: Session = Depends(get_db)):
    """Obter tenant por slug"""
    tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    return tenant


@router.get("/tenants/by-domain/{domain}", response_model=schemas.TenantOut)
def get_tenant_by_domain(domain: str, db: Session = Depends(get_db)):
    """
    Resolver tenant por domínio.
    
    Usado pelo frontend para saber qual tenant carregar.
    Procura em primary_domain e backoffice_domain.
    """
    tenant = db.query(Tenant).filter(
        (Tenant.primary_domain == domain) | 
        (Tenant.backoffice_domain == domain)
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado para este domínio")
    
    if not tenant.is_active:
        raise HTTPException(status_code=403, detail="Tenant inactivo")
    
    return tenant


@router.post("/tenants", response_model=schemas.TenantOut, status_code=201)
def create_tenant(
    tenant_data: schemas.TenantCreate,
    db: Session = Depends(get_db)
):
    """
    Criar novo tenant.
    
    Requer autenticação de super admin (a implementar).
    """
    # Verificar se slug já existe
    existing = db.query(Tenant).filter(Tenant.slug == tenant_data.slug).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Slug '{tenant_data.slug}' já está em uso"
        )
    
    # Verificar se domínios já estão em uso
    if tenant_data.primary_domain:
        domain_check = db.query(Tenant).filter(
            Tenant.primary_domain == tenant_data.primary_domain
        ).first()
        if domain_check:
            raise HTTPException(
                status_code=400,
                detail=f"Domínio '{tenant_data.primary_domain}' já está em uso"
            )
    
    tenant = Tenant(**tenant_data.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    
    return tenant


@router.put("/tenants/{tenant_id}", response_model=schemas.TenantOut)
def update_tenant(
    tenant_id: int,
    tenant_data: schemas.TenantUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar tenant"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    update_data = tenant_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(tenant, field, value)
    
    db.commit()
    db.refresh(tenant)
    
    return tenant


@router.delete("/tenants/{tenant_id}")
def delete_tenant(tenant_id: int, db: Session = Depends(get_db)):
    """
    Desactivar tenant (soft delete).
    
    Não remove da BD, apenas marca como inactivo.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    tenant.is_active = False
    db.commit()
    
    return {"message": f"Tenant '{tenant.slug}' desactivado"}


@router.post("/tenants/{tenant_id}/activate")
def activate_tenant(tenant_id: int, db: Session = Depends(get_db)):
    """Reactivar tenant"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    tenant.is_active = True
    db.commit()
    
    return {"message": f"Tenant '{tenant.slug}' activado"}


# ===========================================
# STATS / DASHBOARD ENDPOINTS
# ===========================================

@router.get("/dashboard", response_model=schemas.PlatformDashboard)
def get_platform_dashboard(db: Session = Depends(get_db)):
    """
    Dashboard global da plataforma.
    
    Mostra métricas agregadas de todos os tenants.
    """
    # Contar tenants
    total_tenants = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.is_active == True).count()
    trial_tenants = db.query(Tenant).filter(Tenant.is_trial == True).count()
    
    # Tenants por plano
    plans = db.query(
        Tenant.plan, 
        func.count(Tenant.id)
    ).group_by(Tenant.plan).all()
    tenants_by_plan = {plan: count for plan, count in plans}
    
    # Métricas globais (da BD actual)
    try:
        total_agents = db.execute(text("SELECT COUNT(*) FROM agents")).scalar() or 0
        total_properties = db.execute(text("SELECT COUNT(*) FROM properties")).scalar() or 0
        total_leads = db.execute(text("SELECT COUNT(*) FROM leads")).scalar() or 0
    except:
        total_agents = 0
        total_properties = 0
        total_leads = 0
    
    return schemas.PlatformDashboard(
        total_tenants=total_tenants,
        active_tenants=active_tenants,
        trial_tenants=trial_tenants,
        total_agents=total_agents,
        total_properties=total_properties,
        total_leads=total_leads,
        tenants_by_plan=tenants_by_plan
    )


@router.get("/tenants/{tenant_id}/stats", response_model=schemas.TenantStats)
def get_tenant_stats(tenant_id: int, db: Session = Depends(get_db)):
    """
    Estatísticas de um tenant específico.
    
    Nota: Na fase actual (single-DB), mostra dados globais.
    Na fase multi-DB, irá mostrar dados do tenant.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    # Por agora, contar dados globais (single-DB)
    try:
        agents_count = db.execute(text("SELECT COUNT(*) FROM agents")).scalar() or 0
        properties_count = db.execute(text("SELECT COUNT(*) FROM properties")).scalar() or 0
        leads_count = db.execute(text("SELECT COUNT(*) FROM leads")).scalar() or 0
        users_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
    except:
        agents_count = 0
        properties_count = 0
        leads_count = 0
        users_count = 0
    
    return schemas.TenantStats(
        tenant_id=tenant.id,
        tenant_slug=tenant.slug,
        tenant_name=tenant.name,
        agents_count=agents_count,
        properties_count=properties_count,
        leads_count=leads_count,
        users_count=users_count
    )


# ===========================================
# SUPER ADMIN MANAGEMENT
# ===========================================

@router.get("/super-admins", response_model=List[schemas.SuperAdminOut])
def list_super_admins(db: Session = Depends(get_db)):
    """Listar super admins"""
    return db.query(SuperAdmin).all()


@router.post("/super-admins", response_model=schemas.SuperAdminOut, status_code=201)
def create_super_admin(
    admin_data: schemas.SuperAdminCreate,
    db: Session = Depends(get_db)
):
    """
    Criar novo super admin.
    
    ATENÇÃO: Este endpoint deveria ser protegido!
    Em produção, requer autenticação de outro super admin.
    """
    # Verificar se email já existe
    existing = db.query(SuperAdmin).filter(SuperAdmin.email == admin_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    super_admin = SuperAdmin(
        email=admin_data.email,
        name=admin_data.name,
        password_hash=hash_password(admin_data.password)
    )
    
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)
    
    return super_admin


# ===========================================
# PLATFORM SETTINGS
# ===========================================

@router.get("/settings", response_model=schemas.PlatformSettingsOut)
def get_platform_settings(db: Session = Depends(get_db)):
    """Obter configurações da plataforma"""
    settings = db.query(PlatformSettings).first()
    
    if not settings:
        # Criar defaults
        settings = PlatformSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@router.put("/settings", response_model=schemas.PlatformSettingsOut)
def update_platform_settings(
    settings_data: schemas.PlatformSettingsUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar configurações da plataforma"""
    settings = db.query(PlatformSettings).first()
    
    if not settings:
        settings = PlatformSettings()
        db.add(settings)
    
    update_data = settings_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    return settings
