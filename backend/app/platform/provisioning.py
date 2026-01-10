"""
Provisioning Service - Criação automática de tenants

Este módulo gere o processo completo de criação de um novo tenant:
1. Criar registo na tabela tenants
2. Criar schema PostgreSQL isolado
3. Copiar estrutura de tabelas
4. Aplicar seeds por setor
5. Criar admin inicial do tenant
6. Enviar email de boas-vindas
"""

import os
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
import bcrypt

from app.database import create_tenant_schema, copy_tables_to_schema, set_tenant_schema
from app.platform.models import Tenant


# ===========================================
# CONFIGURAÇÕES
# ===========================================

TRIAL_DAYS = 14
DEFAULT_MAX_AGENTS = 5
DEFAULT_MAX_PROPERTIES = 50

# Planos disponíveis
PLANS = {
    "trial": {"max_agents": 3, "max_properties": 25, "days": 14},
    "basic": {"max_agents": 5, "max_properties": 100, "days": None},
    "pro": {"max_agents": 20, "max_properties": 500, "days": None},
    "enterprise": {"max_agents": 100, "max_properties": 10000, "days": None},
}

# Setores de atividade suportados
SECTORS = {
    "real_estate": "Imobiliário",
    "automotive": "Automóvel",
    "services": "Serviços",
    "retail": "Retalho",
    "hospitality": "Hotelaria",
    "other": "Outro",
}


# ===========================================
# HELPERS
# ===========================================

def generate_slug(name: str) -> str:
    """
    Gera um slug único a partir do nome da empresa.
    Ex: "Imóveis Mais Leiria" -> "imoveis-mais-leiria"
    """
    import re
    import unicodedata
    
    # Normalizar unicode (remover acentos)
    name = unicodedata.normalize('NFKD', name)
    name = name.encode('ASCII', 'ignore').decode('ASCII')
    
    # Converter para minúsculas e substituir espaços
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    
    return slug


