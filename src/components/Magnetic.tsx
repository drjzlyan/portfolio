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
