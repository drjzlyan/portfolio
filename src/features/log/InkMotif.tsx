import { useEffect, useMemo, useRef } from 'react';
import { blobPath, mulberry32, seedFromString } from '@/lib/rand';
import { gsap } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';

export interface VisualProps {
  slug: string;
  className?: string;
}

/** Generated fallback visual: three seeded, slowly rotating blobs in the page accent. */
export function InkMotif({ slug, className }: VisualProps) {
  const ref = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const paths = useMemo(() => {
    const rand = mulberry32(seedFromString(slug));
    return [0, 1, 2].map((i) => blobPath(rand, 200, 150, 120 - i * 32, 9, 0.28));
  }, [slug]);

  useEffect(() => {
    if (reduced) return;
    let tween: gsap.core.Tween | undefined;
    const ctx = gsap.context(() => {
      tween = gsap.to('.blob', {
        rotation: (i: number) => (i % 2 ? -360 : 360),
        svgOrigin: '200 150',
        duration: (i: number) => 38 + i * 14,
        repeat: -1,
        ease: 'none',
      });
    }, ref);
    // Only animate while on screen
    const io = new IntersectionObserver(([entry]) => tween?.paused(!entry?.isIntersecting));
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [reduced]);

  return (
    <svg ref={ref} viewBox="0 0 400 300" aria-hidden="true" className={className}>
      {paths.map((d, i) => (
        <path
          key={i}
          className="blob"
          d={d}
          style={{ fill: 'var(--accent)', stroke: 'var(--accent)' }}
          fillOpacity={0.1 + i * 0.09}
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
