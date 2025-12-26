# 🛠️ RELATÓRIO DE CORREÇÕES - DEV TEAM

**Projeto:** CRM Plus V7  
**Data:** 26 de dezembro de 2025  
**Prioridade:** Limpeza e Padronização (Segurança adiada para pós-testes)

---

## 📋 ÍNDICE

1. [Limpeza de Ficheiros Duplicados](#1-limpeza-de-ficheiros-duplicados)
2. [Padronização de Variáveis de Ambiente](#2-padronização-de-variáveis-de-ambiente)
3. [Correções no Mobile](#3-correções-no-mobile)
4. [Correções nos Frontends](#4-correções-nos-frontends)
5. [Correções no Backend](#5-correções-no-backend)
6. [SEO e Performance](#6-seo-e-performance)
7. [Checklist de Tarefas](#7-checklist-de-tarefas)

---

## 1. LIMPEZA DE FICHEIROS DUPLICADOS

### 1.1 Mobile - Ecrãs com Múltiplas Versões

**Problema:** Existem 50+ ecrãs com versões V2, V3, V4, V5, V6. Manter apenas a versão mais recente.

**Diretório:** `mobile/app/src/screens/`

| Manter (versão atual) | Eliminar |
|----------------------|----------|
| `LoginScreenV3.tsx` | `LoginScreen.tsx`, `LoginScreenV2.tsx` |
| `HomeScreenV5.tsx` | `HomeScreen.tsx`, `HomeScreenV2.tsx`, `HomeScreenV3.tsx`, `HomeScreenV3 2.tsx`, `HomeScreenV4.tsx` |
| `LeadsScreenV4.tsx` | `LeadsScreen.tsx`, `LeadsScreenV2.tsx`, `LeadsScreenV3.tsx` |
| `PropertiesScreenV4.tsx` | `PropertiesScreen.tsx`, `PropertiesScreenV2.tsx`, `PropertiesScreenV3.tsx` |
| `AgendaScreenV5.tsx` | `AgendaScreen.tsx`, `AgendaScreenV2.tsx`, `AgendaScreenV3.tsx`, `AgendaScreenV4.tsx` |
| `ProfileScreenV6.tsx` | `ProfileScreen.tsx`, `ProfileScreenV2.tsx`, `ProfileScreenV3.tsx`, `ProfileScreenV4.tsx`, `ProfileScreenV5.tsx` |
| `AgentScreenV4.tsx` | `AgentScreen.tsx`, `AgentScreenV2.tsx`, `AgentScreenV3.tsx` |

**Ação:** 
```bash
# Após confirmar que versão atual funciona, eliminar ficheiros antigos
cd mobile/app/src/screens
# Listar todos os ficheiros com versões
ls -la *V*.tsx *\ 2.tsx 2>/dev/null
```

### 1.2 Ficheiros com Espaço no Nome

**Problema:** Ficheiros com " 2" no nome (cópias acidentais)

| Localização | Ficheiros a Eliminar |
|-------------|---------------------|
| `mobile/app/src/screens/` | `HomeScreenV3 2.tsx` |
| `site-montra/__tests__/` | `DataTable.test 2.tsx`, `PropertyForm.test 2.tsx` |
| `site-montra/` | `Dockerfile 2` |
| `backend/app/core/` | Verificar se existem duplicados |

**Ação:**
```bash
# Encontrar todos os ficheiros com " 2" no nome
find . -name "* 2.*" -type f
```

### 1.3 Pastas Duplicadas

| Pasta a Remover | Razão |
|-----------------|-------|
| `backoffice/backoffice/` | Estrutura legacy duplicada |
| `web/app/backoffice/` | Duplica funcionalidade do projeto backoffice/ |
| `web/backoffice/` | Estrutura legacy duplicada |

**Ação:** Verificar se código é usado antes de eliminar. Se `web/` não necessita de backoffice, remover completamente.

---

## 2. PADRONIZAÇÃO DE VARIÁVEIS DE AMBIENTE

### 2.1 Problema Atual

| Variável | backoffice | web | mobile | site-montra |
|----------|------------|-----|--------|-------------|
| API URL | `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_BASE_URL` | `EXPO_PUBLIC_API_BASE_URL` | `NEXT_PUBLIC_API_BASE_URL` |
| Cloudinary | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |

### 2.2 Padrão Recomendado

**Para Next.js (backoffice, web, site-montra):**
```env
NEXT_PUBLIC_API_BASE_URL=https://crmplusv7-production.up.railway.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dtpk4oqoa
```

**Para Expo (mobile):**
```env
EXPO_PUBLIC_API_BASE_URL=https://crmplusv7-production.up.railway.app
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dtpk4oqoa
```

### 2.3 Ficheiros a Atualizar

| Projeto | Ficheiro | Alteração |
|---------|----------|-----------|
| backoffice | `src/services/*.ts` | Mudar `NEXT_PUBLIC_API_URL` → `NEXT_PUBLIC_API_BASE_URL` |
| backoffice | `next.config.mjs` | Verificar fallbacks |
| backoffice | `.env.example` | Atualizar variáveis |
| web | `src/services/*.ts` | Verificar consistência |
| web | `.env.example` | Atualizar variáveis |
| mobile | `.env` e `.env.production` | Alinhar `CLOUDINARY_CLOUD_NAME` com prefixo `EXPO_PUBLIC_` |

### 2.4 Valor Cloudinary Inconsistente

**Problema:** Dois valores diferentes em uso
- `dtpk4oqoa` (documentado em CREDENTIALS.md)
- `dz0crsrhi` (encontrado em mobile/.env)

**Ação:** Confirmar qual é o correto e padronizar em todos os projetos.

---

## 3. CORREÇÕES NO MOBILE

### 3.1 Criar Estrutura de Hooks

**Problema:** Pasta `mobile/app/src/hooks/` está vazia. Lógica repetida nos screens.

**Criar ficheiros:**

```typescript
// mobile/app/src/hooks/useLeads.ts
import { useState, useEffect, useCallback } from 'react';
import { leadsService } from '../services/leads';
import { Lead } from '../types';

export function useLeads(filters?: { status?: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeads(filters);
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
}
```

```typescript
// mobile/app/src/hooks/useProperties.ts
// Similar structure for properties

// mobile/app/src/hooks/useAuth.ts
// Extract auth logic from AuthContext
```

### 3.2 Criar Estrutura de Utils

**Problema:** Pasta `mobile/app/src/utils/` está vazia. Formatters duplicados.

**Criar ficheiros:**

```typescript
// mobile/app/src/utils/formatters.ts
export const formatCurrency = (value: number, currency = 'EUR'): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
  }).format(value);
};

export const formatDate = (date: string | Date, format = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: format === 'short' ? '2-digit' : 'long',
    year: 'numeric',
  });
};

export const formatPhone = (phone: string): string => {
  // Format Portuguese phone numbers
  return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
};
```

```typescript
// mobile/app/src/utils/validators.ts
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^(\+351)?[0-9]{9}$/.test(phone.replace(/\s/g, ''));
};
```

### 3.3 Configurar Google Maps API Key

**Problema:** API key é placeholder em `mobile/app/app.json`

**Ação:**
1. Criar API key em Google Cloud Console
2. Atualizar `app.json`:
```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "AIzaSy_REAL_KEY_HERE"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSy_REAL_KEY_HERE"
        }
      }
    }
  }
}
```

### 3.4 Corrigir Alias de Paths

**Problema:** Alias configurado diferente em `babel.config.js` vs `tsconfig.json`

**Ficheiro:** `mobile/app/babel.config.js`
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/hooks': './src/hooks',
          '@/utils': './src/utils',
          '@/contexts': './src/contexts',
          '@/theme': './src/theme',
          '@/types': './src/types',
          '@/constants': './src/constants',
        }
      }]
    ]
  };
};
```

### 3.5 Renomear Ecrãs para Remover Sufixo de Versão

Após limpar versões antigas, renomear ficheiros:

| De | Para |
|----|------|
| `LoginScreenV3.tsx` | `LoginScreen.tsx` |
| `HomeScreenV5.tsx` | `HomeScreen.tsx` |
| `LeadsScreenV4.tsx` | `LeadsScreen.tsx` |
| etc. | etc. |

**Nota:** Atualizar imports em `navigation/` após renomear.

---

## 4. CORREÇÕES NOS FRONTENDS

### 4.1 Backoffice - Remover Rewrite Hardcoded

**Ficheiro:** `backoffice/next.config.mjs`

**Problema:** URL Vercel hardcoded no rewrite
```javascript
// Atual (problemático)
{
  source: '/placeholder/:path*',
  destination: 'https://web-nymbcws7r-toinos-projects.vercel.app/placeholder/:path*',
}
```

**Solução:**
```javascript
// Usar variável de ambiente
{
  source: '/placeholder/:path*',
  destination: `${process.env.NEXT_PUBLIC_WEB_URL || ''}/placeholder/:path*`,
}
```

### 4.2 Web - Middleware de Autenticação

**Ficheiro:** `web/middleware.ts`

**Problema:** Middleware não valida JWT como o backoffice, apenas verifica presença de cookie.

**Ação:** Alinhar lógica com `backoffice/middleware.ts` se for necessário proteger rotas.

### 4.3 Web - vercel.json Vazio

**Ficheiro:** `web/vercel.json`

**Problema:** Ficheiro contém apenas `{}`

**Solução:** Ou eliminar ficheiro, ou adicionar configuração útil:
```json
{
  "framework": "nextjs",
  "regions": ["cdg1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### 4.4 Site Montra - Dividir Página Monolítica

**Ficheiro:** `site-montra/app/page.tsx` (745 linhas!)

**Ação:** Extrair componentes:

```
site-montra/components/
├── HeroSection.tsx
├── FeaturesSection.tsx
├── StatsSection.tsx
├── TestimonialsSection.tsx
├── CTASection.tsx
├── Footer.tsx
└── Header.tsx
```

### 4.5 Site Montra - Conectar à API

**Problema:** Dados estão hardcoded (stats, testimonials)

**Ação:** Criar serviço para buscar dados reais:
```typescript
// site-montra/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getStats() {
  const res = await fetch(`${API_BASE}/public/stats`);
  return res.json();
}

export async function getTestimonials() {
  const res = await fetch(`${API_BASE}/public/testimonials`);
  return res.json();
}
```

---

## 5. CORREÇÕES NO BACKEND

### 5.1 Limpar Ficheiros Duplicados no Core

**Diretório:** `backend/app/core/`

**Ação:** Verificar e eliminar ficheiros com " 2" ou duplicados.

```bash
ls -la backend/app/core/
# Procurar padrões de duplicação
```

### 5.2 Modelo CalendarEvent Deprecated

**Ficheiro:** `backend/app/models/calendar.py`

**Problema:** `CalendarEvent` está marcado como deprecated mas ainda em uso.

**Ação:**
1. Verificar onde `CalendarEvent` é usado
2. Migrar para `Event` ou `Task`
3. Criar migration Alembic para migrar dados
4. Remover modelo deprecated

```bash
# Encontrar usos de CalendarEvent
grep -r "CalendarEvent" backend/app/
```

### 5.3 Coluna Comentada em Lead

**Ficheiro:** `backend/app/models/lead.py`

**Problema:** Existe coluna comentada - decisão pendente

**Ação:** Decidir se coluna é necessária:
- Se sim: descomentar e criar migration
- Se não: remover comentário

### 5.4 Versões de Dependências

**Ficheiro:** `backend/requirements.txt`

**Problema:** Versões não estão pinadas

**Ação:** Pinar versões para reprodutibilidade:
```txt
fastapi==0.109.0
sqlalchemy==2.0.25
uvicorn==0.27.0
pydantic==2.5.3
PyJWT==2.8.0
bcrypt==4.1.2
psycopg2-binary==2.9.9
cloudinary==1.38.0
alembic==1.13.1
# ... etc
```

---

## 6. SEO E PERFORMANCE

### 6.1 Ativar SEO no Web Portal

**Ficheiro:** `web/app/layout.tsx`

**De:**
```typescript
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

**Para:**
```typescript
export const metadata = {
  robots: {
    index: true,
    follow: true,
  },
  title: 'CRM Plus - Imobiliária',
  description: 'Plataforma imobiliária completa...',
};
```

### 6.2 Ativar Otimização de Imagens

**Ficheiro:** `web/next.config.mjs`

**De:**
```javascript
images: {
  unoptimized: true,
}
```

**Para:**
```javascript
images: {
  unoptimized: false,
  remotePatterns: [
    { protocol: 'https', hostname: 'res.cloudinary.com' },
    { protocol: 'https', hostname: '*.railway.app' },
  ],
}
```

### 6.3 Alinhar Versões React/Next.js

**Problema:** site-montra usa React 19 + Next.js 16, outros usam React 18 + Next.js 14

**Opções:**
1. **Downgrade site-montra** para React 18 + Next.js 14 (recomendado para consistência)
2. **Upgrade todos** para versões mais recentes (mais trabalho, possíveis breaking changes)

---

## 7. CHECKLIST DE TAREFAS

### 📁 Limpeza (Prioridade: Alta)

- [ ] Eliminar ecrãs duplicados no mobile (V2, V3, V4, V5)
- [ ] Eliminar ficheiros com " 2" no nome
- [ ] Remover pasta `backoffice/backoffice/`
- [ ] Remover pasta `web/backoffice/` (se não usado)
- [ ] Remover pasta `web/app/backoffice/` (se não usado)
- [ ] Limpar ficheiros duplicados em `backend/app/core/`

### 🔧 Padronização (Prioridade: Alta)

- [ ] Unificar nome da variável API URL (`NEXT_PUBLIC_API_BASE_URL`)
- [ ] Confirmar e padronizar valor Cloudinary
- [ ] Atualizar `.env.example` em todos os projetos
- [ ] Corrigir alias de paths no mobile

### 📱 Mobile (Prioridade: Média)

- [ ] Criar hooks reutilizáveis (`useLeads`, `useProperties`, `useAuth`)
- [ ] Criar utils (`formatters.ts`, `validators.ts`)
- [ ] Configurar Google Maps API key real
- [ ] Renomear ecrãs para remover sufixo de versão
- [ ] Atualizar navigation após renomear

### 🌐 Frontends (Prioridade: Média)

- [ ] Remover rewrite hardcoded no backoffice
- [ ] Corrigir/remover `web/vercel.json` vazio
- [ ] Dividir `site-montra/app/page.tsx` em componentes

### ⚙️ Backend (Prioridade: Baixa)

- [ ] Pinar versões em `requirements.txt`
- [ ] Decidir sobre coluna comentada em Lead
- [ ] Planear migração de CalendarEvent

### 🚀 SEO/Performance (Prioridade: Baixa)

- [ ] Ativar SEO no web portal
- [ ] Ativar otimização de imagens
- [ ] Avaliar alinhamento de versões React/Next.js

---

## 📝 NOTAS ADICIONAIS

### Antes de Eliminar Ficheiros

1. Fazer backup ou commit do estado atual
2. Verificar que versão atual funciona
3. Procurar imports dos ficheiros a eliminar
4. Testar após eliminação

### Ordem Recomendada de Execução

1. **Padronização de variáveis** (afeta todos os projetos)
2. **Limpeza de ficheiros duplicados** (reduz confusão)
3. **Correções mobile** (hooks, utils, renomeações)
4. **Correções frontends** (configs, componentes)
5. **SEO e performance** (pode ser feito em paralelo)
6. **Backend** (menor prioridade)

---

**Contacto para dúvidas:** [Adicionar contacto]  
**Prazo sugerido:** 1-2 semanas para limpeza e padronização
