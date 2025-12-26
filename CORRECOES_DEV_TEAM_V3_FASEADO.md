# 🛠️ RELATÓRIO DE CORREÇÕES - DEV TEAM (V3 - FASEADO)

**Projeto:** CRM Plus V7  
**Data:** 26 de dezembro de 2025  
**Versão:** 3.0 (Abordagem Faseada e Segura)  
**Resposta ao feedback da Dev Team**

---

## ✅ CONCORDÂNCIA COM DEV TEAM

A dev team tem razão. A limpeza em massa proposta anteriormente é arriscada e não prioritária.

**Nova abordagem:**
1. 🔴 **Primeiro:** Resolver bugs funcionais (pré-angariação, uploads, CORS)
2. 🟡 **Depois:** Alinhar variáveis de ambiente (.env)
3. 🟢 **Por último:** Limpeza gradual com testes entre commits

---

## 📊 PRIORIDADES REVISTAS

| Prioridade | Tarefa | Risco | Impacto |
|------------|--------|-------|---------|
| 🔴 **P0** | Bugs funcionais (pré-angariação, uploads) | Baixo | Alto - afeta utilizadores |
| 🔴 **P1** | Definir CLOUDINARY_CLOUD_NAME único | Baixo | Alto - imagens quebradas |
| 🟡 **P2** | Alinhar todos os .env | Baixo | Médio |
| 🟢 **P3** | Remover ficheiros " 2.*" (um commit por módulo) | Médio | Baixo |
| ⚪ **P4** | Remover versões antigas ecrãs (após mapear imports) | Alto | Baixo |
| ⚪ **P5** | Pastas duplicadas (após confirmar deploy) | Alto | Baixo |

---

## 🔴 FASE 0: BUGS FUNCIONAIS (ANÁLISE FEITA)

### Estado Atual do Código (Analisado)

#### 1. Pré-Angariação / Delete / Cancel

**Código atual (`backend/app/routers/pre_angariacoes.py` linhas 390-430):**
- ✅ DELETE marca como `CANCELADO` (não apaga fisicamente)
- ✅ Tenta marcar FirstImpression associada como `cancelled`
- ✅ Filtro no mobile (`FirstImpressionListScreen.tsx` linha 46) exclui `cancelled`/`cancelado`

**Potencial problema:**
```python
# Linha 421-427 - try/except pode falhar silenciosamente
try:
    if item.first_impression_id:
        fi = db.query(FirstImpression).filter(...).first()
        if fi:
            fi.status = "cancelled"
except Exception as e:
    logger.warning(f"Não foi possível marcar 1ª impressão como cancelada: {e}")
```

**Para testar:** Fornecer IDs de pré-angariações para validar se DELETE reflete no mobile.

#### 2. Uploads

**Código atual (`mobile/app/src/services/cloudinary.ts`):**
- ✅ Upload direto para Cloudinary (client-side)
- ✅ Busca config do backend: `/mobile/cloudinary/upload-config`
- ⚠️ Depende de `upload_preset` correto

**Endpoint config (`backend/app/mobile/routes.py`):**
```python
cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dtpk4oqoa")  # fallback hardcoded
```

**Potencial problema:** Se CLOUDINARY_CLOUD_NAME não estiver definido ou diferente do upload_preset, uploads falham.

#### 3. CORS

**Código atual (`backend/app/main.py` linhas 90-115):**
```python
CORS_ORIGINS_ENV = os.environ.get("CORS_ORIGINS", os.environ.get("CRMPLUS_CORS_ORIGINS", ""))
if CORS_ORIGINS_ENV == "*":
    ALLOWED_ORIGINS = ["*"]
    ALLOW_CREDENTIALS = False  # ← Obrigatório com "*"
```

**Estado:**
- Se `CORS_ORIGINS="*"` no Railway → credentials desativadas
- Regex fallback: `r"https://.*\.vercel\.app|https://.*"` (aceita tudo HTTPS)

**Para verificar:** Qual o valor atual de `CORS_ORIGINS` no Railway?

---

### 🔍 INFORMAÇÃO NECESSÁRIA DA DEV TEAM

