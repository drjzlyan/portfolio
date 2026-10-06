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
