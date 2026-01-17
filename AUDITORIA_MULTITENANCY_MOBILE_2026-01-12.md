# 🔍 AUDITORIA: MULTITENANCY E MOBILE APP - CRM PLUS V7

**Data:** 12 de janeiro de 2026  
**Foco:** Terminologia hardcoded e funcionalidades incompletas da App Mobile

---

## 📊 RESUMO EXECUTIVO

| Área | Problemas Identificados | Prioridade |
|------|------------------------|------------|
| **Terminologia Hardcoded** | 78 ficheiros com texto específico imobiliário | 🔴 ALTA |
| **Tema da App Mobile** | Mudança de tema não funciona (só persiste localmente) | 🔴 ALTA |
| **Multi-tenancy Terminology** | Sistema de terminologia existe mas não está integrado na mobile | 🟠 MÉDIA |
| **Funcionalidades Mobile Incompletas** | 12 funcionalidades parciais ou não funcionais | 🟠 MÉDIA |

---

## 1. 🔴 TERMINOLOGIA HARDCODED (PROBLEMA CRÍTICO)

### 1.1 Ficheiros Afetados na Mobile App

A aplicação mobile tem **78+ ficheiros** com termos específicos do ramo imobiliário hardcoded. Isto impede que novos tenants de outros setores (automóvel, retalho, hotelaria, etc.) usem a app.

#### Termos Encontrados:
| Termo | Ocorrências | Exemplo de Ficheiro |
|-------|-------------|---------------------|
| `imóvel` / `imóveis` | 150+ | HomeScreenV4.tsx, PropertiesScreenV4.tsx |
| `propriedad*` | 200+ | PropertiesScreen.tsx, PropertyDetailScreen.tsx |
| `agente imobiliário` | 25+ | ProfileScreenV3.tsx, HomeScreen.tsx |
| `consultor` | 15+ | CMIFormScreen.tsx |
| `moradia` | 10+ | CMIFormScreen.tsx, TaxCalculatorScreen.tsx |
| `apartamento` | 8+ | TaxCalculatorScreen.tsx |
| `terreno` | 5+ | CMIFormScreen.tsx |

### 1.2 Ficheiros Críticos a Corrigir

```
mobile/app/src/screens/
├── HomeScreen.tsx              ❌ "Agente" hardcoded
├── HomeScreenV2.tsx            ❌ "Dashboard do Agente Imobiliário" 
├── HomeScreenV3.tsx            ❌ "imóveis do agente"
├── HomeScreenV4.tsx            ❌ "Imóvel" hardcoded
├── HomeScreenV5.tsx            ❌ "Imóveis", "Agente"
├── ProfileScreen.tsx           ❌ "🏠 Agente"
├── ProfileScreenV3.tsx         ❌ "Agente Imobiliário"
├── ProfileScreenV4.tsx         ❌ "Agente Imobiliário"
├── ProfileScreenV5.tsx         ❌ "Agente Imobiliário"
├── ProfileScreenV6.tsx         ❌ "Agente Imobiliário"
├── PropertiesScreen.tsx        ❌ "propriedades", "angariadas"
├── PropertiesScreenV3.tsx      ❌ "imóveis do agente"
├── PropertiesScreenV4.tsx      ❌ "imóvel", "imóveis"
├── PropertyDetailScreen.tsx    ❌ "detalhes do imóvel"
├── AgendaScreen.tsx            ❌ "Visita a Imóvel"
├── AgendaScreenV5.tsx          ❌ "Visita a Imóvel", "Imóvel"
├── VisitDetailScreen.tsx       ❌ "Imóvel"
├── TaxCalculatorScreen.tsx     ❌ "Tipo de imóvel", "Destino do imóvel"
├── MortgageSimulatorScreen.tsx ❌ "Dados do Imóvel", "Valor do imóvel"
├── CMIFormScreen.tsx           ❌ "Imóvel", tipos específicos
├── EscrituraFormScreen.tsx     ❌ "Imóvel", "imóvel"
├── FirstImpressionFormScreen.tsx ❌ "Localização do Imóvel"
├── LeadsScreen.tsx             ❌ "agentes imobiliários"
└── ClientsScreen.tsx           ❌ "clientes do agente"

mobile/app/src/navigation/
└── index.tsx                   ❌ "Propriedades", "Detalhe do Imóvel"

mobile/app/src/components/
├── PhotoPicker.tsx             ❌ "Fotos do Imóvel"
└── Skeleton.tsx                ❌ "card de propriedade"
```

### 1.3 Sistema de Terminologia Existente (NÃO INTEGRADO)

