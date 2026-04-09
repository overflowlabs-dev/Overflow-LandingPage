# Funcionalidades

## Implementado

- Layout com meta tags, Open Graph, Twitter card, canonical, JSON-LD (LocalBusiness).
- Navegação por âncoras: header (desktop) + bottom bar (mobile).
- Scroll-spy e estado ativo dos links (`nav-active.ts`, `setupGlobalNavActive`).
- Formulário de contacto via **Web3Forms** (POST), honeypot `_honey`, validação no cliente, mensagens de sucesso/erro genéricas.
- Links **WhatsApp** e **Instagram** a partir de env (`PUBLIC_WHATSAPP_URL`, `PUBLIC_INSTAGRAM_URL`).
- Validação de env com **Zod** no arranque (`env-provider.mjs`).
- Animações de entrada / in-view (Motion + `lib/animate-dom`, `prefers-reduced-motion`).
- FAQ em acordeão (`<details>`) com motion opcional ao abrir (`faq-open-motion.client.ts`).
- **Sitemap** estático no build (`@astrojs/sitemap`).
- Imagens otimizadas com **`astro:assets`** onde aplicável (ex.: Hero, Solutions).

## Segurança (resumo)

- Sem chaves hardcoded; `.env` ignorado pelo Git; `PUBLIC_*` só para dados aceitáveis no cliente.
- Links externos com `target="_blank"` usam `rel="noopener noreferrer"` onde aplicável.
- Headers HTTP: configurar no **host/CDN** (`public/_headers`, `vercel.json`, ou equivalente). **CSP** completa é opcional e exige calibragem (scripts Web3Forms, fontes, API).

Ver detalhes em `.cursor/rules/security.mdc`.

## Pendências conhecidas

- Rodapé: links **Privacy** / **Terms** ainda com `href="#"` — definir URLs ou páginas.
- Antes de cada release: `npm audit` e confirmar headers em produção.
- Opcional: CSP restritiva em staging antes de produção.

## Estado geral

Landing pronta para deploy estático, desde que o `.env` esteja preenchido e o hosting aplique headers. Pequenos ajustes de conteúdo/legal (privacy/terms) e CSP permanecem como melhorias.
