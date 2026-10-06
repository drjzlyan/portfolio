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
      <ul className="flex min-w-0 items-center gap-1 overflow-x-auto md:max-h-[70svh] md:flex-col md:overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
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
