# Testes

## Ferramentas

- **Vitest** com ambiente **jsdom**.
- Config: `getViteConfig()` do Astro em `vitest.config.ts` (alinhado à [documentação de testes do Astro](https://docs.astro.build/en/guides/testing/)).
- **Setup:** `vitest.setup.ts` — `@testing-library/jest-dom/vitest`.
- **Bibliotecas:** `@testing-library/dom`, `@testing-library/user-event`.

## Onde estão

Padrão: `src/**/*.test.ts` (definido no Vitest).

| Área | Ficheiro |
|------|----------|
| Formulário de contacto | `components/contact/ContactForm/ContactForm.test.ts` |
| Navegação ativa + scroll | `lib/nav-active.test.ts` |
| Motion ao abrir FAQ | `components/sections/FaqSection/FaqSection.test.ts` |
| `prefersReducedMotion` | `lib/prefers-reduced-motion.test.ts` |
| `domReveal` | `lib/animate-dom.test.ts` |

## O que é testado (resumo)

- Validação e envio do formulário (incl. `fetch`, captcha, mensagens genéricas, a11y básica).
- Scroll-spy, `aria-current`, scroll suave em âncoras, `setupGlobalNavActive` (idempotência).
- FAQ: `setupFaqOpenMotion` com `domReveal` injetado.
- Helpers pequenos: `prefersReducedMotion`, `domReveal` (delegação ao Motion).

## Convenções

Detalhe em `.cursor/rules/frontend-testing.mdc`: colocation, helpers `build…Html` / `mount…Harness`, `afterEach` com limpeza de DOM e mocks.

## Comandos

```bash
npm test          # uma execução
npm run test:watch # modo watch
```