| Pergunta | Para quê |
|----------|----------|
| **IDs de pré-angariações para testar** | Validar DELETE/cancel no mobile |
| **Fluxo de upload com erro** | Fotos de imóvel? Documentos? Qual ecrã? |
| **Endpoints com CORS error** | Qual endpoint? Mobile ou Web? |
| **Valor de CORS_ORIGINS no Railway** | Verificar se é "*" ou lista específica |

---

## 🔴 FASE 1: CLOUDINARY_CLOUD_NAME ✅ RESOLVIDO

### Estado Atual

| Ficheiro | Valor | Status |
|----------|-------|--------|
| `mobile/app/.env` | `dtpk4oqoa` | ✅ Correto |
| `mobile/app/.env.production` | `dtpk4oqoa` | ✅ Correto |
| `backend/app/mobile/routes.py` | `dtpk4oqoa` (fallback) | ✅ Correto |

**Verificação:** Nenhum ficheiro com valor errado encontrado.

---

## 🟡 FASE 2: ALINHAR .ENV (SEGURO)

### 2.1 Template Padrão

Criar `.env.example` consistente em cada projeto:

**Backend:**
```env
DATABASE_URL=postgresql://...
CRMPLUS_AUTH_SECRET=
CLOUDINARY_CLOUD_NAME=dtpk4oqoa
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Frontends (Next.js):**
```env
NEXT_PUBLIC_API_BASE_URL=https://crmplusv7-production.up.railway.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dtpk4oqoa
```

**Mobile (Expo):**
```env
EXPO_PUBLIC_API_BASE_URL=https://crmplusv7-production.up.railway.app
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dtpk4oqoa
EXPO_PUBLIC_ENV=production
```

### 2.2 Verificar Vercel/Railway

Confirmar que as variáveis estão definidas nos dashboards de deploy.

---

## 🟢 FASE 3: REMOVER FICHEIROS " 2.*" (COM CUIDADO)

### 3.1 Metodologia Segura

**Para CADA módulo:**
1. Verificar se ficheiro " 2" é diferente do original
2. Se diferente → pode ter código não migrado → REVISAR antes
3. Se igual → seguro apagar
4. Fazer commit separado
5. Testar build

### 3.2 Verificar Diferenças Primeiro

```bash
# Backend Core - verificar se são iguais
cd backend/app/core
diff "events.py" "events 2.py"
diff "logging.py" "logging 2.py"
diff "exceptions.py" "exceptions 2.py"
diff "websocket.py" "websocket 2.py"
diff "scheduler.py" "scheduler 2.py"
```

```bash
# Site Montra - verificar
cd site-montra
diff ".eslintrc.json" ".eslintrc 2.json" 2>/dev/null
diff "Dockerfile" "Dockerfile 2"
diff ".gitignore" ".gitignore 2" 2>/dev/null
```

### 3.3 Se Forem Iguais → Remover

```bash
# Commit 1: Backend Core
cd backend/app/core
rm "events 2.py" "logging 2.py" "exceptions 2.py" "websocket 2.py" "scheduler 2.py"
cd ../../..
git add -A && git commit -m "chore(backend): remover ficheiros duplicados ' 2' no core"

# Verificar build
cd backend && python -c "from app.main import app; print('OK')"

# Commit 2: Site Montra
cd ../site-montra
rm ".eslintrc 2.json" "Dockerfile 2" ".gitignore 2" 2>/dev/null
rm "__tests__/PropertyForm.test 2.tsx" "__tests__/DataTable.test 2.tsx" 2>/dev/null
git add -A && git commit -m "chore(site-montra): remover ficheiros duplicados ' 2'"

# Verificar build
npm run build
```

### 3.4 Mobile - Mais Cuidado

```bash
# Verificar diferenças primeiro
cd mobile/app/src/screens
for f in *" 2.tsx"; do
  original="${f% 2.tsx}.tsx"
  if [ -f "$original" ]; then
    echo "=== Comparando: $original vs $f ==="
    diff "$original" "$f" | head -20
  fi
done
```

**Se forem backups não migrados → NÃO apagar sem revisar!**

---

## ⚪ FASE 4: VERSÕES ANTIGAS DE ECRÃS (ADIAR)

### 4.1 Não Fazer Agora

Esta fase só deve acontecer quando:
- [ ] Bugs funcionais resolvidos
- [ ] App estável em produção
- [ ] Tempo dedicado para testar

### 4.2 Quando For Altura - Metodologia

**Antes de apagar qualquer ecrã:**

```bash
# 1. Mapear todos os imports
cd mobile/app
grep -r "LoginScreen" --include="*.tsx" --include="*.ts" src/

