# 🏠 CRMPLUSV7 - Sistema CRM Imobiliário

> **Fresh Start** - Arquitetura limpa, zero baggage histórico

Sistema completo de CRM para imobiliárias com backend FastAPI + PostgreSQL e app mobile React Native.

## 📋 Stack Tecnológica

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL (Railway)
- **ORM**: SQLAlchemy + Alembic
- **Auth**: JWT (access + refresh tokens)
- **Storage**: Cloudinary (fotos/vídeos)
- **Deploy**: Railway

### Mobile
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State**: Context API
- **Deploy**: Vercel (web build)

## 🚀 Quick Start

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL (local ou Railway)

### Setup Local

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configurar .env (copiar de .env.example)
cp .env.example .env

# Aplicar migrations
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

Aceder: http://localhost:8000/docs

#### Mobile
```bash
cd mobile/app
npm install

# Configurar .env (copiar de .env.example)
cp .env.example .env

# Iniciar Expo
npm start
```

## 📦 Estrutura do Projeto

```
CRMPLUSV7/
├── backend/
│   ├── app/
│   │   ├── agents/          # Gestão de agentes
│   │   ├── properties/      # Propriedades
│   │   ├── leads/           # Leads e contactos
│   │   ├── calendar/        # Eventos e visitas
│   │   ├── api/             # Endpoints API
│   │   ├── core/            # Config, auth, utils
│   │   ├── models/          # SQLAlchemy models
│   │   └── schemas/         # Pydantic schemas
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── start.sh
│
├── mobile/
│   └── app/
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── screens/     # App screens
│       │   ├── services/    # API calls
│       │   ├── contexts/    # React contexts
│       │   ├── navigation/  # Navigation setup
│       │   └── types/       # TypeScript types
│       ├── package.json
│       └── app.json
│
└── docs/                    # Documentação
```

## 🔑 Funcionalidades

### Backend
- ✅ **Autenticação**: JWT com refresh tokens
- ✅ **Agents**: CRUD completo com roles (admin/agent)
- ✅ **Properties**: Gestão de imóveis (title, price, location, photos, videos)
- ✅ **Leads**: Sistema de leads (new → contacted → qualified → converted → lost)
- ✅ **Visits**: Agendamento e tracking de visitas
- ✅ **First Impressions**: Recolha de feedback em visitas
- ✅ **Events**: Sistema de eventos genérico
- ✅ **Dashboard**: Métricas em tempo real
- ✅ **Site Preferences**: Configurações por agente
- ✅ **WebSockets**: Real-time updates
- ✅ **Cloudinary**: Upload de media

### Mobile
- ✅ **Login/Logout**: Com multi-device management
- ✅ **Dashboard**: Métricas do agente
- ✅ **Properties**: Listagem e detalhes de imóveis
- ✅ **Leads**: Gestão de contactos
- ✅ **Agenda**: Visitas e eventos
- ✅ **First Impressions**: Formulário com GPS + assinatura
- ✅ **Profile**: Edição de perfil com foto
- ✅ **Active Devices**: Gestão de sessões ativas

## 🌐 API Endpoints

### Auth
```
POST /api/v1/auth/login        # Login
POST /api/v1/auth/refresh      # Refresh token
POST /api/v1/auth/logout       # Logout
GET  /api/v1/auth/sessions     # Dispositivos ativos
```

### Agents
```
GET    /api/v1/agents          # Listar agentes
POST   /api/v1/agents          # Criar agente
GET    /api/v1/agents/{id}     # Detalhes agente
PUT    /api/v1/agents/{id}     # Atualizar agente
DELETE /api/v1/agents/{id}     # Eliminar agente
```

### Properties
```
GET    /api/v1/properties      # Listar propriedades
POST   /api/v1/properties      # Criar propriedade
GET    /api/v1/properties/{id} # Detalhes propriedade
PUT    /api/v1/properties/{id} # Atualizar propriedade
DELETE /api/v1/properties/{id} # Eliminar propriedade
```

### Leads
```
GET    /api/v1/leads           # Listar leads
POST   /api/v1/leads           # Criar lead
GET    /api/v1/leads/{id}      # Detalhes lead
PUT    /api/v1/leads/{id}      # Atualizar lead
PATCH  /api/v1/leads/{id}/status # Mudar status
```

