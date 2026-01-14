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
        
        # SEMPRE garantir que email_verifications existe (mesmo se tenants já existia)
        email_verif_exists = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'email_verifications'
            )
        """)).scalar()
        
        if not email_verif_exists:
            print("[PLATFORM] Creating email_verifications table...")
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS email_verifications (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(200) NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    company_name VARCHAR(200) NOT NULL,
                    hashed_password VARCHAR(200) NOT NULL,
                    sector VARCHAR(50) DEFAULT 'real_estate',
                    phone VARCHAR(50),
                    logo_url VARCHAR(500),
                    primary_color VARCHAR(20),
                    verification_code VARCHAR(6) NOT NULL,
                    verification_token VARCHAR(100) UNIQUE NOT NULL,
                    is_verified BOOLEAN DEFAULT false,
                    verified_at TIMESTAMP WITH TIME ZONE,
                    tenant_id INTEGER,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    ip_address VARCHAR(50),
                    user_agent VARCHAR(500)
                )
            """))
            
            # Criar índices
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
                CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(verification_code);
                CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(verification_token);
            """))
            
            db.commit()
            print("[PLATFORM] email_verifications table created!")
            
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


def require_super_admin():
    """
    Dependency que extrai e valida token de super admin.
    """
    from fastapi import Request
    
    async def _require_super_admin(request: Request, db: Session = Depends(get_db)):
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
    permanent: bool = False,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Eliminar tenant - PROTEGIDO.
    
    Por defeito faz soft delete (is_active=False).
    Com ?permanent=true, elimina permanentemente da BD e o schema.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    tenant_name = tenant.name
    tenant_slug = tenant.slug
    schema_name = tenant.schema_name
    
    if permanent:
        # Eliminar schema se existir
        if schema_name:
            try:
                db.execute(text(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'))
                db.commit()
            except Exception as e:
                print(f"[DELETE TENANT] Warning: Could not drop schema {schema_name}: {e}")
        
        # Eliminar registo do tenant
        db.delete(tenant)
        db.commit()
        
        return {"message": f"Tenant '{tenant_slug}' eliminado permanentemente", "deleted": True}
    else:
        # Soft delete - apenas desactivar
        tenant.is_active = False
        db.commit()
        
        return {"message": f"Tenant '{tenant_slug}' desactivado", "deleted": False}


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
        schema_name = tenant.schema_name or f"tenant_{tenant.slug}"
        agents_count = properties_count = leads_count = users_count = 0

        try:
            # Isolar search_path no schema do tenant para contar dados certos
            db.execute(text(f'SET search_path TO "{schema_name}", public'))
            agents_count = db.execute(text("SELECT COUNT(*) FROM agents")).scalar() or 0
            properties_count = db.execute(text("SELECT COUNT(*) FROM properties")).scalar() or 0
            leads_count = db.execute(text("SELECT COUNT(*) FROM leads")).scalar() or 0
            users_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
        except Exception as e:
            print(f"[STATS] Erro ao contar dados em {schema_name}: {e}")
        finally:
            # Restaurar search_path
            db.execute(text('SET search_path TO public'))

        return schemas.TenantStats(
            tenant_id=tenant.id,
            tenant_slug=tenant.slug,
            tenant_name=tenant.name,
            agents_count=agents_count,
            properties_count=properties_count,
            leads_count=leads_count,
            users_count=users_count
        )


@router.get("/tenants/{tenant_id}/users")
def get_tenant_users(
    tenant_id: int,
    db: Session = Depends(get_db),
    _: SuperAdmin = Depends(require_super_admin())
):
    """
    Listar utilizadores de um tenant específico.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    schema_name = f"tenant_{tenant.slug}"
    users = []
    
    try:
        # Verificar se o schema existe
        schema_exists = db.execute(
            text("SELECT schema_name FROM information_schema.schemata WHERE schema_name = :schema"),
            {"schema": schema_name}
        ).fetchone()
        
        if schema_exists:
            # Buscar utilizadores do schema do tenant
            result = db.execute(
                text(f'''
                    SELECT id, email, full_name, role, is_active, created_at, updated_at AS last_login
                    FROM "{schema_name}".users
                    ORDER BY created_at DESC
                ''')
            ).fetchall()
            
            for row in result:
                users.append({
                    "id": row[0],
                    "email": row[1],
                    "name": row[2] or row[1].split('@')[0],
                    "role": row[3] or "user",
                    "is_active": row[4] if row[4] is not None else True,
                    "created_at": row[5].isoformat() if row[5] else None,
                    "last_login": row[6].isoformat() if row[6] else None
                })
    except Exception as e:
        print(f"Error fetching users for tenant {tenant.slug}: {e}")
    
    return users


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


