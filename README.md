# Dhiraj Salian — Portfolio ("The Ship Log")

A mobile-first, animation-rich portfolio at https://drjzlyan.com. Every shipped project is a full-screen
chapter that re-themes the page; a generative ink field opens the site.

## Stack
Vite · React 18 · TypeScript · Tailwind · GSAP + ScrollTrigger · Lenis · framer-motion (bottom sheet) · Vitest

## Develop
    npm install
    npm run dev      # local dev server
    npm test         # unit tests (project model, colour, particle engine)
    npm run build    # type-check + production build

## Add a project (the only step)
Put a new entry at the **top** of `src/data/projects.ts`. Chapters, dock, theme shifts and ship numbers
are derived from that array. Use `tier: 'flagship'` for a full-screen chapter or `'lab'` for a card in the
Lab row. Optionally register a bespoke visual in `src/features/log/visuals.ts` and set `visual: 'key'`;
otherwise a generated ink motif in the project's accent colour is used.

## Layout
    src/data/            projects.ts (the log), profile.ts (bio/timeline/links)
    src/features/hero/   particle engine + canvas + hero
    src/features/log/    model (pure logic), chapters, lab row, detail sheet
    src/features/about|contact/
    src/components/      Dock, Loader, Magnetic
    src/lib/             scroll driver, theme, colour, seeded random

Deployment: see [DEPLOY.md](./DEPLOY.md).
