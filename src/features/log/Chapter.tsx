import { useEffect, useRef } from 'react';
import { Magnetic } from '@/components/Magnetic';
import { CountUp } from '@/components/CountUp';
import { gsap } from '@/lib/scroll';
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
        <CountUp to={number} pad={2} />
      </span>

      <Visual
        slug={project.slug}
        className="pointer-events-none absolute inset-x-0 top-[10svh] mx-auto h-[40svh] w-[90vw] max-w-xl opacity-90 md:left-auto md:right-12 md:top-[14svh] md:mx-0 md:h-[60svh] md:w-[44vw] md:max-w-none"
      />

      <div className="relative z-10 max-w-3xl">
        <div className="fade-up mb-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-widest text-mute">No. <CountUp to={number} pad={2} /></span>
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

        <p className="fade-up mt-4 max-w-xl text-lg text-paper/85 md:text-xl [overflow-wrap:anywhere]">{project.tagline}</p>

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
            <a className="btn-accent max-w-full text-center [overflow-wrap:anywhere]" href={project.url} target="_blank" rel="noopener noreferrer">
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
