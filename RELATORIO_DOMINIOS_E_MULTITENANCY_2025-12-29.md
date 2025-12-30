# Relatório — Domínios, Backoffice e Plano Multi‑Tenant (1 BD por Empresa)
**Projeto:** CRMPLUSV7
**Data:** 29/12/2025
**Objetivo:** Consolidar a análise e propor um plano executável para:
- associar o domínio `imoveismais.com` ao website;
- criar subdomínio para o backoffice;
- definir estratégia de distribuição iOS (staff/agentes) sem expor em App Store pública;
- desenhar multi‑tenant com **uma base de dados por empresa** (SaaS B2B), com a **mesma app** para todas as imobiliárias.

---

## 1) Resumo Executivo (para decisão)

### O que é “no‑regret” (pode avançar já)
- **Domínio do website**: apontar `imoveismais.com` (e opcionalmente `www.imoveismais.com`) para o projeto Vercel do site.
- **Subdomínio do backoffice**: criar `backoffice.imoveismais.com` no projeto Vercel do backoffice.
- **SEO/canonical do site**: no código do website, trocar URLs canonicais/OG de `*.vercel.app` para o domínio final via env (`NEXT_PUBLIC_SITE_URL`). (Isto já foi preparado no workspace.)

### Decisões que os sócios precisam tomar
1) **Domínio principal** para o site Imóveis Mais: com `www` ou sem `www`.
2) **Estratégia de distribuição iOS** (staff/agentes, multi‑empresa):
   - Piloto: TestFlight
   - Produção B2B: “Custom App” via Apple Business Manager (recomendado)
   - Alternativa: App Store pública (com login obrigatório)
3) **Estratégia de multi‑tenant**: como a app escolhe a empresa (tenant):
   - MVP: `tenant_slug` no login (ex.: “imoveismais”)
   - Evolução: token inclui tenant e cada request abre DB correta

---

## 2) Domínio `imoveismais.com` (website)

### Contexto
- O domínio foi comprado **na própria Vercel** (Vercel-managed domain).
- Isso simplifica o DNS: normalmente não é necessário gerir A/CNAME manualmente fora da Vercel.

### Passos recomendados (Vercel)
1) Vercel Dashboard → projeto do website (o que está em `web-steel-gamma-66.vercel.app`)
2) Settings → Domains
3) Add:
   - `imoveismais.com`
   - `www.imoveismais.com`
4) Definir “Primary Domain” (recomendação: `www.imoveismais.com`) e ativar redirect do outro.

### Ajustes no código do website (SEO/canonical)
Foi identificado hardcode do domínio `https://imoveismais-site.vercel.app` em:
- canonical URLs
- OpenGraph URLs
- sitemap

**Recomendação:** usar `NEXT_PUBLIC_SITE_URL` (ex.: `https://imoveismais.com` ou `https://www.imoveismais.com`) e gerar tudo a partir daí.

**Já preparado no workspace**:
- helper `getSiteUrl()` e substituição dos hardcodes no website.

**Ação no Vercel (website)**:
- criar env var `NEXT_PUBLIC_SITE_URL` com o domínio primário.

> Nota: o ficheiro `robots` no website está configurado para **noindex** (site em testes). Quando a marca quiser indexar, isso deve ser revertido.

---

## 3) Subdomínio do backoffice (ex.: `backoffice.imoveismais.com`)

### Objetivo
Separar publicamente:
- website: `imoveismais.com`
- backoffice: `backoffice.imoveismais.com`

### Passos (Vercel)
1) Vercel Dashboard → projeto do backoffice (ex.: `backoffice-three-opal.vercel.app`)
2) Settings → Domains
3) Add Domain: `backoffice.imoveismais.com`
4) Verificar que fica “Assigned/Verified” (por ser Vercel-managed).

### Observações sobre sessão/auth
- Backoffice normalmente usa cookie/sessão por host.
- Ao mudar de `*.vercel.app` para `backoffice.imoveismais.com`, a sessão continua a funcionar, mas é um **novo host**.
- Só é necessário definir cookie com domínio `.imoveismais.com` se for desejado partilhar sessão entre website e backoffice (geralmente não é necessário e pode aumentar superfície de ataque).

---

## 4) A app mobile precisa de domínio?

### Resposta curta
- Para funcionar como app nativa (iOS/Android), **não** precisa de domínio próprio.
- Precisa de:
  - um **API base URL** estável (ex.: Railway)
  - storage (Cloudinary/S3) para ficheiros, se aplicável.

### Quando faz sentido ter domínio para mobile
- “Landing page” de download (App Store/Play): ex.: `app.crmplus.com`
- Deep links/universal links (iOS) e app links (Android)
- OAuth/SSO callbacks

No vosso caso, como a app é **genérica** (multi‑imobiliária), o domínio “imoveismais.com” não deve ser o da app.

---

## 5) Distribuição iOS sem App Store pública (staff/agentes)

### Premissas
- App B2B (staff/agentes)
- Multi‑empresa (SaaS): várias imobiliárias instalam a mesma app

### Opções

#### Opção A — TestFlight (recomendado para piloto)
**Prós**
- Muito rápido para distribuir a testers
- Não exige publicação pública

**Contras**
- Orientado a beta; builds expiram
- Gestão de testers e ciclos de release

**Quando usar**
- Pilotos iniciais (primeiras imobiliárias)

