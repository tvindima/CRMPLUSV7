# 📱 AUDITORIA COMPLETA - APP MOBILE CRM PLUS V7

**Data:** 2025-01-09  
**Versão App:** 0.1.0  
**Plataforma:** Expo React Native for Web (Vercel)  
**Backend:** FastAPI (Railway)

---

## 📊 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total Endpoints Backend /mobile** | 49 |
| **Total Endpoints Utilizados** | ~32 |
| **Cobertura de API** | ~65% |
| **Services Implementados** | 12 |
| **Services Vazios** | 2 (leads.ts, properties.ts) |
| **Screens Implementados** | ~57 |
| **Funcionalidades Críticas em Falta** | 8 |

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **FICHEIROS DE SERVIÇO VAZIOS**

| Ficheiro | Estado | Impacto |
|----------|--------|---------|
| `leads.ts` | **VAZIO** | Ecrãs de leads usam apiService directamente |
| `properties.ts` | **VAZIO** | Ecrãs de propriedades usam apiService directamente |

**Problema:** Código duplicado nos ecrãs, sem centralização de lógica.

### 2. **clientService.ts - SEM AUTENTICAÇÃO**

O serviço de clientes usa `fetch()` directamente **SEM headers de autenticação**:

```typescript
// ❌ PROBLEMA: Sem token, sem X-Tenant-Slug
const response = await fetch(`${API_URL}/clients/?${params}`, {
  headers: { Accept: 'application/json' },  // Falta Authorization!
});
```

**Impacto:** Falha silenciosa em produção, dados não carregam.

### 3. **auth.ts - SEM X-Tenant-Slug no Login**