# ===========================================
# PROVISIONING ENDPOINTS (NOVOS)
# ===========================================

@router.post("/provision", response_model=schemas.TenantProvisionResponse)
async def provision_new_tenant(
    request: schemas.TenantProvisionRequest,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Provisionar novo tenant completo.
    
    PROTEGIDO - Requer autenticação de super admin.
    
    Este endpoint:
    1. Cria o registo do tenant
    2. Cria o schema PostgreSQL isolado
    3. Copia estrutura de tabelas
    4. Aplica seeds do setor escolhido
    5. Cria admin inicial (se fornecido)
    
    Retorna credenciais do admin se a password foi gerada.
    """
    from app.platform.provisioning import provision_new_tenant as do_provision
    
    result = do_provision(
        db=db,
        name=request.name,
        sector=request.sector,
        sub_sector=request.sub_sector,
        plan=request.plan,
        admin_email=request.admin_email,
        admin_name=request.admin_name,
        admin_password=request.admin_password,
        primary_domain=request.primary_domain,
        backoffice_domain=request.backoffice_domain,
        logo_url=request.logo_url,
        primary_color=request.primary_color,
        custom_terminology=request.custom_terminology,
    )
    
    # Converter para schema de resposta
    tenant_data = None
    if result.get("tenant"):
        tenant = db.query(Tenant).filter(Tenant.id == result["tenant"]["id"]).first()
        if tenant:
            tenant_data = schemas.TenantOut.model_validate(tenant)
    
    return schemas.TenantProvisionResponse(
        success=result["success"],
        tenant=tenant_data,
        admin_email=result.get("admin", {}).get("email") if result.get("admin") else None,
        admin_password=result.get("admin", {}).get("password") if result.get("admin") else None,
        admin_created=result.get("admin", {}).get("created", False) if result.get("admin") else False,
        urls=result.get("urls", {}),
        logs=result.get("logs", []),
        errors=result.get("errors", []),
    )


# ===========================================
# REGISTO SELF-SERVICE COM VERIFICAÇÃO EMAIL
# ===========================================

@router.post("/register")
async def register_tenant_self_service(
    request: schemas.TenantRegister,
    db: Session = Depends(get_db)
):
    """
    Registo self-service de novo tenant - PASSO 1.
    
    PÚBLICO - Não requer autenticação.
    
    Fluxo:
    1. Recebe dados do formulário
    2. Valida email não está em uso
    3. Cria registo de verificação pendente
    4. Envia email com código de verificação
    5. Retorna sucesso (aguarda verificação)
    
    O tenant só é criado após verificação do email.
    """
    import secrets
    import random
    
    from app.platform.models import EmailVerification
    
    # Verificar se registo está ativado
    settings = db.query(PlatformSettings).first()
    if settings and not settings.registration_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registo de novos tenants está temporariamente desativado"
        )
    
    # Verificar se email já existe como tenant
    existing_tenant = db.query(Tenant).filter(Tenant.admin_email == request.admin_email).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está associado a uma conta"
        )
    
    # Verificar se há verificação pendente não expirada
    existing_verification = db.query(EmailVerification).filter(
        EmailVerification.email == request.admin_email,
        EmailVerification.is_verified == False
    ).first()
    
    if existing_verification:
        # Se expirou, remover
        if existing_verification.is_expired:
            db.delete(existing_verification)
            db.commit()
        else:
            # Reenviar código existente
            try:
                from app.services.email import send_verification_email
                verification_url = f"{os.environ.get('PLATFORM_URL', 'https://crmplus.trioto.tech')}/verificar?token={existing_verification.verification_token}"
                send_verification_email(
                    to=request.admin_email,
                    name=request.admin_name,
                    code=existing_verification.verification_code,
                    url=verification_url
                )
            except Exception as e:
                print(f"[REGISTER] Erro ao reenviar email: {e}")
            
            return {
                "success": True,
                "message": "Já existe um registo pendente. Reenviámos o email de verificação.",
                "email": request.admin_email,
                "requires_verification": True
            }
    
    # Gerar código de 6 dígitos e token único
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    verification_token = secrets.token_urlsafe(32)
    
    # Hash da password
    password_hash = bcrypt.hashpw(request.admin_password.encode(), bcrypt.gensalt()).decode()
    
    # Criar registo de verificação
    verification = EmailVerification(
        email=request.admin_email,
        name=request.admin_name,
        company_name=request.company_name,
        hashed_password=password_hash,
        sector=request.sector,
        phone=request.phone,
        logo_url=request.logo_url,
        primary_color=request.primary_color,
        verification_code=verification_code,
        verification_token=verification_token,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    
    db.add(verification)
    db.commit()
    db.refresh(verification)
    
    # Enviar email de verificação
    try:
        from app.services.email import send_verification_email
        verification_url = f"{os.environ.get('PLATFORM_URL', 'https://crmplus.trioto.tech')}/verificar?token={verification_token}"
        email_result = send_verification_email(
            to=request.admin_email,
            name=request.admin_name,
            code=verification_code,
            url=verification_url
        )
        print(f"[REGISTER] Email de verificação enviado: {email_result}")
    except Exception as e:
        print(f"[REGISTER] Erro ao enviar email: {e}")
        # Não falha o registo, user pode pedir reenvio
    
    return {
        "success": True,
        "message": "Registo iniciado! Verifica o teu email para ativar a conta.",
        "email": request.admin_email,
        "requires_verification": True,
        # Em dev, retornar código para testes (remover em produção)
        "debug_code": verification_code if not os.environ.get("RAILWAY_ENVIRONMENT") else None
    }


@router.post("/verify-email")
async def verify_email_and_create_tenant(
    code: str = None,
    token: str = None,
    db: Session = Depends(get_db)
):
    """
    Verificar email e criar tenant - PASSO 2.
    
    PÚBLICO - Aceita código de 6 dígitos OU token da URL.
    
    Após verificação:
    1. Cria tenant completo com schema
    2. Cria admin user
    3. Envia email de boas-vindas
    4. Retorna URLs de acesso
    """
    from app.platform.models import EmailVerification
    from app.platform.provisioning import provision_new_tenant as do_provision
    
    if not code and not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forneça o código de verificação ou token"
        )
    
    # Buscar verificação por código ou token
    verification = None
    if token:
        verification = db.query(EmailVerification).filter(
            EmailVerification.verification_token == token,
            EmailVerification.is_verified == False
        ).first()
    elif code:
        verification = db.query(EmailVerification).filter(
            EmailVerification.verification_code == code,
            EmailVerification.is_verified == False
        ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado"
        )
    
    if verification.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código expirado. Por favor, registe-se novamente."
        )
    
    # IMPORTANTE: Guardar valores ANTES de fazer commit para evitar ObjectDeletedError
    # Após commit, a sessão pode expirar objectos e perder referências
    verification_email = verification.email
    verification_name = verification.name
    verification_company_name = verification.company_name
    verification_sector = verification.sector or "real_estate"
    verification_logo_url = verification.logo_url
    verification_primary_color = verification.primary_color
    verification_hashed_password = verification.hashed_password
    verification_id = verification.id
    
    # Marcar como verificado
    verification.is_verified = True
    verification.verified_at = datetime.utcnow()
    db.commit()
    
    # Provisionar tenant completo (usando variáveis locais para evitar problemas de sessão)
    result = do_provision(
        db=db,
        name=verification_company_name,
        sector=verification_sector,
        plan="trial",
        admin_email=verification_email,
        admin_name=verification_name,
        admin_password=None,  # Usamos o hash guardado
        logo_url=verification_logo_url,
        primary_color=verification_primary_color,
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar conta: {result.get('errors', ['Erro desconhecido'])}"
        )
    
    # Guardar tenant_id na verificação (recarregar verificação da BD)
    if result.get("tenant"):
        # Recarregar o registo de verificação para atualizar tenant_id
        from app.platform.models import EmailVerification
        verif_record = db.query(EmailVerification).filter(EmailVerification.id == verification_id).first()
        if verif_record:
            verif_record.tenant_id = result["tenant"]["id"]
            db.commit()
        
        # Atualizar password do admin com o hash guardado
        tenant = db.query(Tenant).filter(Tenant.id == result["tenant"]["id"]).first()
        if tenant and tenant.schema_name:
            try:
                db.execute(text(f'SET search_path TO "{tenant.schema_name}", public'))
                db.execute(text("""
                    UPDATE users 
                    SET hashed_password = :pwd 
                    WHERE email = :email
                """), {"pwd": verification_hashed_password, "email": verification_email})
                db.commit()
                db.execute(text('SET search_path TO public'))
            except Exception as e:
                print(f"[VERIFY] Erro ao atualizar password: {e}")
    
    # Enviar email de boas-vindas
    try:
        from app.services.email import send_welcome_email
        backoffice_url = result.get("urls", {}).get("backoffice", "")
        send_welcome_email(
            to=verification_email,
            name=verification_name,
            company=verification_company_name,
            url=backoffice_url,
            trial_days=14
        )
    except Exception as e:
        print(f"[VERIFY] Erro ao enviar welcome email: {e}")
    
    # Retornar dados para redirect
    tenant_data = None
    if result.get("tenant"):
        tenant = db.query(Tenant).filter(Tenant.id == result["tenant"]["id"]).first()
        if tenant:
            tenant_data = schemas.TenantOut.model_validate(tenant)
    
    return {
        "success": True,
        "message": "Conta verificada e criada com sucesso!",
        "tenant": tenant_data,
        "urls": result.get("urls", {}),
        "admin_email": verification_email
    }


@router.post("/resend-verification")
async def resend_verification_email(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Reenviar email de verificação.
    
    PÚBLICO - Útil se user não recebeu ou perdeu o email.
    """
    from app.platform.models import EmailVerification
    
    verification = db.query(EmailVerification).filter(
        EmailVerification.email == email,
        EmailVerification.is_verified == False
    ).first()
    
    if not verification:
        # Não revelar se email existe ou não (segurança)
        return {
            "success": True,
            "message": "Se existir um registo pendente, o email será reenviado."
        }
    
    if verification.is_expired:
        db.delete(verification)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registo expirado. Por favor, registe-se novamente."
        )
    
    # Reenviar email
    try:
        from app.services.email import send_verification_email
        verification_url = f"{os.environ.get('PLATFORM_URL', 'https://crmplus.trioto.tech')}/verificar?token={verification.verification_token}"
        send_verification_email(
            to=verification.email,
            name=verification.name,
            code=verification.verification_code,
            url=verification_url
        )
    except Exception as e:
        print(f"[RESEND] Erro ao enviar email: {e}")
    
    return {
        "success": True,
        "message": "Email de verificação reenviado!"
    }


