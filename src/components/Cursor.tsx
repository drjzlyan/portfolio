import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/scroll';
import { prefersReducedMotion } from '@/lib/useReducedMotion';

/** Accent ring that trails the mouse; mouse + motion-OK devices only. The native cursor stays. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const x = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' });
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x(e.clientX);
      y(e.clientY);
      el.style.opacity = '1';
      el.dataset.hot = (e.target as Element | null)?.closest('a,button') ? '1' : '0';
    };
    const leave = () => {
      el.style.opacity = '0';
    };
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[300] opacity-0">
      <span className="cursor-dot -ml-3 -mt-3 block h-6 w-6 rounded-full border" />
    </div>
  );
}
