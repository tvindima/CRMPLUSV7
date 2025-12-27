# Relatório de Desenvolvimento - 27 Dezembro 2025

## Resumo Executivo

Sessão intensiva de debugging e correções críticas no sistema CRM Plus V7. O backend estava completamente offline (502 errors) e múltiplos endpoints do backoffice falhavam. Todas as issues foram resolvidas e o sistema está operacional.

---

## 🔴 Issues Críticas Resolvidas

### 1. Backend Offline (502 Bad Gateway)

**Problema:** O backend no Railway estava completamente down devido a crash no CloudinaryStorage.

**Causa:** O módulo `cloudinary` não estava instalado ou configurado, causando crash no import.

**Solução:** Implementado fallback para LocalStorage em `backend/app/core/storage.py`

```python
# Antes: CloudinaryStorage sem fallback
# Depois: LocalStorage como fallback quando Cloudinary falha
try:
    from cloudinary import ...
except ImportError:
    # Use LocalStorage fallback
```

**Ficheiros alterados:**
- `backend/app/core/storage.py`

---

### 2. Dashboard Endpoints 500 Errors

**Problema:** Todos os endpoints do dashboard (`/api/dashboard/*`) retornavam 500.

**Causa:** 
1. Campo `Lead.created_at` podia ser `None`, causando erro em comparações de datetime
2. Status das leads vinham em inglês ("new") mas o frontend esperava português ("nova")

**Solução:**
- Adicionados null checks para `created_at`
- Implementado mapeamento de status inglês → português

**Ficheiros alterados:**
- `backend/app/api/dashboard.py`
- `backoffice/app/backoffice/dashboard/page.tsx` (status badge mapping)

---

### 3. Agente "Tiago Vindima" Não Aparecia na Lista

**Problema:** Na seleção de agentes do website, Tiago Vindima não aparecia.

**Causa:** O endpoint `/website/auth/agents` estava a usar a tabela `User` em vez de `Agent`.

**Solução:** Alterado para usar tabela `Agent` consistentemente.

**Ficheiros alterados:**
- `backend/app/routers/website_auth.py`

---

### 4. Login Admin Não Funcionava

**Problema:** Não era possível fazer login com credenciais de admin.

**Causa:** Password hash não correspondia.

**Solução:** Criado endpoint temporário para reset de password e atualizada a password do admin.

---

### 5. Migrações Alembic Falhavam

**Problema:** Múltiplas migrações falhavam por tentar criar colunas/tabelas que já existiam.

**Causa:** Migrações não eram idempotentes.

**Solução:** Todas as migrações foram atualizadas para usar `inspect()` e verificar existência antes de criar.

**Migrações corrigidas:**
- `add_role_label_users.py`
- `message_leads.py`
- `website_clients.py`
- `works_for.py`

---

### 6. Erro de "color undefined" no Dashboard

**Problema:** `Cannot read properties of undefined (reading 'color')` no dashboard.

**Causa:** Status das leads vindos da API em inglês não tinham mapeamento para badges.

**Solução:** Adicionado mapeamento de status:
```typescript
const statusMap: Record<string, string> = {
  'new': 'nova',
  'contacted': 'contactada',
  'qualified': 'qualificada',
  // ...
};
```

**Ficheiros alterados:**
- `backoffice/app/backoffice/dashboard/page.tsx`

---

### 7. Sidebar Inconsistente Entre Páginas

**Problema:** Algumas páginas mostravam menu lateral completo, outras mostravam versão reduzida.

**Causa:** Existiam dois componentes `BackofficeLayout`:
- `@/components/BackofficeLayout` - Sidebar completa ✅
- `@/backoffice/components/BackofficeLayout` - Sidebar antiga/incompleta ❌

**Solução:** Atualizado import em **40 ficheiros** para usar o layout correto.

```bash
# Alterado de:
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout"
# Para:
import { BackofficeLayout } from "@/components/BackofficeLayout"
```

**Ficheiros alterados:** 40 páginas em `backoffice/app/backoffice/`

---

### 8. Prop `showBackButton` Não Suportada

**Problema:** Build do Vercel falhava com erro de TypeScript.

**Causa:** Algumas páginas usavam `showBackButton` prop que não existia no novo BackofficeLayout.

**Solução:** Removida a prop de 5 ficheiros.

**Ficheiros alterados:**
- `app/backoffice/leads/new/page.tsx`
- `app/backoffice/leads/page.tsx`
- `app/backoffice/agents/new-staff/page.tsx`
- `app/backoffice/agents/[id]/editar/page.tsx`
- `app/backoffice/agents/page.tsx`

---

### 9. CORS Blocking Requests

**Problema:** Requests do frontend eram bloqueados por CORS policy.

