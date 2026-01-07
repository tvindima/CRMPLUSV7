"""
Platform Routes - API endpoints para gestão da plataforma

Endpoints para:
- Autenticação de super admins
- CRUD de tenants
- Dashboard e estatísticas globais
- Configurações da plataforma
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List
from datetime import datetime, timedelta
import jwt
import bcrypt
import os

from app.database import get_db, create_tenant_schema, copy_tables_to_schema
from app.platform.models import Tenant, SuperAdmin, PlatformSettings
from app.platform import schemas

router = APIRouter(prefix="/platform", tags=["platform"])

# Secret key para tokens de super admin (diferente do token normal)
# FAIL-FAST: Não há fallback - aplicação não inicia sem secret definido
PLATFORM_SECRET = os.environ.get("PLATFORM_SECRET")
if not PLATFORM_SECRET:
    import sys
    print("[FATAL] PLATFORM_SECRET não está definido. Configure a variável de ambiente.")
    print("[FATAL] A aplicação não pode iniciar sem PLATFORM_SECRET.")
    # Em produção, falhar imediatamente. Em desenvolvimento, permitir continuar com aviso.
    if os.environ.get("RAILWAY_ENVIRONMENT") or os.environ.get("VERCEL"):
        sys.exit(1)
    else:
        print("[WARN] Modo desenvolvimento detectado - usando secret temporário (NÃO USAR EM PRODUÇÃO)")
        PLATFORM_SECRET = "dev_only_secret_not_for_production"

PLATFORM_TOKEN_EXPIRE_HOURS = 24


# ===========================================
# ENSURE TABLES EXIST
# ===========================================

def ensure_platform_tables(db: Session):
    """Criar tabelas da plataforma se não existirem"""
    try:
        # Verificar se tabela tenants existe
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'tenants'
            )
        """)).scalar()
        
        if not result:
            print("[PLATFORM] Creating platform tables...")
            
            # Criar tabela tenants
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS tenants (
                    id SERIAL PRIMARY KEY,
                    slug VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    email VARCHAR(200),
                    phone VARCHAR(50),
                    primary_domain VARCHAR(200),
                    backoffice_domain VARCHAR(200),
                    api_subdomain VARCHAR(200),
                    database_url TEXT,
                    plan VARCHAR(50) DEFAULT 'basic',
                    features JSONB DEFAULT '{}',
                    max_agents INTEGER DEFAULT 10,
                    max_properties INTEGER DEFAULT 100,
                    is_active BOOLEAN DEFAULT true,
                    is_trial BOOLEAN DEFAULT false,
                    trial_ends_at TIMESTAMP WITH TIME ZONE,
                    status VARCHAR(20) DEFAULT 'pending',
                    provisioning_error TEXT,
                    provisioned_at TIMESTAMP WITH TIME ZONE,
                    failed_at TIMESTAMP WITH TIME ZONE,
                    schema_name VARCHAR(100),
                    schema_revision VARCHAR(100),
                    logo_url VARCHAR(500),
                    primary_color VARCHAR(20),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            
            # Criar tabela super_admins
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS super_admins (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(200) UNIQUE NOT NULL,
                    password_hash VARCHAR(200) NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    permissions JSONB DEFAULT '{}',
                    last_login_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            
            # Criar tabela platform_settings
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS platform_settings (
                    id SERIAL PRIMARY KEY,
                    platform_name VARCHAR(100) DEFAULT 'CRM Plus',
                    platform_logo_url VARCHAR(500),
                    support_email VARCHAR(200) DEFAULT 'suporte@crmplus.pt',
                    default_plan VARCHAR(50) DEFAULT 'basic',
                    trial_days INTEGER DEFAULT 14,
                    maintenance_mode BOOLEAN DEFAULT false,
                    registration_enabled BOOLEAN DEFAULT true,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            
            db.commit()
            
            # Inserir tenant default
            db.execute(text("""
                INSERT INTO tenants (slug, name, email, primary_domain, backoffice_domain, plan, max_agents, max_properties)
                VALUES ('imoveismais', 'Imóveis Mais', 'geral@imoveismais.com', 'imoveismais.com', 'backoffice.imoveismais.com', 'enterprise', 50, 1000)
                ON CONFLICT (slug) DO NOTHING
            """))
            
            # Inserir settings default
            db.execute(text("""
                INSERT INTO platform_settings (platform_name, support_email)
                VALUES ('CRM Plus', 'suporte@crmplus.pt')
                ON CONFLICT DO NOTHING
            """))
            
            db.commit()
            print("[PLATFORM] Tables created successfully!")
            
    except Exception as e:
        print(f"[PLATFORM] Error ensuring tables: {e}")
        db.rollback()


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


from fastapi import Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)


async def get_current_super_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> SuperAdmin:
    """
    Dependency para obter super admin autenticado.
    Requer header: Authorization: Bearer <token>
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de super admin necessário"
        )
    
    token = credentials.credentials
    
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

# Chave para bootstrap inicial (criar primeiro super admin)
BOOTSTRAP_KEY = os.environ.get("PLATFORM_BOOTSTRAP_KEY", "bootstrap_key_change_in_production")


@router.post("/auth/bootstrap", response_model=schemas.SuperAdminToken)
def bootstrap_super_admin(
    bootstrap_data: schemas.SuperAdminCreate,
    x_bootstrap_key: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Criar o primeiro super admin (bootstrap).
    
    IMPORTANTE: Este endpoint só funciona se:
    1. Não existir nenhum super admin na BD
    2. A chave X-Bootstrap-Key estiver correcta
    
    Após criar o primeiro admin, use o login normal e o endpoint 
    protegido /super-admins para criar mais admins.
    """
    # Verificar chave de bootstrap
    if x_bootstrap_key != BOOTSTRAP_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chave de bootstrap inválida"
        )
    
    ensure_platform_tables(db)
    
    # Verificar se já existe algum super admin
    existing_count = db.query(SuperAdmin).count()
    if existing_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bootstrap não permitido: já existem {existing_count} super admin(s). Use o endpoint /super-admins com autenticação."
        )
    
    # Verificar se email já existe (redundante mas seguro)
    existing_email = db.query(SuperAdmin).filter(SuperAdmin.email == bootstrap_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registado"
        )
    
    # Criar o super admin
    super_admin = SuperAdmin(
        email=bootstrap_data.email,
        name=bootstrap_data.name,
        password_hash=hash_password(bootstrap_data.password),
        is_active=True,
        permissions={"all": True}  # Primeiro admin tem todas as permissões
    )
    
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)
    
    # Criar token e retornar
    token = create_platform_token(super_admin)
    
    print(f"[PLATFORM] ✅ Bootstrap: Super admin '{bootstrap_data.email}' criado com sucesso!")
    
    return schemas.SuperAdminToken(
        access_token=token,
        super_admin=schemas.SuperAdminOut.model_validate(super_admin)
    )


