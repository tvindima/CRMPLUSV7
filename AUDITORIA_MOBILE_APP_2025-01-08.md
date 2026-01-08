# 🔍 AUDITORIA PROFUNDA - MOBILE APP CRM PLUS V7

**Data:** 8 de Janeiro de 2025  
**Diretório Analisado:** `/mobile/app/`  
**Backend Comparativo:** `/backend/app/`

---

## 📊 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Serviços Analisados** | 12 |
| **Ecrãs Analisados** | 8 principais |
| **Endpoints Mobile Usados** | ~65 |
| **Endpoints Backend Disponíveis** | ~120+ |
| **Taxa de Utilização** | ~54% |
| **Arquitetura API Centralizada** | ⚠️ **PARCIAL** |

---

## 1️⃣ ANÁLISE DOS SERVIÇOS (`src/services/`)

### 📁 **api.ts** - Serviço API Centralizado ✅
**Tipo:** Singleton Class `ApiService`  
**URL Base:** `process.env.EXPO_PUBLIC_API_URL`

**Funcionalidades Implementadas:**
- ✅ Interceptor JWT com refresh automático de tokens
- ✅ Header `X-Tenant-Slug` para multi-tenancy
- ✅ Error handling padronizado (400, 401, 403, 404, 409, 422, 500, 503)
- ✅ Métodos: `get`, `post`, `put`, `patch`, `delete`
- ✅ Upload de ficheiros (`uploadFile`)
- ✅ Download de ficheiros/blobs (`download`)
- ✅ Fila de requisições durante refresh token

**Endpoints Chamados:**
- `POST /auth/refresh` - Refresh token

---

### 📁 **auth.ts** - Autenticação ✅
**Usa apiService:** ⚠️ **PARCIAL** (usa fetch direto para login)

**Endpoints Chamados:**
| Endpoint | Método | Usa apiService |
|----------|--------|----------------|
| `/auth/login` | POST | ❌ fetch direto |
| `/auth/refresh` | POST | ❌ fetch direto |
| `/auth/logout` | POST | ✅ apiService |
| `/auth/me` | GET | ✅ apiService |

**Problema Identificado:**
- Login e refresh usam `fetch` direto em vez do `apiService`
- Header `X-Tenant-Slug` **NÃO incluído** no login (vulnerabilidade multi-tenant)

---

### 📁 **clientService.ts** - Gestão de Clientes ⚠️
**Usa apiService:** ❌ **NÃO** - Usa fetch direto com API_URL hardcoded

**URL Base:** `https://crmplusv7-production.up.railway.app` (hardcoded)

**Endpoints Chamados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/clients/` | GET | Listar clientes por agente |
| `/clients/{id}` | GET | Obter cliente |
| `/clients/` | POST | Criar cliente |
| `/clients/{id}` | PUT | Atualizar cliente |
| `/clients/{id}/notes` | PATCH | Atualizar notas |
| `/clients/{id}` | DELETE | Eliminar cliente |
| `/clients/birthdays` | GET | Aniversários próximos |
| `/clients/stats` | GET | Estatísticas |
| `/clients/from-angariacao` | POST | Criar de angariação |

**⚠️ PROBLEMA CRÍTICO:**
- **NÃO usa apiService** - não tem header `X-Tenant-Slug`
- URL hardcoded quebra multi-tenancy
- Não tem refresh automático de tokens

---

### 📁 **cmiService.ts** - Contratos de Mediação ✅
**Usa apiService:** ✅ **SIM**

**Endpoints Chamados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/cmi/` | GET | Listar CMIs |
| `/cmi/{id}` | GET | Obter CMI |
| `/cmi/from-first-impression` | POST | Criar de 1ª Impressão |
| `/cmi/by-first-impression/{id}` | GET | Buscar por 1ª Impressão |
| `/cmi/{id}` | PUT | Atualizar |
| `/cmi/{id}` | DELETE | Cancelar |
| `/cmi/{id}/assinatura-cliente` | POST | Adicionar assinatura cliente |
| `/cmi/{id}/assinatura-mediador` | POST | Adicionar assinatura mediador |
| `/cmi/{id}/ocr` | POST | Processar OCR |
| `/cmi/ocr/extract` | POST | OCR standalone |
| `/cmi/{id}/documentos/{tipo}` | PUT | Marcar documento |
| `/cmi/stats` | GET | Estatísticas |
| `/cmi/{id}/pdf` | GET | Download PDF |