def generate_password(length: int = 12) -> str:
    """Gera uma password segura aleatória."""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def hash_password(password: str) -> str:
    """Hash password com bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def generate_verification_token() -> str:
    """Gera um token único para verificação de email."""
    return secrets.token_urlsafe(32)


# ===========================================
# PROVISIONING PRINCIPAL
# ===========================================

class TenantProvisioner:
    """
    Classe responsável pelo provisionamento completo de um tenant.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.errors: list = []
        self.logs: list = []
    
    def log(self, message: str):
        """Adiciona mensagem ao log."""
        timestamp = datetime.utcnow().isoformat()
        self.logs.append(f"[{timestamp}] {message}")
        print(f"[PROVISIONING] {message}")
    
    def error(self, message: str):
        """Adiciona erro à lista."""
        self.errors.append(message)
        self.log(f"❌ ERROR: {message}")
    
    def provision_tenant(
        self,
        name: str,
        sector: str = "real_estate",
        plan: str = "trial",
        admin_email: Optional[str] = None,
        admin_name: Optional[str] = None,
        admin_password: Optional[str] = None,
        primary_domain: Optional[str] = None,
        backoffice_domain: Optional[str] = None,
        logo_url: Optional[str] = None,
        primary_color: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Provisiona um novo tenant completo.
        
        Args:
            name: Nome da empresa
            sector: Setor de atividade
            plan: Plano escolhido
            admin_email: Email do admin inicial
            admin_name: Nome do admin inicial
            admin_password: Password do admin (gerada se não fornecida)
            primary_domain: Domínio principal (opcional)
            backoffice_domain: Domínio do backoffice (opcional)
            logo_url: URL do logo (opcional)
            primary_color: Cor primária (opcional)
        
        Returns:
            Dict com resultado do provisionamento
        """
        self.log(f"Iniciando provisionamento para: {name}")
        
        # 1. Gerar slug único
        base_slug = generate_slug(name)
        slug = self._ensure_unique_slug(base_slug)
        self.log(f"Slug gerado: {slug}")
        
        # 2. Obter limites do plano
        plan_config = PLANS.get(plan, PLANS["basic"])
        
        # 3. Criar registo do tenant
        tenant = Tenant(
            slug=slug,
            name=name,
            sector=sector,
            plan=plan,
            max_agents=plan_config["max_agents"],
            max_properties=plan_config["max_properties"],
            is_trial=(plan == "trial"),
            trial_ends_at=datetime.utcnow() + timedelta(days=plan_config["days"]) if plan_config["days"] else None,
            status="pending",
            primary_domain=primary_domain,
            backoffice_domain=backoffice_domain,
            logo_url=logo_url,
            primary_color=primary_color,
            admin_email=admin_email,
        )
        
        self.db.add(tenant)
        self.db.commit()
        self.db.refresh(tenant)
        self.log(f"Tenant criado na BD com ID: {tenant.id}")
        
        # 4. Criar schema PostgreSQL
        schema_name = f"tenant_{slug}"
        try:
            tenant.status = "provisioning"
            self.db.commit()
            
            schema_created = create_tenant_schema(self.db, schema_name)
            if schema_created:
                self.log(f"Schema '{schema_name}' criado")
            else:
                self.log(f"Schema '{schema_name}' já existia")
            
            tenant.schema_name = schema_name
            self.db.commit()
        except Exception as e:
            self.error(f"Falha ao criar schema: {e}")
            tenant.status = "failed"
            tenant.provisioning_error = str(e)
            tenant.failed_at = datetime.utcnow()
            self.db.commit()
            return self._build_result(tenant, success=False)
        
        # 5. Copiar estrutura de tabelas
        try:
            result = copy_tables_to_schema(self.db, schema_name)
            self.log(f"Tabelas copiadas: {len(result.get('created', []))}")
            if result.get("errors"):
                for err in result["errors"]:
                    self.log(f"⚠️ Aviso ao copiar tabela: {err}")
        except Exception as e:
            self.error(f"Falha ao copiar tabelas: {e}")
            tenant.status = "failed"
            tenant.provisioning_error = str(e)
            tenant.failed_at = datetime.utcnow()
            self.db.commit()
            return self._build_result(tenant, success=False)
        
        # 6. Aplicar seeds do setor
        try:
            self._apply_sector_seeds(schema_name, sector)
            self.log(f"Seeds do setor '{sector}' aplicados")
        except Exception as e:
            self.log(f"⚠️ Aviso ao aplicar seeds: {e}")
            # Não falha o provisioning por causa de seeds
        
        # 7. Criar admin inicial (se fornecido)
        admin_created = False
        generated_password = None
        
        if admin_email:
            try:
                if not admin_password:
                    generated_password = generate_password()
                    admin_password = generated_password
                
                admin_created = self._create_tenant_admin(
                    schema_name=schema_name,
                    email=admin_email,
                    name=admin_name or "Administrador",
                    password=admin_password
                )
                
                if admin_created:
                    tenant.admin_created = True
                    self.db.commit()
                    self.log(f"Admin '{admin_email}' criado")
            except Exception as e:
                self.error(f"Falha ao criar admin: {e}")
                # Não falha o provisioning por causa do admin
        
        # 8. Marcar como pronto
        tenant.status = "ready"
        tenant.provisioned_at = datetime.utcnow()
        tenant.provisioning_error = None
        tenant.failed_at = None
        self.db.commit()
        self.db.refresh(tenant)
        
        self.log(f"✅ Provisionamento concluído com sucesso!")
        
        return self._build_result(
            tenant,
            success=True,
            admin_email=admin_email,
            admin_password=generated_password,  # Só retorna se foi gerada
            admin_created=admin_created
        )
    
    def _ensure_unique_slug(self, base_slug: str) -> str:
        """Garante que o slug é único, adicionando sufixo se necessário."""
        slug = base_slug
        counter = 1
        
        while self.db.query(Tenant).filter(Tenant.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug
    
    def _apply_sector_seeds(self, schema_name: str, sector: str):
        """Aplica dados iniciais específicos do setor."""
        from app.platform.seeds import get_sector_seeds
        
        seeds = get_sector_seeds(sector)
        if not seeds:
            self.log(f"Sem seeds para o setor '{sector}'")
            return
        
        # Mudar para o schema do tenant
        self.db.execute(text(f'SET search_path TO "{schema_name}", public'))
        
        # Aplicar seeds de configurações
        if "settings" in seeds:
            self._apply_settings_seed(seeds["settings"])
        
        # Aplicar seeds de categorias/tipos
        if "categories" in seeds:
            self._apply_categories_seed(seeds["categories"])
        
        # Aplicar seeds de estágios de pipeline
        if "stages" in seeds:
            self._apply_stages_seed(seeds["stages"])
        
        self.db.commit()
        
        # Voltar ao schema public
        self.db.execute(text('SET search_path TO public'))
    
    def _apply_settings_seed(self, settings: dict):
        """Aplica configurações iniciais."""
        try:
            # Inserir na tabela crm_settings se existir
            self.db.execute(text("""
                INSERT INTO crm_settings (agency_name, primary_color, secondary_color)
                VALUES (:name, :primary, :secondary)
                ON CONFLICT DO NOTHING
            """), {
                "name": settings.get("agency_name", "Nova Agência"),
                "primary": settings.get("primary_color", "#E10600"),
                "secondary": settings.get("secondary_color", "#C5C5C5"),
            })
        except Exception as e:
            self.log(f"⚠️ Não foi possível aplicar settings: {e}")
    
    def _apply_categories_seed(self, categories: list):
        """Aplica categorias iniciais."""
        # Implementar conforme estrutura da tabela de categorias
        pass
    
    def _apply_stages_seed(self, stages: list):
        """Aplica estágios de pipeline."""
        # Implementar conforme estrutura da tabela de estágios
        pass
    
    def _create_tenant_admin(
        self,
        schema_name: str,
        email: str,
        name: str,
        password: str
    ) -> bool:
        """
        Cria o admin inicial do tenant no schema correto.
        """
        password_hash = hash_password(password)
        
        # Mudar para o schema do tenant (usar aspas para schemas com hífen)
        self.db.execute(text(f'SET search_path TO "{schema_name}", public'))
        
        try:
            # Verificar se tabela users existe
            result = self.db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = :schema AND table_name = 'users'
                )
            """), {"schema": schema_name})
            
            if not result.scalar():
                self.log("Tabela users não existe no schema")
                return False
            
            # Criar user admin (full_name e hashed_password são os nomes corretos das colunas)
            self.db.execute(text("""
                INSERT INTO users (email, hashed_password, full_name, role, is_active)
                VALUES (:email, :password_hash, :name, 'admin', true)
                ON CONFLICT (email) DO NOTHING
            """), {
                "email": email,
                "password_hash": password_hash,
                "name": name,
            })
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.log(f"Erro ao criar admin: {e}")
            self.db.rollback()
            return False
        finally:
            # Voltar ao schema public
            self.db.execute(text('SET search_path TO public'))
    
    def _build_result(
        self,
        tenant: Tenant,
        success: bool,
        admin_email: Optional[str] = None,
        admin_password: Optional[str] = None,
        admin_created: bool = False
    ) -> Dict[str, Any]:
        """Constrói o resultado do provisionamento."""
        # URLs padrão para trials (wildcard domains)
        # Tenants com domínio próprio têm os valores em primary_domain e backoffice_domain
        # Padrão: bo-slug.crmplus.trioto.tech (backoffice) e slug.crmplus.trioto.tech (site)
        backoffice_url = tenant.backoffice_domain or f"bo-{tenant.slug}.crmplus.trioto.tech"
        site_url = tenant.primary_domain or f"{tenant.slug}.crmplus.trioto.tech"
        
        return {
            "success": success,
            "tenant": {
                "id": tenant.id,
                "slug": tenant.slug,
                "name": tenant.name,
                "status": tenant.status,
                "schema_name": tenant.schema_name,
                "plan": tenant.plan,
                "sector": tenant.sector,
            },
            "admin": {
                "email": admin_email,
                "password": admin_password,  # Apenas se foi gerada
                "created": admin_created,
            } if admin_email else None,
            "urls": {
                "backoffice": f"https://{backoffice_url}",
                "site": f"https://{site_url}",
                "api": "https://crmplusv7-production.up.railway.app",
            },
            "logs": self.logs,
            "errors": self.errors,
        }


