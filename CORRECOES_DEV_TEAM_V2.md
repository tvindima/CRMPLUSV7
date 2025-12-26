# 🛠️ RELATÓRIO DE CORREÇÕES - DEV TEAM (V2)

**Projeto:** CRM Plus V7  
**Data:** 26 de dezembro de 2025  
**Versão:** 2.0 (Revista)  
**Prioridade:** Limpeza e Padronização

---

## 📊 RESUMO EXECUTIVO

| Categoria | Itens a Corrigir | Prioridade |
|-----------|------------------|------------|
| Ficheiros Duplicados " 2" | 10 ficheiros | 🔴 Alta |
| Ecrãs Mobile com Versões | 31 ficheiros obsoletos | 🔴 Alta |
| Pastas Duplicadas | 3 pastas | 🟡 Média |
| Variáveis Ambiente | 2 inconsistências | 🟡 Média |
| Mobile hooks/utils | 2 pastas vazias | 🟢 Baixa |
| Dependências Backend | Versões não pinadas | 🟢 Baixa |

---

## 1. FICHEIROS DUPLICADOS COM " 2" NO NOME

### 1.1 Backend Core (5 ficheiros)

**Diretório:** `backend/app/core/`

| Ficheiro a ELIMINAR | Ficheiro Original |
|---------------------|-------------------|
| `events 2.py` | `events.py` ✅ |
| `logging 2.py` | `logging.py` ✅ |
| `exceptions 2.py` | `exceptions.py` ✅ |
| `websocket 2.py` | `websocket.py` ✅ |
| `scheduler 2.py` | `scheduler.py` ✅ |

**Comando:**
```bash
cd backend/app/core
rm "events 2.py" "logging 2.py" "exceptions 2.py" "websocket 2.py" "scheduler 2.py"
```

### 1.2 Site Montra (4 ficheiros)

**Diretório:** `site-montra/`

| Ficheiro a ELIMINAR | Localização |
|---------------------|-------------|
| `.eslintrc 2.json` | raiz |
| `Dockerfile 2` | raiz |
| `.gitignore 2` | raiz |
| `PropertyForm.test 2.tsx` | `__tests__/` |
| `DataTable.test 2.tsx` | `__tests__/` |

**Comando:**
```bash
cd site-montra
rm ".eslintrc 2.json" "Dockerfile 2" ".gitignore 2"
rm "__tests__/PropertyForm.test 2.tsx" "__tests__/DataTable.test 2.tsx"
```

### 1.3 Mobile Screens (11 ficheiros)

**Diretório:** `mobile/app/src/screens/`

| Ficheiro a ELIMINAR |
|---------------------|
| `AgendaScreen 2.tsx` |
| `AgentScreen 2.tsx` |
| `HomeScreenV3 2.tsx` |
| `LeadDetailScreenV3 2.tsx` |
| `LeadsScreenV3 2.tsx` |
| `NewLeadScreen 2.tsx` |
| `ProfileScreenV3 2.tsx` |
| `PropertiesScreenV3 2.tsx` |
| `PropertyDetailScreen 2.tsx` |
| `SplashScreen 2.tsx` |
| `VisitDetailScreen 2.tsx` |

**Comando:**
```bash
cd mobile/app/src/screens
rm "AgendaScreen 2.tsx" "AgentScreen 2.tsx" "HomeScreenV3 2.tsx" \
   "LeadDetailScreenV3 2.tsx" "LeadsScreenV3 2.tsx" "NewLeadScreen 2.tsx" \
   "ProfileScreenV3 2.tsx" "PropertiesScreenV3 2.tsx" "PropertyDetailScreen 2.tsx" \
   "SplashScreen 2.tsx" "VisitDetailScreen 2.tsx"
```

---

## 2. ECRÃS MOBILE - VERSÕES OBSOLETAS

### 2.1 Versões em Uso (Confirmado em navigation/index.tsx)

