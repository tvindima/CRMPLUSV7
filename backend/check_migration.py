"""
Script para verificar se todas as colunas da tabela clients existem
"""
import os
from sqlalchemy import create_engine, inspect, text

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    print("❌ DATABASE_URL não configurada")
    exit(1)

# Create engine
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print("🔍 Verificando estrutura da tabela 'clients'...")

# Check if table exists
if 'clients' not in inspector.get_table_names():
    print("❌ Tabela 'clients' não existe!")
    exit(1)

print("✅ Tabela 'clients' existe")

# Expected columns
expected_columns = [
    'id', 'agent_id', 'agency_id', 'nome', 'client_type', 'origin', 'is_empresa',
    'nif', 'cc', 'cc_validade', 'data_nascimento', 'naturalidade', 'nacionalidade',
    'profissao', 'entidade_empregadora', 'estado_civil', 'regime_casamento', 'data_casamento',
    'conjuge_nome', 'conjuge_nif', 'conjuge_cc', 'conjuge_cc_validade', 'conjuge_data_nascimento',
    'conjuge_naturalidade', 'conjuge_nacionalidade', 'conjuge_profissao', 'conjuge_email', 'conjuge_telefone',
    'empresa_nome', 'empresa_nipc', 'empresa_sede', 'empresa_capital_social', 'empresa_conservatoria',
    'empresa_matricula', 'empresa_cargo', 'empresa_poderes',
    'email', 'telefone', 'telefone_alt',
    'morada', 'numero_porta', 'andar', 'codigo_postal', 'localidade', 'concelho', 'distrito', 'pais',
    'documentos', 'notas', 'tags', 'preferencias',
    'angariacao_id', 'property_id', 'lead_id',
    'is_active', 'is_verified', 'created_at', 'updated_at',
    'ultima_interacao', 'proxima_acao', 'proxima_acao_data'
]

# Get actual columns
columns = [col['name'] for col in inspector.get_columns('clients')]

print(f"\n📊 Total de colunas encontradas: {len(columns)}")
print(f"📊 Total de colunas esperadas: {len(expected_columns)}")

# Check missing columns
missing = set(expected_columns) - set(columns)
if missing:
    print(f"\n⚠️  Colunas FALTANDO ({len(missing)}):")
    for col in sorted(missing):
        print(f"   - {col}")
else:
    print("\n✅ Todas as colunas esperadas estão presentes!")

# Check extra columns
extra = set(columns) - set(expected_columns)
if extra:
    print(f"\n📦 Colunas extras ({len(extra)}):")
    for col in sorted(extra):
        print(f"   + {col}")

print("\n" + "="*60)
if not missing:
    print("✅ Estrutura da tabela está CORRETA!")
else:
    print("❌ Estrutura da tabela está INCOMPLETA - executar migração!")
    print("   Comando: alembic upgrade head")

