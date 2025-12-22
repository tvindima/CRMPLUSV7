# CRM PLUS - Site Promocional B2B

Landing page institucional do CRM PLUS. Promove a plataforma para agências imobiliárias e linka para login do backoffice.

**Última atualização:** 15 dezembro 2025 - Deploy isolado configurado com Ignored Build Step.

## Scripts
```bash
npm install
npm run dev
npm run build
npm run start
```

## Público-alvo e branding
- B2C (consumidores finais): hero, imóveis, agentes, contacto — apenas branding da agência, sem promo CRM PLUS.
- “Powered by CRM PLUS” opcional no footer; restante copy é da agência.
- Backoffice `/backoffice/*` é só para staff autenticado (cookie/JWT), nunca exposto em domínio público da agência.

## Domínio / Deploy
- Montra B2C: domínio da agência (ex.: `imoveismais.pt`) via CI/CD próprio (ex.: Vercel apontando para `frontend/web`).
- Backoffice: subdomínio próprio (ex.: `app.crmplus.com` ou `nomeagencia.crmplus.com`), separado da montra.
- Não misturar deploy com `crm-plus-site` (institucional B2B).

## Estrutura
- `app/` rotas públicas Next.js.
- `backoffice/` componentes de backoffice (rotas privadas em `app/backoffice/*`).
- `components/` componentes reutilizáveis B2C.
- `public/` assets da agência (logos, renders, avatares).
- `src/` mocks/serviços auxiliares.

## Partilha de libs/assets
- Assets da agência não são partilhados com o site institucional.
- Se usar um design system comum, documentar importação e versão para evitar acoplamento.
# Test Mon Dec 15 18:57:51 WET 2025: validate crm-plus-site isolation