| Ecrã | Versão ATIVA |
|------|--------------|
| Login | `LoginScreenV3.tsx` |
| Home | `HomeScreenV5.tsx` |
| Properties | `PropertiesScreenV4.tsx` |
| PropertyDetail | `PropertyDetailScreenV4.tsx` |
| Leads | `LeadsScreenV4.tsx` |
| NewLead | `NewLeadScreenV4.tsx` |
| LeadDetail | `LeadDetailScreenV4.tsx` |
| Agenda | `AgendaScreenV5.tsx` |
| VisitDetail | `VisitDetailScreenV4.tsx` |
| Agent (IA) | `AgentScreenV4.tsx` |
| Profile | `ProfileScreenV6.tsx` |
| Settings | `SettingsScreen.tsx` |
| Splash | `SplashScreen.tsx` |
| FirstImpression* | Sem versões (✅ limpo) |
| CMIForm | `CMIFormScreen.tsx` |

### 2.2 Ficheiros a ELIMINAR (31 ficheiros)

```bash
cd mobile/app/src/screens

# Login (manter V3)
rm LoginScreen.tsx LoginScreenV2.tsx

# Home (manter V5)
rm HomeScreen.tsx HomeScreenV2.tsx HomeScreenV3.tsx HomeScreenV4.tsx

# Properties (manter V4)
rm PropertiesScreen.tsx PropertiesScreenV3.tsx

# PropertyDetail (manter V4)
rm PropertyDetailScreen.tsx

# Leads (manter V4)
rm LeadsScreen.tsx LeadsScreenV2.tsx LeadsScreenV3.tsx

# NewLead (manter V4)
rm NewLeadScreen.tsx

# LeadDetail (manter V4)
rm LeadDetailScreen.tsx LeadDetailScreenV3.tsx

# Agenda (manter V5)
rm AgendaScreen.tsx AgendaScreenV4.tsx

# VisitDetail (manter V4)
rm VisitDetailScreen.tsx

# Agent/IA (manter V4)
rm AgentScreen.tsx

# Profile (manter V6)
rm ProfileScreen.tsx ProfileScreenV3.tsx ProfileScreenV4.tsx ProfileScreenV5.tsx

# Splash (manter original)
rm SplashScreenV4.tsx
```

### 2.3 Renomear Após Limpeza (Opcional)

Após confirmar que tudo funciona, renomear para remover sufixos:

| De | Para |
|----|------|
| `LoginScreenV3.tsx` | `LoginScreen.tsx` |
| `HomeScreenV5.tsx` | `HomeScreen.tsx` |
| `PropertiesScreenV4.tsx` | `PropertiesScreen.tsx` |
| etc. | etc. |

**⚠️ ATENÇÃO:** Atualizar imports em `navigation/index.tsx` após renomear!

---

## 3. PASTAS DUPLICADAS

### 3.1 Pastas a Analisar

| Pasta | Conteúdo | Recomendação |
|-------|----------|--------------|
| `backoffice/backoffice/` | components, context, data, hooks (vazio), mocks (vazio) | 🔴 ELIMINAR |
| `web/backoffice/` | components, context, hooks (vazio), mocks (vazio) | 🟡 Verificar uso |
| `web/app/backoffice/` | 14 páginas (agenda, agentes, dashboard, etc.) | 🟡 Verificar se é usado |

### 3.2 Ação Recomendada

**Opção A - Se `web/` é apenas site público:**
```bash
# Eliminar tudo relacionado a backoffice no web
rm -rf web/backoffice/
rm -rf web/app/backoffice/
```

**Opção B - Se `web/` também serve backoffice:**
- Manter `web/app/backoffice/` (páginas)
- Eliminar `web/backoffice/` (duplicado de `backoffice/backoffice/`)

**Sempre eliminar:**
```bash
rm -rf backoffice/backoffice/
```

---

## 4. VARIÁVEIS DE AMBIENTE

### 4.1 Problema: Cloudinary Cloud Name

**Valores encontrados:**
| Ficheiro | Valor |
|----------|-------|
| `mobile/app/.env` | `dz0crsrhi` |
| `mobile/app/.env.production` | `dtpk4oqoa` |
| `CREDENTIALS.md` | (vazio - placeholder) |

