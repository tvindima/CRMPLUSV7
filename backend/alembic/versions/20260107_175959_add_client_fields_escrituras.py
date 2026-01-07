"""add client fields escrituras

Revision ID: 20260107_175959
Revises: 
Create Date: 2026-01-07 17:59:59.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260107_175959'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar colunas que podem estar faltando na tabela clients
    
    # Verificar e adicionar is_empresa se não existir
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='is_empresa') THEN
                ALTER TABLE clients ADD COLUMN is_empresa BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
    """)
    
    # Verificar e adicionar property_id se não existir
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='property_id') THEN
                ALTER TABLE clients ADD COLUMN property_id INTEGER;
            END IF;
        END $$;
    """)
    
    # Verificar e adicionar lead_id se não existir
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='lead_id') THEN
                ALTER TABLE clients ADD COLUMN lead_id INTEGER;
            END IF;
        END $$;
    """)
    
    # Adicionar colunas de dados pessoais
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='cc') THEN
                ALTER TABLE clients ADD COLUMN cc VARCHAR(30);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='cc_validade') THEN
                ALTER TABLE clients ADD COLUMN cc_validade DATE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='data_nascimento') THEN
                ALTER TABLE clients ADD COLUMN data_nascimento DATE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='naturalidade') THEN
                ALTER TABLE clients ADD COLUMN naturalidade VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='nacionalidade') THEN
                ALTER TABLE clients ADD COLUMN nacionalidade VARCHAR(100);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='profissao') THEN
                ALTER TABLE clients ADD COLUMN profissao VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='entidade_empregadora') THEN
                ALTER TABLE clients ADD COLUMN entidade_empregadora VARCHAR(255);
            END IF;
        END $$;
    """)
    
    # Adicionar colunas de estado civil
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='estado_civil') THEN
                ALTER TABLE clients ADD COLUMN estado_civil VARCHAR(50);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='regime_casamento') THEN
                ALTER TABLE clients ADD COLUMN regime_casamento VARCHAR(50);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='data_casamento') THEN
                ALTER TABLE clients ADD COLUMN data_casamento DATE;
            END IF;
        END $$;
    """)
    
    # Adicionar colunas do cônjuge
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_nome') THEN
                ALTER TABLE clients ADD COLUMN conjuge_nome VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_nif') THEN
                ALTER TABLE clients ADD COLUMN conjuge_nif VARCHAR(20);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_cc') THEN
                ALTER TABLE clients ADD COLUMN conjuge_cc VARCHAR(30);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_cc_validade') THEN
                ALTER TABLE clients ADD COLUMN conjuge_cc_validade DATE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_data_nascimento') THEN
                ALTER TABLE clients ADD COLUMN conjuge_data_nascimento DATE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_naturalidade') THEN
                ALTER TABLE clients ADD COLUMN conjuge_naturalidade VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_nacionalidade') THEN
                ALTER TABLE clients ADD COLUMN conjuge_nacionalidade VARCHAR(100);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_profissao') THEN
                ALTER TABLE clients ADD COLUMN conjuge_profissao VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_email') THEN
                ALTER TABLE clients ADD COLUMN conjuge_email VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='conjuge_telefone') THEN
                ALTER TABLE clients ADD COLUMN conjuge_telefone VARCHAR(50);
            END IF;
        END $$;
    """)
    
    # Adicionar colunas de empresa
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='empresa_nome') THEN
                ALTER TABLE clients ADD COLUMN empresa_nome VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='empresa_nipc') THEN
                ALTER TABLE clients ADD COLUMN empresa_nipc VARCHAR(20);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='empresa_sede') THEN
                ALTER TABLE clients ADD COLUMN empresa_sede VARCHAR(500);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='empresa_capital_social') THEN
                ALTER TABLE clients ADD COLUMN empresa_capital_social DECIMAL(15, 2);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='empresa_conservatoria') THEN
                ALTER TABLE clients ADD COLUMN empresa_conservatoria VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='empresa_matricula') THEN
                ALTER TABLE clients ADD COLUMN empresa_matricula VARCHAR(50);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='empresa_cargo') THEN
                ALTER TABLE clients ADD COLUMN empresa_cargo VARCHAR(100);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='empresa_poderes') THEN
                ALTER TABLE clients ADD COLUMN empresa_poderes TEXT;
            END IF;
        END $$;
    """)
    
    # Adicionar colunas de morada expandidas
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='numero_porta') THEN
                ALTER TABLE clients ADD COLUMN numero_porta VARCHAR(20);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='andar') THEN
                ALTER TABLE clients ADD COLUMN andar VARCHAR(20);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='localidade') THEN
                ALTER TABLE clients ADD COLUMN localidade VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='concelho') THEN
                ALTER TABLE clients ADD COLUMN concelho VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='distrito') THEN
                ALTER TABLE clients ADD COLUMN distrito VARCHAR(100);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='pais') THEN
                ALTER TABLE clients ADD COLUMN pais VARCHAR(100) DEFAULT 'Portugal';
            END IF;
        END $$;
    """)
    
    # Adicionar coluna de documentos se não existir
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='clients' AND column_name='documentos') THEN
                ALTER TABLE clients ADD COLUMN documentos JSONB DEFAULT '[]'::jsonb;
            END IF;
        END $$;
    """)


def downgrade():
    # Não remover colunas para evitar perda de dados
    pass
