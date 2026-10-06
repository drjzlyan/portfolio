import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface Props {
  to: number;
  pad?: number;
  suffix?: string;
  className?: string;
}

/** Counts from 0 to `to` once, when scrolled into view. Final value is shown immediately under reduced motion. */
export function CountUp({ to, pad = 0, suffix = '', className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [val, setVal] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced) {
      setVal(to);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: to,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => setVal(Math.round(obj.v)),
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [to, reduced]);

  return (
    <span ref={ref} className={className}>
      {String(val).padStart(pad, '0')}
      {suffix}
    </span>
  );
}