O projeto já tem sistemas de terminologia dinâmica implementados no **site-montra** e **backoffice**, mas **NÃO na mobile app**:

#### ✅ Já Existe:
```typescript
// site-montra/lib/sector-terminology.ts
export type Sector = 'real_estate' | 'automotive' | 'retail' | 'services' | 'other';

interface SectorTerms {
  item: string;        // imóvel, veículo, produto
  items: string;       // imóveis, veículos, produtos
  agent: string;       // agente, comercial, vendedor
  agents: string;      // agentes, comerciais, vendedores
  // ... 25+ termos dinâmicos
}
```

```typescript
// backoffice/lib/sectorConfig.ts
export const PROPERTY_TYPES: Record<Sector, string[]> = {
  real_estate: ["Apartamento", "Moradia", "Terreno", ...],
  automotive: ["Ligeiro Passageiros", "SUV", "Comercial", ...],
  boats: ["Veleiro", "Lancha", "Iate", ...],
  // ...
};
```

```python
# backend/app/platform/form_fields.py
SECTOR_FIELDS_MAP = {
    "real_estate": COMMON_FIELDS + REAL_ESTATE_FIELDS,
    "automotive": COMMON_FIELDS + AUTOMOTIVE_FIELDS,
    "services": COMMON_FIELDS + SERVICES_FIELDS,
    # ...
}
```

#### ❌ Falta na Mobile App:
- Não existe `SectorContext` ou `TerminologyContext`
- Não carrega o sector do tenant atual
- Todos os textos estão hardcoded

### 1.4 Solução Proposta

**PASSO 1:** Criar `TerminologyContext` na mobile app:

```typescript
// mobile/app/src/contexts/TerminologyContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

type Sector = 'real_estate' | 'automotive' | 'retail' | 'services' | 'boats' | 'hospitality' | 'other';

interface Terminology {
  // Entidade principal
  item: string;           // imóvel, veículo, produto
  items: string;          // imóveis, veículos, produtos
  itemCapital: string;    // Imóvel, Veículo, Produto
  itemsCapital: string;   // Imóveis, Veículos, Produtos
  
  // Agentes
  agent: string;          // agente, comercial, vendedor
  agentCapital: string;   // Agente, Comercial, Vendedor
  agentRole: string;      // Agente Imobiliário, Comercial, Vendedor
  
  // Ações
  searchPlaceholder: string;
  noItemsFound: string;
  
  // Navegação
  menuItems: string;      // Imóveis, Veículos, Produtos
}

const SECTOR_TERMS: Record<Sector, Terminology> = {
  real_estate: {
    item: 'imóvel',
    items: 'imóveis',
    itemCapital: 'Imóvel',
    itemsCapital: 'Imóveis',
    agent: 'agente',
    agentCapital: 'Agente',
    agentRole: 'Agente Imobiliário',
    searchPlaceholder: 'Pesquisar imóveis...',
    noItemsFound: 'Nenhum imóvel encontrado',
    menuItems: 'Imóveis',
  },
  automotive: {
    item: 'veículo',
    items: 'veículos',
    itemCapital: 'Veículo',
    itemsCapital: 'Veículos',
    agent: 'comercial',
    agentCapital: 'Comercial',
    agentRole: 'Comercial',
    searchPlaceholder: 'Pesquisar veículos...',
    noItemsFound: 'Nenhum veículo encontrado',
    menuItems: 'Veículos',
  },
  // ... outros setores
};

export function useTerminology() {
  return useContext(TerminologyContext);
}
```

**PASSO 2:** Carregar sector do tenant no login/startup

**PASSO 3:** Substituir textos hardcoded por `terminology.item`, `terminology.agent`, etc.

---

## 2. 🔴 TEMA DA APP NÃO FUNCIONA (CRÍTICO)

### 2.1 Problema Identificado

Ao mudar o tema nas **Definições** da app mobile, a mudança **NÃO** é aplicada aos componentes da app. Os temas são:

```typescript
// SettingsScreen.tsx (linhas 47-90)
const APP_THEMES: AppTheme[] = [
  { id: 'futuristic', name: 'Futurista', ... },
  { id: 'professional', name: 'Profissional', ... },
  { id: 'luxury', name: 'Luxuoso', ... },
  { id: 'feminine', name: 'Elegante Rosa', ... },
  { id: 'nature', name: 'Natureza', ... },
  { id: 'minimalist', name: 'Minimalista', ... },
];
```

### 2.2 Causa do Problema

A mudança de tema só persiste em `AsyncStorage`, mas **NÃO existe um `ThemeContext`** para propagar as cores para os componentes:

```typescript
// SettingsScreen.tsx - Problema:
const handleThemeSelect = (themeId: string) => {
  setSelectedTheme(themeId);
  saveSettings({ theme: themeId });  // ← Só salva em AsyncStorage
  setShowThemeModal(false);
  // ❌ NÃO propaga para os componentes!
};
```

### 2.3 Cores Hardcoded em Todos os Ecrãs

Os ficheiros de tema (`theme/tokens.ts`) definem cores, mas estão **hardcoded**:

```typescript
// mobile/app/src/theme/tokens.ts
export const colors = {
  background: {
    primary: '#0B0B0D',    // ❌ Hardcoded
    secondary: '#12141A',  // ❌ Hardcoded
  },
  brand: {
    cyan: '#00D9FF',       // ❌ Hardcoded
    magenta: '#E946D5',    // ❌ Hardcoded
  },
  // ...
};
```

Cada ecrã usa cores diretamente nos styles:

```typescript
// Exemplo: HomeScreenV5.tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0e1a',  // ❌ Hardcoded
  },
  title: {
    color: '#00d9ff',            // ❌ Hardcoded
  },
});
```

### 2.4 Solução Proposta

**PASSO 1:** Criar `ThemeContext`:

```typescript
// mobile/app/src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  background: { primary: string; secondary: string };
  brand: { primary: string; secondary: string; accent: string };
  text: { primary: string; secondary: string };
}

const THEMES: Record<string, ThemeColors> = {
  futuristic: {
    background: { primary: '#0a0e1a', secondary: '#12141A' },
    brand: { primary: '#00d9ff', secondary: '#8b5cf6', accent: '#d946ef' },
    text: { primary: '#ffffff', secondary: '#9ca3af' },
  },
  professional: {
    background: { primary: '#111827', secondary: '#1f2937' },
    brand: { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa' },
    text: { primary: '#ffffff', secondary: '#9ca3af' },
  },
  // ... outros temas
};

export const ThemeContext = createContext<{
  colors: ThemeColors;
  themeId: string;
  setTheme: (id: string) => void;
}>({} as any);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState('futuristic');
  const colors = THEMES[themeId] || THEMES.futuristic;

  useEffect(() => {
    AsyncStorage.getItem('@crm_plus_settings').then((data) => {
      if (data) {
        const settings = JSON.parse(data);
        if (settings.theme) setThemeId(settings.theme);
      }
    });
  }, []);

  const setTheme = (id: string) => {
    setThemeId(id);
    // Salvar também em AsyncStorage
  };

  return (
    <ThemeContext.Provider value={{ colors, themeId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

**PASSO 2:** Usar `useTheme()` em todos os ecrãs:

```typescript
// Antes (hardcoded):
const styles = StyleSheet.create({
  container: { backgroundColor: '#0a0e1a' },
});

// Depois (dinâmico):
export default function HomeScreen() {
  const { colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background.primary }}>
      {/* ... */}
    </View>
  );
}
```

---

## 3. 🟠 OUTRAS FUNCIONALIDADES INCOMPLETAS NA MOBILE APP

### 3.1 Funcionalidades Não Funcionais

| Funcionalidade | Estado | Problema |
|----------------|--------|----------|
| **Mudar Tema** | ❌ Não funciona | Sem ThemeContext (ver secção 2) |
| **Mudar Idioma** | ❌ Não funciona | Sem i18n/traduções implementadas |
| **Limpar Cache** | ⚠️ Parcial | Só console.log, não limpa nada |
| **Exportar Dados** | ❌ Não funciona | Só console.log |
| **Tasks/Tarefas** | ❌ Não implementado | 7 endpoints disponíveis, 0 usados |
| **Actividade Recente** | ❌ Não implementado | Endpoint existe mas não é chamado |
| **Visitas do Dia Widget** | ❌ Não implementado | `/mobile/visits/today` não é usado |
| **Eventos Individuais** | ❌ Parcial | GET/PUT/DELETE de eventos não usados |
| **OCR de Documentos** | ❌ Não implementado | Endpoints CMI OCR disponíveis |
| **Stats PA/CMI** | ❌ Não implementado | Endpoints de stats disponíveis |

### 3.2 SettingsScreen - Funcionalidades Mock

```typescript
// SettingsScreen.tsx - Linhas 485-509
// "Limpar Cache" - Não faz nada:
<TouchableOpacity style={styles.settingRow}>
  {/* ❌ Sem onPress handler! */}
  <Text>Limpar Cache</Text>
</TouchableOpacity>