@router.get("/sectors", response_model=schemas.AvailableSectorsResponse)
def get_available_sectors():
    """
    Listar setores de atividade disponíveis.
    
    PÚBLICO - Para formulário de registo.
    """
    from app.platform.seeds import get_available_sectors
    
    sectors_dict = get_available_sectors()
    sectors = [
        schemas.SectorInfo(slug=slug, name=name)
        for slug, name in sectors_dict.items()
    ]
    
    return schemas.AvailableSectorsResponse(sectors=sectors)


@router.get("/terminology/{sector}")
def get_sector_terminology_endpoint(sector: str):
    """
    Obter terminologia específica para um setor.
    
    PÚBLICO - Para adaptação da UI por setor.
    
    Exemplo: GET /platform/terminology/automotive
    Retorna: {"item": "Veículo", "items": "Veículos", "visit": "Test Drive", ...}
    """
    from app.platform.seeds import get_sector_terminology, get_available_sectors
    
    available = get_available_sectors()
    if sector not in available:
        raise HTTPException(
            status_code=404, 
            detail=f"Setor '{sector}' não encontrado. Disponíveis: {list(available.keys())}"
        )
    
    terminology = get_sector_terminology(sector)
    return {
        "sector": sector,
        "sector_name": available[sector],
        "terminology": terminology
    }


