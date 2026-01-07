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
