# The Ship Log — Portfolio Redesign Spec

Date: 2026-10-06 · Site: https://drjzlyan.com · Blog: https://blogs.drjzlyan.com

## 1. Intent

A portfolio for **hiring managers and the indie/founder crowd**. It must feel unlike any
other developer site, and the creativity must prove craft rather than hide the work.
Mobile-first, animation-rich, performant.

**Success criteria**
- A recruiter understands who Dhiraj is and what he ships within 10 seconds on a phone.
- A designer/engineer finds a screenshot-worthy "wow" moment (the ink hero + theme-shifting chapters).
- Every important link (projects, resume, email, GitHub, LinkedIn, blog) is one thumb-tap away.
- Adding a future product is a **single data entry** with no layout code changes.
- 60fps on a mid-range phone; honors `prefers-reduced-motion`.

**Constraints / decisions made**
- Stays in this repo on Vite + React 18 + TypeScript + Tailwind; deploys to GitHub Pages at `drjzlyan.com`.
- **Product-agnostic.** No layout or copy code names a specific product. Inspyry and rydd.club are ordinary data entries (flagships).
- Brick Breaker is **not shown** (already removed from `projects.ts`).
- Concept chosen: **A — "The Ship Log"** (over Kinetic Editorial and Playground).

## 2. Concept

The site is a living log of things shipped. Scrolling moves through entries; each entry takes
over the whole screen and re-themes the page.

### Chapters (top to bottom)
1. **Hero — "Signal".** Full-screen 2D-canvas ink/particle field. Idles as a slow flow field;
   follows touch/mouse and phone tilt; resolves into "Dhiraj Salian" + one-line role. Tap/flick
   scatters and re-forms it. Long-press "explodes" it. Bottom: scroll cue + "latest ship" teaser.
2. **The Log (core).** One `100svh` chapter per project, newest first. Each chapter has its own
   accent and background mood; the page crossfades to it on entry. Shows big index number
   (`04`), name, tagline, status chips (Live / Building / Open source), stack line, primary CTA.
   - **Flagship tier:** full takeover, optional mini-visual.
   - **Lab tier:** compact cards in one swipeable chapter so side projects don't bloat the scroll.
3. **About — "The Maker".** Short punchy bio from real resume content (8+ years backend/distributed
   systems, Omnissa/VMware EUC, indie products), counter strip, drag-to-reveal role timeline.
4. **Contact — "Next ship?".** Large tap-friendly CTA; email, resume download, GitHub, LinkedIn,
   blog. "Built by Dhiraj" footer.

## 3. Interaction & Animation

**Mobile-first rules**
- Design at 390px, enhance upward. Chapters `100svh` with scroll-snap **proximity** (never mandatory).
- Content in the lower two-thirds (thumb reach).
- Bottom dock: chapter dot rail (tap to jump; active dot stretches) + Contact button. Desktop: slim side rail.
- Gestures: horizontal swipe on Lab row; "details" opens a draggable bottom sheet; long-press hero explodes ink.

**Scroll driver:** one Lenis + GSAP ScrollTrigger instance feeds all effects.

| Moment | Effect |
|---|---|
| Hero | Flow-field particles follow touch/mouse/`deviceorientation`, resolve into the name; tap scatters, then re-forms |
| Chapter entry | Page theme crossfades via CSS variables (`--accent`, `--bg`); index number counts up; title reveals line-by-line (clip-path mask) |
| Between chapters | Accent-colored SVG-mask "ink wipe"; scroll-linked parallax number behind content |
| Cards/buttons | Magnetic CTAs (desktop), press-scale feedback (touch); custom cursor desktop-only |
| Loader | Ink-drop intro < 1.2s, skippable, once per session |

**Accessibility & safety**
- `prefers-reduced-motion`: particles → static gradient; transitions → simple fades.
- Keyboard-navigable; real headings and landmarks; content readable without the canvas.
- Adaptive particles: ~1.5k mobile / ~4k desktop; auto-reduce on FPS dip; canvas pauses off-screen (IntersectionObserver).
- iOS tilt permission requested only after a user tap.

## 4. Architecture

**Stack:** keep Vite, React 18, TypeScript, Tailwind, GSAP + ScrollTrigger, Lenis; framer-motion only for the bottom sheet.
**Remove:** `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` (heavy, replaced by plain 2D canvas).

```
src/
  data/projects.ts      source of truth for the Log
  data/profile.ts       bio, counters, role timeline, links
  features/hero/        InkField (canvas), particle engine, name→points sampler
  features/log/         Chapter, LabRow, ChapterTheme, DetailSheet
  features/about/  features/contact/
  components/           Dock, Magnetic, Reveal, Loader
  lib/                  scroll.ts (Lenis+GSAP), theme.ts, useReducedMotion
```

**Project model**
```ts
type Project = {
  slug: string; name: string; tagline: string; description: string;
  status: 'live' | 'building' | 'open-source';
  tier: 'flagship' | 'lab';
  accent: string;            // hex (#rgb or #rrggbb); drives theme variables
  url: string;
  links?: { label: string; href: string }[];
  stack: string[];
  visual?: string;           // key of a registered mini-animation; fallback = generated ink motif in accent
};
```
Array order **is** the order (newest first; no date field). Ship numbers count up from the oldest, so a newly added project gets the highest number. Chapters, nav rail and theme shifts are all **derived** from this array.
Layout code must not reference any product by name.

**Initial data:** Inspyry (flagship, live), rydd.club (flagship, live), and Lab: buffer-api-skill,
openclaw-nvidia-speech, inspyry-vector-generator-skill. Taglines/descriptions are taken from the
current site copy and the products' own sites (Inspyry: "Type an idea. Get a cut-ready SVG." /
rydd: "plan a group ride, share one link, see everyone live").

## 5. Performance budget
- Initial JS ≤ 150 KB gzip; hero canvas code-split.
- LCP < 2 s on 4G; 60 fps on mid-range phones.
- Self-hosted, subsetted fonts; optimized profile image.

## 6. Housekeeping
- Domain: `drjzlyan.com` in `public/CNAME`, `index.html` canonical/OG/Twitter, `DEPLOY.md` (done); add sitemap/robots on the new domain. Blog links use `blogs.drjzlyan.com` (done).
- Gitignore the untracked Flutter leftovers (`lib/`, `build/`, `.dart_tool`, `.flutter-plugins*`, `.packages`). They are untracked, so they are deleted only with the owner's explicit OK.
- Update README and DEPLOY.md to describe the new architecture and "how to add a project".

## 7. Verification
- `tsc -b` and production build pass; bundle size within budget.
- Chrome checks at 390px and 1440px: layout, console clean, scroll/snap behavior, dock, bottom sheet, reduced-motion path.
- Adding a dummy `projects.ts` entry (covered by a unit test on the derivation functions) produces a new chapter, nav dot and theme with **no other edits**.

## 8. Out of scope (YAGNI)
CMS, blog engine (stays at blogs.drjzlyan.com), contact form, analytics.

## 9. Open items
- The role timeline uses only facts already on the current site (Omnissa, indie products, OpenClaw). Earlier roles can be added by the owner later in `src/data/profile.ts`.
- Whether `brick-breaker` subdomain is retired entirely (assumed: just hidden from the site).
