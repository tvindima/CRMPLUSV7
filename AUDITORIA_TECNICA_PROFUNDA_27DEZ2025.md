# 🔍 AUDITORIA TÉCNICA PROFUNDA - CRM PLUS V7
**Data:** 27 de Dezembro de 2025  
**Objetivo:** Análise completa do estado atual do projeto sem implementar correções

---

## 📋 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Segurança e Autenticação](#segurança-e-autenticação)
4. [Base de Dados e Modelos](#base-de-dados-e-modelos)
5. [Backend (FastAPI)](#backend-fastapi)
6. [Frontends (Next.js)](#frontends-nextjs)
7. [Mobile (Expo/React Native)](#mobile-exporeact-native)
8. [DevOps e Deployment](#devops-e-deployment)
9. [Gestão de Erros](#gestão-de-erros)
10. [Performance e Otimização](#performance-e-otimização)
11. [Code Quality](#code-quality)
12. [Recomendações Prioritárias](#recomendações-prioritárias)

---

## 1. RESUMO EXECUTIVO

### 🎯 Estado Geral
- **Backend:** ✅ Operacional após correções de hoje
- **Frontends:** ✅ Todos deployados e funcionais
- **Mobile:** ⚠️ Funcional mas com issues de upload
- **Database:** ✅ PostgreSQL estável no Railway

### 📊 Métricas de Qualidade

| Aspecto | Estado | Score |
|---------|--------|-------|
| Arquitetura | 🟢 Boa | 8/10 |
| Segurança | 🟡 Adequada | 7/10 |
| Código Backend | 🟢 Bom | 8/10 |
| Código Frontend | 🟡 Aceitável | 6/10 |
| Testes | 🔴 Crítico | 2/10 |
| Documentação | 🟡 Parcial | 6/10 |
| DevOps | 🟢 Bom | 8/10 |

---

## 2. ARQUITETURA DO SISTEMA

### 2.1 Stack Tecnológica

**Backend:**
- ✅ FastAPI (Python 3.11+)
- ✅ PostgreSQL (Railway)
- ✅ SQLAlchemy ORM
- ✅ Alembic migrations
- ✅ JWT authentication
- ⚠️ Cloudinary (opcional/fallback)

**Frontends:**
- ✅ Next.js 14 (3 projetos)
- ✅ TypeScript
- ✅ Tailwind CSS
- ⚠️ Múltiplos entry points

**Mobile:**
- ✅ Expo (React Native)
- ✅ TypeScript
- ⚠️ Dependências expo-av com vulnerabilidades

### 2.2 Separação de Responsabilidades

**✅ PONTOS FORTES:**
- Backend completamente separado dos frontends
- Routers bem organizados por domínio (`/properties`, `/leads`, `/agents`)
- Schemas Pydantic para validação
- Services layer presente

**⚠️ PONTOS DE MELHORIA:**
- Falta separação clara Controller/Service em alguns endpoints
- Lógica de negócio às vezes misturada com routers
- Alguns ficheiros demasiado grandes (`mobile/routes.py` - 1750+ linhas)

### 2.3 Duplicação de Código

**🔴 ISSUES IDENTIFICADAS:**

1. **Dois sistemas BackofficeLayout:**
   ```
   ❌ @/backoffice/components/BackofficeLayout (antigo)
   ✅ @/components/BackofficeLayout (novo - completo)
   ```
   → 40 ficheiros foram corrigidos hoje

2. **Ficheiros duplicados " 2":**
   ```
   backend/app/core/exceptions 2.py
   backend/app/core/events 2.py
   backend/app/core/logging 2.py
   backend/app/core/websocket 2.py
   backend/app/core/scheduler 2.py
   site-montra/.eslintrc 2.json
   site-montra/Dockerfile 2
   ```

3. **Lógica repetida:**
   - Hash de passwords em múltiplos ficheiros
   - Validação de tokens duplicada
   - Queries similares em routers diferentes

---

## 3. SEGURANÇA E AUTENTICAÇÃO

### 3.1 Autenticação JWT

**✅ IMPLEMENTAÇÃO CORRETA:**
```python
# backend/app/security.py
- JWT com HS256
- Access tokens: 24h (mobile), 60min (backoffice)
- Refresh tokens: 7 dias
- Token rotation implementado
- Secret key via env var
```

**✅ PONTOS FORTES:**
- Bcrypt para hashing de passwords (72-byte limit respeitado)
- Tokens incluem `agent_id`, `role`, `user_id`
- Refresh token rotation (segurança adicional)
- Multi-device tracking

**⚠️ PONTOS DE MELHORIA:**

1. **Secret Keys Hardcoded em Fallback:**
   ```python
   # ❌ Encontrado em múltiplos ficheiros:
   SECRET_KEY = os.environ.get("CRMPLUS_AUTH_SECRET", "change_me_crmplus_secret")
   SECRET_KEY = os.getenv("SECRET_KEY", "crmplusv7-secret-key-change-in-production")
   ```
   **Risco:** Se env var não estiver definida, usa valor inseguro
   **Recomendação:** Fail-fast se SECRET_KEY não existir em produção

2. **Passwords em Logs:**
   ```python
   # ⚠️ Encontrado em alguns endpoints
   print(f"[AUTH] User: {user.email}, password attempt")
   ```
   **Recomendação:** Remover logs sensíveis ou usar logging.debug

3. **CORS com "*":**
   ```python
   if os.environ.get("RAILWAY_ENVIRONMENT"):
       ALLOWED_ORIGINS = ["*"]
   ```
   **Análise:** Aceitável para Bearer auth, mas não ideal
   **Recomendação:** Listar origins específicas em produção

### 3.2 Autorização

**✅ IMPLEMENTAÇÃO:**
```python
- require_staff() dependency
- get_current_user() dependency
- Role-based checks (admin, coordinator, agent, staff)
```

**⚠️ GAPS IDENTIFICADOS:**
- Falta middleware global de rate limiting
- Alguns endpoints públicos sem validação adicional
- Sem proteção contra brute force em `/auth/login`

### 3.3 Validação de Input

**✅ PONTOS FORTES:**
- Pydantic schemas em todos os endpoints
- SQLAlchemy ORM previne SQL injection
- Email validation com EmailStr

**⚠️ MELHORIAS:**
- Falta validação de file upload size em alguns endpoints
- Alguns regex patterns não escaped
- Falta sanitização de HTML em campos de texto livre

---

## 4. BASE DE DADOS E MODELOS

### 4.1 Schema

**✅ MODELOS IMPLEMENTADOS (15+):**
```
Core:
- users ✅
- agents ✅
- properties ✅
- leads ✅
- tasks ✅
- teams ✅
- agencies ✅

Extended:
- visits ✅
- events ✅
- first_impressions ✅
- pre_angariacoes ✅
- contratos_mediacao_imobiliaria ✅
- website_clients ✅
- refresh_tokens ✅
- crm_settings ✅
```

### 4.2 Relacionamentos

**⚠️ INCONSISTÊNCIAS IDENTIFICADAS:**

1. **Duplicação Agent vs User:**
   ```python
   # users table: autenticação
   # agents table: dados de agentes
   
   # ❌ PROBLEMA: 
   User.agent_id → agents.id (opcional)
   User.works_for_agent_id → agents.id (assistentes)
   
   # Confusão: algumas queries usavam User, outras Agent
   # CORRIGIDO HOJE em website_auth.py e website_clients.py
   ```

2. **Foreign Keys Removidas:**
   ```python
   # website_clients.assigned_agent_id
   # ❌ HOJE: FK constraint removida para flexibilidade
   # ⚠️ RISCO: Dados órfãos se agent for deletado
   ```
   **Recomendação:** Adicionar soft deletes ou validação em service layer

3. **Nullable vs Required:**
   ```python
   # ⚠️ Inconsistências encontradas:
   Lead.email = nullable=True  # OK para mobile
   Lead.created_at = nullable default  # ❌ Causou erro hoje
   ```

### 4.3 Migrações Alembic

**✅ MELHORIAS HOJE:**
- Todas as migrações foram feitas idempotentes com `inspect()`
- `add_role_label_users.py` ✅
- `message_leads.py` ✅
- `website_clients.py` ✅
- `works_for.py` ✅

**⚠️ ISSUES RESTANTES:**
- Algumas migrações antigas não têm downgrade
- Falta migration para remover FK de website_clients (feito no modelo mas não migrado)
- Ordem de migrations pode causar problemas em fresh deploy

### 4.4 Enums vs Strings

**🔴 MUDANÇA CRÍTICA HOJE:**
```python
# ANTES:
Lead.status = Column(Enum(LeadStatus))
Lead.source = Column(Enum(LeadSource))

# DEPOIS:
Lead.status = Column(String)  # Para compatibilidade BD
Lead.source = Column(String)
```

**Análise:**
- ✅ Resolve problemas de compatibilidade
- ❌ Perde validação a nível de BD
- ⚠️ Requer validação em application layer

---

## 5. BACKEND (FastAPI)

### 5.1 Estrutura de Routers

**✅ BEM ORGANIZADO:**
```
/properties     - Imóveis
/agents         - Agentes
/leads          - Leads
/teams          - Equipas
/calendar       - Agenda/Tasks
/mobile         - Endpoints mobile
/api/dashboard  - Dashboard KPIs
/website/auth   - Auth clientes website
```

**⚠️ ISSUES:**

1. **Router Gigante:**
   ```python
   # mobile/routes.py - 1750+ linhas
   # PROBLEMA: Difícil de manter e testar
   ```
   **Recomendação:** Dividir em sub-routers:
   ```
   mobile/
     properties.py
     visits.py
     leads.py
     calendar.py
   ```

2. **Lógica de Negócio em Routers:**
   ```python
   # ❌ Exemplo: round-robin logic no router
   @router.post("/website/auth/register")
   def register_client(...):
       # 100+ linhas de lógica aqui
   ```
   **Recomendação:** Mover para `services/`

### 5.2 Exception Handling

**✅ SISTEMA ROBUSTO:**
```python
# Custom exceptions implementadas:
- BusinessRuleError (400)
- ResourceNotFoundError (404)
- UnauthorizedError (403)
- ConflictError (409)
- ValidationError (422)
- ExternalServiceError (503)

# Global handlers registados
```

**⚠️ MELHORIAS:**
```python
# ❌ Encontrado em alguns endpoints:
except Exception as e:
    print(f"Error: {e}")  # Console log apenas
    raise HTTPException(500, "Erro interno")
```

**Recomendação:** 
- Usar logging.logger em vez de print
- Adicionar Sentry/error tracking
- Incluir request_id para correlação

### 5.3 Performance

**⚠️ QUERIES N+1:**
```python
# ❌ Encontrado em dashboard.py:
agents = db.query(Agent).all()
for agent in agents:
    leads_count = db.query(Lead).filter(
        Lead.assigned_agent_id == agent.id
    ).count()  # N+1!
```

**Recomendação:** Usar JOIN ou subquery

**⚠️ FALTA PAGINAÇÃO:**
```python
# ❌ Alguns endpoints sem limit:
@router.get("/properties/")
def list_properties(db: Session):
    return db.query(Property).all()  # Pode retornar 1000+
```

**⚠️ FALTA CACHING:**
- Sem Redis implementado
- Queries repetidas em cada request
- Dashboard KPIs recalculados sempre

### 5.4 File Upload

**✅ FALLBACK IMPLEMENTADO:**
```python
# core/storage.py
try:
    from cloudinary import ...
    storage = CloudinaryStorage()
except ImportError:
    storage = LocalStorage()  # Fallback seguro
```

**⚠️ ISSUES:**
- Sem validação de MIME types em alguns endpoints
- Falta anti-virus scan
- Max file size não consistente

---

## 6. FRONTENDS (Next.js)

### 6.1 Estrutura

**✅ 3 PROJETOS NEXT.JS:**
1. **backoffice/** - Admin/Staff panel
2. **web/** - Site institucional (não usado?)
3. **site-montra/** - Website público

**🔴 CONFUSÃO:**
- `web/` parece não estar em uso
- `site-montra/` é o site público real
- Duplicação de código entre projetos

### 6.2 Gestão de Estado

**⚠️ SEM STATE MANAGEMENT LIBRARY:**
```tsx
// Usa apenas useState/useContext
// Sem Redux, Zustand, ou Jotai
```

**Análise:**
- ✅ Simplifica o projeto
- ❌ Prop drilling em componentes profundos
- ❌ Refetching desnecessário

### 6.3 API Calls

**⚠️ INCONSISTÊNCIA:**
```tsx
// Método 1: Direct fetch
const res = await fetch(`${API_BASE}/properties`)

// Método 2: Via proxy /api
const res = await fetch('/api/properties')

// Método 3: backofficeApi.ts service
import { getProperties } from '@/services/backofficeApi'
```

**Recomendação:** Padronizar para um único método

### 6.4 Error Handling

**⚠️ BÁSICO:**
```tsx
try {
  const data = await fetch(...)
} catch (error) {
  console.error(error)  // ❌ Só console
  setError("Erro ao carregar")  // Mensagem genérica
}
```

**Sem:**
- Toast notifications consistentes
- Error boundaries React
- Retry logic
- Loading states padronizados

### 6.5 TypeScript

**🟡 USO PARCIAL:**
```tsx
// ✅ Interfaces definidas
interface Property { ... }

// ❌ Mas muitos `any`:
const handleSubmit = async (data: any) => { ... }
```

**Recomendação:** Strict mode e eliminar `any`

---

## 7. MOBILE (Expo/React Native)

### 7.1 Arquitetura

**✅ BEM ESTRUTURADO:**
```
/src
  /screens      - Ecrãs completos
  /components   - Componentes reutilizáveis
  /services     - API, auth, cloudinary
  /contexts     - AuthContext, etc
  /constants    - Config, theme
  /types        - TypeScript types
```

### 7.2 Autenticação

**✅ ROBUSTO:**
```typescript
// AuthContext com:
- Token refresh automático
- Multi-device support
- Persistent login
- Error handling padronizado
```

### 7.3 Performance

**⚠️ ISSUES:**
- FlatList sem `getItemLayout` (performance)
- Imagens sem lazy loading
- Sem image caching optimizado
- Heavy screens (CMIFormScreen - 600+ linhas)

### 7.4 Upload Cloudinary

**🔴 PROBLEMA CONHECIDO:**
```typescript
// Configuração vem do backend:
const config = await api.get('/mobile/cloudinary/upload-config')

// ⚠️ Depende de upload_preset correto
// Falhas reportadas em produção
```

**Recomendação:**
- Validar preset existe
- Fallback para upload via backend
- Melhor error messages

---

## 8. DEVOPS E DEPLOYMENT

### 8.1 Ambientes

**✅ CONFIGURAÇÃO:**
```
Backend:  Railway (PostgreSQL + FastAPI)
Frontend: Vercel (3 projetos)
Mobile:   Vercel (web build)
```

### 8.2 Environment Variables

**🔴 INCONSISTÊNCIAS:**

| Projeto | Prefixo | Exemplo |
|---------|---------|---------|
| Backend | Nenhum | `CLOUDINARY_CLOUD_NAME` |
| Next.js | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_BASE_URL` |
| Expo | `EXPO_PUBLIC_` | `EXPO_PUBLIC_API_BASE_URL` |

**⚠️ PROBLEMAS:**
```bash
# mobile/.env tem ambos:
CLOUDINARY_CLOUD_NAME=dz0crsrhi          # ❌ Não funciona
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...  # ✅ Correto
```

### 8.3 CI/CD

**✅ AUTO-DEPLOY:**
- Vercel: Deploy automático no push
- Railway: Deploy automático no push

**❌ FALTA:**
- Testes automáticos
- Linting no CI
- Type checking no CI
- Security scanning

### 8.4 Migrations

**⚠️ PROCESSO MANUAL:**
```bash
# Atualmente requer:
1. SSH para Railway
2. Executar alembic upgrade head
3. Verificar manualmente
```

**Recomendação:** 
```bash
# start.sh automatizado:
if [ "$RUN_MIGRATIONS" = "true" ]; then
  alembic upgrade head
fi
```
*Nota: já existe mas RUN_MIGRATIONS=false por padrão*

---

## 9. GESTÃO DE ERROS

### 9.1 Backend

**✅ GLOBAL HANDLERS:**
```python
@app.exception_handler(RequestValidationError)
@app.exception_handler(ConflictError)
@app.exception_handler(Exception)  # Catch-all
```

**✅ CUSTOM EXCEPTIONS:**
- User-friendly messages
- HTTP status codes corretos
- Structured JSON responses

**⚠️ MELHORIAS:**
```python
# ❌ Alguns endpoints ainda usam:
raise HTTPException(500, "Erro")

# ✅ Deveria usar:
raise BusinessRuleError("Descrição específica")
```

### 9.2 Frontend

**⚠️ BÁSICO:**
```tsx
// Sem error boundaries
// Sem retry logic
// Mensagens genéricas
```

### 9.3 Mobile

**✅ MELHOR:**
```typescript
// ErrorState component ✅
// Retry logic em api.ts ✅
// User-friendly messages ✅
```

---

## 10. PERFORMANCE E OTIMIZAÇÃO

### 10.1 Database

**⚠️ ISSUES:**
- Sem índices em queries frequentes
- N+1 queries em dashboards
- Sem connection pooling configurado
- Falta EXPLAIN ANALYZE em queries lentas

### 10.2 API

**⚠️ ISSUES:**
- Sem rate limiting
- Sem response caching
- Payloads grandes sem paginação
- Falta compression (gzip)

### 10.3 Frontend

**⚠️ ISSUES:**
- Bundle size não otimizado
- Sem code splitting agressivo
- Imagens sem optimização next/image em alguns lugares
- Sem service worker/PWA

### 10.4 Mobile

**⚠️ ISSUES:**
- Hermes engine não configurado
- Bundle size grande
- Sem code splitting
- Heavy dependencies (expo-av vulnerável)

---

## 11. CODE QUALITY

### 11.1 Testes

**🔴 CRÍTICO: QUASE NENHUM TESTE**

```bash
# Backend: 0 testes
# Backoffice: 3 testes básicos
# Mobile: 0 testes
```

**Encontrado apenas:**
```
backoffice/__tests__/
  DataTable.test.tsx
  middleware.test.ts
  PropertyForm.test.tsx
```

### 11.2 Linting

**🟡 PARCIAL:**
- ESLint configurado mas com warnings ignorados
- Ruff para Python (não configurado?)
- Muitos warnings no build do Vercel

### 11.3 Type Safety

**🟡 TYPESCRIPT PARCIAL:**
```typescript
// ✅ Interfaces definidas
// ❌ Muitos `any`
// ❌ Sem `strict: true` no tsconfig
```

### 11.4 Documentação

**🟡 PARCIAL:**
- ✅ README.md em cada projeto
- ✅ Docstrings em alguns endpoints
- ❌ Sem OpenAPI/Swagger docs
- ❌ Sem architecture diagrams
- ❌ Sem onboarding docs para devs

### 11.5 Git Hygiene

**⚠️ ISSUES:**
- Commits grandes (40+ ficheiros)
- Mensagens de commit genéricas às vezes
- Sem branching strategy clara
- `.env` files commitados (mas ignorados depois)

---

## 12. RECOMENDAÇÕES PRIORITÁRIAS

### 🔴 CRÍTICAS (Fazer AGORA)

1. **Remover Ficheiros Duplicados " 2"**
   ```bash
   rm backend/app/core/exceptions\ 2.py
   rm backend/app/core/events\ 2.py
   # etc...
   ```

2. **Consolidar User/Agent Tables**
   - Definir claramente quando usar cada uma
   - Ou unificar numa só tabela com roles
   - Documentar relação

3. **Adicionar Testes Básicos**
   ```python
   # Backend - mínimo:
   - test_auth_login()
   - test_create_property()
   - test_dashboard_kpis()
   ```

4. **Fix Mobile Upload**
   - Validar upload_preset
   - Adicionar fallback backend upload
   - Melhorar error messages

5. **Environment Variables**
   - Criar `.env.example` padronizado
   - Documentar todas as vars necessárias
   - Fail-fast se SECRET_KEY missing

### 🟡 IMPORTANTES (Próximas 2 semanas)

6. **Dividir mobile/routes.py**
   - Criar sub-routers
   - Mover lógica para services

7. **Adicionar Rate Limiting**
   ```python
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)
   ```

8. **Implementar Caching**
   - Redis para dashboard KPIs
   - Cache properties list
   - TTL 5-10 minutos

9. **Error Tracking**
   - Adicionar Sentry
   - Structured logging
   - Request IDs

10. **Type Safety**
    - `strict: true` no tsconfig
    - Eliminar `any` types
    - Generate types from OpenAPI

### 🟢 MELHORIAS (Backlog)

11. **Database Optimization**
    - Adicionar índices
    - Resolver N+1 queries
    - EXPLAIN ANALYZE queries lentas

12. **Security Hardening**
    - Rate limiting por IP
    - Brute force protection
    - File upload scanning

13. **Performance**
    - Next.js ISR para site-montra
    - Image optimization
    - Code splitting

14. **DevOps**
    - CI/CD com testes
    - Automated migrations
    - Blue-green deployments

15. **Documentação**
    - OpenAPI/Swagger
    - Architecture diagrams
    - Dev onboarding guide

---

## 📊 SCORE DETALHADO POR CATEGORIA

### Backend
| Aspecto | Score | Notas |
|---------|-------|-------|
| Arquitetura | 8/10 | Bem organizado, mas routers muito grandes |
| Segurança | 7/10 | JWT robusto, mas falta rate limiting |
| Performance | 6/10 | N+1 queries, sem caching |
| Code Quality | 7/10 | Limpo mas sem testes |
| Documentação | 5/10 | Básica, falta OpenAPI |

### Frontends
| Aspecto | Score | Notas |
|---------|-------|-------|
| Arquitetura | 6/10 | 3 projetos com overlap |
| Type Safety | 5/10 | TypeScript parcial |
| Performance | 6/10 | Bundle não otimizado |
| Error Handling | 4/10 | Básico e inconsistente |
| Testes | 2/10 | Quase nenhum |

### Mobile
| Aspecto | Score | Notas |
|---------|-------|-------|
| Arquitetura | 7/10 | Bem estruturado |
| Performance | 6/10 | Algumas otimizações faltam |
| UX | 8/10 | Boa experiência |
| Error Handling | 7/10 | Melhor que frontend |
| Testes | 1/10 | Nenhum |

### DevOps
| Aspecto | Score | Notas |
|---------|-------|-------|
| Deployment | 9/10 | Auto-deploy funciona bem |
| Monitoring | 3/10 | Sem logs centralizados |
| CI/CD | 4/10 | Deploy sim, testes não |
| Env Management | 5/10 | Inconsistências |

---

## 🎯 CONCLUSÃO

**PONTOS FORTES:**
- ✅ Arquitetura modular e escalável
- ✅ Autenticação JWT robusta
- ✅ Backend FastAPI bem estruturado
- ✅ Deploy automático funcional
- ✅ Base de dados bem normalizada

**GAPS CRÍTICOS:**
- 🔴 Falta de testes (2/10)
- 🔴 Ficheiros duplicados " 2"
- 🔴 Confusão User/Agent tables
- 🔴 Mobile upload issues
- 🔴 Falta de monitoring

**PRIORIDADES:**
1. Remover duplicações
2. Adicionar testes básicos
3. Consolidar User/Agent
4. Implementar error tracking
5. Otimizar queries N+1

**ESTADO GERAL:** 
Sistema funcional e bem arquitetado, mas precisa de:
- Mais testes
- Limpeza de código duplicado
- Monitoring e observability
- Otimizações de performance

**RECOMENDAÇÃO:**
Continuar desenvolvimento mas alocar 20% do tempo para:
- Testes automáticos
- Refactoring
- Documentação
- Monitoring

---

## 📝 NOTAS FINAIS

Esta auditoria foi realizada sem fazer alterações ao código. Todas as observações são baseadas em análise estática e contexto da sessão de debugging de hoje.

Para implementar as recomendações, sugere-se uma abordagem faseada:
- **Sprint 1:** Críticas (issues bloqueadores)
- **Sprint 2:** Importantes (debt técnico)
- **Sprint 3+:** Melhorias (otimizações)

**Próximos Passos Sugeridos:**
1. Review desta auditoria com a equipa
2. Priorizar recomendações críticas
3. Criar issues no GitHub/Jira
4. Alocar tempo para refactoring
5. Estabelecer métricas de qualidade

---

**Auditoria realizada por:** GitHub Copilot (Claude Sonnet 4.5)  
**Data:** 27 de Dezembro de 2025  
**Versão:** 1.0
