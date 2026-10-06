import { useEffect, useRef } from 'react';
import {
  assignTargets,
  burst,
  createParticles,
  movedBeyond,
  nameLines,
  particleCount,
  shouldResample,
  step,
  tiltToGravity,
  type Mode,
  type Particle,
  type Pointer,
  type Vec,
} from './engine';
import { sampleTextPoints } from './sampleText';

interface DeviceOrientationCtor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export default function InkField({ start, name }: { start: boolean; name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!start) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let mode: Mode = 'flow';
    const pointer: Pointer = { x: 0, y: 0, active: false };
    let gravity: Vec = { x: 0, y: 0 };
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let disposed = false;
    let slowFrames = 0;
    let frame = 0;
    let color = 'rgb(255 93 58)';
    let formTimer = 0;
    let pressTimer = 0;
    let resizeTimer = 0;
    let tiltAsked = false;
    let downAt: Vec = { x: 0, y: 0 };
    let measured: { w: number; h: number } | null = null;
    let generation = 0;

    const toForm = (ms: number) => {
      window.clearTimeout(formTimer);
      formTimer = window.setTimeout(() => {
        mode = 'form';
      }, ms);
    };

    const setup = async () => {
      const rect = canvas.getBoundingClientRect();
      const next = { w: Math.round(rect.width), h: Math.round(rect.height) };
      if (next.w === 0 || next.h === 0) return;
      if (!shouldResample(measured, next)) return;
      measured = next;
      w = next.w;
      h = next.h;
      const mine = ++generation;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(particleCount(w, coarse), w, h);
      mode = 'flow';
      const lines = nameLines(name, w < 640);
      const pts = await sampleTextPoints(lines, w, h);
      if (disposed || mine !== generation) return;
      assignTargets(particles, pts);
      toForm(700);
    };

    const loop = (now: number) => {
      raf = 0;
      if (disposed || !visible) return;
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      const workStart = performance.now();
      step(particles, mode, now / 1000, dt, pointer, { w, h }, gravity);

      if (frame++ % 10 === 0) {
        color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || color;
      }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
      for (const p of particles) ctx.fillRect(p.x, p.y, 1.7, 1.7);

      // Adapt on real work time (not rAF interval): 30Hz battery-saver displays are not "slow".
      if (performance.now() - workStart > 12) {
        slowFrames++;
        if (slowFrames > 30 && particles.length > 600) {
          particles.length = Math.max(600, Math.floor(particles.length * 0.7));
          slowFrames = 0;
        }
      } else {
        slowFrames = Math.max(0, slowFrames - 1);
      }
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && visible && !disposed) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const local = (e: PointerEvent): Vec => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onTilt = (e: DeviceOrientationEvent) => {
      gravity = tiltToGravity(e.gamma, e.beta);
    };
    const enableTilt = async () => {
      if (tiltAsked || !coarse) return;
      const D = (window as unknown as { DeviceOrientationEvent?: DeviceOrientationCtor }).DeviceOrientationEvent;
      if (!D) return;
      try {
        if (typeof D.requestPermission === 'function') {
          const answer = await D.requestPermission();
          tiltAsked = true; // a definite answer: don't ask again this session
          if (answer !== 'granted') return;
        } else {
          tiltAsked = true;
        }
        window.addEventListener('deviceorientation', onTilt);
      } catch {
        /* permission denied or unsupported: stay at zero gravity */
      }
    };

    const onDown = (e: PointerEvent) => {
      const p = local(e);
      Object.assign(pointer, p, { active: true });
      downAt = p;
      burst(particles, p, 6);
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(() => {
        mode = 'flow';
        burst(particles, p, 16);
        toForm(1800);
      }, 450);
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (movedBeyond(downAt, p, 8)) window.clearTimeout(pressTimer);
      if (e.pointerType === 'mouse') pointer.active = true;
    };
    const onUp = () => {
      pointer.active = false;
      window.clearTimeout(pressTimer);
    };
    // iOS only treats touchend/click (not pointerdown) as a permission-granting user activation
    const onTap = () => void enableTilt();

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('click', onTap);

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => void setup().then(kick), 250);
    };
    window.addEventListener('resize', onResize);

    void setup().then(kick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(formTimer);
      window.clearTimeout(pressTimer);
      window.clearTimeout(resizeTimer);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('deviceorientation', onTilt);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('click', onTap);
    };
  }, [start, name]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full touch-pan-y" />;
}