**Ação:** Confirmar qual é o valor correto e padronizar:
```env
# Em TODOS os projetos, usar o mesmo valor:
# Para Next.js:
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<VALOR_CORRETO>

# Para Expo:
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=<VALOR_CORRETO>
```

### 4.2 Problema: Prefixo Inconsistente no Mobile

**Ficheiro:** `mobile/app/.env.production`
```env
# ERRADO (sem prefixo EXPO_PUBLIC_):
CLOUDINARY_CLOUD_NAME=dtpk4oqoa

# CORRETO:
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dtpk4oqoa
```

### 4.3 Variáveis API - ✅ Já Consistente

Todos os serviços usam `NEXT_PUBLIC_API_BASE_URL` com fallback para Railway.

**Ficheiros verificados:**
- ✅ `backoffice/src/services/backofficeApi.ts`
- ✅ `backoffice/src/services/auth.ts`
- ✅ `backoffice/src/services/publicApi.ts`
- ✅ `backoffice/src/services/dashboardApi.ts`
- ✅ `web/src/services/backofficeApi.ts`
- ✅ `web/src/services/auth.ts`
- ✅ `web/src/services/publicApi.ts`

---

## 5. MOBILE - ESTRUTURA INCOMPLETA

### 5.1 Pastas Vazias

| Pasta | Estado | Ação |
|-------|--------|------|
| `mobile/app/src/hooks/` | Vazia | Criar hooks reutilizáveis |
| `mobile/app/src/utils/` | Vazia | Criar utils comuns |

### 5.2 Hooks Sugeridos

```typescript
// mobile/app/src/hooks/useLeads.ts
import { useState, useEffect, useCallback } from 'react';
import { leadsService } from '../services/leads';

export function useLeads(filters?: { status?: string }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeads(filters);
      setLeads(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }, [filters?.status]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
}
```

```typescript
// mobile/app/src/hooks/useProperties.ts
// Estrutura similar para propriedades
```

### 5.3 Utils Sugeridos

```typescript
// mobile/app/src/utils/formatters.ts
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-PT');
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
};
```

```typescript
// mobile/app/src/utils/validators.ts
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone: string): boolean =>
  /^(\+351)?[0-9]{9}$/.test(phone.replace(/\s/g, ''));
```

---

## 6. BACKEND - DEPENDÊNCIAS

### 6.1 Versões Não Pinadas

**Ficheiro:** `backend/requirements.txt`

**Atual (problemático):**
```
fastapi
sqlalchemy
uvicorn[standard]
```

**Recomendado (pinar versões):**
```
fastapi==0.109.2
sqlalchemy==2.0.25
uvicorn[standard]==0.27.0
pytest==8.0.0
pydantic[email]==2.5.3
python-multipart==0.0.6
PyJWT==2.8.0
httpx==0.26.0
aiosqlite==0.19.0
pymongo==4.6.1
python-dotenv==1.0.0
pandas==2.2.0
psycopg2-binary==2.9.9
alembic==1.13.1
bcrypt==4.1.2
Pillow==10.2.0
cloudinary==1.38.0
websockets==12.0
python-json-logger==2.0.7
requests==2.31.0
google-cloud-vision==3.7.0
reportlab==4.1.0
```

---

## 7. OUTROS ITENS (BAIXA PRIORIDADE)

### 7.1 Web - vercel.json Vazio

**Ficheiro:** `web/vercel.json` contém apenas `{}`

**Opções:**
1. Eliminar ficheiro (Vercel usa defaults)
2. Adicionar configuração útil

### 7.2 Site Montra - Página Monolítica

**Ficheiro:** `site-montra/app/page.tsx` (744 linhas)

**Sugestão:** Dividir em componentes quando houver tempo.

### 7.3 SEO Bloqueado (Intencional)

**Ficheiro:** `web/app/layout.tsx`
```typescript
robots: {
  index: false,  // 🚫 BLOQUEADO - Site em testes
  follow: false, // 🚫 BLOQUEADO - Site em testes
}
```
**Status:** ✅ Correto para fase de testes. Ativar quando for para produção.

