import { themeVars } from './color';
import { gsap } from './scroll';
import { prefersReducedMotion } from './useReducedMotion';

let current: string | null = null;

/** Accent-coloured circle that sweeps up from the dock, then fades: the transition between chapters. */
function inkWipe(color: string): void {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = `position:fixed;inset:0;z-index:40;pointer-events:none;background:${color};opacity:.2;clip-path:circle(0% at 50% 100%)`;
  document.body.appendChild(el);
  gsap
    .timeline({ onComplete: () => el.remove() })
    .to(el, { clipPath: 'circle(150% at 50% 100%)', duration: 0.7, ease: 'power3.out' })
    .to(el, { opacity: 0, duration: 0.4 }, '-=0.2');
}

export function applyAccent(accent: string, opts: { wipe?: boolean } = {}): void {
  const { wipe = true } = opts;
  const value = themeVars(accent)['--accent'];
  document.documentElement.style.setProperty('--accent', value);
  if (wipe && current !== null && current !== accent && !prefersReducedMotion()) inkWipe(value);
  current = accent;
}
