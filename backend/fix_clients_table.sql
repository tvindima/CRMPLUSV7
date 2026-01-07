-- Script SQL para adicionar TODAS as colunas faltantes na tabela clients
-- Pode ser executado diretamente no Railway PostgreSQL console

-- Adicionar colunas básicas
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_empresa BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_id INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_id INTEGER;

-- Adicionar colunas de dados pessoais
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cc VARCHAR(30);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cc_validade DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS naturalidade VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profissao VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS entidade_empregadora VARCHAR(255);

-- Adicionar colunas de estado civil
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS regime_casamento VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_casamento DATE;

-- Adicionar colunas do cônjuge
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nome VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nif VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_cc VARCHAR(30);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_cc_validade DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_data_nascimento DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_naturalidade VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_nacionalidade VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_profissao VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_email VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conjuge_telefone VARCHAR(50);

-- Adicionar colunas de empresa
ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_nome VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_nipc VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_sede VARCHAR(500);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_capital_social DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_conservatoria VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_matricula VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_cargo VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS empresa_poderes TEXT;

-- Adicionar colunas de morada expandidas
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero_porta VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS andar VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS localidade VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS concelho VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS distrito VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'Portugal';

-- Adicionar coluna de documentos
ALTER TABLE clients ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'::jsonb;

-- Verificar colunas adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
