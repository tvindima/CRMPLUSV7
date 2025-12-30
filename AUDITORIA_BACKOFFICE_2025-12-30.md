# 📊 AUDITORIA COMPLETA DO BACKOFFICE
**Data:** 30 de dezembro de 2025  
**Versão:** 1.0

---

## 🎯 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total de módulos analisados** | 18 |
| **Módulos com CRUD completo** | 5 (28%) |
| **Módulos parcialmente funcionais** | 7 (39%) |
| **Módulos sem funcionalidade real** | 6 (33%) |
| **Módulos usando RoleContext** | 2 (11%) |
| **Endpoints backend em falta** | 3 |

---

## 📁 ANÁLISE DETALHADA POR MÓDULO

### 1️⃣ PRE-ANGARIAÇÕES (`/backoffice/pre-angariacoes/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ✅ OK | Usa `/pre-angariacoes/` via backofficeApi |
| **Detalhe** | ✅ OK | Página `[id]/page.tsx` funcional |
| **Criar** | ❌ Em falta | Não existe página/formulário de criação |
| **Editar** | ❌ Em falta | Página de detalhe é READ-ONLY |
| **Cancelar** | ⚠️ Parcial | Tem botão mas sem confirmação adequada |
| **RoleContext** | ❌ Em falta | Não verifica permissões |

**Backend:** ✅ Router completo (`/backend/app/routers/pre_angariacoes.py`)
- `GET /pre-angariacoes/` ✅
- `GET /pre-angariacoes/{id}` ✅
- `POST /pre-angariacoes/` ✅
- `PUT /pre-angariacoes/{id}` ✅ **← UI não usa!**
- `POST /pre-angariacoes/{id}/cancel` ✅

**Ação necessária:**
- [ ] Criar página de edição `[id]/editar/page.tsx`
- [ ] Adicionar RoleContext para admin/coordinator only
- [ ] UI para usar PUT endpoint existente

---

### 2️⃣ AGENDA (`/backoffice/agenda/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ⚠️ Mock | Código tem `TODO: Implementar quando endpoint /api/visits estiver disponível` |
| **Criar evento** | ❌ Em falta | Botão existe mas não funciona |
| **Editar evento** | ❌ Em falta | Não implementado |
| **Apagar evento** | ❌ Em falta | Não implementado |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ✅ Endpoints existem!
- `/calendar/` - Eventos de calendário (CRUD completo)
- `/calendar/tasks` - Tarefas (CRUD completo)
- `/mobile/visits` - Visitas (CRUD completo)

**Problema:** Página não está conectada aos endpoints!

**Ação necessária:**
- [ ] Conectar a `/calendar/tasks` ou `/mobile/visits`
- [ ] Implementar criação de eventos/tarefas
- [ ] Implementar edição e remoção
- [ ] Adicionar RoleContext

---

### 3️⃣ LEADS (`/backoffice/leads/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ✅ OK | Usa backofficeApi → `/leads/` |
| **Detalhe** | ✅ OK | Página `[id]/page.tsx` com timeline |
| **Criar** | ✅ OK | LeadForm funcional |
| **Editar** | ✅ OK | PUT via Drawer |
| **Apagar** | ✅ OK | DELETE funcional |
| **RoleContext** | ✅ OK | Verifica permissões de edição |

**Backend:** ✅ Router completo (`/backend/app/leads/routes.py`)

**Status:** 🟢 COMPLETO

---

### 4️⃣ CLIENTES CRM (`/backoffice/clients/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ❌ Em falta | `TODO: Fetch clients from API` - array vazio |
| **Criar** | ⚠️ Parcial | Formulário existe mas console.log only |
| **Editar** | ❌ Em falta | Não existe |
| **Apagar** | ❌ Em falta | Não existe |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ❌ **NÃO EXISTE endpoint `/clients/`**

**Ação necessária:**
- [ ] **CRIAR** `/backend/app/clients/` com router completo
- [ ] Modelo: Client (nome, email, telefone, tipo, agente_id, notas, etc.)
- [ ] Conectar página ao novo endpoint
- [ ] Adicionar RoleContext

---

