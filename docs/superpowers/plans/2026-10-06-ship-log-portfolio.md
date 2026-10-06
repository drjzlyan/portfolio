# The Ship Log Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as "The Ship Log": a mobile-first, animation-rich, data-driven site where each shipped project is a full-screen chapter that re-themes the page, opened by a generative ink hero.

**Architecture:** Pure, unit-tested logic (project model, color, seeded random, particle engine) is kept separate from React components. One Lenis + GSAP ScrollTrigger driver feeds all scroll effects. Chapters, dock and theme are *derived* from `src/data/projects.ts`, so adding a product is one array entry.

**Tech Stack:** Vite 6, React 18, TypeScript (strict), Tailwind 3, GSAP + ScrollTrigger, Lenis, framer-motion (bottom sheet only, lazy), Vitest (pure-logic tests), lucide-react, fontsource (self-hosted fonts).

**Spec:** `docs/superpowers/specs/2026-10-06-ship-log-portfolio-design.md`

## Global Constraints

- Site is deployed at `https://drjzlyan.com`; blog is `https://blogs.drjzlyan.com` (never `dhirajsalian.com` in new code).
- Vite + React 18 + TypeScript + Tailwind stack; deploys to GitHub Pages (existing `.github/workflows/deploy.yml`, Node 24).
- **Product-agnostic:** no layout/copy code names a specific product. Inspyry and rydd.club are plain data entries (flagships).
- Brick Breaker is **not shown**.
- Design at 390px first, enhance upward. Chapters are `100svh`; scroll-snap is **proximity** only, never mandatory.
- Remove `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`.
- Performance: initial JS ≤ 150 KB gzip (hero canvas code-split), LCP < 2 s on 4G, 60 fps on mid-range phones.
- Particles: ~1.5k mobile / ~4k desktop; auto-reduce on FPS dip; canvas pauses off-screen.
- `prefers-reduced-motion`: particles → static gradient; transitions → simple fades.
- iOS tilt permission requested only after a user tap.
- Loader < 1.2 s, skippable, once per session.
- Untracked Flutter leftovers are gitignored; deleted only with the owner's explicit OK.
- Out of scope: CMS, blog engine, contact form, analytics.

## Review Focus

The spec implies these inputs but no behavior task would otherwise pin them. Each is owned by a test or check below.

1. **Zero or one project in data / only labs / only flagships** → page still renders, no empty Lab chapter, dock has no dead dots. (Task 3 tests.)
2. **Accent given as 3-digit hex (`#abc`) or invalid hex** → 3-digit works; invalid throws a clear error at startup, not a silent black theme. (Task 2 tests.)
3. **Unknown `visual` key on a project** → falls back to the generated ink motif, never crashes. (Task 3 test.)
4. **iOS tilt permission denied / no `DeviceOrientationEvent` / null `gamma`/`beta`** → hero still works with zero gravity. (Task 6 test + guarded code.)
5. **320px-wide screen and very long names/taglines** → no horizontal scroll. (Task 10 check.)

---

### Task 1: Tooling and baseline commit

**Files:**
- Modify: `package.json`, `vite.config.ts`, `.gitignore`
- Commit: pending domain/data edits already in the working tree

**Interfaces:**
- Produces: `npm test` runs Vitest (node environment) over `src/**/*.test.ts`; `@` alias resolves in tests.

- [ ] **Step 1: Commit the pending domain and Brick Breaker edits on their own**

```bash
git add DEPLOY.md index.html public/CNAME src/components/About.tsx src/components/Contact.tsx src/data/projects.ts
git commit -m "chore: move to drjzlyan.com, use blogs.drjzlyan.com, hide brick-breaker

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 2: Install test runner and self-hosted fonts**

```bash
npm install
npm install -D vitest
npm install @fontsource/instrument-serif @fontsource-variable/geist @fontsource-variable/jetbrains-mono
```
Expected: installs succeed; `package.json` gains the four packages.

- [ ] **Step 3: Add the test script and Vitest config**

In `package.json` `scripts` add `"test": "vitest run"`.

Replace `vite.config.ts` entirely with (the `three` chunk stays until Task 9 removes the dependency):

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
```

- [ ] **Step 4: Gitignore the Flutter leftovers**

Append to `.gitignore`:

```
# Legacy Flutter artifacts (untracked; delete only with owner's OK)
/lib/
/build/
/.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
```

- [ ] **Step 5: Verify the runner works with no tests yet**

Run: `npm test`
Expected: Vitest starts and reports "No test files found" (exit code 1 is acceptable here); no config error.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts .gitignore
git commit -m "chore: add vitest and self-hosted font packages, ignore legacy flutter files

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Color and seeded-random utilities (TDD)

**Files:**
- Create: `src/lib/color.ts`, `src/lib/color.test.ts`, `src/lib/rand.ts`, `src/lib/rand.test.ts`

**Interfaces:**
- Produces:
  - `hexToRgb(hex: string): [number, number, number]` (accepts `#rgb`/`#rrggbb`, with or without `#`; throws `Error` on invalid)
  - `themeVars(accent: string): { '--accent': string }` (value `rgb(r g b)`)
  - `seedFromString(s: string): number`
  - `mulberry32(seed: number): () => number` (deterministic 0..1)
  - `blobPath(rand: () => number, cx: number, cy: number, r: number, points?: number, wobble?: number): string` (closed SVG path, starts `M`, ends `Z`)

- [ ] **Step 1: Write the failing color tests**

`src/lib/color.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hexToRgb, themeVars } from './color';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#7c5cff')).toEqual([124, 92, 255]);
  });
  it('parses 3-digit hex', () => {
    expect(hexToRgb('#abc')).toEqual([170, 187, 204]);
  });
  it('parses hex without a leading #', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });
  it('throws a clear error on invalid input', () => {
    expect(() => hexToRgb('#12')).toThrow(/Invalid hex colour/);
    expect(() => hexToRgb('not-a-colour')).toThrow(/Invalid hex colour/);
  });
});

describe('themeVars', () => {
  it('produces an rgb() accent variable', () => {
    expect(themeVars('#fff')).toEqual({ '--accent': 'rgb(255 255 255)' });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/color.test.ts`
Expected: FAIL (cannot resolve `./color`).

- [ ] **Step 3: Implement `src/lib/color.ts`**

```ts
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex colour: ${hex}`);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function themeVars(accent: string): { '--accent': string } {
  const [r, g, b] = hexToRgb(accent);
  return { '--accent': `rgb(${r} ${g} ${b})` };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/color.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing rand tests**

`src/lib/rand.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { blobPath, mulberry32, seedFromString } from './rand';

describe('seedFromString', () => {
  it('is deterministic and differs between inputs', () => {
    expect(seedFromString('abc')).toBe(seedFromString('abc'));
    expect(seedFromString('abc')).not.toBe(seedFromString('abd'));
  });
});

describe('mulberry32', () => {
  it('yields the same sequence for the same seed, in [0,1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('blobPath', () => {
  it('returns a deterministic closed path with one Q per point', () => {
    const p1 = blobPath(mulberry32(7), 200, 150, 100, 8, 0.25);
    const p2 = blobPath(mulberry32(7), 200, 150, 100, 8, 0.25);
    expect(p1).toBe(p2);
    expect(p1.startsWith('M')).toBe(true);
    expect(p1.endsWith('Z')).toBe(true);
    expect((p1.match(/Q/g) ?? []).length).toBe(8);
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run src/lib/rand.test.ts`
Expected: FAIL (cannot resolve `./rand`).

- [ ] **Step 7: Implement `src/lib/rand.ts`**

```ts
export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth closed blob: quadratic curves through the midpoints of a jittered ring. */
export function blobPath(
  rand: () => number,
  cx: number,
  cy: number,
  r: number,
  points = 8,
  wobble = 0.25,
): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const rr = r * (1 - wobble + rand() * wobble * 2);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];
  const f = (n: number) => n.toFixed(1);
  const first = mid(pts[points - 1]!, pts[0]!);
  let d = `M${f(first[0])} ${f(first[1])}`;
  for (let i = 0; i < points; i++) {
    const p = pts[i]!;
    const m = mid(p, pts[(i + 1) % points]!);
    d += ` Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `${d} Z`;
}
```

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: PASS (all tests in both files).

- [ ] **Step 9: Commit**

```bash
git add src/lib
git commit -m "feat(lib): add color and seeded-random utilities with tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Project model, data, and profile (TDD)