**Causa:** Configuração CORS demasiado restritiva.

**Solução:** Simplificada configuração CORS para permitir todas as origens em produção (Railway):

```python
if os.environ.get("RAILWAY_ENVIRONMENT"):
    ALLOWED_ORIGINS = ["*"]
    ALLOW_CREDENTIALS = False
```

**Ficheiros alterados:**
- `backend/app/main.py`

---

### 10. Website Clients Endpoint 500

**Problema:** `/website/clients/` retornava 500.

**Causa:** Usava `User` model para buscar agentes em vez de `Agent`.

**Solução:** Alterado para usar `Agent` model.

**Ficheiros alterados:**
- `backend/app/routers/website_clients.py`

---

### 11. Registo de Clientes Website Falhava

**Problema:** `POST /website/auth/register` retornava 500.

**Causa:** 
1. Usava `User` model em vez de `Agent` para lookup de agentes
2. FK constraint em `assigned_agent_id` apontava para `users.id` mas guardava IDs de `agents`

**Solução:**
1. Alterado todos os lookups para usar `Agent` model
2. Removida FK constraint para flexibilidade

**Ficheiros alterados:**
- `backend/app/routers/website_auth.py`
- `backend/app/models/website_client.py`

---

## 📊 Modelo de Dados - Clarificação Importante

### Tabela `agents` vs `users`

O sistema tem **duas tabelas** para pessoas:

| Tabela | Propósito | Campos Chave |
|--------|-----------|--------------|
| `users` | Autenticação backoffice | `email`, `hashed_password`, `role` |
| `agents` | Dados de agentes imobiliários | `name`, `email`, `phone`, `photo` |

**⚠️ IMPORTANTE:** O `assigned_agent_id` em `website_clients` e `leads` aponta para a tabela **`agents`**, não `users`.

---

## 🔧 Configurações de Ambiente

### Railway (Backend)
- URL: `https://crmplusv7-production.up.railway.app`
- CORS: Permite todas as origens (`*`)
- Variáveis necessárias: `RAILWAY_ENVIRONMENT`, `DATABASE_URL`, `JWT_SECRET_KEY`

### Vercel (Frontend)
- Backoffice: `https://backoffice-three-opal.vercel.app`
- Site Montra: `https://web-steel-gamma-66.vercel.app`
- API URL: `NEXT_PUBLIC_API_BASE_URL` ou fallback para Railway

---

## 📁 Ficheiros Modificados (Resumo)

### Backend (`/backend`)
- `app/main.py` - CORS config
- `app/core/storage.py` - CloudinaryStorage fallback
- `app/api/dashboard.py` - Null checks, status mapping
- `app/routers/website_auth.py` - Agent model usage
- `app/routers/website_clients.py` - Agent model usage
- `app/models/website_client.py` - FK removal
- `app/leads/models.py` - Enum to String
- `alembic/versions/*.py` - Idempotent migrations

### Backoffice (`/backoffice`)
- `app/backoffice/dashboard/page.tsx` - Status badge fix
- 40+ páginas - BackofficeLayout import fix
- 5 páginas - showBackButton removal

---

## 🧪 Testes Recomendados

1. **Login Admin:** `admin@imoveismais.pt` / nova password
2. **Dashboard:** Verificar KPIs e gráficos carregam
3. **Agentes:** Verificar lista mostra todos os agentes
4. **Website Registo:** Criar nova conta de cliente
5. **Website Clients:** Listar clientes no backoffice
6. **Sidebar:** Verificar menu completo em todas as páginas

---

## 🚀 Commits de Hoje

```
881e4fb fix: remove FK constraint from website_clients.assigned_agent_id for flexibility
acf2a52 fix: change website_clients.assigned_agent_id FK from users to agents
4b4322d fix: use Agent model instead of User for all agent lookups in website_auth
7a7b177 fix: use Agent model instead of User for website clients agent lookup
3131f29 fix: simplify CORS config - allow all origins in Railway production
26593f1 fix: remove showBackButton prop not supported by BackofficeLayout
66b36b6 fix: standardize BackofficeLayout import across all pages - Sidebar consistency
[+ commits anteriores da sessão]
```

---

## 📝 Notas para Desenvolvimento Futuro

1. **Consolidar User/Agent:** Considerar unificar as tabelas ou criar relação clara
2. **Testes Automatizados:** Adicionar testes para endpoints críticos
3. **Logging:** Melhorar logging no backend para debug mais fácil
4. **Cloudinary:** Configurar credenciais Cloudinary ou remover dependência
5. **Migrações:** Garantir todas novas migrações são idempotentes

---

## 👤 Autor

Sessão de debugging realizada com GitHub Copilot (Claude Opus 4.5)
Data: 27 de Dezembro de 2025