### 5️⃣ CLIENTES WEBSITE (`/backoffice/website-clients/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ✅ OK | Usa `/website-clients/` direto |
| **Stats** | ✅ OK | Usa `/website-clients/stats` |
| **Editar** | ❌ Em falta | Backend tem PUT mas UI não expõe |
| **Apagar** | ❌ Em falta | Não existe no backend nem UI |
| **Toggle ativo** | ⚠️ Parcial | Backend tem mas UI não expõe |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ⚠️ Parcial (`/backend/app/routers/website_clients.py`)
- `GET /website-clients/` ✅
- `GET /website-clients/stats` ✅
- `PUT /website-clients/{id}` ✅ **← UI não usa!**
- `PUT /website-clients/{id}/toggle-active` ✅ **← UI não usa!**
- `DELETE /website-clients/{id}` ❌ **← Não existe**

**Ação necessária:**
- [ ] Adicionar DELETE no backend
- [ ] Criar modal de edição na UI
- [ ] Botão toggle ativo na UI
- [ ] Botão apagar na UI
- [ ] Adicionar RoleContext

---

### 6️⃣ VISITAS (`/backoffice/visits/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ❌ Em falta | Página só mostra "Nenhuma visita" |
| **Criar** | ⚠️ Parcial | Formulário existe mas só console.log |
| **Editar** | ❌ Em falta | Não implementado |
| **Apagar** | ❌ Em falta | Não implementado |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ✅ Endpoints existem em `/mobile/visits`
- `GET /mobile/visits` ✅
- `GET /mobile/visits/{id}` ✅
- `POST /mobile/visits` ✅
- `PUT /mobile/visits/{id}` ✅
- `PATCH /mobile/visits/{id}/status` ✅

**Problema:** Página não está conectada ao backend!

**Ação necessária:**
- [ ] Conectar a `/mobile/visits` (ou criar alias `/visits/`)
- [ ] Implementar listagem real
- [ ] Implementar criação funcional
- [ ] Adicionar RoleContext

---

### 7️⃣ OPORTUNIDADES (`/backoffice/opportunities/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ❌ Em falta | Página só mostra "Nenhuma oportunidade" |
| **Criar** | ⚠️ Parcial | Formulário existe mas só console.log |
| **Editar** | ❌ Em falta | Não implementado |
| **Apagar** | ❌ Em falta | Não implementado |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ❌ **NÃO EXISTE endpoint `/opportunities/`**

**Ação necessária:**
- [ ] **CRIAR** `/backend/app/opportunities/` com router completo
- [ ] Modelo: Opportunity (lead_id, property_id, valor_proposto, status, agente_id, etc.)
- [ ] Conectar página ao endpoint
- [ ] Adicionar RoleContext

---

### 8️⃣ PROPOSTAS (`/backoffice/proposals/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ❌ Em falta | Página só mostra estado vazio |
| **Criar** | ⚠️ Parcial | Formulário existe mas só console.log |
| **Editar** | ❌ Em falta | Não implementado |
| **Apagar** | ❌ Em falta | Não implementado |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ❌ **NÃO EXISTE endpoint `/proposals/`**

**Ação necessária:**
- [ ] **CRIAR** `/backend/app/proposals/` com router completo
- [ ] Modelo: Proposal (opportunity_id, valor, condições, estado, etc.)
- [ ] Conectar página ao endpoint
- [ ] Adicionar RoleContext

---

### 9️⃣ EQUIPAS (`/backoffice/teams/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ✅ OK | Usa backofficeApi → `/teams/` |
| **Criar** | ✅ OK | TeamForm funcional |
| **Editar** | ✅ OK | PUT via Drawer |
| **Apagar** | ✅ OK | DELETE funcional |
| **RoleContext** | ✅ OK | Verifica permissões |

**Backend:** ✅ Router completo (`/backend/app/teams/routes.py`)

**Status:** 🟢 COMPLETO

---

### 🔟 IMÓVEIS (`/backoffice/properties/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ✅ OK | CRUD completo via backofficeApi |
| **Criar** | ✅ OK | PropertyForm funcional |
| **Editar** | ✅ OK | Página `[id]/editar/` |
| **Apagar** | ✅ OK | DELETE funcional |
| **RoleContext** | ⚠️ Parcial | Não verifica permissões granulares |

**Backend:** ✅ Router completo (`/backend/app/properties/routes.py`)

**Status:** 🟢 COMPLETO (exceto RoleContext granular)

---

### 1️⃣1️⃣ AGENTES (`/backoffice/agents/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ✅ OK | Lista agentes e staff |
| **Criar** | ✅ OK | Páginas `new/` e `new-staff/` |
| **Editar** | ✅ OK | Página `[id]/editar/` |
| **Desativar** | ⚠️ Parcial | Botão existe sem implementação |
| **RoleContext** | ❌ Em falta | Não verifica permissões |