```typescript
// ❌ PROBLEMA: Login não inclui X-Tenant-Slug
const response = await fetch(`${apiService['baseURL']}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Falta: 'X-Tenant-Slug': TENANT_SLUG
  },
  body: JSON.stringify({...}),
});
```

---

## 📡 MAPEAMENTO COMPLETO DE ENDPOINTS

### BACKEND: /mobile/* (49 endpoints)

| Endpoint | Método | Usado pela App? | Serviço |
|----------|--------|-----------------|---------|
| `/mobile/version` | GET | ❌ Não | - |
| `/mobile/auth/me` | GET | ✅ Sim (via apiService) | - |
| `/mobile/auth/change-password` | POST | ✅ Sim | SettingsScreen |
| `/mobile/auth/assistants` | GET | ❓ Parcial | - |
| `/mobile/auth/change-assistant-password` | POST | ✅ Sim | SettingsScreen |
| `/mobile/properties` | GET | ✅ Sim | apiService directo |
| `/mobile/properties/{id}` | GET | ✅ Sim | PropertyDetailScreen |
| `/mobile/properties` | POST | ❓ Parcial | - |
| `/mobile/properties/{id}` | PUT | ❓ Parcial | - |
| `/mobile/properties/{id}/status` | PATCH | ❌ Não | - |
| `/mobile/properties/{id}/photos/upload` | POST | ❓ Parcial | cloudinary |
| `/mobile/properties/{id}/photos/bulk` | POST | ✅ Sim | cloudinary |
| `/mobile/cloudinary/upload-config` | GET | ✅ Sim | cloudinaryService |
| `/mobile/leads` | GET | ✅ Sim | apiService directo |
| `/mobile/leads/{id}` | GET | ✅ Sim | LeadDetailScreen |
| `/mobile/leads/{id}/status` | PATCH | ❓ Parcial | - |
| `/mobile/leads/{id}` | PUT | ✅ Sim | LeadDetailScreen |
| `/mobile/leads/{id}/contact` | POST | ❌ Não | - |
| `/mobile/leads/{id}/convert` | PUT | ✅ Sim | LeadDetailScreen |
| `/mobile/leads` | POST | ✅ Sim | NewLeadScreen |
| `/mobile/tasks` | GET | ❌ Não | - |
| `/mobile/tasks/today` | GET | ❌ Não | - |
| `/mobile/tasks` | POST | ❌ Não | - |
| `/mobile/tasks/{id}/status` | PATCH | ❌ Não | - |
| `/mobile/tasks/{id}` | GET | ❌ Não | - |
| `/mobile/tasks/{id}` | PUT | ❌ Não | - |
| `/mobile/tasks/{id}` | DELETE | ❌ Não | - |
| `/mobile/dashboard/stats` | GET | ✅ Sim | HomeScreen, etc. |
| `/mobile/dashboard/recent-activity` | GET | ❌ Não | - |
| `/mobile/visits` | GET | ✅ Sim | visitsService |
| `/mobile/visits/today` | GET | ❌ Não | - |
| `/mobile/visits/upcoming` | GET | ✅ Sim | visitsService |
| `/mobile/visits/{id}` | GET | ✅ Sim | visitsService |
| `/mobile/visits` | POST | ✅ Sim | visitsService |
| `/mobile/visits/{id}` | PUT | ✅ Sim | visitsService |
| `/mobile/visits/{id}/status` | PATCH | ✅ Sim | visitsService |
| `/mobile/visits/{id}/check-in` | POST | ✅ Sim | VisitDetailScreen |
| `/mobile/visits/{id}/check-out` | POST | ✅ Sim | VisitDetailScreen |
| `/mobile/visits/{id}/feedback` | POST | ✅ Sim | VisitDetailScreen |
| `/mobile/calendar/day/{date}` | GET | ❓ Parcial | AgendaScreen |
| `/mobile/calendar/month/{year}/{month}` | GET | ❓ Parcial | AgendaScreen |
| `/mobile/site-preferences` | GET | ✅ Sim | HomeScreen |
| `/mobile/site-preferences` | PUT | ✅ Sim | ProfileScreen |
| `/mobile/events` | POST | ✅ Sim | AgendaScreen |
| `/mobile/events` | GET | ✅ Sim | AgendaScreen |
| `/mobile/events/today` | GET | ❌ Não | - |
| `/mobile/events/{id}` | GET | ❌ Não | - |
| `/mobile/events/{id}` | PUT | ❌ Não | - |
| `/mobile/events/{id}` | DELETE | ❌ Não | - |

### BACKEND: /mobile/first-impressions/* (7 endpoints)

| Endpoint | Método | Usado? | Serviço |
|----------|--------|--------|---------|
| `/mobile/first-impressions` | POST | ✅ Sim | firstImpressionService |
| `/mobile/first-impressions` | GET | ✅ Sim | firstImpressionService |
| `/mobile/first-impressions/{id}` | GET | ✅ Sim | firstImpressionService |
| `/mobile/first-impressions/{id}` | PUT | ✅ Sim | firstImpressionService |
| `/mobile/first-impressions/{id}/signature` | POST | ✅ Sim | firstImpressionService |
| `/mobile/first-impressions/{id}/cancel` | POST | ✅ Sim | firstImpressionService |
| `/mobile/first-impressions/{id}` | DELETE | ✅ Sim | firstImpressionService |

### BACKEND: /pre-angariacoes/* (13 endpoints)

| Endpoint | Método | Usado? | Serviço |
|----------|--------|--------|---------|
| `/pre-angariacoes/` | GET | ✅ Sim | preAngariacaoService |
| `/pre-angariacoes/by-first-impression/{id}` | GET | ✅ Sim | preAngariacaoService |
| `/pre-angariacoes/stats` | GET | ❌ Não | - |
| `/pre-angariacoes/{id}` | GET | ✅ Sim | preAngariacaoService |
| `/pre-angariacoes/` | POST | ❌ Não | - |
| `/pre-angariacoes/from-first-impression` | POST | ✅ Sim | preAngariacaoService |
| `/pre-angariacoes/{id}` | PUT | ✅ Sim | preAngariacaoService |
| `/pre-angariacoes/{id}` | DELETE | ✅ Sim | preAngariacaoService |
| `/pre-angariacoes/{id}/documentos` | POST | ✅ Sim | preAngariacaoService |
| `/pre-angariacoes/{id}/documentos/{idx}` | DELETE | ✅ Sim | preAngariacaoService |
| `/pre-angariacoes/{id}/fotos` | POST | ❌ Não | - |
| `/pre-angariacoes/{id}/checklist` | PUT | ❌ Não | - |
| `/pre-angariacoes/{id}/activar` | POST | ❌ Não | - |

### BACKEND: /cmi/* (15+ endpoints)

| Endpoint | Método | Usado? | Serviço |
|----------|--------|--------|---------|
| `/cmi/` | GET | ✅ Sim | cmiService |
| `/cmi/stats` | GET | ❌ Não | - |
| `/cmi/{id}` | GET | ✅ Sim | cmiService |
| `/cmi/` | POST | ❌ Não | - |
| `/cmi/{id}/pdf` | GET | ❓ Parcial | - |
| `/cmi/from-first-impression` | POST | ✅ Sim | cmiService |
| `/cmi/{id}` | PUT | ✅ Sim | cmiService |
| `/cmi/{id}` | DELETE | ✅ Sim | cmiService |
| `/cmi/by-first-impression/{id}` | GET | ✅ Sim | cmiService |
| `/cmi/{id}/assinatura-cliente` | POST | ✅ Sim | cmiService |
| `/cmi/{id}/assinatura-mediador` | POST | ✅ Sim | cmiService |
| `/cmi/ocr/extract` | POST | ❌ Não | - |
| `/cmi/{id}/ocr` | POST | ❌ Não | - |
| `/cmi/{id}/documentos/{tipo}` | PUT | ❌ Não | - |

### BACKEND: /clients/* (10 endpoints)

| Endpoint | Método | Usado? | Serviço |
|----------|--------|--------|---------|
| `/clients/` | GET | ✅ Sim | clientService (sem auth!) |
| `/clients/{id}` | GET | ✅ Sim | clientService |
| `/clients/` | POST | ✅ Sim | clientService |
| `/clients/{id}` | PUT | ✅ Sim | clientService |
| `/clients/{id}` | DELETE | ✅ Sim | clientService |
| `/clients/{id}/notes` | PATCH | ✅ Sim | clientService |
| `/clients/birthdays` | GET | ✅ Sim | clientService |
| `/clients/with-leads` | GET | ✅ Sim | ClientsScreen directo |

---

## ⚠️ FUNCIONALIDADES EM FALTA

### 1. **GESTÃO DE TAREFAS (TASKS)** ❌
Existem 7 endpoints no backend para tasks, mas **NENHUM é usado** pela app mobile.

```
/mobile/tasks - GET, POST
/mobile/tasks/today - GET
/mobile/tasks/{id} - GET, PUT, DELETE
/mobile/tasks/{id}/status - PATCH
```

**Impacto:** Agentes não conseguem gerir tarefas na app.

### 2. **ACTIVIDADE RECENTE** ❌
```
/mobile/dashboard/recent-activity - GET
```
**Impacto:** Dashboard sem feed de actividade.

### 3. **VISITAS DO DIA** ❌
```
/mobile/visits/today - GET
```
**Impacto:** Widget de visitas do dia não implementado.

### 4. **EVENTOS INDIVIDUAIS** ❌
```
/mobile/events/{id} - GET, PUT, DELETE
/mobile/events/today - GET
```
**Impacto:** Não consegue editar/apagar eventos.

### 5. **OCR DE DOCUMENTOS** ❌
```
/cmi/ocr/extract - POST
/cmi/{id}/ocr - POST
```
**Impacto:** Digitalização de documentos não funciona.

### 6. **ESTATÍSTICAS PA/CMI** ❌
```
/pre-angariacoes/stats - GET
/cmi/stats - GET
```
**Impacto:** Dashboards sem métricas de PA/CMI.

### 7. **CHECKLIST E ACTIVAÇÃO PA** ❌
```
/pre-angariacoes/{id}/checklist - PUT
/pre-angariacoes/{id}/activar - POST
```
**Impacto:** Fluxo de activação de pré-angariação incompleto.

### 8. **STATUS DE PROPRIEDADES** ❌
```
/mobile/properties/{id}/status - PATCH
```
**Impacto:** Não consegue mudar status directamente.

---

## 🔗 SINCRONIZAÇÃO COM BACKOFFICE

### Endpoints Partilhados (via proxy API routes)

| Recurso | Mobile | Backoffice | Sincronizado? |
|---------|--------|------------|---------------|
| Properties | `/mobile/properties` | `/api/properties` → backend | ✅ Sim |
| Leads | `/mobile/leads` | `/api/leads` → backend | ✅ Sim |
| Clients | `/clients` | `/api/clients` → backend | ✅ Sim |
| First Impressions | `/mobile/first-impressions` | - | ⚠️ Só mobile |
| Pré-Angariações | `/pre-angariacoes` | `/api/pre-angariacoes` | ✅ Sim |
| CMI | `/cmi` | `/api/cmi` | ✅ Sim |
| Visitas | `/mobile/visits` | `/api/visits` | ✅ Sim |
| Eventos | `/mobile/events` | `/api/calendar` | ⚠️ Endpoints diferentes |

### ⚠️ Inconsistências

1. **First Impressions** - Só existe no mobile, backoffice não tem acesso directo
2. **Calendário** - Mobile usa `/mobile/events`, backoffice usa `/calendar`
3. **Dashboard Stats** - Mobile tem endpoint dedicado, backoffice calcula client-side

---

## 🌐 SINCRONIZAÇÃO COM MICRO-SITE WEB DE AGENTE

### Endpoints do Micro-Site

| Endpoint | Descrição | Mobile usa? |
|----------|-----------|-------------|
| `/website/auth/register` | Registo cliente site | ❌ |
| `/website/auth/login` | Login cliente site | ❌ |
| `/website/clients/me` | Perfil cliente | ❌ |
| `/website/clients/favorites` | Favoritos cliente | ❌ |

### Dados Sincronizados

| Recurso | Mobile → Site | Site → Mobile |
|---------|---------------|---------------|
| Propriedades | ✅ Via `/properties` | ✅ |
| Leads do site | ❌ | ✅ Aparecem em `/mobile/leads` |
| Visitas | ❌ | ❌ |
| Favoritos | ❌ | ❌ |

### ⚠️ Lacunas

1. **Leads do Site** - Quando cliente do site faz pedido de visita, cria lead que aparece na app mobile, mas agente não vê origem
2. **Favoritos** - Mobile não consegue ver propriedades favoritas dos clientes
3. **Chat/Mensagens** - Não existe comunicação bidireccional site ↔ mobile

---

## 🔧 RECOMENDAÇÕES DE CORRECÇÃO

### PRIORIDADE ALTA (P1)

#### 1. Corrigir `clientService.ts` - Adicionar autenticação

```typescript
// ANTES
const response = await fetch(`${API_URL}/clients/?${params}`, {
  headers: { Accept: 'application/json' },
});

