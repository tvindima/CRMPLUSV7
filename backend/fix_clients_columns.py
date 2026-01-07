"""
Script para adicionar colunas faltantes na tabela clients
Executa SQL direto para garantir que as colunas são criadas
"""
import os
import sys
from sqlalchemy import create_engine, text

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    print("❌ DATABASE_URL não configurada")
    sys.exit(1)

print("🔧 Conectando ao banco de dados...")
engine = create_engine(DATABASE_URL)

sql_statements = [
    # Colunas básicas
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_empresa BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_id INTEGER;",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_id INTEGER;",
    
    # Dados pessoais
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS cc VARCHAR(30);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS cc_validade DATE;",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_nascimento DATE;",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(255);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(100);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS profissao VARCHAR(255);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS entidade_empregadora VARCHAR(255);",
    
    # Estado civil
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_casamento VARCHAR(50);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_casamento DATE;",
    
    # Cônjuge
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
    
    # Empresa
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_nome VARCHAR(255);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_nipc VARCHAR(20);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_sede VARCHAR(500);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_capital_social DECIMAL(15, 2);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_conservatoria VARCHAR(255);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_matricula VARCHAR(50);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_cargo VARCHAR(100);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_poderes TEXT;",
    
    # Morada
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero_porta VARCHAR(20);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS andar VARCHAR(20);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS localidade VARCHAR(255);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS concelho VARCHAR(255);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS distrito VARCHAR(100);",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'Portugal';",
    
    # Documentos
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'::jsonb;",
]

print(f"📦 Executando {len(sql_statements)} comandos SQL...")

try:
    with engine.connect() as conn:
        for i, sql in enumerate(sql_statements, 1):
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"  ✅ {i}/{len(sql_statements)}")
            except Exception as e:
                print(f"  ⚠️  {i}/{len(sql_statements)}: {e}")
    
    print("\n✅ Migração concluída com sucesso!")
    print("🔍 Verificando colunas...")
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'clients' 
            ORDER BY ordinal_position
        """))
        columns = [row[0] for row in result]
        print(f"\n📊 Total de colunas na tabela: {len(columns)}")
        
except Exception as e:
    print(f"\n❌ Erro ao executar migração: {e}")
    sys.exit(1)