**Backend:** ✅ Router completo (`/backend/app/agents/routes.py`)

**Ação necessária:**
- [ ] Implementar desativação de agente
- [ ] Adicionar RoleContext (só admin/coordinator)

---

### 1️⃣2️⃣ UTILIZADORES (`/backoffice/users/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ✅ OK | Via API proxy |
| **CRUD** | ✅ OK | Funcional |
| **RoleContext** | ⚠️ Parcial | Deveria ser só admin |

**Backend:** ✅ Router completo (`/backend/app/users/routes.py`)

**Status:** 🟢 COMPLETO

---

### 1️⃣3️⃣ RELATÓRIOS (`/backoffice/reports/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **KPIs** | ⚠️ Parcial | Carrega de `/api/dashboard/kpis` |
| **Exportar** | ❌ Em falta | Diz "em desenvolvimento" |
| **Filtros** | ⚠️ Parcial | Filtros existem mas limitados |
| **RoleContext** | ❌ Em falta | Deveria restringir acesso |

**Backend:** ⚠️ Usa dashboard API, não tem reports dedicados

**Ação necessária:**
- [ ] Criar endpoint `/reports/` dedicado
- [ ] Implementar exportação (PDF/Excel)
- [ ] Adicionar RoleContext

---

### 1️⃣4️⃣ DASHBOARD (`/backoffice/dashboard/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **KPIs** | ✅ OK | Carrega de `/api/dashboard/kpis` |
| **Rankings** | ✅ OK | Rankings de agentes |
| **Leads recentes** | ✅ OK | Funcional |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ✅ Router funcional (`/backend/app/api/dashboard.py`)

**Status:** 🟢 FUNCIONAL

---

### 1️⃣5️⃣ FEED (`/backoffice/feed/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Listagem** | ✅ OK | Carrega atividades |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ✅ Router funcional (`/backend/app/feed/routes.py`)

**Status:** 🟡 PARCIAL (falta RoleContext)

---

### 1️⃣6️⃣ CONFIGURAÇÕES (`/backoffice/config/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Branding** | ⚠️ Parcial | Existe mas limitado |
| **Watermark** | ✅ OK | Funcional com API |
| **RoleContext** | ❌ Em falta | Deveria ser só admin |

**Status:** 🟡 PARCIAL

---

### 1️⃣7️⃣ MARKETING (`/backoffice/marketing/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Criar campanha** | ⚠️ Mock | Formulário existe mas sem backend |
| **Listagem** | ❌ Em falta | Não existe |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ❌ Não existe endpoint `/marketing/`

**Ação necessária:**
- [ ] Avaliar se é prioritário ou remover página

---

### 1️⃣8️⃣ AUTOMAÇÃO (`/backoffice/automation/`)

| Funcionalidade | Status | Detalhe |
|----------------|--------|---------|
| **Regras** | ⚠️ Mock | UI existe mas sem backend |
| **RoleContext** | ❌ Em falta | Não usa |

**Backend:** ❌ Não existe endpoint `/automation/`

**Ação necessária:**
- [ ] Avaliar se é prioritário ou remover página

---

## 🔴 ENDPOINTS EM FALTA NO BACKEND

| # | Endpoint | Usado Por | Prioridade | Esforço |
|---|----------|-----------|------------|---------|
| 1 | `/clients/` (CRUD) | clients/ | 🔴 Alta | 4h |
| 2 | `/opportunities/` (CRUD) | opportunities/ | 🔴 Alta | 4h |
| 3 | `/proposals/` (CRUD) | proposals/ | 🔴 Alta | 4h |
| 4 | `DELETE /website-clients/{id}` | website-clients/ | 🟠 Média | 30min |

---

## ⚠️ ENDPOINTS EXISTENTES MAS NÃO USADOS PELA UI

| Endpoint | Router | UI Deveria Usar |
|----------|--------|-----------------|
| `PUT /pre-angariacoes/{id}` | pre_angariacoes.py | Edição de pré-angariação |
| `PUT /website-clients/{id}` | website_clients.py | Edição de cliente website |
| `PUT /website-clients/{id}/toggle-active` | website_clients.py | Toggle ativo |
| `/calendar/tasks` (CRUD) | calendar/routes.py | Agenda |
| `/mobile/visits` (CRUD) | mobile/routes.py | Visitas |