**Files:**
- Create: `src/features/log/model.ts`, `src/features/log/model.test.ts`, `src/data/profile.ts`
- Modify (replace entirely): `src/data/projects.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces (from `@/features/log/model`):
  - `type Status = 'live' | 'building' | 'open-source'`, `type Tier = 'flagship' | 'lab'`
  - `interface ProjectLink { label: string; href: string }`
  - `interface Project { slug: string; name: string; tagline: string; description: string; status: Status; tier: Tier; accent: string; url: string; links?: ProjectLink[]; stack: string[]; visual?: string }`
  - `DEFAULT_ACCENT: string` (`'#ff5d3a'`)
  - `sortProjects(list: readonly Project[]): Project[]` (returns a copy; array order is the order)
  - `shipNumbers(list: readonly Project[]): Map<string, number>` (oldest = 1, newest = length)
  - `splitTiers(list: readonly Project[]): { flagships: Project[]; labs: Project[] }`
  - `type SectionKind = 'hero' | 'flagship' | 'lab' | 'about' | 'contact'`
  - `interface Section { id: string; label: string; kind: SectionKind; accent: string }`
  - `chapterId(slug: string): string` (`p-<slug>`)
  - `buildSections(list: readonly Project[]): Section[]`
  - `pickVisual<T>(key: string | undefined, registry: Record<string, T>, fallback: T): T`
- Produces (from `@/data/projects`): `projects: Project[]` newest first.
- Produces (from `@/data/profile`): `profile` object (see code).

- [ ] **Step 1: Write the failing model tests**

`src/features/log/model.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ACCENT,
  buildSections,
  chapterId,
  pickVisual,
  shipNumbers,
  sortProjects,
  splitTiers,
  type Project,
} from './model';

const make = (slug: string, tier: Project['tier'], accent = '#112233'): Project => ({
  slug,
  name: slug,
  tagline: `${slug} tagline`,
  description: `${slug} description`,
  status: 'live',
  tier,
  accent,
  url: `https://example.com/${slug}`,
  stack: [],
});

describe('sortProjects', () => {
  it('keeps array order and returns a copy', () => {
    const input = [make('a', 'flagship'), make('b', 'lab')];
    const out = sortProjects(input);
    expect(out.map((p) => p.slug)).toEqual(['a', 'b']);
    expect(out).not.toBe(input);
  });
});

describe('shipNumbers', () => {
  it('numbers the newest (first) highest', () => {
    const n = shipNumbers([make('new', 'flagship'), make('mid', 'lab'), make('old', 'lab')]);
    expect(n.get('new')).toBe(3);
    expect(n.get('old')).toBe(1);
  });
  it('gives a newly prepended project the highest number', () => {
    const base = [make('a', 'flagship'), make('b', 'lab')];
    const n = shipNumbers([make('fresh', 'flagship'), ...base]);
    expect(n.get('fresh')).toBe(3);
    expect(n.get('a')).toBe(2);
  });
});

describe('splitTiers', () => {
  it('splits by tier preserving order', () => {
    const { flagships, labs } = splitTiers([
      make('a', 'flagship'),
      make('b', 'lab'),
      make('c', 'flagship'),
    ]);
    expect(flagships.map((p) => p.slug)).toEqual(['a', 'c']);
    expect(labs.map((p) => p.slug)).toEqual(['b']);
  });
});

describe('buildSections', () => {
  it('derives hero, one chapter per flagship, one lab chapter, about, contact', () => {
    const s = buildSections([make('a', 'flagship', '#111'), make('b', 'lab', '#222'), make('c', 'lab')]);
    expect(s.map((x) => x.id)).toEqual(['hero', chapterId('a'), 'lab', 'about', 'contact']);
    expect(s.find((x) => x.id === 'lab')?.accent).toBe('#222');
    expect(s[0]?.accent).toBe(DEFAULT_ACCENT);
  });
  it('handles an empty list without dead chapters', () => {
    expect(buildSections([]).map((x) => x.id)).toEqual(['hero', 'about', 'contact']);
  });
  it('omits the lab chapter when there are only flagships', () => {
    expect(buildSections([make('a', 'flagship')]).map((x) => x.id)).toEqual([
      'hero',
      chapterId('a'),
      'about',
      'contact',
    ]);
  });
  it('includes a lab chapter when there are only labs', () => {
    expect(buildSections([make('b', 'lab')]).map((x) => x.id)).toEqual(['hero', 'lab', 'about', 'contact']);
  });
  it('adding one entry adds exactly one chapter and nothing else', () => {
    const before = buildSections([make('a', 'flagship')]);
    const after = buildSections([make('z', 'flagship'), make('a', 'flagship')]);
    expect(after.length).toBe(before.length + 1);
  });
});

