import { lazy, Suspense, useRef } from 'react';
import { profile } from '@/data/profile';
import { DEFAULT_ACCENT, sectionIdFor, type Project } from '@/features/log/model';
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
          <InkField start={start} name={profile.name} />
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

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-28 right-6 z-10 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mute md:bottom-16 md:right-12"
      >
        <span style={{ writingMode: 'vertical-rl' }}>Scroll</span>
        <span className="relative h-14 w-px overflow-hidden bg-white/15">
          <span className="cue-dot absolute left-0 top-0 h-4 w-px bg-accent" />
        </span>
      </div>

      <div className="pointer-events-none relative z-10 max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
          {profile.role} · {profile.location}
        </p>
        <p className="mt-3 text-lg text-paper/85 md:text-xl">{profile.headline}</p>
        {latest && (
          <button
            type="button"
            onClick={() => scrollToId(sectionIdFor(latest))}
            className="pointer-events-auto btn-ghost mt-6 max-w-full text-left [overflow-wrap:anywhere]"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Latest ship: {latest.name} ↓
          </button>
        )}
      </div>
    </section>
  );
}
