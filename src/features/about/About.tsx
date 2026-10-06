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
