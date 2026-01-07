"""
Endpoint temporário para executar a migração SQL diretamente
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/emergency", tags=["Emergency Fix"])

@router.post("/fix-clients-table")
def fix_clients_table(db: Session = Depends(get_db)):
    """
    Endpoint de emergência para adicionar colunas faltantes na tabela clients
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
