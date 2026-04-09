# Sobre o projeto

Landing page **estática (SSG)** da **Overflow Labs**: automação, IA e desenvolvimento sob medida.

## Objetivo

- Apresentar a oferta.
- Gerar contacto: formulário (Web3Forms) + WhatsApp/Instagram.
- Navegação por âncoras na mesma página.

## Entrega

- HTML estático, **sem backend** neste repositório.
- Site configurado: `https://overflowlabs.com.br` (`astro.config.mjs` → `site`).

## Stack (resumo)

| Uso | Tecnologia |
|-----|------------|
| Framework SSG | Astro ^6 |
| Estilos | Tailwind CSS ^4 + plugin Vite |
| Animações | Motion |
| Mapa do site | `@astrojs/sitemap` |
| Validação de env | Zod (`src/lib/env-provider.mjs`) |
| Node | >= 22.12 |

**Tipografia / ícones:** Google Fonts (Space Grotesk, Inter) + Material Symbols (definidos no `BaseLayout`).

## Manutenção da documentação

Após mudanças relevantes em stack, deploy ou secções novas, atualizar os ficheiros em `docs/` e, se existir, `PROJECT_STATUS.md` na raiz.