describe('pickVisual', () => {
  const fallback = 'fallback';
  it('returns the registered visual', () => {
    expect(pickVisual('x', { x: 'X' }, fallback)).toBe('X');
  });
  it('falls back for undefined and unknown keys', () => {
    expect(pickVisual(undefined, { x: 'X' }, fallback)).toBe(fallback);
    expect(pickVisual('nope', { x: 'X' }, fallback)).toBe(fallback);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/features/log/model.test.ts`
Expected: FAIL (cannot resolve `./model`).

- [ ] **Step 3: Implement `src/features/log/model.ts`**

```ts
export type Status = 'live' | 'building' | 'open-source';
export type Tier = 'flagship' | 'lab';

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: Status;
  tier: Tier;
  /** #rgb or #rrggbb; drives the page theme while this chapter is on screen */
  accent: string;
  url: string;
  links?: ProjectLink[];
  stack: string[];
  /** Key of a registered mini-visual; unknown/absent falls back to the ink motif */
  visual?: string;
}

export const DEFAULT_ACCENT = '#ff5d3a';

/** Array order IS the order (newest first). Returns a copy. */
export function sortProjects(list: readonly Project[]): Project[] {
  return [...list];
}

/** Oldest = 1, newest (index 0) = list.length. */
export function shipNumbers(list: readonly Project[]): Map<string, number> {
  const map = new Map<string, number>();
  list.forEach((p, i) => map.set(p.slug, list.length - i));
  return map;
}

export function splitTiers(list: readonly Project[]): { flagships: Project[]; labs: Project[] } {
  return {
    flagships: list.filter((p) => p.tier === 'flagship'),
    labs: list.filter((p) => p.tier === 'lab'),
  };
}

export type SectionKind = 'hero' | 'flagship' | 'lab' | 'about' | 'contact';

export interface Section {
  id: string;
  label: string;
  kind: SectionKind;
  accent: string;
}

export const chapterId = (slug: string) => `p-${slug}`;

export function buildSections(list: readonly Project[]): Section[] {
  const { flagships, labs } = splitTiers(list);
  const sections: Section[] = [{ id: 'hero', label: 'Intro', kind: 'hero', accent: DEFAULT_ACCENT }];
  for (const p of flagships) {
    sections.push({ id: chapterId(p.slug), label: p.name, kind: 'flagship', accent: p.accent });
  }
  if (labs.length > 0) {
    sections.push({ id: 'lab', label: 'Lab', kind: 'lab', accent: labs[0]!.accent });
  }
  sections.push({ id: 'about', label: 'About', kind: 'about', accent: DEFAULT_ACCENT });
  sections.push({ id: 'contact', label: 'Contact', kind: 'contact', accent: DEFAULT_ACCENT });
  return sections;
}

export function pickVisual<T>(key: string | undefined, registry: Record<string, T>, fallback: T): T {
  if (key && Object.prototype.hasOwnProperty.call(registry, key)) return registry[key] as T;
  return fallback;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/features/log/model.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the data (replace `src/data/projects.ts` entirely)**

```ts
import type { Project } from '@/features/log/model';

/**
 * The Ship Log. Newest first: to add a product, put a new entry at the TOP.
 * Chapters, dock dots, theme shifts and ship numbers are all derived from this array.
 * - tier 'flagship' = full-screen chapter; 'lab' = card in the shared Lab row.
 * - accent = #rgb or #rrggbb colour the whole page takes on in that chapter.
 */
export const projects: Project[] = [
  {
    slug: 'rydd',
    name: 'rydd.club',
    tagline: 'Plan a group ride. Share one link. See everyone live.',
    description:
      'Group ride coordination: one shareable link and live locations for everyone on the ride.',
    status: 'live',
    tier: 'flagship',
    accent: '#facc15',
    url: 'https://rydd.club',
    stack: [],
  },
  {
    slug: 'inspyry',
    name: 'Inspyry',
    tagline: 'Type an idea. Get a cut-ready SVG.',
    description:
      'AI SVG generator on Cloudflare. Single-pass raster → vector pipeline with VTracer WASM. Flat colours, closed paths, transparent background. Production SaaS with a REST API and MCP server.',
    status: 'live',
    tier: 'flagship',
    accent: '#7c5cff',
    url: 'https://inspyry.com',
    stack: ['Cloudflare', 'VTracer WASM'],
  },
  {
    slug: 'buffer-api-skill',
    name: 'buffer-api-skill',
    tagline: 'Post, schedule and manage Buffer from an agent.',
    description:
      'OpenClaw-compatible agent skill for Buffer’s GraphQL API: post, schedule, delete, channels. MIT.',
    status: 'open-source',
    tier: 'lab',
    accent: '#2ebe9c',
    url: 'https://github.com/dhiraj-salian/buffer-api-skill',
    stack: ['Python', 'GraphQL'],
  },
  {
    slug: 'openclaw-nvidia-speech',
    name: 'openclaw-nvidia-speech',
    tagline: 'NVIDIA text-to-speech and speech-to-text for OpenClaw.',
    description:
      'OpenClaw plugin for NVIDIA TTS (Magpie) and STT (Parakeet). Zero dependencies, published to npm.',
    status: 'open-source',
    tier: 'lab',
    accent: '#22d3ee',
    url: 'https://github.com/dhiraj-salian/openclaw-nvidia-speech',
    stack: ['npm', 'Magpie', 'Parakeet'],
  },
  {
    slug: 'inspyry-vector-generator-skill',
    name: 'inspyry-vector-generator-skill',
    tagline: 'Logos, icons and mascots as vectors, from an agent.',
    description:
      'Agent skill for creating vector images: logos, icons, mascots, illustrations. MIT licensed.',
    status: 'open-source',
    tier: 'lab',
    accent: '#f472b6',
    url: 'https://github.com/dhiraj-salian/inspyry-vector-generator-skill',
    stack: ['Agent skill', 'SVG'],
  },
];
```

Note for the executor: rydd.club is placed above Inspyry (treated as newest). That is an assumption; flip the order of the two flagship entries if the owner says otherwise.

- [ ] **Step 6: Write `src/data/profile.ts`**

```ts
export const profile = {
  name: 'Dhiraj Salian',
  role: 'Senior Software Engineer',
  location: 'Bengaluru, India',
  headline: 'I build distributed systems at work and ship products on the side.',
  yearsExperience: 8,
  bio: [
    'I’m a Senior Software Engineer based in Bengaluru with 8+ years building backend services and distributed systems across enterprise cloud platforms, most recently leading multi-cloud architecture at Omnissa (formerly VMware EUC).',
    'On the side I ship indie products and open-source tools, and I write about AI and ML on the blog.',
  ],
  timeline: [
    {
      title: 'Senior Software Engineer',
      org: 'Omnissa (formerly VMware EUC)',
      note: 'Leading multi-cloud architecture for enterprise cloud platforms.',
    },
    {
      title: 'Indie maker',
      org: 'Independent',
      note: 'Shipping SaaS products and open-source developer tools.',
    },
    {
      title: 'Open-source contributor',
      org: 'OpenClaw ecosystem',
      note: 'Plugins and agent skills.',
    },
  ],
  links: {
    github: 'https://github.com/dhiraj-salian',
    linkedin: 'https://linkedin.com/in/dhiraj-salian',
    email: 'mailto:dhirajsalian1996@gmail.com',
    blog: 'https://blogs.drjzlyan.com',
    resume: '/resume.pdf',
  },
} as const;
```

- [ ] **Step 7: Run all tests and commit**

Run: `npm test`
Expected: PASS. (Do not run `tsc` yet: old components still reference the old `Project` shape until Task 9.)

```bash
git add src/features/log/model.ts src/features/log/model.test.ts src/data
git commit -m "feat(data): add project model, derived sections, and profile data

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Design tokens, fonts, global styles, HTML shell

**Files:**
- Modify (replace entirely): `tailwind.config.ts`, `src/styles/globals.css`, `index.html`, `src/main.tsx`
- Create: `public/robots.txt`, `public/sitemap.xml`

**Interfaces:**
- Produces: Tailwind colors `ink-950/900/800/700`, `paper`, `mute`, `accent` (= `var(--accent)`); fonts `font-display`, `font-mono`, `font-body`; CSS classes `.chip`, `.btn-accent`, `.btn-ghost`, `.ghost-no`, `.snap-chapter`, `.grain`; animatable CSS property `--accent` (registered with `@property`).

- [ ] **Step 1: Replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#06070b', 900: '#0b0d14', 800: '#12151f', 700: '#1b1f2d' },
        paper: '#f3efe6',
        mute: '#8b8f9c',
        accent: 'var(--accent)',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
        body: ['"Geist Variable"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Replace `src/styles/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Registered so the page theme can transition smoothly between chapters */
@property --accent {
  syntax: '<color>';
  inherits: true;
  initial-value: rgb(255 93 58);
}

@layer base {
  :root {
    --accent: rgb(255 93 58);
    transition: --accent 0.8s ease;
    color-scheme: dark;
  }

  * {
    box-sizing: border-box;
  }

  html {
    background: #06070b;
    color: #f3efe6;
    scroll-behavior: auto; /* Lenis / native handle it */
  }

  body {
    margin: 0;
    font-family: 'Geist Variable', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    background: color-mix(in srgb, var(--accent) 9%, #06070b);
    min-height: 100svh;
  }

  ::selection {
    background: color-mix(in srgb, var(--accent) 45%, transparent);
  }

  /* Lenis recommended resets */
  html.lenis,
  html.lenis body {
    height: auto;
  }
  .lenis.lenis-smooth {
    scroll-behavior: auto !important;
  }
  .lenis.lenis-stopped {
    overflow: hidden;
  }
}

@layer components {
  .chip {
    @apply inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider;
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: color-mix(in srgb, var(--accent) 70%, #f3efe6);
  }

  .btn-accent {
    @apply inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 font-mono text-sm font-medium text-ink-950 transition-transform active:scale-95;
    background: var(--accent);
  }

  .btn-ghost {
    @apply inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/15 px-6 font-mono text-sm text-paper transition-colors active:scale-95;
  }
  .btn-ghost:hover {
    border-color: var(--accent);
  }

  .ghost-no {
    color: color-mix(in srgb, var(--accent) 14%, transparent);
  }

  .grain {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 128px 128px;
  }
}

/* Touch devices: gentle proximity snap between chapters (never mandatory) */
@media (pointer: coarse) {
  html {
    scroll-snap-type: y proximity;
  }
  .snap-chapter {
    scroll-snap-align: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .grain {
    display: none;
  }
}
```

- [ ] **Step 3: Replace `src/main.tsx` (self-hosted fonts)**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';
import App from '@/App';
import '@/styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Replace `index.html`** (generic copy, no product names, JSON-LD Person, noscript fallback, no Google Fonts links)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Dhiraj Salian — Senior Software Engineer · Bengaluru</title>
    <meta name="description" content="Senior Software Engineer with 8+ years building distributed systems and cloud platforms. Ships indie products and open-source tools." />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="Dhiraj Salian — Senior Software Engineer" />
    <meta property="og:description" content="8+ years building backend services and distributed systems. Ships indie products and open-source tools." />
    <meta property="og:url" content="https://drjzlyan.com" />
    <meta property="og:image" content="https://drjzlyan.com/profile.jpg" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Dhiraj Salian — Senior Software Engineer" />
    <meta name="twitter:description" content="8+ years building backend services and distributed systems. Ships indie products and open-source tools." />
    <meta name="twitter:image" content="https://drjzlyan.com/profile.jpg" />

    <link rel="canonical" href="https://drjzlyan.com" />
    <link rel="alternate" type="application/pdf" href="https://drjzlyan.com/resume.pdf" title="Dhiraj Salian — Resume" />

    <meta name="theme-color" content="#06070b" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Dhiraj Salian",
        "jobTitle": "Senior Software Engineer",
        "url": "https://drjzlyan.com",
        "image": "https://drjzlyan.com/profile.jpg",
        "address": { "@type": "PostalAddress", "addressLocality": "Bengaluru", "addressCountry": "IN" },
        "sameAs": ["https://github.com/dhiraj-salian", "https://linkedin.com/in/dhiraj-salian", "https://blogs.drjzlyan.com"]
      }
    </script>
  </head>
  <body>
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-paper focus:px-4 focus:py-2 focus:text-ink-950">
      Skip to content
    </a>
    <div id="root"></div>
    <noscript>
      <main style="padding:2rem;font-family:system-ui;color:#f3efe6">
        <h1>Dhiraj Salian</h1>
        <p>Senior Software Engineer · Bengaluru, India</p>
        <p>
          <a style="color:#ff5d3a" href="https://github.com/dhiraj-salian">GitHub</a> ·
          <a style="color:#ff5d3a" href="https://linkedin.com/in/dhiraj-salian">LinkedIn</a> ·
          <a style="color:#ff5d3a" href="https://blogs.drjzlyan.com">Blog</a> ·
          <a style="color:#ff5d3a" href="/resume.pdf">Resume</a>
        </p>
      </main>
    </noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `public/robots.txt` and `public/sitemap.xml`**

`public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://drjzlyan.com/sitemap.xml
```

`public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://drjzlyan.com/</loc></url>
</urlset>
```

- [ ] **Step 6: Commit** (build verification happens in Task 9; the app doesn't compile until `App.tsx` is rewritten)

```bash
git add tailwind.config.ts src/styles/globals.css src/main.tsx index.html public/robots.txt public/sitemap.xml
git commit -m "feat(design): new tokens, self-hosted fonts, globals, SEO shell

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Scroll driver, theme helper, reduced-motion hook, Loader, Magnetic

**Files:**
- Create: `src/lib/useReducedMotion.ts`, `src/lib/scroll.ts`, `src/lib/theme.ts`, `src/features/log/useAccent.ts`, `src/components/Loader.tsx`, `src/components/Magnetic.tsx`

**Interfaces:**
- Consumes: `themeVars` from `@/lib/color`.
- Produces:
  - `prefersReducedMotion(): boolean`, `useReducedMotion(): boolean`
  - `initScroll(): () => void` (cleanup), `scrollToId(id: string): void`, `pauseScroll(): void`, `resumeScroll(): void`, re-exports `gsap`, `ScrollTrigger`
  - `applyAccent(accent: string): void` (sets `--accent` on `<html>`)
  - `useAccentOnVisible(ref: RefObject<HTMLElement>, accent: string): void`
  - `<Loader onDone={() => void} />` (calls `onDone` exactly once)
  - `<Magnetic>{ReactElement}</Magnetic>`

- [ ] **Step 1: `src/lib/useReducedMotion.ts`**

```ts
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: `src/lib/scroll.ts`**

```ts
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** One Lenis instance driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function initScroll(): () => void {
  if (prefersReducedMotion()) return () => {};
  const instance = new Lenis({ autoRaf: false, lerp: 0.1 });
  lenis = instance;
  instance.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    instance.destroy();
    if (lenis === instance) lenis = null;
  };
}

export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.2 });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export const pauseScroll = () => lenis?.stop();
export const resumeScroll = () => lenis?.start();

export { gsap, ScrollTrigger };
```

- [ ] **Step 3: `src/lib/theme.ts`**

```ts
import { themeVars } from './color';

export function applyAccent(accent: string): void {
  const vars = themeVars(accent);
  document.documentElement.style.setProperty('--accent', vars['--accent']);
}
```

- [ ] **Step 4: `src/features/log/useAccent.ts`**

```ts
import { useEffect, type RefObject } from 'react';
import { ScrollTrigger } from '@/lib/scroll';
import { applyAccent } from '@/lib/theme';

/** While `ref` is mostly on screen, the page takes on `accent`. */
export function useAccentOnVisible(ref: RefObject<HTMLElement>, accent: string): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) applyAccent(accent);
      },
    });
    return () => trigger.kill();
  }, [ref, accent]);
}
```

- [ ] **Step 5: `src/components/Loader.tsx`**

```tsx
import { useCallback, useEffect, useRef } from 'react';
import { gsap } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';