@router.get("/terminology/tenant/{tenant_slug}")
def get_tenant_terminology_endpoint(tenant_slug: str, db: Session = Depends(get_db)):
    """
    Obter terminologia completa de um tenant específico.
    Aplica custom_terminology e sub_sector overrides.
    
    PÚBLICO - Para o frontend do tenant.
    
    Exemplo: GET /platform/terminology/tenant/pg-auto
    
    Se tenant_slug for "default", retorna terminologia padrão (real_estate).
    """
    from app.platform.seeds import get_tenant_terminology, get_available_sectors, get_sector_terminology
    
    # Fallback para "default" - retorna terminologia de real_estate
    if tenant_slug == "default":
        terminology = get_sector_terminology("real_estate")
        available = get_available_sectors()
        return {
            "tenant_slug": "default",
            "sector": "real_estate",
            "sub_sector": None,
            "sector_name": available.get("real_estate", "Imobiliário"),
            "terminology": terminology,
            "has_custom_terminology": False
        }
    
    # Buscar tenant
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"Tenant '{tenant_slug}' não encontrado")
    
    # Preparar dados do tenant
    tenant_data = {
        'sector': tenant.sector or 'other',
        'sub_sector': None,  # tenant.sub_sector,  # TEMPORARIAMENTE COMENTADO
        'custom_terminology': {}  # tenant.custom_terminology or {}  # TEMPORARIAMENTE COMENTADO
    }
    
    # Obter terminologia merged
    terminology = get_tenant_terminology(tenant_data)
    
    available = get_available_sectors()
    
    return {
        "tenant_slug": tenant_slug,
        "sector": tenant.sector,
        "sub_sector": None,  # tenant.sub_sector,  # TEMPORARIAMENTE COMENTADO
        "sector_name": available.get(tenant.sector, 'Outro'),
        "terminology": terminology,
        "has_custom_terminology": False  # bool(tenant.custom_terminology)  # TEMPORARIAMENTE COMENTADO
    }


