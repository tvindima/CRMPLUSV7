# 🔍 Relatório de Auditoria — CRMPLUSV7

**Data:** 29 de dezembro de 2025  
**Objetivo:** auditoria prática (endpoints ↔ ecrãs/fluxos) + prioridades de correção.  
**Nota:** este relatório substitui partes desatualizadas do `RELATORIO_AUDITORIA_CRMPLUSV7.md` (22/12).

---

## 1) Estado atual (confirmado no código)

### 1.1 Website (Site Montra)
**Consome:**
- `GET /properties/?is_published=1&skip&limit` (listagem pública)
- `GET /agents/?limit` e `GET /agents/staff`
- `POST /leads/from-website`
- `POST /website/auth/register`, `POST /website/auth/login`, `GET|POST /website/auth/validate`
- `GET /website/auth/agents?interest_type=...` (lista consultores para escolha)

**Ponto crítico corrigido (IDs):**
- `assigned_agent_id` do website client deve ser `Agent.id` (não `User.id`).
- Esta repo agora está alinhada com isso em:
  - [backend/app/routers/website_auth.py](backend/app/routers/website_auth.py)
  - [backend/app/routers/website_clients.py](backend/app/routers/website_clients.py)

### 1.2 Backoffice
**Consome (principal):**
- via proxy `/api/*` do Next para `properties`, `leads`, `agents`, `users`, `pre-angariacoes`, `api/dashboard/*`.
- `GET /website/clients/*` (ecrã “website clients”).

### 1.3 Mobile
**Consome:**
- `/mobile/*` (maioria dos fluxos)
- `/auth/login` + `/auth/refresh` (refresh token)

**Observação:** existe também `/auth/mobile/login`, mas não é obrigatório se o fluxo atual está estabilizado em `/auth/login` + `/auth/refresh`.

---

## 2) Prioridades (P0) — acordadas

### P0-A) Fechar CRUD sensíveis com autenticação
**Risco atual:** mutações sem auth são um vetor de abuso.

**Correção aplicada nesta repo:**
- `POST/PUT/DELETE /properties/*` agora requer `require_staff`.
- `POST/PUT/DELETE /agents/*` e `POST /agents/{id}/upload-photo` agora requer `require_staff`.

**Ficheiros:**
- [backend/app/properties/routes.py](backend/app/properties/routes.py)
- [backend/app/agents/routes.py](backend/app/agents/routes.py)

**Checklist de validação:**
- Sem token/cookie: `POST /properties/` deve dar `401`.
- Com token de staff/admin/agent: `POST /properties/` deve dar `201`.
- `GET /properties/` continua público (não quebra site).

### P0-B) Filtro `is_published` no endpoint de listagem
**Problema:** o site chama `is_published=1`, mas o backend ignorava o parâmetro.

**Correção aplicada nesta repo:**
- `GET /properties/` aceita `is_published` e filtra por `properties.is_published`.

**Ficheiros:**
- [backend/app/properties/routes.py](backend/app/properties/routes.py)
- [backend/app/properties/services.py](backend/app/properties/services.py)

**Checklist de validação:**
- `GET /properties/?is_published=1` devolve apenas publicados.
- `GET /properties/?is_published=0` devolve apenas rascunhos.
- `GET /properties/` (sem filtro) mantém comportamento anterior (para backoffice).

---

## 3) P1/P2 (sugestões — não bloqueantes)

### P1) Website clients (backoffice)
- Considerar proteger `/website/clients/*` com `require_staff` (hoje parece estar aberto). Só fazer isto quando o backoffice estiver a enviar credenciais corretamente (cookie vs bearer).

### P1) Normalização de superfícies “públicas vs privadas”
- Idealmente:
  - **público:** `GET /properties/` (com `is_published=1`), `GET /agents/`, `POST /leads/from-website`.
  - **privado:** todas as mutações e endpoints de gestão.

### P2) Aliases e consistência mobile
- Se a app tiver chamadas antigas fora de `/mobile/*`, decidir entre:
  - expor aliases no core (compat), ou
  - migrar tudo para `/mobile/*`.

---

## 4) Nota de integridade do projeto
Durante validação local encontrei um `SyntaxError` que impediria o backend de arrancar.
Foi corrigido em:
- [backend/app/routers/pre_angariacoes.py](backend/app/routers/pre_angariacoes.py)