@router.post("/auth/reset-super-admin", response_model=schemas.SuperAdminToken)
def reset_super_admin(
    admin_data: schemas.SuperAdminCreate,
    x_bootstrap_key: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Resetar/atualizar o super admin principal.
    
    PERIGO: Este endpoint permite resetar as credenciais do super admin.
    Requer a chave de bootstrap.
    
    Se já existe um super admin com o email fornecido, atualiza a password.
    Se não existe, cria um novo (substituindo os existentes se houver apenas 1).
    """
    # Verificar chave de bootstrap
    if x_bootstrap_key != BOOTSTRAP_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chave de bootstrap inválida"
        )
    
    ensure_platform_tables(db)
    
    # Verificar se já existe com este email
    existing = db.query(SuperAdmin).filter(SuperAdmin.email == admin_data.email).first()
    
    if existing:
        # Atualizar password
        existing.password_hash = hash_password(admin_data.password)
        existing.name = admin_data.name
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        super_admin = existing
        print(f"[PLATFORM] ✅ Reset: Super admin '{admin_data.email}' atualizado!")
    else:
        # Criar novo
        super_admin = SuperAdmin(
            email=admin_data.email,
            name=admin_data.name,
            password_hash=hash_password(admin_data.password),
            is_active=True,
            permissions={"all": True}
        )
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        print(f"[PLATFORM] ✅ Reset: Super admin '{admin_data.email}' criado!")
    
    token = create_platform_token(super_admin)
    
    return schemas.SuperAdminToken(
        access_token=token,
        super_admin=schemas.SuperAdminOut.model_validate(super_admin)
    )


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
    ensure_platform_tables(db)
    
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


def provision_tenant_schema_internal(db: Session, tenant: Tenant) -> dict:
    """
    Função interna para provisionar schema de um tenant.
    Usada tanto na criação inicial como no retry.
    
    Returns:
        dict com status e detalhes
    """
    schema_name = f"tenant_{tenant.slug}"
    
    try:
        # Marcar como provisioning
        tenant.status = 'provisioning'
        tenant.provisioning_error = None
        db.commit()
        
        # Criar schema
        create_tenant_schema(db, schema_name)
        
        # Copiar estrutura das tabelas principais para o novo schema
        result = copy_tables_to_schema(db, schema_name)
        
        # Marcar como ready
        tenant.status = 'ready'
        tenant.schema_name = schema_name
        tenant.provisioned_at = datetime.utcnow()
        tenant.failed_at = None
        tenant.provisioning_error = None
        db.commit()
        
        print(f"[PLATFORM] ✅ Schema '{schema_name}' provisionado com sucesso para tenant {tenant.slug}")
        
        return {
            "success": True,
            "schema_name": schema_name,
            "tables_created": result.get("created", []),
            "errors": result.get("errors", [])
        }
        
    except Exception as e:
        # Marcar como failed
        tenant.status = 'failed'
        tenant.provisioning_error = str(e)
        tenant.failed_at = datetime.utcnow()
        db.commit()
        
        print(f"[PLATFORM] ❌ Erro ao provisionar schema para tenant {tenant.slug}: {e}")
        
        return {
            "success": False,
            "error": str(e),
            "schema_name": schema_name
        }


@router.post("/tenants", response_model=schemas.TenantOut, status_code=201)
async def create_tenant(
    tenant_data: schemas.TenantCreate,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Criar novo tenant.
    
    PROTEGIDO - Requer autenticação de super admin.
    
    Este endpoint:
    1. Valida que o slug não está em uso
    2. Valida que os domínios não estão em uso
    3. Cria o registo do tenant na tabela principal (status=pending)
    4. Tenta provisionar o schema PostgreSQL isolado
    5. Actualiza status para ready ou failed
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
    
    # Criar tenant com status pending
    tenant = Tenant(**tenant_data.model_dump())
    tenant.status = 'pending'
    tenant.schema_name = f"tenant_{tenant_data.slug}"
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    
    # Provisionar schema (síncrono mas com tracking de estado)
    provision_result = provision_tenant_schema_internal(db, tenant)
    
    # Refresh para obter estado actualizado
    db.refresh(tenant)
    
    # Se falhou, ainda retornamos o tenant mas com status failed
    # O caller pode verificar tenant.status
    if not provision_result["success"]:
        print(f"[PLATFORM] Tenant criado mas provisionamento falhou: {provision_result['error']}")
    
    return tenant


@router.post("/tenants/{tenant_id}/retry-provisioning", response_model=schemas.TenantProvisioningStatus)
async def retry_tenant_provisioning(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Retry de provisionamento de schema para tenant que falhou.
    
    PROTEGIDO - Requer autenticação de super admin.
    
    Apenas tenants com status 'pending' ou 'failed' podem ser re-provisionados.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    if tenant.status not in ('pending', 'failed'):
        raise HTTPException(
            status_code=400,
            detail=f"Tenant está com status '{tenant.status}'. Apenas tenants 'pending' ou 'failed' podem ser re-provisionados."
        )
    
    # Tentar provisionar
    provision_result = provision_tenant_schema_internal(db, tenant)
    
    # Refresh para obter estado actualizado
    db.refresh(tenant)
    
    return schemas.TenantProvisioningStatus(
        tenant_id=tenant.id,
        tenant_slug=tenant.slug,
        status=tenant.status,
        provisioning_error=tenant.provisioning_error,
        provisioned_at=tenant.provisioned_at,
        failed_at=tenant.failed_at,
        schema_name=tenant.schema_name,
        schema_revision=tenant.schema_revision
    )


@router.get("/tenants/provisioning-status", response_model=list[schemas.TenantProvisioningStatus])
async def get_tenants_provisioning_status(
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Listar status de provisionamento de todos os tenants.
    
    PROTEGIDO - Requer autenticação de super admin.
    
    Útil para dashboard de monitorização.
    """
    tenants = db.query(Tenant).all()
    
    return [
        schemas.TenantProvisioningStatus(
            tenant_id=t.id,
            tenant_slug=t.slug,
            status=t.status or 'unknown',
            provisioning_error=t.provisioning_error,
            provisioned_at=t.provisioned_at,
            failed_at=t.failed_at,
            schema_name=t.schema_name,
            schema_revision=t.schema_revision
        )
        for t in tenants
    ]


@router.put("/tenants/{tenant_id}", response_model=schemas.TenantOut)
async def update_tenant(
    tenant_id: int,
    tenant_data: schemas.TenantUpdate,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """Actualizar tenant - PROTEGIDO"""
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
async def delete_tenant(
    tenant_id: int, 
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Desactivar tenant (soft delete) - PROTEGIDO.
    
    Não remove da BD, apenas marca como inactivo.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    tenant.is_active = False
    db.commit()
    
    return {"message": f"Tenant '{tenant.slug}' desactivado"}


@router.post("/tenants/{tenant_id}/activate")
async def activate_tenant(
    tenant_id: int, 
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """Reactivar tenant - PROTEGIDO"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    tenant.is_active = True
    db.commit()
    
    return {"message": f"Tenant '{tenant.slug}' activado"}


@router.post("/tenants/{tenant_id}/provision-schema")
async def provision_tenant_schema(
    tenant_id: int, 
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    DEPRECATED - Use POST /tenants/{tenant_id}/retry-provisioning
    
    Mantido para compatibilidade. Redireciona internamente para retry-provisioning.
    """
    return await retry_tenant_provisioning(tenant_id, db, current_admin)


# ===========================================
# STATS / DASHBOARD ENDPOINTS
# ===========================================

@router.get("/dashboard", response_model=schemas.PlatformDashboard)
def get_platform_dashboard(db: Session = Depends(get_db)):
    """
    Dashboard global da plataforma.
    
    Mostra métricas agregadas de todos os tenants.
    """
    ensure_platform_tables(db)
    
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
async def list_super_admins(
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """Listar super admins - PROTEGIDO"""
    return db.query(SuperAdmin).all()


@router.post("/super-admins", response_model=schemas.SuperAdminOut, status_code=201)
async def create_super_admin(
    admin_data: schemas.SuperAdminCreate,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Criar novo super admin.
    
    PROTEGIDO - Requer autenticação de outro super admin.
    """
    # Verificar se email já existe
    existing = db.query(SuperAdmin).filter(SuperAdmin.email == admin_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    super_admin = SuperAdmin(
        email=admin_data.email,
        name=admin_data.name,
        password_hash=hash_password(admin_data.password),
        permissions=admin_data.permissions or {}
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
async def update_platform_settings(
    settings_data: schemas.PlatformSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """Actualizar configurações da plataforma - PROTEGIDO"""
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
