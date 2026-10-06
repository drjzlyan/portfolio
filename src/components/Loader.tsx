import { useCallback, useEffect, useRef } from 'react';
import { gsap } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';

const KEY = 'shiplog:intro';

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage unavailable: intro simply shows again next load */
  }
}

export function Loader({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const skip = reduced || alreadySeen();
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    markSeen();
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (skip) {
      finish();
      return;
    }
    const ctx = gsap.context(() => {
      gsap
        .timeline({ onComplete: finish })
        .fromTo('.drop', { scale: 0 }, { scale: 1, duration: 0.45, ease: 'power3.out' })
        .to('.drop', { scale: 70, duration: 0.55, ease: 'power3.in' }, '+=0.05')
        .to(root.current, { opacity: 0, duration: 0.2 }, '-=0.1');
    }, root);
    return () => ctx.revert();
  }, [skip, finish]);

  if (skip) return null;
  return (
    <div
      ref={root}
      onClick={finish}
      role="presentation"
      className="fixed inset-0 z-[100] grid place-items-center bg-ink-950"
    >
      <div className="drop h-6 w-6 rounded-full bg-accent" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
