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
