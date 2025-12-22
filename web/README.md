# Frontend Web (Montra B2C da agência)

Frontend público da agência (ex.: Imóveis Mais) em Next.js. Inclui páginas públicas e rotas privadas de backoffice sob `/backoffice`.

**Última atualização:** 15 dezembro 2025 - Deploy isolado VALIDADO com Ignored Build Step ativo.

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
# Test timestamp: Mon Dec 15 18:53:39 WET 2025
# Test 19:11:24: validate imoveismais-site only
# Final test 19:23:01