// "Exportar Dados" - Não faz nada:
<TouchableOpacity style={styles.settingRow}>
  {/* ❌ Sem onPress handler! */}
  <Text>Exportar Dados</Text>
</TouchableOpacity>
```

### 3.3 Services Vazios/Parciais

```
mobile/app/src/services/
├── leads.ts        ⚠️ Parcial - Falta updateStatus, contact
├── properties.ts   ⚠️ Parcial - Funcional mas não usa filtersByAgent
├── clientService.ts ❌ Sem autenticação (problema de segurança)
└── tasks.ts        ❌ Não existe (deveria existir para 7 endpoints)
```

---

## 4. 📋 PLANO DE CORREÇÃO

### FASE 1: Terminologia Multi-Tenant (Prioridade ALTA - 2-3 dias)

1. [ ] Criar `TerminologyContext` na mobile app
2. [ ] Criar endpoint `/api/v1/tenant/terminology` no backend
3. [ ] Substituir textos hardcoded nos 25 ecrãs principais
4. [ ] Testar com tenant de sector diferente (ex: automotive)

### FASE 2: Sistema de Temas (Prioridade ALTA - 1-2 dias)

1. [ ] Criar `ThemeContext` com 6 temas definidos
2. [ ] Integrar com `SettingsScreen`
3. [ ] Refatorar estilos para usar `useTheme()`
4. [ ] Testar mudança de tema em todos os ecrãs

### FASE 3: Funcionalidades Incompletas (Prioridade MÉDIA - 3-4 dias)

1. [ ] Implementar "Limpar Cache" funcional
2. [ ] Implementar "Exportar Dados" (download JSON/CSV)
3. [ ] Criar `tasksService.ts` e ecrã de Tasks
4. [ ] Adicionar widget "Visitas do Dia" no HomeScreen
5. [ ] Adicionar "Actividade Recente" no Dashboard

### FASE 4: Correções de Segurança (Prioridade MÉDIA - 1 dia)

1. [ ] Adicionar autenticação ao `clientService.ts`
2. [ ] Adicionar `X-Tenant-Slug` ao `auth.ts`

---

## 5. 📈 ESFORÇO ESTIMADO

| Fase | Esforço | Complexidade |
|------|---------|--------------|
| Terminologia Multi-Tenant | ~20 horas | Alta |
| Sistema de Temas | ~12 horas | Média |
| Funcionalidades Incompletas | ~24 horas | Média |
| Correções de Segurança | ~4 horas | Baixa |
| **TOTAL** | **~60 horas** | - |

---

## 6. ANEXO: Lista Completa de Ficheiros a Modificar

### Para Terminologia (25 ficheiros principais):

```
mobile/app/src/screens/HomeScreen.tsx
mobile/app/src/screens/HomeScreenV2.tsx
mobile/app/src/screens/HomeScreenV3.tsx
mobile/app/src/screens/HomeScreenV4.tsx
mobile/app/src/screens/HomeScreenV5.tsx
mobile/app/src/screens/ProfileScreen.tsx
mobile/app/src/screens/ProfileScreenV3.tsx
mobile/app/src/screens/ProfileScreenV4.tsx
mobile/app/src/screens/ProfileScreenV5.tsx
mobile/app/src/screens/ProfileScreenV6.tsx
mobile/app/src/screens/PropertiesScreen.tsx
mobile/app/src/screens/PropertiesScreenV3.tsx
mobile/app/src/screens/PropertiesScreenV4.tsx
mobile/app/src/screens/PropertyDetailScreen.tsx
mobile/app/src/screens/PropertyDetailScreenV4.tsx
mobile/app/src/screens/AgendaScreen.tsx
mobile/app/src/screens/AgendaScreenV5.tsx
mobile/app/src/screens/VisitDetailScreen.tsx
mobile/app/src/screens/VisitDetailScreenV4.tsx
mobile/app/src/screens/TaxCalculatorScreen.tsx
mobile/app/src/screens/MortgageSimulatorScreen.tsx
mobile/app/src/screens/CMIFormScreen.tsx
mobile/app/src/screens/EscrituraFormScreen.tsx
mobile/app/src/screens/FirstImpressionFormScreen.tsx
mobile/app/src/navigation/index.tsx
```

### Para Temas (todos os ecrãs com styles hardcoded):

Praticamente todos os ficheiros em `mobile/app/src/screens/` precisam de refatoração para usar `useTheme()`.

---

*Relatório gerado automaticamente - Auditoria Técnica CRM PLUS V7*
*Data: 12 de janeiro de 2026*
