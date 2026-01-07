# Proposta Técnica: Sistema de Migrations Multi-Tenant

**Data**: 7 Janeiro 2026  
**Versão**: 1.0  
**Status**: Proposta para revisão

---

## 1. Contexto e Problema

### Situação Actual
- Cada tenant tem um schema PostgreSQL isolado (`tenant_{slug}`)
- Schemas são criados por "clone" do `public` com `LIKE ... INCLUDING ALL`
- **Problema crítico**: Não há mecanismo para aplicar alterações DDL a schemas existentes
- Risco de **drift**: schemas de tenants antigos ficam desactualizados

### Requisitos
1. Aplicar migrations de forma determinística e auditável
2. Tracking de versão por tenant (saber quem está outdated)
3. Falhas isoladas (tenant A pode falhar sem afectar B)
4. Rollback possível por tenant
5. Dashboard de visibilidade

---

## 2. Arquitectura Proposta: Alembic Multi-Schema

### 2.1 Modelo de Dados

```sql
-- Tabela global de tracking (schema public)
CREATE TABLE tenant_schema_versions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    tenant_slug VARCHAR(50) NOT NULL,
    schema_name VARCHAR(100) NOT NULL,
    current_revision VARCHAR(100),
    target_revision VARCHAR(100),
    migration_status VARCHAR(20) DEFAULT 'pending', -- pending, running, success, failed
    last_migration_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id)
);

CREATE INDEX ix_tenant_schema_versions_status ON tenant_schema_versions(migration_status);
```

### 2.2 Fluxo de Migration

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION RUNNER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Ler tenants com status='ready'                              │
│  2. Para cada tenant:                                            │
│     ├─ Adquirir advisory lock (pg_try_advisory_lock)            │
│     ├─ Se lock falhou → skip (outro processo está a migrar)     │
│     ├─ Verificar current_revision vs target_revision            │
│     ├─ Se igual → skip (já actualizado)                         │
│     ├─ SET search_path TO tenant_schema                         │
│     ├─ Aplicar migrations pendentes                              │
│     ├─ Actualizar tenant_schema_versions                         │
│     └─ Libertar lock                                             │
│  3. Retornar relatório                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Locking Strategy

```python
# Advisory locks PostgreSQL por tenant_id
# Garante que apenas um processo migra um tenant de cada vez

LOCK_NAMESPACE = 12345  # Namespace arbitrário para migrations

def acquire_tenant_lock(db: Session, tenant_id: int) -> bool:
    """Tenta adquirir lock para migrar tenant. Non-blocking."""
    result = db.execute(text(
        "SELECT pg_try_advisory_lock(:namespace, :tenant_id)"
    ), {"namespace": LOCK_NAMESPACE, "tenant_id": tenant_id})
    return result.scalar()

def release_tenant_lock(db: Session, tenant_id: int):
    """Liberta lock do tenant."""
    db.execute(text(
        "SELECT pg_advisory_unlock(:namespace, :tenant_id)"
    ), {"namespace": LOCK_NAMESPACE, "tenant_id": tenant_id})
```

### 2.4 Aplicação de Migrations

```python
def run_tenant_migrations(db: Session, tenant: Tenant, target_revision: str = "head") -> dict:
    """
    Aplica migrations a um tenant específico.
    
    Returns:
        {
            "success": bool,
            "previous_revision": str,
            "current_revision": str,
            "migrations_applied": list[str],
            "error": str | None
        }
    """
    schema_name = tenant.schema_name
    
    # 1. Adquirir lock
    if not acquire_tenant_lock(db, tenant.id):
        return {"success": False, "error": "Lock não disponível - outro processo em execução"}
    
    try:
        # 2. Registar início
        update_migration_status(db, tenant.id, 'running')
        
        # 3. Configurar Alembic para este schema
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)
        
        # 4. SET search_path
        db.execute(text(f"SET search_path TO {schema_name}, public"))
        
        # 5. Criar alembic_version no schema se não existir
        db.execute(text(f"""
            CREATE TABLE IF NOT EXISTS {schema_name}.alembic_version (
                version_num VARCHAR(32) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            )
        """))
        
        # 6. Obter revisão actual
        result = db.execute(text(f"SELECT version_num FROM {schema_name}.alembic_version"))
        current = result.scalar()
        
        # 7. Aplicar migrations
        # Usa command.upgrade com script location apontando para o schema
        with db.begin_nested():
            command.upgrade(alembic_cfg, target_revision)
        
        # 8. Obter nova revisão
        result = db.execute(text(f"SELECT version_num FROM {schema_name}.alembic_version"))
        new_revision = result.scalar()
        
        # 9. Registar sucesso
        update_migration_status(db, tenant.id, 'success', new_revision)
        
        return {
            "success": True,
            "previous_revision": current,
            "current_revision": new_revision,
            "error": None
        }
        
    except Exception as e:
        # 10. Registar falha
        update_migration_status(db, tenant.id, 'failed', error=str(e))
        return {"success": False, "error": str(e)}
        
    finally:
        # 11. Libertar lock
        release_tenant_lock(db, tenant.id)
```