# 2. Verificar navegação
cat src/navigation/index.tsx | grep -i "screen"

# 3. Listar versões de cada ecrã
ls -la src/screens/Login*.tsx
ls -la src/screens/Home*.tsx
# etc.
```

**Só apagar quando:**
- Confirmado que versão não está importada em lado nenhum
- Build passa após remoção
- App testada manualmente

---

## ⚪ FASE 5: PASTAS DUPLICADAS (ADIAR)

### 5.1 Não Fazer Agora

Pastas como `backoffice/backoffice/` podem estar:
- Referenciadas em builds de deploy
- Usadas por scripts
- Necessárias para funcionamento atual

### 5.2 Quando For Altura

```bash
# Verificar referências antes de apagar
grep -r "backoffice/backoffice" --include="*.json" --include="*.js" --include="*.ts" .
grep -r "web/backoffice" --include="*.json" --include="*.js" --include="*.ts" .

# Verificar configs de deploy
cat vercel.json
cat backoffice/vercel.json
cat web/vercel.json
```

---

## 📋 CHECKLIST REVISTO

### Esta Semana (P0-P1)

- [ ] **Dev team lista bugs específicos** de pré-angariação, uploads, CORS
- [ ] **Decidir CLOUDINARY_CLOUD_NAME** correto
- [ ] Aplicar cloud_name correto em todos os .env
- [ ] Testar que imagens carregam corretamente

### Próxima Semana (P2-P3)

- [ ] Alinhar .env.example em todos os projetos
- [ ] Verificar variáveis em Vercel/Railway dashboards
- [ ] Verificar se ficheiros " 2.*" são iguais aos originais
- [ ] Se iguais → remover com commits separados por módulo
- [ ] Testar build após cada commit

### Quando Houver Tempo (P4-P5)

- [ ] Mapear imports de todos os ecrãs do mobile
- [ ] Identificar versões realmente não usadas
- [ ] Remover uma versão de cada vez, com teste
- [ ] Investigar pastas duplicadas

---

## 🔍 INFORMAÇÃO EM FALTA

~~CLOUDINARY_CLOUD_NAME~~ ✅ Já confirmado: `dtpk4oqoa`

Para avançar nos bugs, a dev team só precisa de fornecer:

| Pergunta | Resposta Esperada |
|----------|-------------------|
| **IDs de pré-angariações para testar DELETE** | Ex: 5, 12, 23 |
| **Fluxo específico de upload com erro** | "Fotos em FirstImpressionForm" ou "Documentos em CMIForm" |
| **Endpoint com CORS error** | Ex: "POST /mobile/first-impressions" |
| **Valor atual de CORS_ORIGINS no Railway** | "*" ou lista? |

---

## ✅ PRÓXIMO PASSO

**Opção 1 - Dev team fornece info acima** → Posso atacar bugs específicos

**Opção 2 - Avançar sem testes** → Posso:
1. ✅ Garantir CLOUDINARY_CLOUD_NAME = `dtpk4oqoa` em todos os .env (valor usado no backend como fallback)
2. ✅ Verificar se CORS_ORIGINS está como "*" no Railway
3. ✅ Remover ficheiros " 2.*" óbvios (após diff confirmar que são iguais)

---

## 📋 FICHEIROS RELEVANTES IDENTIFICADOS

| Área | Ficheiro | Linhas Importantes |
|------|----------|-------------------|
| **DELETE pré-angariação** | `backend/app/routers/pre_angariacoes.py` | 390-430 |
| **Filtro cancelled mobile** | `mobile/app/src/screens/FirstImpressionListScreen.tsx` | 46 |
| **Upload config** | `backend/app/mobile/routes.py` | cloud_name hardcoded |
| **Cloudinary service** | `mobile/app/src/services/cloudinary.ts` | getConfig() |
| **CORS** | `backend/app/main.py` | 90-115 |

---

**Abordagem:** Pequenos passos, um commit por mudança, testar sempre.
