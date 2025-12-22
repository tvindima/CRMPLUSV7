# 🚀 CRMPLUSV7 - Deploy e Migrations

## Status Atual
✅ GitHub: Código pushed (tvindima/CRMPLUSV7)
✅ Railway: PostgreSQL online e pronto
✅ Railway: Backend configurado (Root Directory: backend)
⏳ Railway: Build em progresso...

---

## 📋 Quando o Deploy Terminar

### 1. Verificar se Backend está Online
```bash
# Ver logs
cd ~/Desktop/CRMPLUSV7
railway logs --service CRMPLUSV7

# Deve ver: "Uvicorn running on http://0.0.0.0:8000"
```

### 2. Obter URL do Backend
No Railway:
- **Settings** → **Networking** → **Generate Domain**
- Copie a URL (ex: `crmplusv7-production.up.railway.app`)

### 3. Testar Health Endpoint
```bash
# Substituir <URL> pela URL do Railway
curl https://<URL>/health

# Deve retornar: {"status":"healthy"}
```

### 4. Aplicar Migrations (IMPORTANTE!)
```bash
cd ~/Desktop/CRMPLUSV7

# Método 1: Via Railway CLI (RECOMENDADO)
railway run alembic upgrade head

# Se falhar, tentar com bash explícito:
railway run bash -c 'alembic upgrade head'
```

**Nota**: Como definimos `RUN_MIGRATIONS=false`, as migrations NÃO rodam automaticamente. É preciso aplicar manualmente na primeira vez.

### 5. Verificar Migrations Aplicadas
```bash
# Ver migration atual
railway run alembic current

# Deve mostrar: "head" e o hash da última migration
```

### 6. Testar API com Database
```bash
# Health check com DB
curl https://<URL>/api/v1/health

# Deve retornar: {"status":"healthy","database":"connected"}
```

---

## 🎯 Após Migrations: Criar Primeiro Agent (Admin)

```bash
# Substituir <URL> pela URL do Railway
curl -X POST https://<URL>/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crmplusv7.com",
    "name": "Admin CRM",
    "password": "Admin@2025!",
    "role": "admin"
  }'
```

### Testar Login
```bash
curl -X POST https://<URL>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crmplusv7.com",
    "password": "Admin@2025!"
  }'

# Deve retornar: access_token, refresh_token, etc.
```

---

## ⚡ Comandos Rápidos

```bash
# Ver logs em tempo real
railway logs --service CRMPLUSV7 --tail

# Abrir shell no container
railway run bash

# Ver variáveis de ambiente
railway vars

# Status do serviço
railway status
```

---

## 🔥 Se Migrations Falharem

### Erro: "cannot connect to database"
- Verificar se PostgreSQL está online: Railway → Postgres service
- Confirmar `DATABASE_URL=${{Postgres.DATABASE_URL}}` nas variáveis

### Erro: "alembic.ini not found"
- Confirmar Root Directory está `backend`
- Executar: `railway run bash -c 'pwd && ls -la'` para debug

### Erro: "No upgrade path"
- Database já tem tabelas? 
- Ver estado: `railway run alembic current`
- Se necessário: `railway run alembic stamp head`

---

## ✅ Checklist Final Deploy

- [ ] Build terminou sem erros
- [ ] Logs mostram "Uvicorn running"
- [ ] Domain gerado no Railway
- [ ] `/health` retorna 200 OK
- [ ] Migrations aplicadas com sucesso
- [ ] `/api/v1/health` retorna database connected
- [ ] Agent admin criado
- [ ] Login funciona e retorna tokens

---

**Quando o build terminar, volte aqui e execute os comandos acima! 🚀**
