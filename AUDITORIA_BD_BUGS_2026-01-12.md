# 🔍 AUDITORIA TÉCNICA - BASE DE DADOS E BUGS - CRM PLUS V7

**Data:** 12 de janeiro de 2026  
**Foco:** Colunas/Tabelas em falta no Railway, bugs e imperfeições

---

## 📊 RESUMO EXECUTIVO

| Categoria | Problemas Encontrados | Prioridade |
|-----------|----------------------|------------|
| **Migrações/BD** | 4 tabelas/colunas potencialmente em falta | 🔴 CRÍTICO |
| **TODOs Não Implementados** | 15+ pendentes no backend | 🟠 MÉDIA |
| **Console.logs em Produção** | 40+ ficheiros com logs de debug | 🟡 BAIXA |
| **Funcionalidades Incompletas** | 10+ páginas mock no backoffice | 🟠 MÉDIA |

---

## 1. 🔴 PROBLEMAS DE BASE DE DADOS (CRÍTICO)

### 1.1 Tabela `client_transacoes` - SEM MIGRAÇÃO

**Problema:** O modelo `ClientTransacao` existe em `app/models/client.py` mas **NÃO existe migração** Alembic para criar a tabela.

```python
# app/models/client.py (linha 270-318)
class ClientTransacao(Base):
    __tablename__ = "client_transacoes"
    # ... 20+ colunas
```

**Impacto:** 
- Se a tabela não existir no Railway, qualquer query a `client_transacoes` causa erro 500
- O lifespan em `main.py` tenta criar, mas pode não criar todas as colunas

**Correção Necessária:**
```bash
# Criar migração
alembic revision --autogenerate -m "add_client_transacoes_table"
alembic upgrade head
```

### 1.2 Tabela `escrituras` - SEM MIGRAÇÃO

**Problema:** O modelo `Escritura` existe em `app/models/escritura.py` mas **NÃO existe migração**.

```python
# app/models/escritura.py
class Escritura(Base):
    __tablename__ = "escrituras"
    # ... 20+ colunas
```

**Impacto:** Endpoint `/escrituras/` pode falhar se tabela não existir

**Nota:** O lifespan tenta criar a tabela no startup, mas isto não é fiável.

### 1.3 Colunas em Falta no Modelo `clients` vs Migração

O modelo `Client` tem muitas colunas que **NÃO estão na migração** `add_clients_table.py`:

| Coluna no Modelo | Na Migração? |
|------------------|--------------|
| `is_empresa` | ❌ NÃO |
| `naturalidade` | ❌ NÃO |
| `entidade_empregadora` | ❌ NÃO |
| `regime_casamento` | ❌ NÃO |
| `data_casamento` | ❌ NÃO |
| `conjuge_*` (10 colunas) | ❌ NÃO |
| `empresa_*` (8 colunas) | ❌ NÃO |
| `numero_porta` | ❌ NÃO |
| `andar` | ❌ NÃO |
| `concelho` | ❌ NÃO |
| `pais` | ❌ NÃO |
| `documentos` | ❌ NÃO |
| `preferencias` | ❌ NÃO |
| `is_verified` | ❌ NÃO |

**Impacto:** Erros ao tentar inserir/atualizar clientes com campos que não existem na BD.

### 1.4 Colunas Comentadas no Modelo `Tenant`

```python
# backend/app/platform/models.py (linhas 73-80)
# TEMPORARIAMENTE COMENTADO ATÉ MIGRATION RODAR
# sub_sector = Column(String(100), nullable=True)
# custom_terminology = Column(JSON, nullable=True)
```

**Impacto:** Sistema de terminologia personalizada por tenant não funciona.

### 1.5 Verificação Recomendada

Executar no Railway para verificar tabelas:

```sql
-- Verificar se tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'client_transacoes', 'escrituras');

-- Verificar colunas da tabela clients
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
```

---

## 2. 🟠 TODOs NÃO IMPLEMENTADOS NO BACKEND

### 2.1 Dashboard API (`app/api/dashboard.py`)

```python
# Linha 70
propostas_abertas = 12  # TODO: implementar quando tabela Proposta existir

# Linha 462
# TODO: Implementar quando criar tabela Task

# Linha 541
"user": "Sistema",  # TODO: adicionar user_id nas tabelas
```