---

### 📁 **firstImpressionService.ts** - Primeiras Impressões ✅
**Usa apiService:** ✅ **SIM**

**Endpoints Chamados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/mobile/first-impressions` | POST | Criar |
| `/mobile/first-impressions` | GET | Listar |
| `/mobile/first-impressions/{id}` | GET | Obter |
| `/mobile/first-impressions/{id}` | PUT | Atualizar |
| `/mobile/first-impressions/{id}/signature` | POST | Adicionar assinatura |
| `/mobile/first-impressions/{id}/cancel` | POST | Cancelar |
| `/mobile/first-impressions/{id}` | DELETE | Apagar |

---

### 📁 **preAngariacaoService.ts** - Pré-Angariações ✅
**Usa apiService:** ✅ **SIM**

**Endpoints Chamados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/pre-angariacoes/from-first-impression` | POST | Criar de 1ª Impressão |
| `/pre-angariacoes` | GET | Listar |
| `/pre-angariacoes/{id}` | GET | Obter |
| `/pre-angariacoes/by-first-impression/{id}` | GET | Buscar por 1ª Impressão |
| `/pre-angariacoes/{id}` | PUT | Atualizar |
| `/pre-angariacoes/{id}` | DELETE | Eliminar |
| `/pre-angariacoes/{id}/documentos` | POST | Adicionar documento |
| `/pre-angariacoes/{id}/documentos/{idx}` | DELETE | Remover documento |

---

### 📁 **visits.ts** - Sistema de Visitas ✅
**Usa apiService:** ✅ **SIM**

**Endpoints Chamados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/mobile/visits` | GET | Listar visitas |
| `/mobile/visits/upcoming` | GET | Próximas visitas |
| `/mobile/visits/{id}` | GET | Obter visita |
| `/mobile/visits` | POST | Criar visita |
| `/mobile/visits/{id}` | PUT | Atualizar |
| `/mobile/visits/{id}` | DELETE | Eliminar |
| `/mobile/visits/{id}/check-in` | POST | Check-in GPS |
| `/mobile/visits/{id}/check-out` | POST | Check-out |
| `/mobile/visits/{id}/cancel` | POST | Cancelar |
| `/mobile/visits/{id}/reschedule` | POST | Reagendar |
| `/mobile/visits/stats` | GET | Estatísticas |

---

### 📁 **cloudinary.ts** - Upload de Fotos ✅
**Usa apiService:** ✅ **SIM** (para config e salvar URLs)

**Endpoints Chamados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/mobile/cloudinary/upload-config` | GET | Obter config |
| `/mobile/properties/{id}/photos/bulk` | POST | Salvar URLs |

**Fluxo:**
1. Obtém config do backend
2. Upload direto para Cloudinary (client-side)
3. Envia URLs para backend salvar na BD

---

### 📁 **websocket.ts** - Notificações Real-Time ✅
**Usa apiService:** ⚠️ **PARCIAL** - WebSocket nativo

**Endpoint WebSocket:**
- `wss://{baseURL}/mobile/ws?token={jwt}`

**Eventos Suportados:**
- `connected` - Conexão estabelecida
- `pong` - Keep-alive
- `new_lead` - Novo lead atribuído
- `visit_scheduled` - Visita agendada
- `visit_reminder` - Lembrete de visita
- `error` - Erro de conexão

**Features:**
- ✅ Reconnect automático com backoff exponencial
- ✅ Ping/pong a cada 30s
- ✅ Máximo 5 tentativas de reconexão

---

### 📁 **leads.ts** - VAZIO ❌
**Estado:** Ficheiro existe mas está **completamente vazio**

**Impacto:** Os ecrãs de leads usam o `apiService` diretamente

---

### 📁 **properties.ts** - VAZIO ❌
**Estado:** Ficheiro existe mas está **completamente vazio**

**Impacto:** O ecrã de propriedades usa o `apiService` diretamente

---

### 📁 **sessions.ts** - VAZIO ❌
**Estado:** Ficheiro existe mas está **completamente vazio**

---

## 2️⃣ ANÁLISE DOS ECRÃS PRINCIPAIS

