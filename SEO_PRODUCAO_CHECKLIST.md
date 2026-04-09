# Checklist de SEO para Produção

Este documento lista o que deve ser revisado antes do deploy final da landing.

## 1) Domínio e URLs canônicas

- [ ] Confirmar `site` em `astro.config.mjs` com a URL final de produção.
  - Atual: `https://overflowlabs.com.br`
- [ ] Confirmar `robots.txt` com o mesmo domínio do `site`.
  - Arquivo: `public/robots.txt`
  - Atual: `Sitemap: https://overflowlabs.com.br/sitemap-index.xml`
- [ ] Validar se o deploy final usa exatamente o mesmo domínio (com ou sem `www`) para evitar canônicos inconsistentes.

## 2) Metadados globais (BaseLayout)

Arquivo: `src/layouts/BaseLayout.astro`

- [ ] Revisar `title` e `description` que vêm das páginas (no momento, da `index.astro`).
- [ ] Conferir Open Graph:
  - `og:title`
  - `og:description`
  - `og:image`
  - `og:url`
- [ ] Conferir Twitter Card:
  - `twitter:card`
  - `twitter:title`
  - `twitter:description`
  - `twitter:image`
- [ ] Confirmar favicon/logo:
  - `link rel="icon"` apontando para `/logo.svg`.

## 3) Conteúdo SEO da Home

Arquivo: `src/pages/index.astro`

- [ ] Ajustar título final (ideal entre ~50 e 60 caracteres).
  - Atual: `Overflow Labs — Automação, IA e desenvolvimento sob medida`
- [ ] Ajustar meta description final (ideal entre ~120 e 160 caracteres).
  - Atual definida em `description` no frontmatter.
- [ ] Garantir coerência entre promessa do título/description e conteúdo visível da página.

## 4) Imagem de compartilhamento (OG Image)

- [ ] Validar `public/og-image.png` em 1200x630.
- [ ] Garantir leitura em miniatura (logo/texto com bom contraste).
- [ ] Confirmar que a imagem representa a oferta atual da landing.

## 5) Dados estruturados (JSON-LD)

Arquivo: `src/layouts/BaseLayout.astro`

- [ ] Revisar `@type` atual (`Organization`) e manter se faz sentido.
- [ ] Revisar `name` da organização.
  - Atual: `Overflow Labs`
- [ ] Revisar `url` e `logo` no JSON-LD (devem apontar para produção).
- [ ] Validar `sameAs` com links reais:
  - Instagram
  - WhatsApp

## 6) Variáveis de ambiente obrigatórias

Arquivos: `.env`, `.env.example`, `src/lib/env-provider.mjs`

- [ ] Preencher em produção:
  - `PUBLIC_WEB3FORMS_ACCESS_KEY`
  - `PUBLIC_WHATSAPP_URL`
  - `PUBLIC_INSTAGRAM_URL`
  - `PUBLIC_FORM_ENDPOINT`
- [ ] Garantir que `.env` não é versionado.
- [ ] Manter `.env.example` atualizado para onboarding e CI.

## 7) Indexação e sitemap

- [ ] Confirmar geração de sitemap (`@astrojs/sitemap` já está ativo).
- [ ] Após deploy, validar:
  - `https://SEU_DOMINIO/sitemap-index.xml`
  - `https://SEU_DOMINIO/robots.txt`
- [ ] Submeter sitemap no Google Search Console.

## 8) Validações pós-deploy

- [ ] Testar preview Open Graph (WhatsApp/LinkedIn/Facebook):
  - https://www.opengraph.xyz
- [ ] Testar JSON-LD:
  - https://search.google.com/test/rich-results
- [ ] Testar URL no Search Console (inspeção de URL).
- [ ] Fazer hard refresh e checar `<title>`, `<meta name="description">` e canonical no HTML final publicado.

## 9) Melhorias opcionais (recomendadas)

- [ ] Adicionar `og:image:alt` e `twitter:image:alt`.
- [ ] Adicionar `twitter:site` (se houver perfil X/Twitter oficial).
- [ ] Criar `apple-touch-icon` (`180x180`) para melhor suporte em iOS.

