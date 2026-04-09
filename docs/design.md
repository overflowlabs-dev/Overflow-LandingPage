# Design do projeto

## Identidade visual

- Tema **escuro**.
- Tipografia **headline** / **body**.
- Cards estilo “glass”, gradientes metálicos (alinhados ao design da marca; referências auxiliares em `.stitch-assets/` quando existirem).

## Desktop

- Header fixo com navegação horizontal, CTA “Connect”, logo.
- Gradiente superior no header a partir do breakpoint `md`.

## Mobile

- Header simplificado: marca centralizada, fundo sólido; nav completa e CTA ocultos abaixo de `md`.
- **Bottom bar** fixa (`BottomNavbar`): atalhos com ícones + rótulos e estado ativo (pill).
- Rodapé com `max-md:pb-28` na página para não ficar por baixo da bottom bar.

## Responsividade

- Breakpoints Tailwind (`md`, `min-[480px]` na bottom bar, etc.).
- Animações respeitam **`prefers-reduced-motion`**.

## Ordem visual na página

1. `GrainOverlay`  
2. `SiteHeader`  
3. `HeroSection`  
4. `SolutionsSection`  
5. `AboutSection`  
6. `TrustSection`  
7. `FaqSection`  
8. `ContactSection`  
9. `SiteFooter`  
10. `BottomNavbar`  
11. `FloatingSocialButtons`  

Ordem definida em `src/pages/index.astro`.