const KEY = 'shiplog:intro';

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage unavailable: intro simply shows again next load */
  }
}

export function Loader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const skip = reduced || alreadySeen();
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    markSeen();
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (skip) {
      finish();
      return;
    }
    const ctx = gsap.context(() => {
      gsap
        .timeline({ onComplete: finish })
        .fromTo('.drop', { scale: 0 }, { scale: 1, duration: 0.45, ease: 'power3.out' })
        .to('.drop', { scale: 70, duration: 0.55, ease: 'power3.in' }, '+=0.05')
        .to(root.current, { opacity: 0, duration: 0.2 }, '-=0.1');
    }, root);
    return () => ctx.revert();
  }, [skip, finish]);

  if (skip) return null;
  return (
    <div
      ref={root}
      onClick={finish}
      role="presentation"
      className="fixed inset-0 z-[100] grid place-items-center bg-ink-950"
    >
      <div className="drop h-6 w-6 rounded-full bg-accent" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
```

- [ ] **Step 6: `src/components/Magnetic.tsx`** (mouse-only pull; no-op on touch)

```tsx
import { useRef, type ReactNode } from 'react';
import { gsap } from '@/lib/scroll';

export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.25;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.25;
    gsap.to(ref.current, { x, y, duration: 0.3, ease: 'power3.out' });
  };
  const leave = () => {
    if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.5)' });
  };

  return (
    <span ref={ref} onPointerMove={move} onPointerLeave={leave} className="inline-block">
      {children}
    </span>
  );
}
```

- [ ] **Step 7: Commit** (compiled and verified in Task 9)

```bash
git add src/lib src/features/log/useAccent.ts src/components/Loader.tsx src/components/Magnetic.tsx
git commit -m "feat(core): scroll driver, accent theming, loader, magnetic

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Ink particle engine (TDD), canvas component, Hero

**Files:**
- Create: `src/features/hero/engine.ts`, `src/features/hero/engine.test.ts`, `src/features/hero/sampleText.ts`, `src/features/hero/InkField.tsx`, `src/features/hero/Hero.tsx`

**Interfaces:**
- Consumes: `useReducedMotion`, `scrollToId`, `profile`, `chapterId`, `Project`.
- Produces (`engine.ts`):
  - `interface Vec { x: number; y: number }`, `interface Particle { x; y; vx; vy; tx; ty: number }`, `type Mode = 'flow' | 'form'`, `interface Pointer extends Vec { active: boolean }`
  - `particleCount(viewportWidth: number, coarse: boolean): number` (1500 if coarse or width < 768, else 4000)
  - `createParticles(n: number, w: number, h: number, rand?: () => number): Particle[]`
  - `assignTargets(ps: Particle[], pts: Vec[], rand?: () => number): void`
  - `flowAngle(x: number, y: number, t: number): number`
  - `step(ps: Particle[], mode: Mode, t: number, dt: number, pointer: Pointer | null, bounds: { w: number; h: number }, gravity?: Vec): void`
  - `burst(ps: Particle[], origin: Vec, strength: number, rand?: () => number): void`
  - `tiltToGravity(gamma: number | null | undefined, beta: number | null | undefined): Vec` (each axis clamped to [-1, 1]; null/undefined → 0)
- Produces: `sampleTextPoints(lines: string[], w: number, h: number): Promise<Vec[]>`; default export `InkField({ start }: { start: boolean })`; `Hero({ start, latest }: { start: boolean; latest?: Project })`.

- [ ] **Step 1: Write the failing engine tests**

`src/features/hero/engine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@/lib/rand';
import {
  assignTargets,
  burst,
  createParticles,
  particleCount,
  step,
  tiltToGravity,
  type Vec,
} from './engine';

const bounds = { w: 400, h: 400 };

describe('particleCount', () => {
  it('uses 1500 on coarse pointers and narrow viewports', () => {
    expect(particleCount(390, true)).toBe(1500);
    expect(particleCount(500, false)).toBe(1500);
    expect(particleCount(0, false)).toBe(1500);
  });
  it('uses 4000 on wide fine-pointer viewports', () => {
    expect(particleCount(1440, false)).toBe(4000);
  });
});

describe('form mode', () => {
  it('converges particles onto their targets', () => {
    const rand = mulberry32(1);
    const ps = createParticles(200, bounds.w, bounds.h, rand);
    const pts: Vec[] = Array.from({ length: 50 }, (_, i) => ({ x: 100 + (i % 10) * 10, y: 100 + Math.floor(i / 10) * 10 }));
    assignTargets(ps, pts, rand);
    for (let i = 0; i < 400; i++) step(ps, 'form', i / 60, 1 / 60, null, bounds);
    const mean = ps.reduce((s, p) => s + Math.hypot(p.tx - p.x, p.ty - p.y), 0) / ps.length;
    expect(mean).toBeLessThan(1);
  });
  it('leaves targets untouched when there are no sample points', () => {
    const ps = createParticles(5, bounds.w, bounds.h, mulberry32(2));
    const before = ps.map((p) => [p.tx, p.ty]);
    assignTargets(ps, [], mulberry32(2));
    expect(ps.map((p) => [p.tx, p.ty])).toEqual(before);
  });
});

describe('flow mode', () => {
  it('wraps particles that leave the bounds', () => {
    const ps = createParticles(1, bounds.w, bounds.h, mulberry32(3));
    ps[0]!.x = -1;
    ps[0]!.y = 10;
    ps[0]!.vx = 0;
    ps[0]!.vy = 0;
    step(ps, 'flow', 0, 1 / 60, null, bounds);
    expect(ps[0]!.x).toBeGreaterThan(bounds.w / 2);
  });
});

describe('pointer repulsion', () => {
  it('pushes a nearby particle away from an active pointer', () => {
    const ps = createParticles(1, bounds.w, bounds.h, mulberry32(4));
    Object.assign(ps[0]!, { x: 210, y: 210, vx: 0, vy: 0, tx: 210, ty: 210 });
    step(ps, 'form', 0, 1 / 60, { x: 200, y: 200, active: true }, bounds);
    expect(ps[0]!.vx).toBeGreaterThan(0);
    expect(ps[0]!.vy).toBeGreaterThan(0);
  });
  it('ignores an inactive pointer', () => {
    const ps = createParticles(1, bounds.w, bounds.h, mulberry32(4));
    Object.assign(ps[0]!, { x: 210, y: 210, vx: 0, vy: 0, tx: 210, ty: 210 });
    step(ps, 'form', 0, 1 / 60, { x: 200, y: 200, active: false }, bounds);
    expect(ps[0]!.vx).toBe(0);
  });
});

describe('burst', () => {
  it('imparts outward velocity from the origin', () => {
    const ps = createParticles(1, bounds.w, bounds.h, mulberry32(5));
    Object.assign(ps[0]!, { x: 300, y: 200, vx: 0, vy: 0 });
    burst(ps, { x: 200, y: 200 }, 10, () => 0.5);
    expect(ps[0]!.vx).toBeGreaterThan(0);
  });
});

describe('tiltToGravity', () => {
  it('returns zero gravity when orientation data is missing', () => {
    expect(tiltToGravity(null, null)).toEqual({ x: 0, y: 0 });
    expect(tiltToGravity(undefined, undefined)).toEqual({ x: 0, y: 0 });
  });
  it('clamps each axis to [-1, 1]', () => {
    expect(tiltToGravity(90, 180)).toEqual({ x: 1, y: 1 });
    expect(tiltToGravity(-90, -90)).toEqual({ x: -1, y: -1 });
  });
  it('treats a phone held at ~45deg beta as neutral', () => {
    expect(tiltToGravity(0, 45).y).toBeCloseTo(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/features/hero/engine.test.ts`