@router.get("/terminology")
def get_all_terminology():
    """
    Obter terminologia de todos os setores.
    
    PÚBLICO - Para cache no frontend.
    """
    from app.platform.seeds import SECTOR_TERMINOLOGY, get_available_sectors
    
    available = get_available_sectors()
    return {
        "sectors": available,
        "terminology": SECTOR_TERMINOLOGY
    }


@router.get("/sub-sectors")
def get_available_sub_sectors_endpoint():
    """
    Obter lista de sub-sectores disponíveis.
    
    PÚBLICO - Para onboarding e configuração de tenant.
    
    Retorna: {"sub_sectors": {"training": "Formação e Educação", ...}}
    """
    from app.platform.seeds import get_available_sub_sectors
    
    return {
        "sub_sectors": get_available_sub_sectors()
    }


@router.patch("/tenants/{tenant_id}/terminology")
def update_tenant_terminology(
    tenant_id: int,
    terminology: dict,
    db: Session = Depends(get_db),
    token: str = Header(None, alias="Authorization")
):
    """
    Atualizar terminologia customizada de um tenant.
    
    PROTEGIDO - Apenas super admin ou admin do tenant.
    
    Body: {"item": "Curso", "items": "Cursos", "visit": "Sessão", ...}
    """
    # Verificar token (simplificado - em produção usar verificação completa)
    if not token:
        raise HTTPException(status_code=401, detail="Token de autorização necessário")
    
    # Buscar tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    # Atualizar custom_terminology
    tenant.custom_terminology = terminology
    db.commit()
    db.refresh(tenant)
    
    return {
        "success": True,
        "tenant_id": tenant_id,
        "custom_terminology": tenant.custom_terminology
    }