---

## 3. Gestão de Falhas

### 3.1 Falhas Isoladas

- Cada tenant é migrado independentemente
- Se tenant A falhar, tenant B continua normalmente
- Falhas são registadas em `tenant_schema_versions.last_error`

### 3.2 Estados de Migration

| Status | Descrição |
|--------|-----------|
| `pending` | Nunca migrado ou nova revision disponível |
| `running` | Migration em curso (lock adquirido) |
| `success` | Última migration bem sucedida |
| `failed` | Última migration falhou |

### 3.3 Retry Manual

```python
@router.post("/tenants/{tenant_id}/run-migrations")
async def run_tenant_migrations_endpoint(tenant_id: int, ...):
    """Retry manual de migrations para um tenant."""
    tenant = db.query(Tenant).get(tenant_id)
    result = run_tenant_migrations(db, tenant)
    return result
```

---

## 4. Dashboard de Monitorização

### 4.1 Endpoint de Status

```python
@router.get("/schema-status")
async def get_schema_status(db: Session = Depends(get_db)):
    """
    Retorna estado de todos os schemas.
    """
    # Obter revisão target (head do Alembic)
    target = get_alembic_head()
    
    tenants = db.query(Tenant).filter(Tenant.status == 'ready').all()
    versions = db.query(TenantSchemaVersion).all()
    
    return {
        "target_revision": target,
        "tenants": [
            {
                "slug": t.slug,
                "schema": t.schema_name,
                "current_revision": v.current_revision if v else None,
                "status": "outdated" if v and v.current_revision != target else "current",
                "last_migration": v.last_migration_at if v else None,
                "error": v.last_error if v and v.migration_status == 'failed' else None
            }
            for t, v in ...
        ],
        "summary": {
            "total": len(tenants),
            "current": count_current,
            "outdated": count_outdated,
            "failed": count_failed
        }
    }
```

### 4.2 UI Dashboard (super-admin)

```
┌─────────────────────────────────────────────────────────────────┐
│  Schema Status                                    Target: abc123│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ 45 tenants actualizados                                      │
│  ⚠️  3 tenants desactualizados                                   │
│  ❌ 1 tenant com erro                                            │
│                                                                  │
│  [Run All Migrations]  [View Details]                           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Tenants com Problemas:                                         │
│                                                                  │
│  ⚠️ acme-corp     @ rev_001  (outdated)    [Migrate]            │
│  ⚠️ beta-inc      @ rev_002  (outdated)    [Migrate]            │
│  ❌ gamma-llc     @ rev_001  (failed)      [Retry]              │
│     Error: column "xyz" already exists                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Workflow Operacional

### 5.1 Criar Nova Migration

```bash
# 1. Developer cria migration normal
cd backend
alembic revision -m "add_column_xyz"

# 2. Migration é aplicada ao public schema (CI/CD normal)
alembic upgrade head

# 3. Runner multi-tenant propaga para todos os tenants
# (pode ser manual, cron, ou trigger pós-deploy)
python -m app.platform.migrations.runner --all
```

### 5.2 Deploy com Migrations

```yaml
# railway.toml ou CI/CD
[deploy]
steps:
  - alembic upgrade head  # public schema
  - python -m app.platform.migrations.runner --all  # tenant schemas
```

### 5.3 Monitorização Pós-Deploy

1. Dashboard mostra tenants outdated/failed
2. Alertas se >0 failed após 5 minutos
3. Retry manual via UI ou API

---

## 6. Implementação Faseada

### Fase 1 (Esta semana) ✅
- [x] tenant.status + provisioning tracking
- [x] Endpoint retry provisioning
- [ ] Criar tabela `tenant_schema_versions`

### Fase 2 (Próxima semana)
- [ ] Migration runner básico
- [ ] Endpoint `/schema-status`
- [ ] Advisory locks

### Fase 3 (2 semanas)
- [ ] Dashboard UI no super-admin
- [ ] Alertas
- [ ] Integração CI/CD

---

## 7. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Lock deadlock | Advisory locks são non-blocking; timeout configurável |
| Migration parcial | Transações por migration; rollback automático |
| Falha em cascade | Processamento isolado por tenant |
| Performance em scale | Paralelização com pool de workers (fase futura) |

---

## 8. Decisão Necessária

**Confirmar abordagem?**

- [ ] Opção 1 (proposta): Alembic multi-schema com tracking
- [ ] Opção 2: Template public + catálogo DDL manual

**Após confirmação**, implemento Fase 2 imediatamente.