**Impacto:** Dashboard mostra dados hardcoded/incorretos.

### 2.2 Escrituras Router (`app/routers/escrituras.py`)

```python
# Linha 287-288
# TODO: Criar evento no calendário do agente
# TODO: Enviar notificação ao backoffice
```

**Impacto:** Escrituras não criam eventos nem notificam backoffice.

### 2.3 Admin Setup (`app/api/admin_setup.py`)

```python
# Linha 231
# TODO: Remover quando backoffice tiver autenticação
```

### 2.4 Mobile Routes (`app/mobile/routes.py`)

```python
# Linha 2332
# TODO: Reativar após aplicar migração da tabela agent_site_preferences
```

---

## 3. 🟡 CONSOLE.LOGS EM PRODUÇÃO

### 3.1 Ficheiros Afetados (40+)

| Área | Ficheiros com console.log/print |
|------|--------------------------------|
| **Backend** | 15+ ficheiros (middleware, routers) |
| **Backoffice** | 20+ ficheiros (APIs, páginas) |
| **Mobile** | 15+ ficheiros (serviços) |

### 3.2 Exemplos Críticos

```python
# backend/app/middleware/tenant.py (linhas 113-146)
print(f"[TENANT DEBUG] Path: {path}")
print(f"[TENANT DEBUG] X-Tenant-Slug header: {tenant_slug}")
# ... mais 5 prints
```

```python
# backend/app/routers/contratos_mediacao.py
# DEBUG: Mostrar primeiras linhas do OCR
# DEBUG: mostrar texto para análise
```

```typescript
// backoffice/app/api/dashboard/kpis/route.ts
console.log("[KPIs] Token encontrado:", !!token);
console.log("[KPIs] Tenant slug:", tenantSlug);
```

**Impacto:** 
- Logs de produção poluídos
- Possível vazamento de informação sensível
- Performance ligeiramente impactada

**Correção:** Usar sistema de logging com níveis (DEBUG apenas em dev).

---

## 4. 🟠 FUNCIONALIDADES INCOMPLETAS NO BACKOFFICE

### 4.1 Páginas Mock (Não Conectadas ao Backend)

| Página | Estado | Código |
|--------|--------|--------|
| `/backoffice/proposals/new` | ❌ Mock | `console.log("Creating proposal:", formData)` |
| `/backoffice/marketing/new` | ❌ Mock | `console.log("Creating marketing action:", formData)` |
| `/backoffice/opportunities/new` | ❌ Mock | `console.log("Creating opportunity:", formData)` |
| `/backoffice/visits/new` | ❌ Mock | `console.log("Creating visit:", formData)` |
| `/backoffice/activities/new` | ❌ Mock | `console.log("Creating activity:", formData)` |
| `/backoffice/agenda` | ❌ Mock | `// TODO: Implementar quando endpoint existir` |
| `/backoffice/feed` | ❌ Mock | `// TODO: Implementar quando endpoint existir` |
| `/backoffice/automation` | ❌ Mock | `// TODO: construtor de fluxos` |

### 4.2 TODOs no Backoffice

```typescript
// backoffice/app/backoffice/properties/[id]/page.tsx
// TODO: carregar imagens reais (API /properties/{id}/upload)
// TODO: listar visitas quando API estiver disponível
// TODO: ligar a contactos reais
```

```typescript
// backoffice/DESIGN_FORM_AGENTE_COMPLETO.tsx
// TODO: Implementar no backoffice em app/backoffice/agentes/
```

---

## 5. 🟠 PROBLEMAS DE SEGURANÇA (LEMBRETE)

### 5.1 Já Identificados na Auditoria Anterior

| Problema | Ficheiro | Estado |
|----------|----------|--------|
| SECRET_KEY com default | `security.py:9` | ⚠️ Pendente |
| `/debug/db` exposto | `main.py:632` | ⚠️ Pendente |
| Auto-criação users admin | `security.py:91` | ⚠️ Pendente |
| CORS muito permissivo | `main.py:191` | ⚠️ Pendente |
| Sem rate limiting | - | ⚠️ Pendente |

---

## 6. 📋 PLANO DE CORREÇÃO PRIORITIZADO

### PRIORIDADE 1: Base de Dados (Urgente - 4h)