### Dashboard
```
GET /api/v1/dashboard/metrics  # Métricas do agente
```

**Documentação completa**: `/docs` (Swagger UI)

## 🔐 Segurança

- ✅ JWT tokens com expiração (15 min access, 7 dias refresh)
- ✅ Refresh token rotation
- ✅ Device tracking e gestão de sessões
- ✅ CORS configurado
- ✅ Password hashing (bcrypt)
- ✅ Environment variables (nunca commitadas)
- ✅ SQL injection protection (SQLAlchemy ORM)

## 📊 Database Models

### Core Models
- **Agent**: Agentes imobiliários (email, name, photo, role, license_ami)
- **Property**: Imóveis (title, price, location, photos, videos, agent_id)
- **Lead**: Contactos (name, email, phone, status, source, agent_id)
- **Visit**: Visitas agendadas (property_id, agent_id, client_name, date)
- **Event**: Eventos genéricos (title, type, date, agent_id)
- **FirstImpression**: Feedback de visitas (visit_id, notes, photos, signature, gps)
- **RefreshToken**: Sessões ativas (token, agent_id, device_info, expires_at)
- **AgentSitePreferences**: Configurações do site do agente

### Relationships
```python
Agent -> Properties (one-to-many)
Agent -> Leads (one-to-many)
Agent -> Visits (one-to-many)
Property -> Visits (one-to-many)
Visit -> FirstImpressions (one-to-one)
```

## 🚀 Deploy

### Railway (Backend)
1. Criar projeto Railway
2. Adicionar PostgreSQL
3. Adicionar service (GitHub: CRMPLUSV7, root: `backend/`)
4. Configurar variáveis (ver [FRESH_START_GUIDE.md](FRESH_START_GUIDE.md))
5. Deploy automático

### Vercel (Mobile Web)
1. Importar repo GitHub
2. Root directory: `mobile/app`
3. Build: `npm run build:web`
4. Deploy

**Guia completo**: [FRESH_START_GUIDE.md](FRESH_START_GUIDE.md)

## 🧪 Testes

```bash
# Backend (quando implementados)
cd backend
pytest

# Linting
flake8 app/
mypy app/
```

## 📝 Migrations

```bash
# Criar nova migration
cd backend
alembic revision --autogenerate -m "descrição"

# Aplicar migrations
alembic upgrade head

# Reverter migration
alembic downgrade -1
```

## 🔧 Troubleshooting

### Backend não arranca
1. Verificar logs: `Uvicorn running`?
2. Confirmar `DATABASE_URL` está definido
3. Testar DB connection: `curl /api/v1/health`

### Mobile não liga ao backend
1. Confirmar `EXPO_PUBLIC_API_BASE_URL` no `.env`
2. Testar backend: `curl $API_URL/health`
3. Verificar CORS settings

**Guia completo**: [FRESH_START_GUIDE.md](FRESH_START_GUIDE.md)

## 📚 Documentação

- [Fresh Start Guide](FRESH_START_GUIDE.md) - Setup completo
- [API Docs](http://localhost:8000/docs) - Swagger UI
- [CREDENTIALS.md](CREDENTIALS.md) - Credenciais (não commitado)

## 🎯 Roadmap

### Fase 1 (Atual)
- ✅ Backend API completo
- ✅ Mobile app funcional
- ✅ Auth com JWT + refresh tokens
- ✅ Deploy Railway + Vercel

### Fase 2
- [ ] Testes automatizados (pytest + React Native Testing Library)
- [ ] CI/CD com GitHub Actions
- [ ] Notificações push (Expo Notifications)
- [ ] Sistema de mensagens in-app

### Fase 3
- [ ] Backoffice web (React + Vite)
- [ ] Relatórios avançados
- [ ] Integração com CasaSapo/Idealista
- [ ] Sistema de billing

## 👥 Equipa

**Dev Team** - Fresh start criado com sucesso! 🎉

## 📄 Licença

Privado - Todos os direitos reservados

---

**Última atualização**: Fresh start - commit inicial 02ee2a7
**Status**: ✅ Pronto para deploy