# ===========================================
# FUNÇÕES DE CONVENIÊNCIA
# ===========================================

def provision_new_tenant(
    db: Session,
    name: str,
    sector: str = "real_estate",
    plan: str = "trial",
    admin_email: Optional[str] = None,
    admin_name: Optional[str] = None,
    admin_password: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Função de conveniência para provisionar um novo tenant.
    """
    provisioner = TenantProvisioner(db)
    return provisioner.provision_tenant(
        name=name,
        sector=sector,
        plan=plan,
        admin_email=admin_email,
        admin_name=admin_name,
        admin_password=admin_password,
        **kwargs
    )


def retry_provisioning(db: Session, tenant_id: int) -> Dict[str, Any]:
    """
    Tenta re-provisionar um tenant que falhou.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        return {"success": False, "error": "Tenant não encontrado"}
    
    if tenant.status not in ("pending", "failed"):
        return {"success": False, "error": f"Tenant está em estado '{tenant.status}'"}
    
    provisioner = TenantProvisioner(db)
    
    # Re-executar apenas as etapas que falharam
    schema_name = f"tenant_{tenant.slug}"
    
    try:
        tenant.status = "provisioning"
        tenant.provisioning_error = None
        db.commit()
        
        # Criar/verificar schema
        create_tenant_schema(db, schema_name)
        tenant.schema_name = schema_name
        
        # Copiar tabelas
        copy_tables_to_schema(db, schema_name)
        
        # Aplicar seeds
        provisioner._apply_sector_seeds(schema_name, tenant.sector or "real_estate")
        
        # Marcar como pronto
        tenant.status = "ready"
        tenant.provisioned_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "tenant_id": tenant.id,
            "status": "ready"
        }
        
    except Exception as e:
        tenant.status = "failed"
        tenant.provisioning_error = str(e)
        tenant.failed_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": False,
            "error": str(e),
            "tenant_id": tenant.id
        }