1. [ ] Criar migração para `client_transacoes`
2. [ ] Criar migração para `escrituras`
3. [ ] Adicionar colunas em falta na tabela `clients`
4. [ ] Descomentar e criar migração para `sub_sector` e `custom_terminology` em tenants
5. [ ] Verificar no Railway se todas as tabelas existem

### PRIORIDADE 2: Corrigir TODOs Críticos (8h)

1. [ ] Implementar tabela `Proposta` para dashboard
2. [ ] Implementar criação de evento em escrituras
3. [ ] Implementar notificação ao backoffice em escrituras
4. [ ] Reativar `agent_site_preferences` no mobile

### PRIORIDADE 3: Limpar Logs de Debug (2h)

1. [ ] Remover/condicionar prints no middleware tenant
2. [ ] Remover DEBUG comments nos routers
3. [ ] Substituir console.log por logger no backoffice
4. [ ] Substituir console.log por logger no mobile

### PRIORIDADE 4: Conectar Páginas Mock (16h)

1. [ ] Criar endpoints para proposals/opportunities/marketing
2. [ ] Conectar páginas do backoffice aos endpoints
3. [ ] Implementar agenda real
4. [ ] Implementar feed real

---

## 7. 📈 SCRIPT DE VERIFICAÇÃO RAILWAY

```python
#!/usr/bin/env python3
"""
Script para verificar integridade da BD no Railway
Executar: python check_db_integrity.py
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

REQUIRED_TABLES = [
    "agents", "users", "properties", "leads", "teams", "agencies",
    "visits", "events", "first_impressions", "pre_angariacoes",
    "contratos_mediacao", "clients", "client_transacoes", "escrituras",
    "tasks", "calendar_events", "refresh_tokens", "website_clients",
    "tenants", "super_admins", "platform_settings", "email_verifications",
    "crm_settings", "agent_site_preferences"
]

REQUIRED_COLUMNS = {
    "clients": [
        "is_empresa", "naturalidade", "entidade_empregadora",
        "regime_casamento", "data_casamento", "conjuge_nome",
        "empresa_nome", "documentos", "preferencias", "is_verified"
    ],
    "tenants": [
        "sector", "admin_email", "admin_created", "stripe_customer_id"
    ],
    "agents": [
        "nif", "address", "twitter", "tiktok", "license_ami"
    ],
    "first_impressions": [
        "tipo_imovel", "gps_latitude", "gps_longitude"
    ]
}

with engine.connect() as conn:
    # Check tables
    result = conn.execute(text("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
    """))
    existing_tables = {row[0] for row in result}
    
    print("=== TABELAS ===")
    for table in REQUIRED_TABLES:
        status = "✅" if table in existing_tables else "❌ FALTA"
        print(f"{status} {table}")
    
    # Check columns
    print("\n=== COLUNAS ===")
    for table, columns in REQUIRED_COLUMNS.items():
        if table not in existing_tables:
            print(f"⏭️ Tabela {table} não existe, pulando verificação de colunas")
            continue
            
        result = conn.execute(text(f"""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = '{table}'
        """))
        existing_cols = {row[0] for row in result}
        
        print(f"\n{table}:")
        for col in columns:
            status = "✅" if col in existing_cols else "❌ FALTA"
            print(f"  {status} {col}")

print("\n=== VERIFICAÇÃO CONCLUÍDA ===")
```

---

## 8. ANEXO: LISTA DE FICHEIROS A VERIFICAR/CORRIGIR

### Migrações a Criar

```
backend/alembic/versions/
├── CRIAR: 20260112_add_client_transacoes.py
├── CRIAR: 20260112_add_escrituras.py
├── CRIAR: 20260112_add_missing_clients_columns.py
└── CRIAR: 20260112_add_tenant_terminology.py
```

### Ficheiros com Logs para Limpar

```
backend/app/middleware/tenant.py
backend/app/routers/contratos_mediacao.py
backend/app/routers/first_impressions.py
backend/app/mobile/routes.py

backoffice/app/api/dashboard/kpis/route.ts
backoffice/app/api/auth/login/route.ts
backoffice/app/api/clients/route.ts
backoffice/src/services/backofficeApi.ts

mobile/app/src/services/auth.ts
mobile/app/src/services/api.ts
mobile/app/src/services/*.ts
```

---

*Relatório gerado automaticamente - Auditoria Técnica CRM PLUS V7*
*Data: 12 de janeiro de 2026*