### 📱 **HomeScreenV5.tsx** - Dashboard
**Endpoints Usados:**
| Endpoint | Serviço | Descrição |
|----------|---------|-----------|
| `/mobile/dashboard/stats` | apiService | Estatísticas do agente |
| `/mobile/site-preferences` | apiService | Preferências do site |
| `/agents/{id}` | apiService | Dados do agente |

**Features:**
- ✅ Pull-to-refresh com cache via AgentContext
- ✅ Atalhos personalizáveis (AsyncStorage local)
- ✅ Navegação para todos os módulos

---

### 📱 **ClientsScreen.tsx** - Clientes ⚠️
**Endpoints Usados:**
| Endpoint | Método | Usa apiService |
|----------|--------|----------------|
| `/clients/with-leads` | GET | ❌ fetch direto |
| `/clients/birthdays` | GET | ❌ fetch direto |
| `/clients/stats` | GET | ❌ fetch direto |
| `/clients/` | POST | ❌ fetch direto |
| `/clients/{id}` | PUT | ❌ fetch direto |

**⚠️ PROBLEMA:**
- Usa `fetch` direto com URL hardcoded
- Inclui `X-Tenant-Slug` manualmente via `getHeaders()`
- Não usa `clientService.ts` nem `apiService`

---

### 📱 **PropertiesScreenV4.tsx** - Imóveis ✅
**Endpoints Usados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/mobile/dashboard/stats` | GET | Obter agent_id |
| `/agents/{id}` | GET | Dados do agente |
| `/mobile/properties` | GET | Listar propriedades |

**Features:**
- ✅ Filtros completos (tipo, tipologia, preço, área)
- ✅ Toggle meus/agência
- ✅ Pull-to-refresh

---

### 📱 **LeadsScreenV4.tsx** - Leads ✅
**Endpoints Usados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/mobile/dashboard/stats` | GET | Obter agent_id |
| `/agents/{id}` | GET | Dados do agente |
| `/mobile/leads` | GET | Listar leads |

**Features:**
- ✅ Tabs: Em Progresso, Novos, Convertidos
- ✅ Filtro por status múltiplo
- ✅ Navegação para Clientes

---

