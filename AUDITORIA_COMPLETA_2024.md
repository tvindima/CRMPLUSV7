# 📊 AUDITORIA COMPLETA - CRM PLUS V7

**Data da Auditoria:** 24 de dezembro de 2025  
**Versão do Projeto:** V7  
**Estado Geral:** 🟢 Operacional com áreas de melhoria

---

## 📑 ÍNDICE

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Inventário de Credenciais e Variáveis](#2-inventário-de-credenciais-e-variáveis)
3. [Análise do Backend](#3-análise-do-backend)
4. [Análise dos Frontends](#4-análise-dos-frontends)
5. [Análise da App Mobile](#5-análise-da-app-mobile)
6. [Infraestrutura e Deploy](#6-infraestrutura-e-deploy)
7. [Problemas Críticos](#7-problemas-críticos)
8. [Sugestões de Melhoria](#8-sugestões-de-melhoria)
9. [Plano de Ação Recomendado](#9-plano-de-ação-recomendado)

---

## 1. VISÃO GERAL DO PROJETO

### Stack Tecnológica

| Componente | Tecnologia | Versão | Plataforma |
|------------|------------|--------|------------|
| **Backend** | FastAPI + SQLAlchemy | Python 3.x | Railway |
| **Database** | PostgreSQL | 17 | Railway |
| **Backoffice** | Next.js | 14.2.4 | Vercel |
| **Web Portal** | Next.js | 14.2.4 | Vercel |
| **Site Montra** | Next.js | 16.0.10 | Vercel |
| **Mobile** | Expo + React Native | SDK 51 / RN 0.74 | Vercel (Web) |
| **Media Storage** | Cloudinary | - | Cloud |

### URLs de Produção

| Serviço | URL |
|---------|-----|
| Backend API | https://crmplusv7-production.up.railway.app |
| Backoffice | https://backoffice-dp2mx1i6i-toinos-projects.vercel.app |
| Web Portal | https://web-nymbcws7r-toinos-projects.vercel.app |
| Site Montra | https://site-plataforma-crmplus.vercel.app |
| Mobile Web | https://crmplusv7-mobile.vercel.app |

### Dados em Produção

- ✅ **381 propriedades** importadas
- ✅ **34 agentes** (19 ativos + 15 legacy)
- ✅ **3 leads** registados
- ✅ **25 tabelas** PostgreSQL

---

## 2. INVENTÁRIO DE CREDENCIAIS E VARIÁVEIS

### 🔐 Backend (Railway)

| Variável | Descrição | Obrigatória | Risco |
|----------|-----------|-------------|-------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Sim | 🟢 Baixo |
| `CRMPLUS_AUTH_SECRET` | JWT signing key | ✅ Sim | 🔴 **Alto** - tem default inseguro |
| `CORS_ORIGINS` | Origens permitidas CORS | ❌ Não | 🟡 Médio |
| `CORS_ORIGIN_REGEX` | Regex CORS | ❌ Não | 🟡 Médio |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud | ✅ Sim | 🟢 Baixo |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ Sim | 🟢 Baixo |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | ✅ Sim | 🟡 Médio |
| `GCP_VISION_KEY_B64` | Google Vision key (base64) | ❌ Não | 🟢 Baixo |
| `GCP_VISION_ENABLED` | Ativar OCR | ❌ Não | 🟢 Baixo |
| `RUN_MIGRATIONS` | Auto-run migrations | ❌ Não | 🟢 Baixo |
| `PORT` | Server port | ❌ Não | 🟢 Baixo |
| `BOOTSTRAP_ADMIN_EMAIL` | Email admin inicial | ❌ Não | 🟡 Médio |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password admin inicial | ❌ Não | 🔴 **Alto** |

### 🖥️ Backoffice (Vercel)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL do backend | ✅ Sim |
| `CRMPLUS_AUTH_SECRET` | JWT secret (deve = backend) | ✅ Sim |
| `BYPASS_AUTH` | Bypass autenticação (dev) | ❌ Não |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary | ❌ Não |
| `NEXTAUTH_SECRET` | NextAuth secret | ❌ Não |
| `NEXTAUTH_URL` | NextAuth URL | ❌ Não |

### 🌐 Web Portal (Vercel)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | URL do backend | ✅ Sim |
| `NEXT_PUBLIC_API_URL` | URL alternativa (inconsistente!) | ❌ Não |
| `NEXT_PUBLIC_BACKEND_URL` | URL para proxy | ❌ Não |
| `BYPASS_AUTH` | Bypass autenticação | ❌ Não |

### 📱 Mobile (Expo/Vercel)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | URL do backend | ✅ Sim |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary | ✅ Sim |
| `EXPO_PUBLIC_ENV` | Ambiente (dev/prod) | ❌ Não |

### 🎨 Site Montra (Vercel)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | URL do backend (não usada) | ❌ Não |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary | ❌ Não |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps | ❌ Não |

### ⚠️ Inconsistências Detetadas

| Problema | Projetos Afetados |
|----------|-------------------|
| `NEXT_PUBLIC_API_URL` vs `NEXT_PUBLIC_API_BASE_URL` | backoffice, web |
| `CLOUDINARY_CLOUD_NAME` vs `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | mobile |
| Valores diferentes de `CLOUDINARY_CLOUD_NAME` | `dtpk4oqoa` vs `dz0crsrhi` |

---

## 3. ANÁLISE DO BACKEND

### 3.1 Estrutura de Módulos

```
backend/app/
├── core/           # Configurações centrais
├── models/         # 15+ modelos SQLAlchemy
├── routers/        # Rotas da API
├── schemas/        # Pydantic schemas
├── agencies/       # CRUD agências
├── agents/         # CRUD agentes
├── leads/          # CRUD leads
├── properties/     # CRUD propriedades
├── calendar/       # Agenda e eventos
├── teams/          # Equipas
├── billing/        # Faturação
├── reports/        # Relatórios
├── notifications/  # Sistema de notificações
├── match_plus/     # Matching AI
├── assistant/      # Assistente IA
├── mobile/         # Endpoints específicos mobile
├── feed/           # Feed de atividades
└── api/            # Routers agregados
```

### 3.2 Endpoints Principais

| Categoria | Endpoints |
|-----------|-----------|
| **Autenticação** | `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/mobile/login`, `/auth/mobile/refresh` |
| **Mobile** | `/mobile/me`, `/mobile/ws`, `/mobile/version`, `/mobile/first-impressions` |
| **CRUD** | `/leads`, `/properties`, `/agents`, `/teams`, `/agencies`, `/users` |
| **Agenda** | `/calendar/events`, `/calendar/tasks`, `/visits` |
| **Documentos** | `/contratos-mediacao-imobiliaria`, `/first-impressions`, `/pre-angariacoes` |
| **Admin** | `/admin/bootstrap/*`, `/debug/db`, `/health`, `/health/db` |

### 3.3 Modelos de Dados

| Modelo | Tabela | Status |
|--------|--------|--------|
| `User` | `users` | ✅ Ativo |
| `Agent` | `agents` | ✅ Ativo |
| `Property` | `properties` | ✅ Ativo |
| `Lead` | `leads` | ✅ Ativo |
| `Team` | `teams` | ✅ Ativo |
| `Agency` | `agencies` | ✅ Ativo |
| `Task` | `tasks` | ✅ Ativo |
| `Visit` | `visits` | ✅ Ativo |
| `Event` | `events` | ✅ Ativo |
| `CalendarEvent` | `calendar_events` | ⚠️ Deprecated |
| `FirstImpression` | `first_impressions` | ✅ Ativo |
| `CMI` | `contratos_mediacao` | ✅ Ativo |
| `RefreshToken` | `refresh_tokens` | ✅ Ativo |
| `FeedItem` | `feed_items` | ✅ Ativo |
| `Notification` | `notifications` | ✅ Ativo |

### 3.4 Problemas de Segurança

| Severidade | Problema | Localização |
|------------|----------|-------------|
| 🔴 **Crítico** | SECRET_KEY com valor default inseguro | `security.py:9` |
| 🔴 **Crítico** | Endpoint `/admin/bootstrap/setup-admins` exposto | `admin.py:750` |
| 🔴 **Crítico** | Endpoint `/debug/db` exposto em produção | `main.py:318` |
| 🟡 **Médio** | CORS regex muito permissivo | `main.py:106` |
| 🟡 **Médio** | Stack traces expostas em erros | `auth.py:49-53` |
| 🟡 **Médio** | Falta rate limiting em login | Global |
| 🟡 **Médio** | Criação automática de users em login | `security.py:78-86` |

### 3.5 Pontos Fortes

- ✅ Token rotation em refresh tokens
- ✅ Bcrypt para hashing de passwords
- ✅ JWT com expiração (24h access, 7 dias refresh)
- ✅ Tracking multi-device de sessões
- ✅ WebSocket para notificações real-time
- ✅ Exception handlers customizados
- ✅ Structured JSON logging
- ✅ Pool pre_ping para PostgreSQL

---

## 4. ANÁLISE DOS FRONTENDS

### 4.1 Backoffice

**Estrutura:**
```
backoffice/
├── app/                    # App Router Next.js 14
│   ├── api/               # 6 route handlers
│   └── backoffice/        # 27+ páginas protegidas
├── components/            # 18 componentes reutilizáveis
├── src/services/          # 4 serviços API
├── context/               # RoleContext
└── backoffice/            # ⚠️ Pasta duplicada (legacy)
```

**Páginas Principais:**
- Dashboard, Dashboard Agente
- Agentes, Equipas, Utilizadores
- Propriedades, Leads, Clientes
- Agenda, Visitas, Feed
- Pré-Angariações, Propostas
- Relatórios, Configurações
- Simulador, Calculadora

**Dependências Notáveis:**
- `jose` v5.9.3 - Validação JWT
- `framer-motion` v11 - Animações
- `zustand` v4.5.2 - Estado global

### 4.2 Web Portal

**Estrutura:**
```
web/
├── app/
│   ├── backoffice/        # ⚠️ Mini-backoffice duplicado
│   ├── backend/           # Proxy para API
│   └── (páginas públicas) # ~20 páginas
├── components/            # 18 componentes
└── src/services/          # 3 serviços API
```

**Páginas Públicas:**
- Home, Imóveis, Imóvel (detalhe)
- Agentes, Equipas
- Blog, Sobre, Contactos
- Serviços, Avaliação Imóvel
- Termos, Privacidade, Cookies
- Favoritos, Pesquisas, Alertas

**Problemas:**
- ⚠️ SEO bloqueado: `robots: { index: false }`
- ⚠️ Imagens não otimizadas: `unoptimized: true`
- ⚠️ Duplica funcionalidade do backoffice

### 4.3 Site Montra

**Estrutura:**
```
site-montra/
├── app/
│   ├── layout.tsx         # Com LanguageProvider
│   └── page.tsx           # 745 linhas (monolítico!)
├── components/            # 1 componente (LanguageSwitcher)
├── contexts/              # LanguageContext
└── lib/i18n.ts            # Traduções EN/PT
```

**Características:**
- Next.js 16.0.10 (versão mais recente)
- React 19.2.3 (versão mais recente)
- Internacionalização EN/PT
- Content Security Policy configurada
- Turbopack experimental

**Problemas:**
- ⚠️ Página monolítica (745 linhas)
- ⚠️ Dados hardcoded (sem API)
- ⚠️ Versões React incompatíveis com outros projetos

### 4.4 Comparação de Frontends

| Aspeto | Backoffice | Web | Site Montra |
|--------|------------|-----|-------------|
| Next.js | 14.2.4 | 14.2.4 | 16.0.10 |
| React | 18.3.1 | 18.3.1 | 19.2.3 |
| Páginas | 27+ | 30+ | 1 |
| Componentes | 18 | 18 | 1 |
| Testes | 3 | 2 | 4 (2 dup) |
| Output | standalone | default | default |
| SEO | ❌ | ❌ | ✅ |

---

## 5. ANÁLISE DA APP MOBILE

### 5.1 Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| Framework | Expo SDK 51 |
| React Native | 0.74.1 |
| TypeScript | 5.4.5 |
| Navegação | React Navigation 6.x |
| Estado | Context API + AsyncStorage |

### 5.2 Estrutura

```
mobile/app/src/
├── components/     # 14 componentes
├── constants/      # API, storage keys
├── contexts/       # Auth, Agent, WebSocket
├── hooks/          # (vazio!)
├── navigation/     # Stack + Tab navigators
├── screens/        # 50+ ecrãs (com versões V2-V6!)
├── services/       # 11 serviços API
├── theme/          # Dark Neon design system
├── types/          # TypeScript types
└── utils/          # (vazio!)
```

### 5.3 Navegação

```
Root Stack
├── SplashScreen
├── LoginScreenV3
└── TabNavigator
    ├── Home → HomeScreenV5, PropertyDetail, LeadDetail
    ├── Leads → LeadsScreenV4, NewLead, LeadDetail
    ├── Propriedades → PropertiesScreenV4, FirstImpressions
    ├── Agenda → AgendaScreenV5, VisitDetail
    ├── IA → AgentScreenV4
    └── Perfil → ProfileScreenV6, Settings
```

### 5.4 Funcionalidades

| Feature | Status |
|---------|--------|
| Login/Logout | ✅ Implementado |
| JWT Refresh | ✅ Implementado |
| WebSocket Notificações | ✅ Implementado |
| Lista Propriedades | ✅ Implementado |
| Lista Leads | ✅ Implementado |
| Criar Lead | ✅ Implementado |
| Agenda | ✅ Implementado |
| Primeiras Impressões | ✅ Implementado |
| Upload Fotos | ⚠️ Parcial |
| Mapas | ⚠️ Sem API key |

### 5.5 Problemas Críticos

| Problema | Impacto |
|----------|---------|
| 50+ ecrãs com versões duplicadas (V2-V6) | Manutenção impossível |
| Pasta `hooks/` vazia | Lógica duplicada |
| Pasta `utils/` vazia | Formatters duplicados |
| Google Maps API key placeholder | Mapas não funcionam |
| Ficheiros com espaço no nome | Potenciais bugs |

---

## 6. INFRAESTRUTURA E DEPLOY

### 6.1 Railway (Backend)

```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "cd backend && pip install -r requirements.txt"

[deploy]
startCommand = "cd backend && bash start.sh"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

### 6.2 Vercel (Frontends)

| Projeto | Root Directory | Build Command |
|---------|---------------|---------------|
| Mobile | `/` | `cd mobile/app && npm run build:web` |
| Web | `web/` | `next build` |
| Backoffice | `backoffice/` | `next build` |
| Site Montra | `site-montra/` | `next build` |

### 6.3 Ficheiros de Deploy

| Ficheiro | Localização | Propósito |
|----------|-------------|-----------|
| `railway.toml` | raiz | Config Railway |
| `vercel.json` | raiz, cada frontend | Config Vercel |
| `Dockerfile` | backend, cada frontend | Build Docker |
| `nixpacks.toml` | backend | Config Nixpacks |

---

## 7. PROBLEMAS CRÍTICOS

### 🔴 SEVERIDADE ALTA

| # | Problema | Localização | Ação |
|---|----------|-------------|------|
| 1 | SECRET_KEY com default inseguro | `backend/app/security.py:9` | Remover default, forçar env var |
| 2 | Endpoint bootstrap exposto | `backend/app/routers/admin.py:750` | Remover ou proteger |
| 3 | Endpoint debug exposto | `backend/app/main.py:318` | Remover em produção |
| 4 | 50+ ecrãs duplicados no mobile | `mobile/app/src/screens/` | Limpar versões antigas |
| 5 | Inconsistência de variáveis de ambiente | Todos os projetos | Padronizar nomenclatura |
| 6 | Backoffice duplicado em web/ | `web/app/backoffice/` | Remover duplicação |
| 7 | SEO bloqueado no web | `web/app/layout.tsx` | Ativar indexação |

### 🟡 SEVERIDADE MÉDIA

| # | Problema | Localização | Ação |
|---|----------|-------------|------|
| 8 | CORS muito permissivo | `backend/app/main.py:106` | Restringir domínios |
| 9 | Stack traces em erros | `backend/app/routers/auth.py:49` | Remover em produção |
| 10 | Falta rate limiting | Backend global | Adicionar slowapi |
| 11 | Imagens não otimizadas | `web/next.config.mjs` | Ativar otimização |
| 12 | Google Maps sem API key | `mobile/app/app.json` | Configurar key real |
| 13 | Ficheiros duplicados | Vários | Limpar |
| 14 | Versões React incompatíveis | site-montra vs outros | Alinhar versões |

### 🟢 SEVERIDADE BAIXA

| # | Problema | Localização | Ação |
|---|----------|-------------|------|
| 15 | CalendarEvent deprecated | `backend/app/models/` | Migrar para Event/Task |
| 16 | Pastas hooks/utils vazias | `mobile/app/src/` | Implementar |
| 17 | Falta de testes | Todos os projetos | Aumentar cobertura |
| 18 | Documentação inline | Código | Melhorar JSDoc/docstrings |

---

## 8. SUGESTÕES DE MELHORIA

### 8.1 Segurança

```python
# backend/app/security.py - ANTES
SECRET_KEY = os.environ.get("CRMPLUS_AUTH_SECRET", "change_me_crmplus_secret")

# DEPOIS
SECRET_KEY = os.environ.get("CRMPLUS_AUTH_SECRET")
if not SECRET_KEY:
    raise RuntimeError("CRMPLUS_AUTH_SECRET must be set")
```

```python
# backend/app/main.py - Remover endpoints de debug
# @app.get("/debug/db")  # REMOVER

# Proteger bootstrap com flag de ambiente
if os.environ.get("ENABLE_BOOTSTRAP", "false") == "true":
    app.include_router(bootstrap_router)
```

### 8.2 Padronização de Variáveis

```env
# Padrão recomendado para TODOS os projetos:
# Backend
DATABASE_URL=...
CRMPLUS_AUTH_SECRET=...
CLOUDINARY_CLOUD_NAME=dtpk4oqoa
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Frontends (Next.js)
NEXT_PUBLIC_API_BASE_URL=https://crmplusv7-production.up.railway.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dtpk4oqoa

# Mobile (Expo)
EXPO_PUBLIC_API_BASE_URL=https://crmplusv7-production.up.railway.app
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dtpk4oqoa
```

### 8.3 Estrutura do Mobile

```bash
# Limpar ecrãs duplicados - manter apenas versão mais recente
rm mobile/app/src/screens/LoginScreen.tsx
rm mobile/app/src/screens/LoginScreenV2.tsx
# Manter apenas LoginScreenV3.tsx

# Criar hooks reutilizáveis
# mobile/app/src/hooks/useLeads.ts
# mobile/app/src/hooks/useProperties.ts
# mobile/app/src/hooks/useAuth.ts

# Criar utils comuns
# mobile/app/src/utils/formatters.ts
# mobile/app/src/utils/validators.ts
```

### 8.4 Consolidação de Frontends

```
Opção A: Manter 2 projetos separados
├── backoffice/  → Apenas admin (renomear app/backoffice → app/)
└── web/         → Apenas público (remover app/backoffice/)

Opção B: Monorepo com turborepo
├── apps/
│   ├── backoffice/
│   ├── web/
│   ├── mobile/
│   └── site-montra/
└── packages/
    ├── ui/          # Componentes partilhados
    ├── config/      # Configs partilhadas
    └── api-client/  # Cliente API unificado
```

### 8.5 Performance

```javascript
// web/next.config.mjs - Ativar otimização de imagens
const nextConfig = {
  images: {
    unoptimized: false, // MUDAR de true para false
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.railway.app' },
    ],
  },
};

// Ativar SEO
export const metadata = {
  robots: {
    index: true,  // MUDAR de false
    follow: true, // MUDAR de false
  },
};
```

### 8.6 Rate Limiting

```python
# backend/requirements.txt - Adicionar
slowapi==0.1.9

# backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# backend/app/routers/auth.py
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

---

## 9. PLANO DE AÇÃO RECOMENDADO

### Fase 1: Segurança (Urgente - 1-2 dias)

- [ ] Remover/proteger endpoint `/admin/bootstrap/setup-admins`
- [ ] Remover endpoint `/debug/db`
- [ ] Forçar `CRMPLUS_AUTH_SECRET` obrigatório (sem default)
- [ ] Restringir CORS a domínios específicos
- [ ] Remover stack traces das respostas de erro
- [ ] Adicionar rate limiting ao login

### Fase 2: Limpeza (3-5 dias)

- [ ] Remover `web/app/backoffice/` (duplicado)
- [ ] Remover `backoffice/backoffice/` (pasta legacy)
- [ ] Limpar ecrãs duplicados no mobile (V2, V3, V4, V5)
- [ ] Remover ficheiros duplicados (Dockerfile 2, *.test 2.tsx)
- [ ] Padronizar variáveis de ambiente em todos os projetos

### Fase 3: Melhorias (1-2 semanas)

- [ ] Ativar SEO no web portal
- [ ] Ativar otimização de imagens
- [ ] Criar hooks reutilizáveis no mobile
- [ ] Configurar Google Maps API key
- [ ] Implementar upload de fotos completo no mobile
- [ ] Adicionar ErrorBoundary global no mobile

### Fase 4: Arquitetura (2-4 semanas)

- [ ] Avaliar consolidação em monorepo
- [ ] Migrar CalendarEvent para Event/Task
- [ ] Implementar endpoints mobile em falta
- [ ] Alinhar versões React/Next.js entre projetos
- [ ] Aumentar cobertura de testes (meta: 50%)

### Fase 5: Infraestrutura (Contínuo)

- [ ] Configurar domínios customizados
- [ ] Adicionar Sentry para error tracking
- [ ] Implementar Redis para cache/rate limiting
- [ ] Configurar CI/CD com testes automáticos
- [ ] Implementar health checks mais robustos

---

## 📊 MÉTRICAS DE QUALIDADE

| Métrica | Atual | Meta |
|---------|-------|------|
| Endpoints implementados | ~60% | 100% |
| Cobertura de testes | <5% | 50% |
| Problemas de segurança | 7 | 0 |
| Duplicação de código | Alta | Baixa |
| Documentação | Boa | Excelente |
| Performance Lighthouse | N/A | >90 |

---

## ✅ CONCLUSÃO

O projeto CRM Plus V7 está **operacional** e bem estruturado no geral, mas requer atenção imediata em:

1. **Segurança** - Endpoints expostos e configurações inseguras
2. **Limpeza** - Código duplicado especialmente no mobile
3. **Padronização** - Variáveis de ambiente inconsistentes

A documentação existente é excelente e facilita a manutenção. A arquitetura modular do backend e o uso de tecnologias modernas são pontos fortes.

**Estimativa de esforço total:** 4-6 semanas para todas as fases

---

*Relatório gerado em 24 de dezembro de 2025*
