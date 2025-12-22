# 🚀 CRMPLUSV7 - Guia de Fresh Start

## ✅ FASE 1: Setup Local (COMPLETO)
- ✅ Estrutura criada em `~/Desktop/CRMPLUSV7`
- ✅ Backend copiado: 139 ficheiros Python (824KB)
- ✅ 13 migrations essenciais
- ✅ Mobile app (código apenas, sem node_modules)
- ✅ Git inicializado com commit inicial (247 ficheiros)
- ✅ Branch main configurada

## 📋 FASE 2: GitHub (FAÇA AGORA)

### 2.1 Criar Repositório no GitHub
**A página já está aberta no browser!**

1. **Nome do repositório**: `CRMPLUSV7`
2. **Visibilidade**: Private ✅
3. **NÃO inicialize** com README, .gitignore ou license (já temos)
4. Clique **Create repository**

### 2.2 Push do Código
Após criar o repo, copie e execute:

```bash
cd ~/Desktop/CRMPLUSV7
git remote add origin https://github.com/SEU_USERNAME/CRMPLUSV7.git
git push -u origin main
```

✅ **Checkpoint**: Confirme que vê os 247 ficheiros no GitHub

---

## 🚂 FASE 3: Railway Setup

### 3.1 Criar Projeto Railway
1. Aceda a https://railway.app/new
2. **Create New Project** → **Deploy from GitHub repo**
3. Selecione `CRMPLUSV7`
4. **Root Directory**: `backend`
5. **Start Command**: `bash start.sh`

### 3.2 Adicionar PostgreSQL
1. No projeto Railway, clique **+ New**
2. Selecione **Database** → **PostgreSQL**
3. Anote a variável: `DATABASE_URL`

### 3.3 Configurar Variáveis de Ambiente (Backend Service)

```bash
# Database (automático do Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Secrets (gerar novas!)
SECRET_KEY=<gerar com: openssl rand -hex 32>
JWT_SECRET_KEY=<gerar com: openssl rand -hex 32>

# CORS
CORS_ORIGINS=*

# Cloudinary (suas credenciais)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# Migrations (IMPORTANTE!)
RUN_MIGRATIONS=false
```

### 3.4 Deploy Inicial
1. Railway vai fazer deploy automático
2. **Aguarde completar** (~2-3 min)
3. Verifique logs: deve ver `Uvicorn running on http://0.0.0.0:8000`
4. Clique **Settings** → **Generate Domain**
5. Teste: `curl https://SEU_DOMINIO.railway.app/health`

✅ **Checkpoint**: `/health` deve retornar 200 OK

### 3.5 Aplicar Migrations (MANUALMENTE na primeira vez)
No Railway terminal ou localmente com Railway CLI:

```bash
# Instalar Railway CLI (se não tiver)
npm i -g @railway/cli

# Login
railway login

# Linkar ao projeto
railway link

# Aplicar migrations
railway run bash -c 'cd backend && alembic upgrade head'
```

### 3.6 Ativar Migrations Automáticas (Opcional para próximos deploys)
Se tudo correu bem, pode ativar:
- Railway → Variables → `RUN_MIGRATIONS=true`

⚠️ **Nota**: Só ative após confirmar que DB está a funcionar!

---

## 📱 FASE 4: Vercel Setup (Mobile Web)

### 4.1 Criar Projeto Vercel
1. Aceda a https://vercel.com/new
2. **Import Git Repository** → Selecione `CRMPLUSV7`
3. **Root Directory**: `mobile/app`
4. **Framework Preset**: `Other`

### 4.2 Build Settings
```
Build Command: npm run build:web
Output Directory: web-build
Install Command: npm install
```

### 4.3 Variáveis de Ambiente
```bash
EXPO_PUBLIC_API_BASE_URL=https://SEU_DOMINIO.railway.app
CLOUDINARY_CLOUD_NAME=seu_cloud_name
```

### 4.4 Deploy
1. Clique **Deploy**
2. Aguarde build (~5 min)
3. Teste a URL gerada

✅ **Checkpoint**: App mobile deve carregar no browser

---

## 🧪 FASE 5: Validação Completa