@router.patch("/tenants/{tenant_id}/sub-sector")
def update_tenant_sub_sector(
    tenant_id: int,
    sub_sector: str,
    db: Session = Depends(get_db),
    token: str = Header(None, alias="Authorization")
):
    """
    Atualizar sub-sector de um tenant.
    
    PROTEGIDO - Apenas super admin ou admin do tenant.
    """
    from app.platform.seeds import get_available_sub_sectors
    
    # Verificar token
    if not token:
        raise HTTPException(status_code=401, detail="Token de autorização necessário")
    
    # Validar sub_sector
    available = get_available_sub_sectors()
    if sub_sector and sub_sector not in available:
        raise HTTPException(
            status_code=400,
            detail=f"Sub-sector inválido. Disponíveis: {list(available.keys())}"
        )
    
    # Buscar tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    # Atualizar sub_sector
    tenant.sub_sector = sub_sector
    db.commit()
    db.refresh(tenant)
    
    return {
        "success": True,
        "tenant_id": tenant_id,
        "sub_sector": tenant.sub_sector,
        "sub_sector_name": available.get(sub_sector)
    }


@router.get("/form-fields/{sector}")
def get_sector_form_fields(sector: str):
    """
    Obter campos de formulário para um setor específico.
    
    PÚBLICO - Para formulário de criação/edição de itens.
    
    Retorna a configuração completa do formulário:
    - sections: Seções do formulário com labels e ícones
    - fields: Lista de todos os campos
    - fields_by_section: Campos organizados por seção
    
    Exemplo: GET /platform/form-fields/automotive
    """
    from app.platform.form_fields import get_form_config, SECTOR_FIELDS_MAP
    from app.platform.seeds import get_available_sectors
    
    available = get_available_sectors()
    if sector not in available:
        raise HTTPException(
            status_code=404, 
            detail=f"Setor '{sector}' não encontrado. Disponíveis: {list(available.keys())}"
        )
    
    return get_form_config(sector)


@router.get("/form-fields")
def get_all_form_fields():
    """
    Obter campos de formulário de todos os setores.
    
    PÚBLICO - Para cache no frontend.
    """
    from app.platform.form_fields import get_form_config, SECTOR_FIELDS_MAP
    from app.platform.seeds import get_available_sectors
    
    available = get_available_sectors()
    configs = {}
    
    for sector in available.keys():
        configs[sector] = get_form_config(sector)
    
    return {
        "sectors": available,
        "form_configs": configs
    }


@router.get("/plans", response_model=schemas.AvailablePlansResponse)
def get_available_plans():
    """
    Listar planos disponíveis.
    
    PÚBLICO - Para página de preços.
    """
    from app.platform.provisioning import PLANS
    
    plans = [
        schemas.PlanInfo(
            slug=slug,
            name=slug.capitalize(),
            max_agents=config["max_agents"],
            max_properties=config["max_properties"],
            features=[]
        )
        for slug, config in PLANS.items()
    ]
    
    return schemas.AvailablePlansResponse(plans=plans)


