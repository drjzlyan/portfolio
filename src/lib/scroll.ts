import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** One Lenis instance driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function initScroll(): () => void {
  if (prefersReducedMotion()) return () => {};
  const instance = new Lenis({ autoRaf: false, lerp: 0.1 });
  lenis = instance;
  instance.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    instance.destroy();
    if (lenis === instance) lenis = null;
  };
}

export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.2 });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export const pauseScroll = () => lenis?.stop();
export const resumeScroll = () => lenis?.start();

export { gsap, ScrollTrigger };