### 7.4 Imagens Não Otimizadas (Intencional)

**Ficheiro:** `web/next.config.mjs`
```javascript
images: {
  unoptimized: true, // Desativa otimização para resolver problemas
}
```
**Status:** ✅ OK para testes. Reativar otimização em produção.

---

## 📋 CHECKLIST FINAL

### 🔴 Prioridade Alta (Fazer Primeiro)

- [ ] Eliminar 5 ficheiros duplicados em `backend/app/core/`
- [ ] Eliminar 5 ficheiros duplicados em `site-montra/`
- [ ] Eliminar 11 ficheiros duplicados em `mobile/app/src/screens/`
- [ ] Eliminar 31 ecrãs obsoletos em `mobile/app/src/screens/`
- [ ] Testar app mobile após limpeza

### 🟡 Prioridade Média (Fazer Depois)

- [ ] Eliminar pasta `backoffice/backoffice/`
- [ ] Decidir sobre `web/backoffice/` e `web/app/backoffice/`
- [ ] Corrigir `CLOUDINARY_CLOUD_NAME` no mobile `.env.production`
- [ ] Confirmar valor correto de Cloudinary Cloud Name

### 🟢 Prioridade Baixa (Quando Houver Tempo)

- [ ] Criar hooks em `mobile/app/src/hooks/`
- [ ] Criar utils em `mobile/app/src/utils/`
- [ ] Pinar versões em `backend/requirements.txt`
- [ ] Renomear ecrãs mobile (remover sufixos V3, V4, etc.)
- [ ] Dividir `site-montra/app/page.tsx` em componentes

---

## 📊 IMPACTO DA LIMPEZA

| Antes | Depois |
|-------|--------|
| 53 ecrãs mobile | ~22 ecrãs |
| 10 ficheiros " 2" backend/site | 0 ficheiros |
| 11 ficheiros " 2" mobile | 0 ficheiros |
| ~150 ficheiros desnecessários | Projeto limpo |

**Estimativa de tempo:** 2-4 horas para limpeza completa

---

## 🚀 COMANDOS RÁPIDOS

```bash
# 1. Backup primeiro!
cd /Users/tiago.vindima/Desktop/CRMPLUSV7
git add -A && git commit -m "Backup antes de limpeza"

# 2. Limpar backend core
cd backend/app/core
rm "events 2.py" "logging 2.py" "exceptions 2.py" "websocket 2.py" "scheduler 2.py"

# 3. Limpar site-montra
cd ../../site-montra
rm ".eslintrc 2.json" "Dockerfile 2" ".gitignore 2" 2>/dev/null
rm "__tests__/PropertyForm.test 2.tsx" "__tests__/DataTable.test 2.tsx" 2>/dev/null

# 4. Limpar mobile duplicados " 2"
cd ../mobile/app/src/screens
rm *" 2.tsx" 2>/dev/null

# 5. Limpar versões obsoletas mobile (CUIDADO - testar depois!)
rm LoginScreen.tsx LoginScreenV2.tsx
rm HomeScreen.tsx HomeScreenV2.tsx HomeScreenV3.tsx HomeScreenV4.tsx
rm PropertiesScreen.tsx PropertiesScreenV3.tsx
rm PropertyDetailScreen.tsx
rm LeadsScreen.tsx LeadsScreenV2.tsx LeadsScreenV3.tsx
rm NewLeadScreen.tsx
rm LeadDetailScreen.tsx LeadDetailScreenV3.tsx
rm AgendaScreen.tsx AgendaScreenV4.tsx
rm VisitDetailScreen.tsx
rm AgentScreen.tsx
rm ProfileScreen.tsx ProfileScreenV3.tsx ProfileScreenV4.tsx ProfileScreenV5.tsx
rm SplashScreenV4.tsx

# 6. Limpar pasta backoffice duplicada
cd ../../../..
rm -rf backoffice/backoffice/

# 7. Testar!
cd mobile/app && npm start
```

---

**Contacto:** [A definir]  
**Prazo:** 1 semana para tarefas de alta prioridade