### 📱 **AgendaScreenV5.tsx** - Agenda ✅
**Endpoints Usados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/mobile/events` | GET | Listar eventos |
| `/mobile/events` | POST | Criar evento |
| `/properties` | GET | Lista para seleção |
| `/mobile/leads` | GET | Lista para seleção |

**Features:**
- ✅ Calendário mensal com marcações
- ✅ Tipos de evento: Visita, Reunião, Tarefa, Chamada, Pessoal
- ✅ Duração configurável

---

### 📱 **FirstImpressionFormScreen.tsx** - VAZIO ❌
**Estado:** Ficheiro existe mas está **completamente vazio**

**Impacto:** Funcionalidade de criar 1ª impressão não funciona neste ecrã

---

### 📱 **CMIFormScreen.tsx** - Contrato de Mediação ✅
**Endpoints Usados (via serviços):**
| Endpoint | Serviço | Descrição |
|----------|---------|-----------|
| `/cmi/*` | cmiService | CRUD de CMI |
| `/mobile/first-impressions/*` | firstImpressionService | Dados da 1ª Impressão |
| `/pre-angariacoes/*` | preAngariacaoService | Pré-angariação |
| `/clients/*` | clientService | Gestão de clientes |

**Features:**
- ✅ OCR para documentos (CC, Caderneta, Certidão)
- ✅ Assinaturas digitais
- ✅ Download PDF
- ✅ Suporte múltiplos proprietários

---

### 📱 **ProfileScreenV6.tsx** - Perfil ✅
**Endpoints Usados:**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/mobile/dashboard/stats` | GET | Estatísticas |
| `/agents/{id}` | GET | Dados do agente |
| `/mobile/site-preferences` | GET | Preferências |
| `/mobile/site-preferences` | PUT | Atualizar preferências |

**Features:**
- ✅ Edição de perfil (nome, telefone, bio)
- ✅ Upload de foto de perfil
- ✅ Redes sociais (Instagram, Facebook, LinkedIn, etc.)

---

## 3️⃣ COMPARAÇÃO COM O BACKEND

### Endpoints Backend DISPONÍVEIS mas NÃO USADOS na App Mobile

#### 📦 **Módulo Mobile (`/mobile/*`)**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/mobile/version` | GET | Versão da API |
| `/mobile/auth/me` | GET | Perfil completo (usa /agents/{id} em vez) |
| `/mobile/auth/change-password` | POST | Alterar password |
| `/mobile/auth/assistants` | GET | Listar assistentes |
| `/mobile/auth/change-assistant-password` | POST | Alterar pwd assistente |
| `/mobile/properties/{id}` | GET | Detalhe propriedade |
| `/mobile/properties` | POST | Criar propriedade |
| `/mobile/properties/{id}` | PUT | Atualizar propriedade |
| `/mobile/properties/{id}/status` | PATCH | Mudar status |
| `/mobile/properties/{id}/photos/upload` | POST | Upload foto servidor |
| `/mobile/leads/{id}` | GET | Detalhe lead |
| `/mobile/leads/{id}/status` | PATCH | Mudar status |
| `/mobile/leads/{id}` | PUT | Atualizar lead |
| `/mobile/leads/{id}/contact` | POST | Registar contacto |
| `/mobile/leads/{id}/convert` | PUT | Converter em cliente |
| `/mobile/leads` | POST | **Criar lead** |
| `/mobile/tasks` | GET/POST | Gestão de tarefas |
| `/mobile/tasks/today` | GET | Tarefas de hoje |
| `/mobile/tasks/{id}` | GET/PUT/DELETE | CRUD tarefa |
| `/mobile/tasks/{id}/status` | PATCH | Mudar status |
| `/mobile/dashboard/recent-activity` | GET | Atividade recente |
| `/mobile/visits/today` | GET | Visitas de hoje (widget) |
| `/mobile/visits/{id}/feedback` | POST | Adicionar feedback |
| `/mobile/calendar/day/{date}` | GET | Visitas do dia |
| `/mobile/calendar/month/{year}/{month}` | GET | Marcações do mês |

#### 📦 **Módulo Clients (`/clients/*`)**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/clients/search` | GET | Pesquisa avançada |
| `/clients/{id}/transacoes` | GET/POST | Histórico transações |
| `/clients/{id}/documentos` | GET/POST | Documentos do cliente |

#### 📦 **Módulo Pré-Angariações (`/pre-angariacoes/*`)**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/pre-angariacoes/stats` | GET | Estatísticas |
| `/pre-angariacoes/{id}/fotos` | POST | Adicionar fotos |
| `/pre-angariacoes/{id}/activar` | POST | Activar angariação |

#### 📦 **Módulo CMI (`/cmi/*`)**
| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/cmi/{id}/finalizar` | POST | Finalizar contrato |
| `/cmi/{id}/renovar` | POST | Renovar contrato |

#### 📦 **Outros Módulos NÃO Usados**
| Router | Prefixo | Descrição |
|--------|---------|-----------|
| `match_plus_router` | `/match-plus` | Match de leads com imóveis |
| `assistant_router` | `/assistant` | Assistente IA |
| `notifications_router` | `/notifications` | Centro de notificações |
| `billing_router` | `/billing` | Faturação |
| `reports_router` | `/reports` | Relatórios e analytics |
| `feed_router` | `/feed` | Feed de atividade |
| `escrituras_router` | `/escrituras` | Agendamento escrituras |

---

## 4️⃣ SINCRONIZAÇÃO E CACHE

### Estado Atual
| Feature | Implementado | Descrição |
|---------|--------------|-----------|
| **Cache Local** | ✅ Parcial | `AgentContext` com cache 30s para stats |
| **Pull-to-Refresh** | ✅ Sim | Todos os ecrãs principais |
| **Offline Mode** | ❌ Não | Não há suporte offline |
| **Sync Automático** | ❌ Não | Não há sync em background |
| **Persistência** | ✅ Parcial | Apenas tokens e shortcuts |

### Armazenamento Local (AsyncStorage)
| Chave | Uso |
|-------|-----|
| `@crm_plus_access_token` | JWT access token |
| `@crm_plus_refresh_token` | JWT refresh token |
| `@crm_plus_user_data` | Dados do utilizador |
| `@crm_plus_shortcuts` | Atalhos personalizados |
| `expires_at` | Expiração do token |

### WebSocket Real-Time
- ✅ Conexão WebSocket para notificações
- ✅ Eventos: new_lead, visit_scheduled, visit_reminder
- ✅ Reconnect automático
- ⚠️ Não há UI para exibir notificações recebidas

---

## 5️⃣ PROBLEMAS DE ARQUITETURA IDENTIFICADOS

### 🔴 CRÍTICOS

1. **clientService.ts NÃO usa apiService**
   - URL hardcoded `https://crmplusv7-production.up.railway.app`
   - Sem `X-Tenant-Slug` automático
   - Quebra multi-tenancy para outros tenants

2. **auth.ts - Login sem X-Tenant-Slug**
   - O endpoint `/auth/login` é chamado com fetch direto
   - Header `X-Tenant-Slug` não incluído
   - Pode autenticar no tenant errado

3. **Ficheiros de Serviço VAZIOS**
   - `leads.ts` - vazio
   - `properties.ts` - vazio
   - `sessions.ts` - vazio
   - `FirstImpressionFormScreen.tsx` - vazio

4. **ClientsScreen.tsx usa fetch direto**
   - Não usa clientService nem apiService
   - Código duplicado para headers

### 🟡 MÉDIOS

5. **Inconsistência de Padrões**
   - Alguns serviços são classes, outros são objetos
   - Alguns ecrãs usam serviços, outros usam apiService direto

6. **Falta de Tipagem Centralizada**
   - Interfaces duplicadas em vários ficheiros
   - Sem ficheiro de tipos central para API responses

7. **Sem Tratamento de Erro Centralizado**
   - Cada ecrã implementa tratamento de erro diferente
   - Não há componente global de erro

### 🟢 MENORES

8. **Ficheiros Duplicados**
   - Múltiplas versões de ecrãs (V2, V3, V4, V5, V6)
   - Alguns com sufixo " 2.tsx"

9. **Logs de Debug em Produção**
   - `console.log` extensivos nos serviços

---

## 6️⃣ FUNCIONALIDADES QUE FALTAM IMPLEMENTAR

### Alta Prioridade
| Funcionalidade | Endpoint Backend | Estado |
|----------------|------------------|--------|
| **Criar Lead na App** | `POST /mobile/leads` | ⚠️ NewLeadScreen existe |
| **Alterar Password** | `POST /mobile/auth/change-password` | ❌ Não implementado |
| **Criar Propriedade** | `POST /mobile/properties` | ❌ Não implementado |
| **Editar Propriedade** | `PUT /mobile/properties/{id}` | ❌ Não implementado |
| **Upload Fotos Servidor** | `POST /mobile/properties/{id}/photos/upload` | ⚠️ Usa Cloudinary |
| **Gestão de Tarefas** | `/mobile/tasks/*` | ❌ Não implementado |

### Média Prioridade
| Funcionalidade | Endpoint Backend | Estado |
|----------------|------------------|--------|
| **Match Plus** | `/match-plus/*` | ❌ Não implementado |
| **Assistente IA** | `/assistant/*` | ❌ Não implementado |
| **Centro Notificações** | `/notifications/*` | ❌ Não implementado |
| **Relatórios** | `/reports/*` | ❌ Não implementado |
| **Atividade Recente** | `/mobile/dashboard/recent-activity` | ❌ Não implementado |
| **Gestão Assistentes** | `/mobile/auth/assistants` | ❌ Não implementado |

### Baixa Prioridade
| Funcionalidade | Endpoint Backend | Estado |
|----------------|------------------|--------|
| **Faturação** | `/billing/*` | ❌ Não implementado |
| **Feed** | `/feed/*` | ❌ Não implementado |
| **Escrituras** | `/escrituras/*` | ❌ Não implementado |

---

## 7️⃣ RECOMENDAÇÕES DE MELHORIAS

### Imediatas (Críticas)

1. **Refatorar clientService.ts**
```typescript
// ANTES (problemático)
const API_URL = 'https://crmplusv7-production.up.railway.app';
const response = await fetch(`${API_URL}/clients/...`);

// DEPOIS (correto)
import { apiService } from './api';
const response = await apiService.get('/clients/...');
```

2. **Corrigir auth.ts - Login**
```typescript
// Adicionar X-Tenant-Slug ao login
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};
if (TENANT_SLUG) {
  headers['X-Tenant-Slug'] = TENANT_SLUG;
}
```

3. **Implementar leads.ts e properties.ts**
   - Criar serviços dedicados usando apiService
   - Remover chamadas diretas dos ecrãs

### Curto Prazo (1-2 semanas)

4. **Implementar Gestão de Tarefas**
   - Novo ecrã TasksScreen
   - Usar endpoints `/mobile/tasks/*`
   - Widget de tarefas no HomeScreen

5. **Criar Funcionalidade de Criar Lead**
   - Endpoint `POST /mobile/leads` existe
   - NewLeadScreen precisa ser verificado

6. **Implementar Alterar Password**
   - Nova opção no ProfileScreen
   - Endpoint `POST /mobile/auth/change-password`

### Médio Prazo (1 mês)

7. **Implementar Modo Offline**
   - Cache de dados essenciais
   - Sincronização quando online
   - Indicador de estado de conexão

8. **Centralizar Tipos**
   - Criar `src/types/api.ts`
   - Exportar interfaces de todas as respostas da API

9. **Implementar Centro de Notificações**
   - UI para WebSocket events
   - Badge de notificações não lidas
   - Histórico de notificações

### Longo Prazo (2-3 meses)

10. **Match Plus na App**
    - Match de leads com imóveis
    - Sugestões automáticas

11. **Assistente IA**
    - Chat com IA integrado
    - Sugestões contextuais

12. **Relatórios Mobile**
    - Dashboard de KPIs
    - Gráficos de performance

---

## 8️⃣ MATRIZ DE ENDPOINTS

### Endpoints 100% Funcionais ✅
```
POST /auth/logout
GET  /auth/me
GET  /mobile/dashboard/stats
GET  /mobile/properties
GET  /mobile/leads
GET  /mobile/visits
GET  /mobile/visits/upcoming
POST /mobile/visits
PUT  /mobile/visits/{id}
POST /mobile/visits/{id}/check-in
POST /mobile/visits/{id}/check-out
GET  /mobile/events
POST /mobile/events
GET  /mobile/site-preferences
PUT  /mobile/site-preferences
GET  /mobile/cloudinary/upload-config
POST /mobile/properties/{id}/photos/bulk
GET  /agents/{id}
GET  /mobile/first-impressions
POST /mobile/first-impressions
PUT  /mobile/first-impressions/{id}
POST /mobile/first-impressions/{id}/signature
GET  /pre-angariacoes
POST /pre-angariacoes/from-first-impression
PUT  /pre-angariacoes/{id}
GET  /cmi
POST /cmi/from-first-impression
PUT  /cmi/{id}
POST /cmi/{id}/ocr
GET  /cmi/{id}/pdf
```

### Endpoints com Problemas ⚠️
```
POST /auth/login          → Falta X-Tenant-Slug
GET  /clients/*           → Não usa apiService
POST /clients/*           → Não usa apiService
PUT  /clients/*           → Não usa apiService
```

### Endpoints Disponíveis mas Não Usados ❌
```
POST /mobile/leads
GET  /mobile/tasks
POST /mobile/tasks
GET  /mobile/dashboard/recent-activity
POST /mobile/auth/change-password
GET  /mobile/auth/assistants
/match-plus/*
/assistant/*
/notifications/*
/reports/*
/billing/*
/feed/*
/escrituras/*
```

---

## 📋 CONCLUSÃO

A app mobile CRM Plus V7 tem uma base sólida com o `apiService` centralizado, mas apresenta **inconsistências críticas** na utilização desse serviço, especialmente no módulo de **Clientes** e na **autenticação**.

**Pontos Fortes:**
- ✅ Sistema de refresh token automático
- ✅ Suporte multi-tenant (quando apiService é usado)
- ✅ WebSocket para notificações real-time
- ✅ Upload de fotos via Cloudinary (client-side)

**Pontos a Melhorar:**
- ❌ clientService não usa apiService
- ❌ Login sem X-Tenant-Slug
- ❌ ~46% dos endpoints backend não são usados
- ❌ Sem modo offline
- ❌ Ficheiros de serviço vazios

**Prioridade de Correção:**
1. 🔴 Corrigir clientService.ts (CRÍTICO - multi-tenant)
2. 🔴 Corrigir auth.ts login header (CRÍTICO - multi-tenant)
3. 🟡 Implementar leads.ts e properties.ts
4. 🟡 Implementar gestão de tarefas
5. 🟢 Adicionar funcionalidades faltantes

---

*Relatório gerado automaticamente em 8 de Janeiro de 2025*