#### Opção B — “Custom App” via Apple Business Manager (recomendação para produção B2B)
**Prós**
- Não fica pública na App Store
- Pode ser distribuída apenas às empresas/organizações autorizadas
- Modelo B2B robusto

**Contras**
- Requer preparação (contas/organizações)
- Continua a exigir revisão Apple

**Quando usar**
- Produção B2B com distribuição controlada

#### Opção C — App Store pública (com login obrigatório)
**Prós**
- Distribuição e updates mais simples
- Escala melhor

**Contras**
- App fica visível publicamente

#### Opção D — Enterprise Program
**Não recomendado** para SaaS multi‑empresa.
- É destinado a apps internas **da própria empresa**, não para distribuir para clientes.
- Alto risco de violar regras e perder o programa.

### Recomendação prática
- **Fase 1:** TestFlight para pilotos
- **Fase 2:** Custom App via Apple Business Manager (produção B2B)

---

## 6) Plano Multi‑Tenant — 1 Base de Dados por Empresa

### Objetivo
Ter uma **única app mobile** e **um único backend**, mas que abre a **DB correta por request**.

### Decisão de produto
- Cada imobiliária (empresa) tem:
  - uma base de dados própria (Postgres)
  - um identificador de tenant: `tenant_slug` (ex.: `imoveismais`, `imob_x`)

### Como a app escolhe o tenant (recomendação MVP)
**Login com tenant code (MVP):**
- Ecrã de login pede: `Empresa` + `Email` + `Password`
- Request: `POST /auth/login` com `{ tenant_slug, email, password }`

Depois do login:
- o token inclui `tenant_slug`
- cada request envia `Authorization: Bearer <token>`

### Peça central: “Tenant Registry”
Um serviço (ou BD pequena) que mapeia:
- `tenant_slug` → `DATABASE_URL`

Opções para o registry:
1) **BD central** (recomendado): tabela `tenants` com `slug`, `db_url`, `active`, `created_at`
2) **ENV/JSON** (MVP ultra simples): lista em env var (não escala bem)

### Execução técnica (backend)
**MVP (sem refactor gigante):**
1) Criar mecanismo para resolver o tenant:
   - no login: ler `tenant_slug` do body
   - nos restantes endpoints: ler `tenant_slug` do token (claim)
2) Adaptar `get_db()` para:
   - receber tenant
   - criar engine/session para a DB do tenant
3) Alterar emissão/validação de JWT:
   - incluir `tenant_slug` no token
   - recusar token sem tenant

### Cache/pooling para performance
Abrir engine por request é caro.
Recomendação:
- cache de engines por `tenant_slug` (LRU)
- SQLAlchemy connection pooling por engine

### Migrações e schema
Como é 1 DB por empresa:
- cada DB tem as mesmas tabelas
- é obrigatório ter estratégia de migrations:
  - ao criar novo tenant: aplicar `alembic upgrade head`
  - em deploy: aplicar migrations em todas as DBs (com cuidado)

**Opções de operação (a decidir):**
- aplicar migrations automaticamente (risco controlado) vs manual

### Onboarding de nova imobiliária (fluxo)
1) Criar DB Postgres para a empresa
2) Aplicar migrations
3) Inserir tenant no registry (`slug`, `db_url`)
4) Criar admin inicial na DB dessa empresa
5) Entregar “tenant code” ao cliente (para login)

### Segurança
- JWT deve conter tenant e o backend deve recusar “cross-tenant”.
- Logs/erros nunca devem mostrar DB URLs.
- Rate limiting em endpoints críticos (login) é recomendado.

### Observabilidade
- adicionar `tenant_slug` nos logs (campo estruturado)
- métricas por tenant (latência, erros)

---

## 7) Plano de implementação (faseado)

### Fase 0 — Domínios e SEO (1–2h)
- Associar `imoveismais.com` ao website no Vercel
- Criar `backoffice.imoveismais.com` no Vercel
- Definir `NEXT_PUBLIC_SITE_URL` no website

### Fase 1 — Multi‑tenant MVP (2–5 dias)
- Tenant registry simples (BD central ou configuração inicial)
- Login com `tenant_slug`
- Token inclui `tenant_slug`
- `get_db()` abre sessão na DB do tenant
- Checklist de segurança mínima

### Fase 2 — Operação e escala (1–2 semanas)
- cache de engines por tenant
- automação de onboarding (script)
- estratégia de migrations multi‑DB (segura)
- logs estruturados + métricas

### Fase 3 — Distribuição iOS B2B (paralelo)
- Pilotos: TestFlight
- Produção: Apple Business Manager “Custom App”

---

## 8) Checklist de decisões (para reunião)
1) Site primário: `www.imoveismais.com` vs `imoveismais.com`
2) Subdomínio backoffice: `backoffice` vs `admin` vs `crm`
3) Tenant selection na app: `tenant_slug` no login (MVP) vs subdomínio
4) Tenant registry: BD central vs env config
5) iOS distribuição: TestFlight (piloto) + Custom App (produção)

---

## 9) Apêndice — mudanças já feitas no workspace (relevantes para domínios)
No website (projeto `web/`) foi preparado suporte para URLs canonicais/OG/sitemap via env `NEXT_PUBLIC_SITE_URL` (em vez de `*.vercel.app`).

Arquivos tocados:
- `web/src/lib/siteUrl.ts`
- `web/app/layout.tsx`
- `web/app/imoveis/layout.tsx`
- `web/app/imovel/[referencia]/page.tsx`
- `web/app/sitemap.ts`
