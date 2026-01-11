"""
Endpoint temporário para executar a migração SQL diretamente
PROTEGIDO - Requer header X-Admin-Key
"""
import os
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/emergency", tags=["Emergency Fix"])

# Chave de admin para proteger endpoints sensíveis
ADMIN_SETUP_KEY = os.environ.get("ADMIN_SETUP_KEY", "dev_admin_key_change_in_production")


def verify_admin_key(x_admin_key: str = Header(..., description="Chave de administração")):
    """Verificar chave de admin para acesso a endpoints protegidos."""
    if x_admin_key != ADMIN_SETUP_KEY:
        raise HTTPException(status_code=403, detail="Chave de administração inválida")
    return True


@router.post("/fix-clients-table")
def fix_clients_table(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Endpoint de emergência para adicionar colunas faltantes na tabela clients
    PROTEGIDO - Requer header: X-Admin-Key
    """
    sql_statements = [
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_empresa BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_id INTEGER;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_id INTEGER;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS cc VARCHAR(30);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS cc_validade DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_nascimento DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(100);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS profissao VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS entidade_empregadora VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_casamento VARCHAR(50);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_casamento DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nome VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nif VARCHAR(20);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_cc VARCHAR(30);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_cc_validade DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_data_nascimento DATE;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_naturalidade VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nacionalidade VARCHAR(100);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_profissao VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_email VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_telefone VARCHAR(50);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_nome VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_nipc VARCHAR(20);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_sede VARCHAR(500);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_capital_social DECIMAL(15, 2);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_conservatoria VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_matricula VARCHAR(50);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_cargo VARCHAR(100);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_poderes TEXT;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero_porta VARCHAR(20);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS andar VARCHAR(20);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS localidade VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS concelho VARCHAR(255);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS distrito VARCHAR(100);",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'Portugal';",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'::jsonb;",
    ]
    
    results = []
    for i, sql in enumerate(sql_statements, 1):
        try:
            db.execute(text(sql))
            db.commit()
            results.append(f"✅ {i}/{len(sql_statements)}")
        except Exception as e:
            results.append(f"⚠️ {i}/{len(sql_statements)}: {str(e)}")
    
    # Verificar colunas
    result = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        ORDER BY ordinal_position
    """))
    columns = [row[0] for row in result]
    
    return {
        "status": "completed",
        "total_commands": len(sql_statements),
        "results": results,
        "total_columns": len(columns),
        "columns": columns
    }


@router.post("/add-missing-columns")
def add_missing_columns(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Adicionar colunas que faltaram: preferencias e is_verified
    PROTEGIDO - Requer header: X-Admin-Key
    """
    sql_statements = [
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferencias JSONB DEFAULT '{}'::jsonb;",
        "ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;",
    ]
    
    results = []
    for i, sql in enumerate(sql_statements, 1):
        try:
            db.execute(text(sql))
            db.commit()
            results.append(f"✅ {i}/{len(sql_statements)}: Coluna adicionada")
        except Exception as e:
            results.append(f"⚠️ {i}/{len(sql_statements)}: {str(e)}")
    
    # Verificar se as colunas existem agora
    result = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name IN ('preferencias', 'is_verified')
        ORDER BY column_name
    """))
    columns = [row[0] for row in result]
    
    return {
        "status": "completed",
        "total_commands": len(sql_statements),
        "results": results,
        "columns_added": columns,
        "message": "Agora pode criar o cliente!"
    }


@router.post("/fix-tenant-branding/{tenant_slug}")
def fix_tenant_branding(
    tenant_slug: str,
    agency_name: str,
    agency_slogan: str = "A sua imobiliária de confiança",
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_key)
):
    """
    Corrigir branding de um tenant específico.
    PROTEGIDO - Requer header: X-Admin-Key
    """
    from app.platform.models import Tenant
    from app.database import engine
    
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"Tenant '{tenant_slug}' não encontrado")
    
    if not tenant.schema_name:
        raise HTTPException(status_code=400, detail="Tenant não tem schema provisionado")
    
    try:
        # Usar conexão isolada para evitar contaminar outras queries
        with engine.connect() as conn:
            # Definir search_path para o schema do tenant
            conn.execute(text(f'SET search_path TO "{tenant.schema_name}", public'))
            
            # Verificar se existe CRMSettings
            result = conn.execute(text("SELECT COUNT(*) FROM crm_settings"))
            count = result.scalar()
            
            if count == 0:
                # Criar novo
                conn.execute(text("""
                    INSERT INTO crm_settings (
                        agency_name, agency_slogan, primary_color, secondary_color,
                        background_color, background_secondary, text_color, text_muted,
                        border_color, accent_color
                    ) VALUES (
                        :agency_name, :agency_slogan, '#E10600', '#C5C5C5',
                        '#0B0B0D', '#1A1A1F', '#FFFFFF', '#9CA3AF',
                        '#2A2A2E', '#E10600'
                    )
                """), {"agency_name": agency_name, "agency_slogan": agency_slogan})
            else:
                # Atualizar existente
                conn.execute(text("""
                    UPDATE crm_settings SET
                        agency_name = :agency_name,
                        agency_slogan = :agency_slogan
                """), {"agency_name": agency_name, "agency_slogan": agency_slogan})
            
            conn.commit()
            
            # Verificar resultado
            result = conn.execute(text("SELECT agency_name, agency_slogan FROM crm_settings"))
            row = result.first()
        
        return {
            "success": True,
            "tenant": tenant_slug,
            "schema": tenant.schema_name,
            "agency_name": row[0] if row else agency_name,
            "agency_slogan": row[1] if row else agency_slogan,
            "message": f"Branding atualizado para '{agency_name}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar branding: {str(e)}")
