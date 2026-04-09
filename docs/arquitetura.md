# Arquitetura do projeto

## Organização de pastas

| Caminho | Função |
|---------|--------|
| `src/pages/` | Páginas; hoje só `index.astro` (composição de secções, sem lógica pesada). |
| `src/layouts/` | `BaseLayout.astro` — shell HTML, meta/OG, JSON-LD, CSS global. |
| `src/components/sections/` | Blocos de conteúdo (Hero, Solutions, About, Trust, FAQ, Contact). |
| `src/components/layout/` | Header, footer, bottom nav, botões sociais flutuantes. |
| `src/components/contact/` | `ContactForm/` (UI + cliente + testes), `ContactSocialLinks`. |
| `src/lib/` | `nav-active.ts`, `animate-dom.ts`, `prefers-reduced-motion.ts`, `env-provider.mjs`. |
| `src/styles/global.css` | Tokens e estilos globais. |
| `public/` | Assets estáticos, favicon, OG, `_headers` (ex.: Netlify). |
| `.cursor/rules/` | Convenções (arquitetura, segurança, testes, Astro, animações). |

## Padrões importantes

- **Âncoras:** secções com `id` alinhados a `NAV_SECTION_IDS` em `src/lib/nav-active.ts`.
- **Navegação:** links com `data-nav-section-link`; estado ativo + `aria-current` no header via `setupGlobalNavActive()`.
- **Env:** variáveis públicas com prefixo `PUBLIC_*`; consumo via `getPublicEnv()`; validação no arranque em `astro.config.mjs` (`dotenv/config` + Zod).
- **Animações:** helpers em `lib/`; respeito a `prefers-reduced-motion`.

## Módulos colocalizados (exemplo)

- `ContactForm/index.astro` + `contact-form.client.ts` + `ContactForm.test.ts`
- `FaqSection/index.astro` + `faq-open-motion.client.ts` + `FaqSection.test.ts`

## Configuração

- `astro.config.mjs` — `site`, integração sitemap, plugin Tailwind.
- `tailwind.config.mjs` — `content` apontando para `src/**/*` (utilities geradas corretamente).