Expected: FAIL (cannot resolve `./engine`).

- [ ] **Step 3: Implement `src/features/hero/engine.ts`**

```ts
export interface Vec {
  x: number;
  y: number;
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
}
export type Mode = 'flow' | 'form';
export interface Pointer extends Vec {
  active: boolean;
}

export function particleCount(viewportWidth: number, coarse: boolean): number {
  return coarse || viewportWidth < 768 ? 1500 : 4000;
}

export function createParticles(n: number, w: number, h: number, rand: () => number = Math.random): Particle[] {
  return Array.from({ length: n }, () => {
    const x = rand() * w;
    const y = rand() * h;
    return { x, y, vx: 0, vy: 0, tx: x, ty: y };
  });
}

export function assignTargets(ps: Particle[], pts: Vec[], rand: () => number = Math.random): void {
  if (pts.length === 0) return;
  for (const p of ps) {
    const t = pts[Math.floor(rand() * pts.length)]!;
    p.tx = t.x;
    p.ty = t.y;
  }
}

export function flowAngle(x: number, y: number, t: number): number {
  return Math.sin(x * 0.004 + t * 0.3) * Math.PI + Math.cos(y * 0.005 - t * 0.2) * Math.PI;
}

const POINTER_RADIUS = 120;

export function step(
  ps: Particle[],
  mode: Mode,
  t: number,
  dt: number,
  pointer: Pointer | null,
  bounds: { w: number; h: number },
  gravity: Vec = { x: 0, y: 0 },
): void {
  const k = Math.min(dt, 0.05) * 60;
  const damp = Math.pow(mode === 'form' ? 0.86 : 0.94, k);
  for (const p of ps) {
    let ax = 0;
    let ay = 0;
    if (mode === 'flow') {
      const a = flowAngle(p.x, p.y, t);
      ax = Math.cos(a) * 0.05 + gravity.x * 0.05;
      ay = Math.sin(a) * 0.05 + gravity.y * 0.05;
    } else {
      ax = (p.tx - p.x) * 0.02;
      ay = (p.ty - p.y) * 0.02;
    }
    if (pointer?.active) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < POINTER_RADIUS * POINTER_RADIUS && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const s = (1 - d / POINTER_RADIUS) * 1.2;
        ax += (dx / d) * s;
        ay += (dy / d) * s;
      }
    }
    p.vx = (p.vx + ax * k) * damp;
    p.vy = (p.vy + ay * k) * damp;
    p.x += p.vx * k;
    p.y += p.vy * k;
    if (mode === 'flow') {
      if (p.x < 0) p.x += bounds.w;
      else if (p.x > bounds.w) p.x -= bounds.w;
      if (p.y < 0) p.y += bounds.h;
      else if (p.y > bounds.h) p.y -= bounds.h;
    }
  }
}

export function burst(ps: Particle[], origin: Vec, strength: number, rand: () => number = Math.random): void {
  for (const p of ps) {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    const d = Math.hypot(dx, dy) || 1;
    const s = strength * (0.5 + rand());
    p.vx += (dx / d) * s;
    p.vy += (dy / d) * s;
  }
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export function tiltToGravity(gamma: number | null | undefined, beta: number | null | undefined): Vec {
  return { x: clamp((gamma ?? 0) / 45), y: clamp(((beta ?? 45) - 45) / 45) };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/features/hero/engine.test.ts`
Expected: PASS. If the convergence test is borderline, increase iterations (not thresholds) and note it.

- [ ] **Step 5: `src/features/hero/sampleText.ts`** (browser-only; verified visually in Task 10)

```ts
import type { Vec } from './engine';

/** Rasterise `lines` in the display font and return the lit pixel positions. */
export async function sampleTextPoints(lines: string[], w: number, h: number): Promise<Vec[]> {
  try {
    await document.fonts.load('italic 400 100px "Instrument Serif"');
  } catch {
    /* fall back to the serif stack */
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return [];

  const family = '"Instrument Serif", serif';
  let size = lines.length > 1 ? Math.min(h * 0.2, w * 0.3) : Math.min(h * 0.2, w * 0.14);
  g.font = `italic 400 ${size}px ${family}`;
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  if (widest > w * 0.86) size *= (w * 0.86) / widest;
  g.font = `italic 400 ${size}px ${family}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';

  const lineHeight = size * 1.0;
  const startY = h * 0.42 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => g.fillText(l, w / 2, startY + i * lineHeight));

  const data = g.getImageData(0, 0, w, h).data;
  const gap = 3;
  const pts: Vec[] = [];
  for (let y = 0; y < h; y += gap) {
    for (let x = 0; x < w; x += gap) {
      if (data[(y * w + x) * 4 + 3]! > 128) pts.push({ x, y });
    }
  }
  return pts;
}
```

- [ ] **Step 6: `src/features/hero/InkField.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import {
  assignTargets,
  burst,
  createParticles,
  particleCount,
  step,
  tiltToGravity,
  type Mode,
  type Particle,
  type Pointer,
  type Vec,
} from './engine';
import { sampleTextPoints } from './sampleText';

interface DeviceOrientationCtor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export default function InkField({ start }: { start: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!start) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let mode: Mode = 'flow';
    const pointer: Pointer = { x: 0, y: 0, active: false };
    let gravity: Vec = { x: 0, y: 0 };
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let disposed = false;
    let slowFrames = 0;
    let frame = 0;
    let color = 'rgb(255 93 58)';
    let formTimer = 0;
    let pressTimer = 0;
    let resizeTimer = 0;
    let tiltAsked = false;

    const toForm = (ms: number) => {
      window.clearTimeout(formTimer);
      formTimer = window.setTimeout(() => {
        mode = 'form';
      }, ms);
    };

    const setup = async () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(particleCount(w, coarse), w, h);
      mode = 'flow';
      const lines = w < 640 ? ['Dhiraj', 'Salian'] : ['Dhiraj Salian'];
      const pts = await sampleTextPoints(lines, w, h);
      if (disposed) return;
      assignTargets(particles, pts);
      toForm(700);
    };

    const loop = (now: number) => {
      raf = 0;
      if (disposed || !visible) return;
      const dt = (now - last) / 1000;
      last = now;
      if (dt > 1 / 40) {
        slowFrames++;
        if (slowFrames > 30 && particles.length > 600) {
          particles.length = Math.max(600, Math.floor(particles.length * 0.7));
          slowFrames = 0;
        }
      } else {
        slowFrames = Math.max(0, slowFrames - 1);
      }
      step(particles, mode, now / 1000, dt, pointer, { w, h }, gravity);

      if (frame++ % 10 === 0) {
        color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || color;
      }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
      for (const p of particles) ctx.fillRect(p.x, p.y, 1.7, 1.7);
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && visible && !disposed) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const local = (e: PointerEvent): Vec => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onTilt = (e: DeviceOrientationEvent) => {
      gravity = tiltToGravity(e.gamma, e.beta);
    };
    const enableTilt = async () => {
      if (tiltAsked || !coarse) return;
      tiltAsked = true;
      const D = (window as unknown as { DeviceOrientationEvent?: DeviceOrientationCtor }).DeviceOrientationEvent;
      if (!D) return;
      try {
        if (typeof D.requestPermission === 'function') {
          if ((await D.requestPermission()) !== 'granted') return;
        }
        window.addEventListener('deviceorientation', onTilt);
      } catch {
        /* permission denied or unsupported: stay at zero gravity */
      }
    };

    const onDown = (e: PointerEvent) => {
      const p = local(e);
      Object.assign(pointer, p, { active: true });
      void enableTilt();
      burst(particles, p, 6);
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => {
        mode = 'flow';
        burst(particles, p, 16);
        toForm(1800);
      }, 450);
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (e.pointerType === 'mouse') pointer.active = true;
    };
    const onUp = () => {
      pointer.active = false;
      window.clearTimeout(pressTimer);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);
    canvas.addEventListener('pointercancel', onUp);

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => void setup().then(kick), 250);
    };
    window.addEventListener('resize', onResize);

    void setup().then(kick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(formTimer);
      window.clearTimeout(pressTimer);
      window.clearTimeout(resizeTimer);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('deviceorientation', onTilt);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [start]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full touch-pan-y" />;
}
```

- [ ] **Step 7: `src/features/hero/Hero.tsx`**

```tsx
import { lazy, Suspense, useRef } from 'react';
import { profile } from '@/data/profile';
import { chapterId, DEFAULT_ACCENT, type Project } from '@/features/log/model';
import { useAccentOnVisible } from '@/features/log/useAccent';
import { scrollToId } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';