### 5.1 Backend Health Check
```bash
# Health básico
curl https://SEU_DOMINIO.railway.app/health

# DB Connection
curl https://SEU_DOMINIO.railway.app/api/v1/health

# Mobile version
curl https://SEU_DOMINIO.railway.app/mobile/version
```

### 5.2 Testar Authentication
```bash
# Criar primeiro agent (admin)
curl -X POST https://SEU_DOMINIO.railway.app/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crmplusv7.com",
    "name": "Admin",
    "password": "suasenha123",
    "role": "admin"
  }'

# Login
curl -X POST https://SEU_DOMINIO.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crmplusv7.com",
    "password": "suasenha123"
  }'
```

### 5.3 Testar Mobile App
1. Abra a URL do Vercel
2. Faça login com as credenciais criadas
3. Navegue por: Dashboard → Propriedades → Leads → Perfil

---

## 🎯 Checklist Final

- [ ] GitHub: Repo CRMPLUSV7 criado e código pushed
- [ ] Railway: Projeto criado com PostgreSQL
- [ ] Railway: Backend service deployed e a funcionar
- [ ] Railway: Migrations aplicadas (`alembic upgrade head`)
- [ ] Railway: `/health` retorna 200 OK
- [ ] Railway: Agent admin criado e login funciona
- [ ] Vercel: Mobile app deployed
- [ ] Vercel: App carrega e faz login
- [ ] Todas as credenciais antigas ELIMINADAS
- [ ] Todas as variáveis NOVAS geradas

---

## 📝 Credenciais Novas (Guardar em Segurança!)

```bash
# Backend Railway
SECRET_KEY=___________________________
JWT_SECRET_KEY=___________________________
DATABASE_URL=postgresql://... (automático Railway)

# Cloudinary (reutilizar ou criar novas)
CLOUDINARY_CLOUD_NAME=___________________________
CLOUDINARY_API_KEY=___________________________
CLOUDINARY_API_SECRET=___________________________

# URLs
BACKEND_URL=https://_____________________________.railway.app
MOBILE_URL=https://_____________________________.vercel.app

# Admin Account
EMAIL=admin@crmplusv7.com
PASSWORD=___________________________
```

---

## 🔥 Vantagens do Fresh Start

✅ **Zero baggage histórico**
- Sem commits antigos (500+)
- Sem conflitos de DATABASE_URL
- Sem ficheiros .bak/.backup
- Sem node_modules antigos (469MB)

✅ **Credenciais novas**
- SECRET_KEY novo
- JWT_SECRET_KEY novo
- DATABASE_URL novo (PostgreSQL fresco)
- Sem risco de leaks de credenciais antigas

✅ **Arquitetura limpa**
- 139 ficheiros Python essenciais (824KB)
- 13 migrations validadas
- Mobile app otimizado
- Scripts start.sh com retry logic

✅ **Deploy controlado**
- `RUN_MIGRATIONS=false` por defeito
- Migrations manuais primeiro (segurança)
- Health checks em todos os níveis
- Logs limpos desde o início

---

## 🆘 Troubleshooting

### Backend não arranca
1. Verifique logs Railway: `Uvicorn running`?
2. Confirme `DATABASE_URL` está definido
3. Teste localmente: `cd backend && uvicorn app.main:app`

### Migrations falham
1. Verifique PostgreSQL está online (Railway)
2. Confirme `alembic.ini` tem `sqlalchemy.url` correto
3. Teste: `railway run bash -c 'cd backend && alembic current'`

### Mobile não liga ao backend
1. Confirme `EXPO_PUBLIC_API_BASE_URL` no Vercel
2. Teste: `curl $EXPO_PUBLIC_API_BASE_URL/health`
3. Verifique CORS: `CORS_ORIGINS=*` no Railway

---

## 🎉 Próximos Passos (Após Deploy)

1. **Seed inicial**: Criar agents, properties, leads de teste
2. **Monitorização**: Railway alerts + logs
3. **Backup**: Configurar Railway PostgreSQL backups
4. **CI/CD**: GitHub Actions para testes automáticos
5. **Domínio**: Configurar domínio custom (opcional)

---

**Última atualização**: Fresh start criado com sucesso!
**Commit inicial**: 02ee2a7 (247 ficheiros, 45086 linhas)