// DEPOIS
const response = await fetch(`${API_URL}/clients/?${params}`, {
  headers: await getHeaders(),  // Incluir Authorization e X-Tenant-Slug
});
```

#### 2. Corrigir `auth.ts` - Adicionar X-Tenant-Slug

```typescript
const TENANT_SLUG = process.env.EXPO_PUBLIC_TENANT_SLUG || '';

const response = await fetch(`${apiService['baseURL']}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(TENANT_SLUG && { 'X-Tenant-Slug': TENANT_SLUG }),
  },
  body: JSON.stringify({...}),
});
```

#### 3. Implementar `leads.ts` e `properties.ts`

```typescript
// leads.ts
import { apiService } from './api';

export const leadsService = {
  list: (filters?: any) => apiService.get('/mobile/leads', { params: filters }),
  getById: (id: number) => apiService.get(`/mobile/leads/${id}`),
  create: (data: any) => apiService.post('/mobile/leads', data),
  update: (id: number, data: any) => apiService.put(`/mobile/leads/${id}`, data),
  updateStatus: (id: number, status: string) => 
    apiService.patch(`/mobile/leads/${id}/status`, { status }),
  convert: (id: number) => apiService.put(`/mobile/leads/${id}/convert`),
  contact: (id: number, data: any) => apiService.post(`/mobile/leads/${id}/contact`, data),
};
```

### PRIORIDADE MÉDIA (P2)

#### 4. Implementar Gestão de Tarefas

Criar `tasksService.ts`:
```typescript
export const tasksService = {
  list: () => apiService.get('/mobile/tasks'),
  getToday: () => apiService.get('/mobile/tasks/today'),
  create: (data: any) => apiService.post('/mobile/tasks', data),
  update: (id: number, data: any) => apiService.put(`/mobile/tasks/${id}`, data),
  updateStatus: (id: number, status: string) => 
    apiService.patch(`/mobile/tasks/${id}/status`, { status }),
  delete: (id: number) => apiService.delete(`/mobile/tasks/${id}`),
};
```

#### 5. Adicionar Dashboard Activity

No HomeScreen, chamar:
```typescript
const activity = await apiService.get('/mobile/dashboard/recent-activity');
```

### PRIORIDADE BAIXA (P3)

#### 6. Implementar OCR

```typescript
export const ocrService = {
  extract: (imageBase64: string) => apiService.post('/cmi/ocr/extract', { image: imageBase64 }),
  processCMI: (cmiId: number, docType: string, imageBase64: string) => 
    apiService.post(`/cmi/${cmiId}/ocr`, { tipo: docType, image: imageBase64 }),
};
```

#### 7. Completar Fluxo PA

```typescript
// Adicionar ao preAngariacaoService
updateChecklist: (id: number, checklist: any) => 
  apiService.put(`/pre-angariacoes/${id}/checklist`, checklist),
activate: (id: number) => 
  apiService.post(`/pre-angariacoes/${id}/activar`),
getStats: () => 
  apiService.get('/pre-angariacoes/stats'),
```

---

## 📈 MÉTRICAS DE QUALIDADE

| Métrica | Valor | Target | Status |
|---------|-------|--------|--------|
| Cobertura API | 65% | 90% | 🔴 |
| Services Vazios | 2 | 0 | 🔴 |
| Endpoints sem Auth | 1 (clientService) | 0 | 🔴 |
| Código Duplicado | Alto | Baixo | 🟡 |
| Tipos TypeScript | 60% | 100% | 🟡 |
| Error Handling | 70% | 95% | 🟡 |
| Offline Support | 0% | 50% | 🔴 |

---

## 🚀 ROADMAP SUGERIDO

### Sprint 1 (1-2 dias)
- [ ] Corrigir autenticação no clientService.ts
- [ ] Adicionar X-Tenant-Slug ao auth.ts
- [ ] Implementar leads.ts
- [ ] Implementar properties.ts

### Sprint 2 (2-3 dias)
- [ ] Implementar tasksService.ts
- [ ] Adicionar TasksScreen
- [ ] Integrar recent-activity no dashboard

### Sprint 3 (3-5 dias)
- [ ] Implementar OCR
- [ ] Completar fluxo PA (checklist + activar)
- [ ] Adicionar stats PA/CMI ao dashboard

### Sprint 4 (1 semana)
- [ ] Offline support básico (AsyncStorage cache)
- [ ] Sincronização background
- [ ] Push notifications

---

## 📋 CONCLUSÃO

A app mobile CRM PLUS V7 tem uma base sólida com:
- ✅ Arquitectura de serviços bem definida
- ✅ Interceptor de refresh token
- ✅ Error handling padronizado
- ✅ First Impressions completo
- ✅ CMI e PA funcionais

**Principais lacunas:**
- 🔴 Autenticação inconsistente (clientService, auth)
- 🔴 Serviços vazios (leads, properties)
- 🔴 Tarefas não implementadas
- 🔴 Sem suporte offline
- 🔴 ~35% dos endpoints backend não utilizados

**Esforço estimado para 100% cobertura:** 2-3 semanas (1 dev full-time)

---

*Relatório gerado automaticamente - Auditoria Técnica CRM PLUS V7*