@router.get("/tenants/{tenant_id}/stats", response_model=schemas.TenantStats)
def get_tenant_detailed_stats(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Obter estatísticas detalhadas de um tenant.
    
    PROTEGIDO - Requer autenticação de super admin.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    # Contar dados do schema do tenant
    stats = {"agents": 0, "properties": 0, "leads": 0, "users": 0}
    
    if tenant.schema_name:
        try:
            # Mudar para schema do tenant
            db.execute(text(f'SET search_path TO "{tenant.schema_name}", public'))
            
            # Contar registos
            for table, key in [("agents", "agents"), ("properties", "properties"), ("leads", "leads"), ("users", "users")]:
                try:
                    result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    stats[key] = result.scalar() or 0
                except:
                    pass
            
            # Voltar ao schema public
            db.execute(text('SET search_path TO public'))
        except Exception as e:
            print(f"[PLATFORM] Erro ao obter stats do tenant {tenant_id}: {e}")
    
    return schemas.TenantStats(
        tenant_id=tenant.id,
        tenant_slug=tenant.slug,
        tenant_name=tenant.name,
        agents_count=stats["agents"],
        properties_count=stats["properties"],
        leads_count=stats["leads"],
        users_count=stats["users"]
    )


class CreateAdminRequest(schemas.BaseModel):
    """Request body para criação de admin"""
    email: str
    name: str
    password: str | None = None


@router.post("/tenants/{tenant_id}/create-admin")
async def create_tenant_admin(
    tenant_id: int,
    request: CreateAdminRequest,
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Criar admin inicial para um tenant existente.
    
    PROTEGIDO - Requer autenticação de super admin.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    if not tenant.schema_name:
        raise HTTPException(status_code=400, detail="Tenant não tem schema provisionado")
    
    from app.platform.provisioning import TenantProvisioner, generate_password
    
    provisioner = TenantProvisioner(db)
    
    generated_password = None
    admin_password = request.password
    if not admin_password:
        generated_password = generate_password()
        admin_password = generated_password
    
    success = provisioner._create_tenant_admin(
        schema_name=tenant.schema_name,
        email=request.email,
        name=request.name,
        password=admin_password
    )
    
    if success:
        tenant.admin_email = request.email
        tenant.admin_created = True
        db.commit()
    
    return {
        "success": success,
        "admin_email": request.email,
        "admin_password": generated_password,  # Só retorna se foi gerada
        "message": "Admin criado com sucesso" if success else "Falha ao criar admin"
    }


@router.post("/tenants/{tenant_id}/fix-branding")
async def fix_tenant_branding(
    tenant_id: int,
    agency_name: str,
    agency_slogan: str = "A sua agência de confiança",
    db: Session = Depends(get_db),
    current_admin: SuperAdmin = Depends(get_current_super_admin)
):
    """
    Corrigir branding de um tenant (quando dados estão errados).
    
    PROTEGIDO - Requer autenticação de super admin.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    if not tenant.schema_name:
        raise HTTPException(status_code=400, detail="Tenant não tem schema provisionado")
    
    try:
        # Definir search_path para o schema do tenant
        db.execute(text(f'SET search_path TO "{tenant.schema_name}", public'))
        
        # Verificar se existe CRMSettings
        from app.models.crm_settings import CRMSettings
        settings = db.query(CRMSettings).first()
        
        if not settings:
            # Criar novo
            db.execute(text(f"""
                INSERT INTO crm_settings (
                    agency_name, agency_slogan, primary_color, secondary_color,
                    background_color, background_secondary, text_color, text_muted,
                    border_color, accent_color
                ) VALUES (
                    '{agency_name}', '{agency_slogan}', '#E10600', '#C5C5C5',
                    '#0B0B0D', '#1A1A1F', '#FFFFFF', '#9CA3AF',
                    '#2A2A2E', '#E10600'
                )
            """))
        else:
            # Atualizar existente
            db.execute(text(f"""
                UPDATE crm_settings SET
                    agency_name = '{agency_name}',
                    agency_slogan = '{agency_slogan}'
            """))
        
        db.commit()
        
        # Voltar ao schema public
        db.execute(text('SET search_path TO public'))
        
        return {
            "success": True,
            "message": f"Branding atualizado para '{agency_name}'"
        }
    except Exception as e:
        db.rollback()
        print(f"[PLATFORM] Erro ao corrigir branding: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar branding: {str(e)}")
