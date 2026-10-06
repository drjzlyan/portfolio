export interface Vec {
  x: number;
  y: number;
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
}
export type Mode = 'flow' | 'form';
export interface Pointer extends Vec {
  active: boolean;
}

export function particleCount(viewportWidth: number, coarse: boolean): number {
  return coarse || viewportWidth < 768 ? 1500 : 4000;
}

export function createParticles(n: number, w: number, h: number, rand: () => number = Math.random): Particle[] {
  return Array.from({ length: n }, () => {
    const x = rand() * w;
    const y = rand() * h;
    return { x, y, vx: 0, vy: 0, tx: x, ty: y };
  });
}

export function assignTargets(ps: Particle[], pts: Vec[], rand: () => number = Math.random): void {
  if (pts.length === 0) return;
  for (const p of ps) {
    const t = pts[Math.floor(rand() * pts.length)]!;
    p.tx = t.x;
    p.ty = t.y;
  }
}

export function flowAngle(x: number, y: number, t: number): number {
  return Math.sin(x * 0.004 + t * 0.3) * Math.PI + Math.cos(y * 0.005 - t * 0.2) * Math.PI;
}

const POINTER_RADIUS = 120;

export function step(
  ps: Particle[],
  mode: Mode,
  t: number,
  dt: number,
  pointer: Pointer | null,
  bounds: { w: number; h: number },
  gravity: Vec = { x: 0, y: 0 },
): void {
  const k = Math.min(dt, 0.05) * 60;
  const damp = Math.pow(mode === 'form' ? 0.86 : 0.94, k);
  for (const p of ps) {
    let ax = 0;
    let ay = 0;
    if (mode === 'flow') {
      const a = flowAngle(p.x, p.y, t);
      ax = Math.cos(a) * 0.05 + gravity.x * 0.05;
      ay = Math.sin(a) * 0.05 + gravity.y * 0.05;
    } else {
      ax = (p.tx - p.x) * 0.02;
      ay = (p.ty - p.y) * 0.02;
    }
    if (pointer?.active) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < POINTER_RADIUS * POINTER_RADIUS && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const s = (1 - d / POINTER_RADIUS) * 1.2;
        ax += (dx / d) * s;
        ay += (dy / d) * s;
      }
    }
    p.vx = (p.vx + ax * k) * damp;
    p.vy = (p.vy + ay * k) * damp;
    p.x += p.vx * k;
    p.y += p.vy * k;
    if (mode === 'flow') {
      if (p.x < 0) p.x += bounds.w;
      else if (p.x > bounds.w) p.x -= bounds.w;
      if (p.y < 0) p.y += bounds.h;
      else if (p.y > bounds.h) p.y -= bounds.h;
    }
  }
}

export function burst(ps: Particle[], origin: Vec, strength: number, rand: () => number = Math.random): void {
  for (const p of ps) {
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    const d = Math.hypot(dx, dy) || 1;
    const s = strength * (0.5 + rand());
    p.vx += (dx / d) * s;
    p.vy += (dy / d) * s;
  }
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export function tiltToGravity(gamma: number | null | undefined, beta: number | null | undefined): Vec {
  return { x: clamp((gamma ?? 0) / 45), y: clamp(((beta ?? 45) - 45) / 45) };
}

const RESAMPLE_HEIGHT_DELTA = 120;

/** Mobile address bars change the viewport height by < ~100px; that must not replay the intro. */
export function shouldResample(
  prev: { w: number; h: number } | null,
  next: { w: number; h: number },
): boolean {
  if (!prev) return true;
  if (prev.w !== next.w) return true;
  return Math.abs(prev.h - next.h) >= RESAMPLE_HEIGHT_DELTA;
}