const InkField = lazy(() => import('./InkField'));

export function Hero({ start, latest }: { start: boolean; latest?: Project }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  useAccentOnVisible(ref, DEFAULT_ACCENT);

  return (
    <section
      ref={ref}
      id="hero"
      aria-label="Introduction"
      className="snap-chapter relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-5 pb-28 md:px-12 md:pb-16"
    >
      {reduced ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'radial-gradient(60% 50% at 50% 40%, color-mix(in srgb, var(--accent) 22%, transparent), transparent)' }}
        />
      ) : (
        <Suspense fallback={null}>
          <InkField start={start} />
        </Suspense>
      )}

      {/* The canvas draws the name; this h1 is the accessible/reduced-motion text */}
      <h1
        className={
          reduced
            ? 'relative z-10 mb-6 font-display text-[clamp(3rem,14vw,9rem)] italic leading-[0.95]'
            : 'sr-only'
        }
      >
        {profile.name}
      </h1>

      <div className="pointer-events-none relative z-10 max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
          {profile.role} · {profile.location}
        </p>
        <p className="mt-3 text-lg text-paper/85 md:text-xl">{profile.headline}</p>
        {latest && (
          <button
            type="button"
            onClick={() => scrollToId(chapterId(latest.slug))}
            className="pointer-events-auto btn-ghost mt-6"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Latest ship: {latest.name} ↓
          </button>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Run tests and commit**

Run: `npm test`
Expected: PASS.

```bash
git add src/features/hero
git commit -m "feat(hero): ink particle engine (tested), canvas field, hero

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Log chapters (flagship, lab row, detail sheet, ink motif)

**Files:**
- Create: `src/features/log/InkMotif.tsx`, `src/features/log/visuals.ts`, `src/features/log/StatusChip.tsx`, `src/features/log/Chapter.tsx`, `src/features/log/LabRow.tsx`, `src/features/log/DetailSheet.tsx`

**Interfaces:**
- Consumes: `Project`, `chapterId`, `pickVisual` (Task 3); `useAccentOnVisible` (Task 5); `applyAccent`, `Magnetic`, `gsap`, `ScrollTrigger`, `pauseScroll`, `resumeScroll`, `useReducedMotion`; `blobPath`, `mulberry32`, `seedFromString`.
- Produces:
  - `visuals: Record<string, ComponentType<VisualProps>>` (empty by default), `resolveVisual(key?: string): ComponentType<VisualProps>`, `interface VisualProps { slug: string; className?: string }`
  - `<InkMotif slug className />`
  - `<StatusChip status />`
  - `<Chapter project number onOpen />` (flagship), `<LabRow labs numbers onOpen />`
  - default export `DetailSheet({ project, onClose })` (lazy-loaded by `App`)

- [ ] **Step 1: `src/features/log/InkMotif.tsx`**

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { blobPath, mulberry32, seedFromString } from '@/lib/rand';
import { gsap } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';

export interface VisualProps {
  slug: string;
  className?: string;
}

/** Generated fallback visual: three seeded, slowly rotating blobs in the page accent. */
export function InkMotif({ slug, className }: VisualProps) {
  const ref = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const paths = useMemo(() => {
    const rand = mulberry32(seedFromString(slug));
    return [0, 1, 2].map((i) => blobPath(rand, 200, 150, 120 - i * 32, 9, 0.28));
  }, [slug]);

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.to('.blob', {
        rotation: (i: number) => (i % 2 ? -360 : 360),
        svgOrigin: '200 150',
        duration: (i: number) => 38 + i * 14,
        repeat: -1,
        ease: 'none',
      });
    }, ref);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <svg ref={ref} viewBox="0 0 400 300" aria-hidden="true" className={className}>
      {paths.map((d, i) => (
        <path
          key={i}
          className="blob"
          d={d}
          style={{ fill: 'var(--accent)', stroke: 'var(--accent)' }}
          fillOpacity={0.1 + i * 0.09}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: `src/features/log/visuals.ts`**

```ts
import type { ComponentType } from 'react';
import { pickVisual } from './model';
import { InkMotif, type VisualProps } from './InkMotif';

export type { VisualProps };

/** Register bespoke mini-visuals here by key, then set `visual: 'key'` on a project. */
export const visuals: Record<string, ComponentType<VisualProps>> = {};

export function resolveVisual(key?: string): ComponentType<VisualProps> {
  return pickVisual(key, visuals, InkMotif);
}
```

- [ ] **Step 3: `src/features/log/StatusChip.tsx`**

```tsx
import type { Status } from './model';

const LABEL: Record<Status, string> = {
  live: 'Live',
  building: 'Building',
  'open-source': 'Open source',
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span className="chip">
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
```

- [ ] **Step 4: `src/features/log/Chapter.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { Magnetic } from '@/components/Magnetic';
import { gsap, ScrollTrigger } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { chapterId, type Project } from './model';
import { StatusChip } from './StatusChip';
import { useAccentOnVisible } from './useAccent';
import { resolveVisual } from './visuals';

interface Props {
  project: Project;
  number: number;
  onOpen: (p: Project) => void;
}

function host(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function Chapter({ project, number, onOpen }: Props) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const Visual = resolveVisual(project.visual);
  useAccentOnVisible(root, project.accent);

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const trigger = { trigger: el, start: 'top 65%', once: true };
      gsap.from('.line > span', { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.08, scrollTrigger: trigger });
      gsap.from('.fade-up', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, delay: 0.25, ease: 'power3.out', scrollTrigger: trigger });
      gsap.to('.big-no', {
        yPercent: -25,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // Fonts/layout settle after mount; keep trigger positions accurate
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  const id = chapterId(project.slug);
  return (
    <section
      ref={root}
      id={id}
      aria-labelledby={`${id}-title`}
      className="snap-chapter relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-5 pb-28 pt-24 md:px-12 md:pb-16"
    >
      <span
        aria-hidden="true"
        className="big-no ghost-no pointer-events-none absolute -right-2 top-14 select-none font-display italic leading-none text-[clamp(10rem,52vw,34rem)]"
      >
        {String(number).padStart(2, '0')}
      </span>

      <Visual
        slug={project.slug}
        className="pointer-events-none absolute inset-x-0 top-[10svh] mx-auto h-[40svh] w-[90vw] max-w-xl opacity-90 md:left-auto md:right-12 md:top-[14svh] md:mx-0 md:h-[60svh] md:w-[44vw] md:max-w-none"
      />

      <div className="relative z-10 max-w-3xl">
        <div className="fade-up mb-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-widest text-mute">No. {String(number).padStart(2, '0')}</span>
          <StatusChip status={project.status} />
        </div>

        <h2
          id={`${id}-title`}
          className="font-display text-[clamp(2.75rem,13vw,7rem)] italic leading-[0.95] [overflow-wrap:anywhere]"
        >
          <span className="line block overflow-hidden pb-[0.12em]">
            <span className="block">{project.name}</span>
          </span>
        </h2>

        <p className="fade-up mt-4 max-w-xl text-lg text-paper/85 md:text-xl">{project.tagline}</p>

        {project.stack.length > 0 && (
          <ul className="fade-up mt-5 flex flex-wrap gap-2" aria-label="Stack">
            {project.stack.map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>
        )}

        <div className="fade-up mt-7 flex flex-wrap gap-3">
          <Magnetic>
            <a className="btn-accent" href={project.url} target="_blank" rel="noopener noreferrer">
              Visit {host(project.url)} ↗
            </a>
          </Magnetic>
          <button type="button" className="btn-ghost" onClick={() => onOpen(project)}>
            Details
          </button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: `src/features/log/LabRow.tsx`**

```tsx
import { useRef } from 'react';
import { applyAccent } from '@/lib/theme';
import type { Project } from './model';
import { StatusChip } from './StatusChip';
import { useAccentOnVisible } from './useAccent';

interface Props {
  labs: Project[];
  numbers: Map<string, number>;
  onOpen: (p: Project) => void;
}

export function LabRow({ labs, numbers, onOpen }: Props) {
  const ref = useRef<HTMLElement>(null);
  useAccentOnVisible(ref, labs[0]!.accent);

  return (
    <section
      ref={ref}
      id="lab"
      aria-labelledby="lab-title"
      className="snap-chapter relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-24"
    >
      <div className="px-5 md:px-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">Lab</p>
        <h2 id="lab-title" className="mt-2 font-display text-[clamp(2.5rem,11vw,6rem)] italic leading-[0.95]">
          Smaller things, shipped in public.
        </h2>
        <p className="mt-3 text-sm text-mute md:hidden">Swipe →</p>
      </div>

      <div
        role="region"
        aria-label="Lab projects"
        tabIndex={0}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {labs.map((p) => (
          <article
            key={p.slug}
            onPointerEnter={() => applyAccent(p.accent)}
            onFocus={() => applyAccent(p.accent)}
            className="flex w-[78vw] max-w-sm shrink-0 snap-center flex-col rounded-3xl border border-white/10 bg-ink-900/70 p-6 backdrop-blur md:w-80"
            style={{ borderTopColor: p.accent, borderTopWidth: 2 }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest text-mute">
                No. {String(numbers.get(p.slug) ?? 0).padStart(2, '0')}
              </span>
              <StatusChip status={p.status} />
            </div>
            <h3 className="mt-5 font-display text-3xl italic leading-tight [overflow-wrap:anywhere]">{p.name}</h3>
            <p className="mt-2 text-paper/80">{p.tagline}</p>
            <div className="mt-auto flex gap-3 pt-6">
              <a className="btn-accent" href={p.url} target="_blank" rel="noopener noreferrer">
                Open ↗
              </a>
              <button type="button" className="btn-ghost" onClick={() => onOpen(p)}>
                Details
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: `src/features/log/DetailSheet.tsx`** (default export so `App` can lazy-load it and keep framer-motion out of the initial bundle)

```tsx
import { useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { pauseScroll, resumeScroll } from '@/lib/scroll';
import { StatusChip } from './StatusChip';
import type { Project } from './model';

interface Props {
  project: Project | null;
  onClose: () => void;
}

export default function DetailSheet({ project, onClose }: Props) {
  const controls = useDragControls();

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    pauseScroll();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
      resumeScroll();
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[60] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="fixed inset-x-0 bottom-0 z-[61] mx-auto max-h-[85svh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-ink-800 p-6 pb-10"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              onPointerDown={(e) => controls.start(e)}
              className="mx-auto mb-5 h-1.5 w-12 cursor-grab touch-none rounded-full bg-white/25"
              aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <StatusChip status={project.status} />
                <h2 id="sheet-title" className="mt-3 font-display text-4xl italic leading-tight [overflow-wrap:anywhere]">
                  {project.name}
                </h2>
              </div>
              <button type="button" autoFocus onClick={onClose} className="btn-ghost shrink-0" aria-label="Close details">
                ✕
              </button>
            </div>
            <p className="mt-3 text-lg text-paper/90">{project.tagline}</p>
            <p className="mt-4 text-paper/70">{project.description}</p>
            {project.stack.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Stack">
                {project.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="btn-accent" href={project.url} target="_blank" rel="noopener noreferrer">
                Open project ↗
              </a>
              {project.links?.map((l) => (
                <a key={l.href} className="btn-ghost" href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/features/log
git commit -m "feat(log): flagship chapters, lab row, detail sheet, ink motif

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Dock, About, Contact

**Files:**
- Create: `src/components/Dock.tsx`, `src/features/about/About.tsx`, `src/features/contact/Contact.tsx`
- Reuse: `src/assets/profile.jpg`

**Interfaces:**
- Consumes: `Section` (Task 3), `scrollToId`, `ScrollTrigger`, `gsap`, `useAccentOnVisible`, `DEFAULT_ACCENT`, `profile`, `projects` (for derived counters), `Magnetic`.
- Produces: `<Dock sections={Section[]} />` (the `sections` array must be referentially stable: compute once at module level), `<About projects={Project[]} />`, `<Contact />`.

- [ ] **Step 1: `src/components/Dock.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { Section } from '@/features/log/model';
import { scrollToId, ScrollTrigger } from '@/lib/scroll';

export function Dock({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const triggers = sections.map((s) => {
      const el = document.getElementById(s.id);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) setActive(s.id);
        },
      });
    });
    return () => triggers.forEach((t) => t?.kill());
  }, [sections]);

  return (
    <nav
      aria-label="Chapters"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-white/10 bg-ink-900/70 px-4 py-2 backdrop-blur-xl md:inset-x-auto md:bottom-auto md:left-5 md:top-1/2 md:max-w-none md:-translate-y-1/2 md:flex-col md:px-2 md:py-4"
    >
      <ul className="flex items-center gap-1 md:flex-col">
        {sections.map((s) => {
          const on = s.id === active;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => scrollToId(s.id)}
                aria-label={s.label}
                aria-current={on ? 'true' : undefined}
                className="grid h-9 w-6 place-items-center md:h-6 md:w-9"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    on ? 'h-1.5 w-5 bg-accent md:h-5 md:w-1.5' : 'h-1.5 w-1.5 bg-white/30'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => scrollToId('contact')} className="btn-accent !min-h-[40px] px-4 text-xs md:hidden">
        Contact
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: `src/features/about/About.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { profile } from '@/data/profile';
import profileImg from '@/assets/profile.jpg';
import { DEFAULT_ACCENT, type Project } from '@/features/log/model';
import { useAccentOnVisible } from '@/features/log/useAccent';
import { gsap } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';

function Counter({ to, suffix = '', label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = `${to}${suffix}`;
      return;
    }
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: to,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => {
        el.textContent = `${Math.round(obj.v)}${suffix}`;
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [to, suffix, reduced]);

  return (
    <div>
      <span ref={ref} className="block font-display text-5xl italic text-accent">
        {to}
        {suffix}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-wider text-mute">{label}</span>
    </div>
  );
}

export function About({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLElement>(null);
  useAccentOnVisible(ref, DEFAULT_ACCENT);
  const live = projects.filter((p) => p.status === 'live').length;

  return (
    <section
      ref={ref}
      id="about"
      aria-labelledby="about-title"
      className="snap-chapter relative flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-12"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">The maker</p>
      <h2 id="about-title" className="mt-2 font-display text-[clamp(2.5rem,11vw,6rem)] italic leading-[0.95]">
        {profile.name}
      </h2>

      <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:gap-14">
        <img
          src={profileImg}
          alt={`Portrait of ${profile.name}`}
          width={176}
          height={176}
          loading="lazy"
          decoding="async"
          className="h-36 w-36 shrink-0 rounded-full border border-white/10 object-cover md:h-44 md:w-44"
        />
        <div className="max-w-2xl space-y-4 text-lg text-paper/85">
          {profile.bio.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            Notes on AI and ML live on the{' '}
            <a className="underline decoration-accent underline-offset-4" href={profile.links.blog} target="_blank" rel="noopener noreferrer">
              blog
            </a>
            .
          </p>
        </div>
      </div>

      <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
        <Counter to={profile.yearsExperience} suffix="+" label="years engineering" />
        <Counter to={projects.length} label="things shipped" />
        <Counter to={live} label="live products" />
      </div>

      <div
        role="region"
        aria-label="Timeline"
        tabIndex={0}
        className="-mx-5 mt-10 flex snap-x gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {profile.timeline.map((t) => (
          <article key={t.title + t.org} className="w-[72vw] max-w-xs shrink-0 snap-start rounded-2xl border border-white/10 bg-ink-900/60 p-5 md:w-72">
            <h3 className="font-display text-2xl italic">{t.title}</h3>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-accent">{t.org}</p>
            <p className="mt-3 text-sm text-paper/75">{t.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `src/features/contact/Contact.tsx`**

```tsx
import { useRef } from 'react';
import { Download, Github, Linkedin, Mail, Pen } from 'lucide-react';
import { Magnetic } from '@/components/Magnetic';
import { profile } from '@/data/profile';
import { DEFAULT_ACCENT } from '@/features/log/model';
import { useAccentOnVisible } from '@/features/log/useAccent';

const socials = [
  { label: 'GitHub', href: profile.links.github, Icon: Github },
  { label: 'LinkedIn', href: profile.links.linkedin, Icon: Linkedin },
  { label: 'Blog', href: profile.links.blog, Icon: Pen },
  { label: 'Email', href: profile.links.email, Icon: Mail },
];

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  useAccentOnVisible(ref, DEFAULT_ACCENT);

  return (
    <section
      ref={ref}
      id="contact"
      aria-labelledby="contact-title"
      className="snap-chapter relative flex min-h-[100svh] flex-col justify-center px-5 pb-32 pt-24 md:px-12"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">Contact</p>
      <h2 id="contact-title" className="mt-2 font-display text-[clamp(3rem,15vw,9rem)] italic leading-[0.92]">
        Next ship?
      </h2>
      <p className="mt-4 max-w-md text-lg text-paper/80">
        Hiring, collaborating, or just curious what I’m building next. Say hi.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Magnetic>
          <a className="btn-accent" href={profile.links.email}>
            <Mail className="h-4 w-4" aria-hidden="true" /> Email me
          </a>
        </Magnetic>
        <a className="btn-ghost" href={profile.links.resume} download>
          <Download className="h-4 w-4" aria-hidden="true" /> Resume
        </a>
      </div>

      <ul className="mt-8 flex gap-3" aria-label="Social links">
        {socials.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              aria-label={label}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/15 text-paper/80 transition-colors hover:border-[var(--accent)] hover:text-paper"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-16 font-mono text-[11px] tracking-wider text-mute">Built by Dhiraj · 2026</p>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Dock.tsx src/features/about src/features/contact
git commit -m "feat: dock, about, and contact chapters

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: App assembly, remove legacy code and three.js, docs

**Files:**
- Modify (replace entirely): `src/App.tsx`, `vite.config.ts` (drop `three` chunk), `README.md`, `DEPLOY.md` (add "Adding a project")
- Delete: `src/components/About.tsx`, `Contact.tsx`, `CosmicLoader.tsx`, `Hero.tsx`, `HeroCanvas.tsx`, `Projects.tsx`, `SmoothScroll.tsx`, `src/components/ui/` (Magnetic.tsx, Reveal.tsx, Section.tsx)
- Uninstall: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Dock } from '@/components/Dock';
import { Loader } from '@/components/Loader';
import { projects } from '@/data/projects';
import { About } from '@/features/about/About';
import { Contact } from '@/features/contact/Contact';
import { Hero } from '@/features/hero/Hero';
import { Chapter } from '@/features/log/Chapter';
import { LabRow } from '@/features/log/LabRow';
import { buildSections, shipNumbers, sortProjects, splitTiers, type Project } from '@/features/log/model';
import { initScroll, ScrollTrigger } from '@/lib/scroll';

const DetailSheet = lazy(() => import('@/features/log/DetailSheet'));

// Derived once at module level: stable references, single source of truth
const ordered = sortProjects(projects);
const sections = buildSections(ordered);
const numbers = shipNumbers(ordered);
const { flagships, labs } = splitTiers(ordered);

export default function App() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<Project | null>(null);
  const [sheetMounted, setSheetMounted] = useState(false);

  const openProject = useCallback((p: Project) => {
    setSheetMounted(true);
    setOpen(p);
  }, []);
  const onLoaderDone = useCallback(() => setReady(true), []);
  const closeSheet = useCallback(() => setOpen(null), []);

  useEffect(() => initScroll(), []);

  useEffect(() => {
    document.documentElement.style.overflow = ready ? '' : 'hidden';
  }, [ready]);

  useEffect(() => {
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      <Loader onDone={onLoaderDone} />
      <div className="grain" aria-hidden="true" />

      <main id="main">
        <Hero start={ready} latest={ordered[0]} />
        {flagships.map((p) => (
          <Chapter key={p.slug} project={p} number={numbers.get(p.slug) ?? 0} onOpen={openProject} />
        ))}
        {labs.length > 0 && <LabRow labs={labs} numbers={numbers} onOpen={openProject} />}
        <About projects={ordered} />
        <Contact />
      </main>

      {ready && <Dock sections={sections} />}
      <Suspense fallback={null}>{sheetMounted && <DetailSheet project={open} onClose={closeSheet} />}</Suspense>
    </>
  );
}
```

`DetailSheet` stays mounted after the first open so `AnimatePresence` can play its exit animation.

- [ ] **Step 2: Delete legacy components, drop three.js**

```bash
git rm src/components/About.tsx src/components/Contact.tsx src/components/CosmicLoader.tsx src/components/Hero.tsx src/components/HeroCanvas.tsx src/components/Projects.tsx src/components/SmoothScroll.tsx src/components/ui/Magnetic.tsx src/components/ui/Reveal.tsx src/components/ui/Section.tsx
npm uninstall three @react-three/fiber @react-three/drei @types/three
```

In `vite.config.ts` replace the `manualChunks` block with `manualChunks: { motion: ['framer-motion'] },`.

- [ ] **Step 3: Type-check and build**

Run: `npm test && npx tsc -b && npm run build`
Expected: tests pass; no TypeScript errors; build succeeds. Fix any `noUnusedLocals`/`noUncheckedIndexedAccess` errors at their source (do not loosen tsconfig). `src/lib/cn.ts` and `src/vite-env.d.ts` may remain; delete `cn.ts` (and `clsx`/`tailwind-merge`) only if nothing imports it.

- [ ] **Step 4: Check the bundle budget**

Run:
```bash
for f in dist/assets/index-*.js; do echo "$f $(gzip -c "$f" | wc -c) bytes gzip"; done
```
Expected: the entry chunk is ≤ 150 KB gzip. If over, first confirm `InkField` and `DetailSheet` are separate chunks (`ls dist/assets`), then check `lucide-react` is importing individual icons (it is, via named imports).

- [ ] **Step 5: Rewrite `README.md`**

```markdown
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
```

- [ ] **Step 6: Commit**

```bash
git add -A src README.md vite.config.ts package.json package-lock.json
git commit -m "feat: assemble Ship Log site, remove legacy 3D code and components

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Browser verification and fixes

**Files:**
- Modify only as needed to fix defects found. No new features.

**Interfaces:**
- Consumes: the running app.

- [ ] **Step 1: Start the dev server**

Run in the background: `npm run dev` (note the printed local URL, normally `http://localhost:5173`).

- [ ] **Step 2: Load the Claude-in-Chrome tools and open a fresh tab**

Use `ToolSearch` with `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__resize_window`, call `tabs_context_mcp`, then open the dev URL in a **new** tab.

- [ ] **Step 3: Mobile check at 390×844**

Resize to 390×844 and verify, with screenshots:
  - Loader plays then fades; reload in the same session skips it.
  - Hero: particles form "Dhiraj / Salian" (two lines); pointer-drag disturbs and re-forms them.
  - Scrolling shows one chapter per flagship, newest first, page color shifts per chapter; ghost number parallaxes.
  - Lab row swipes horizontally; hover/focus on a card tints the page.
  - "Details" opens the bottom sheet; drag handle down or press Esc closes it; page scroll is locked while open.
  - Bottom dock: active dot stretches; tapping a dot jumps to that chapter; Contact pill works.
  - Console: `read_console_messages` shows no errors.

- [ ] **Step 4: Overflow check at 320 px (Review Focus #5)**

Resize to 320×640, then run via `javascript_tool`:
```js
({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })
```
Expected: `sw <= iw` (no horizontal page scroll). Fix any overflow (long names must wrap via `[overflow-wrap:anywhere]`).

- [ ] **Step 5: Desktop check at 1440×900**

Verify the side rail replaces the bottom dock, the hero name is on one line, chapters show the motif on the right, magnetic CTAs respond, and the console is clean.

- [ ] **Step 6: Resize re-sample check**

Drag the window from 1440 to 390 wide (or `resize_window`) and confirm the hero re-forms the name (one line → two lines) without a blank canvas.

- [ ] **Step 7: Reduced-motion check**

In Chrome DevTools-equivalent (or `javascript_tool` cannot toggle media): emulate `prefers-reduced-motion: reduce` if the browser tool supports it; otherwise state in the report that it was verified by code inspection only (`useReducedMotion` gates InkField, Loader, Chapter animations, Lenis, counters). Confirm the hero shows the visible `h1` and a static gradient.

- [ ] **Step 8: Extensibility check**

Temporarily prepend a dummy entry to `src/data/projects.ts` (`slug: 'dummy'`, `tier: 'flagship'`, `accent: '#00ff88'`, short strings). Confirm a new chapter, dock dot and theme appear with no other edits. Then revert: `git checkout -- src/data/projects.ts`.

- [ ] **Step 8b: Verify the reverted file is clean**

Run: `git status --short src/data/projects.ts`
Expected: no output.

- [ ] **Step 9: Production build smoke test**

Run: `npm run build && npm run preview` and load the preview URL once; confirm no console errors and that `/CNAME`, `/robots.txt`, `/sitemap.xml`, `/resume.pdf` are served (`curl -sI <preview>/robots.txt`).

- [ ] **Step 10: Commit any fixes and report**

```bash
git add -A src
git commit -m "fix: issues found during browser verification

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Skip the commit if nothing changed. Report: what was checked, bundle size, anything verified only by inspection, and the two assumptions to confirm with the owner (rydd.club listed newest; Flutter leftovers still on disk, gitignored).

---

## Self-Review Notes

- **Spec coverage:** hero ink field (Task 6), data-driven chapters + theme shifts (Tasks 3, 5, 7), flagship/lab tiers (Task 7), About with counters/timeline (Task 8), Contact (Task 8), dock rail (Task 8), loader (Task 5), gestures/bottom sheet (Task 7), reduced motion and adaptive particles (Tasks 5–7), performance budget (Task 9 step 4), housekeeping and docs (Tasks 1, 4, 9), verification incl. extensibility (Tasks 3, 10).
- **Deliberately deferred by the spec amendment:** the date field (order is array order) and Flutter deletion (gitignored; delete only with owner OK).
- **Type consistency:** `Project`, `Section`, `chapterId`, `shipNumbers`, `splitTiers`, `buildSections`, `pickVisual`, `Particle`, `Pointer`, `Mode`, `Vec`, `tiltToGravity`, `applyAccent`, `useAccentOnVisible`, `scrollToId` are defined once and used with identical signatures.