---

## 📋 PLANO DE AÇÃO PRIORITIZADO

### 🔴 FASE 1 - CRÍTICO (Semana 1)

#### Backend (2 dias)
1. **Criar `/clients/` router** (4h)
   - Modelo: `Client` (nome, email, telefone, tipo, agente_id, notas, created_at)
   - CRUD completo com filtros por agente

2. **Criar `/opportunities/` router** (4h)
   - Modelo: `Opportunity` (lead_id, property_id, valor_proposto, status, agente_id)
   - Status: novo, em_negociacao, aceite, rejeitado, cancelado

3. **Criar `/proposals/` router** (4h)
   - Modelo: `Proposal` (opportunity_id, valor, condicoes, estado, data_validade)
   - Ligação com opportunity

4. **Adicionar DELETE em website_clients** (30min)

#### Frontend (3 dias)
5. **Conectar pages aos endpoints:**
   - clients/ → `/clients/`
   - opportunities/ → `/opportunities/`
   - proposals/ → `/proposals/`
   - visits/ → `/mobile/visits`
   - agenda/ → `/calendar/tasks` ou `/mobile/visits`

---

### 🟠 FASE 2 - ALTA (Semana 2)

6. **Adicionar RoleContext a todas as páginas** (1 dia)
   ```tsx
   import { useRole } from '@/context/roleContext';
   const { role, isAdmin, canEdit } = useRole();
   ```

7. **Criar página edição pré-angariações** (4h)
   - `pre-angariacoes/[id]/editar/page.tsx`
   - Usar PUT existente

8. **Melhorar website-clients** (2h)
   - Modal de edição
   - Botão toggle ativo
   - Botão apagar

9. **Implementar desativação de agentes** (2h)

---

### 🟡 FASE 3 - MÉDIA (Semana 3)

10. **Melhorar agenda/** (4h)
    - Decidir: usar Tasks ou Visits ou ambos
    - Implementar criação funcional
    - Implementar edição/remoção

11. **Criar endpoint `/reports/`** (4h)
    - Relatórios por período
    - Exportação PDF/Excel

12. **Páginas de detalhe [id]/ em falta:**
    - `clients/[id]/page.tsx`
    - `opportunities/[id]/page.tsx`
    - `proposals/[id]/page.tsx`

---

### 🟢 FASE 4 - BAIXA (Semana 4+)

13. **Avaliar e decidir sobre:**
    - marketing/ - manter ou remover?
    - automation/ - manter ou remover?
    - calculator/ - necessário?
    - simulator/ - necessário?

14. **Melhorias de UX:**
    - Filtros avançados em todas as listagens
    - Paginação server-side
    - Ordenação por colunas

---

## 📊 ESTIMATIVA DE ESFORÇO TOTAL

| Fase | Esforço | Prioridade |
|------|---------|------------|
| Fase 1 | ~5 dias | Crítico |
| Fase 2 | ~3 dias | Alto |
| Fase 3 | ~3 dias | Médio |
| Fase 4 | ~2 dias | Baixo |
| **TOTAL** | **~13 dias** | - |

---

## 🎯 QUICK WINS (Correções Rápidas < 1h cada)

1. ✅ Autenticação em agents/ - **FEITO**
2. [ ] DELETE website-clients - 30min
3. [ ] Toggle ativo website-clients UI - 30min
4. [ ] Conectar visits/ a /mobile/visits - 1h
5. [ ] Conectar agenda/ a /calendar/tasks - 1h

---

## 📝 NOTAS FINAIS

### O que FUNCIONA BEM:
- Leads (CRUD completo + RoleContext) ✅
- Teams (CRUD completo + RoleContext) ✅
- Properties (CRUD completo) ✅
- Agents (CRUD quase completo) ✅
- Dashboard (funcional) ✅
- Users (funcional) ✅

### O que PRECISA de ATENÇÃO URGENTE:
- Clients (endpoint não existe)
- Opportunities (endpoint não existe)
- Proposals (endpoint não existe)
- Pre-angariações (edição não funciona)
- Agenda (não conectada ao backend)
- Visits (não conectada ao backend)

### O que está ABANDONADO/MOCK:
- Marketing (sem backend)
- Automation (sem backend)
- Calculator/Simulator (funcionalidade limitada)
