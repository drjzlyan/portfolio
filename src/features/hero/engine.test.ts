import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@/lib/rand';
import {
  assignTargets,
  burst,
  createParticles,
  particleCount,
  step,
  tiltToGravity,
  type Vec,
} from './engine';

const bounds = { w: 400, h: 400 };

describe('particleCount', () => {
  it('uses 1500 on coarse pointers and narrow viewports', () => {
    expect(particleCount(390, true)).toBe(1500);
    expect(particleCount(500, false)).toBe(1500);
    expect(particleCount(0, false)).toBe(1500);
  });
  it('uses 4000 on wide fine-pointer viewports', () => {
    expect(particleCount(1440, false)).toBe(4000);
  });
});

describe('form mode', () => {
  it('converges particles onto their targets', () => {
    const rand = mulberry32(1);
    const ps = createParticles(200, bounds.w, bounds.h, rand);
    const pts: Vec[] = Array.from({ length: 50 }, (_, i) => ({ x: 100 + (i % 10) * 10, y: 100 + Math.floor(i / 10) * 10 }));
    assignTargets(ps, pts, rand);
    for (let i = 0; i < 400; i++) step(ps, 'form', i / 60, 1 / 60, null, bounds);
    const mean = ps.reduce((s, p) => s + Math.hypot(p.tx - p.x, p.ty - p.y), 0) / ps.length;
    expect(mean).toBeLessThan(1);
  });
  it('leaves targets untouched when there are no sample points', () => {
    const ps = createParticles(5, bounds.w, bounds.h, mulberry32(2));
    const before = ps.map((p) => [p.tx, p.ty]);
    assignTargets(ps, [], mulberry32(2));
    expect(ps.map((p) => [p.tx, p.ty])).toEqual(before);
  });
});

describe('flow mode', () => {
  it('wraps particles that leave the bounds', () => {
    const ps = createParticles(1, bounds.w, bounds.h, mulberry32(3));
    ps[0]!.x = -1;
    ps[0]!.y = 10;
    ps[0]!.vx = 0;
    ps[0]!.vy = 0;
    step(ps, 'flow', 0, 1 / 60, null, bounds);
    expect(ps[0]!.x).toBeGreaterThan(bounds.w / 2);
  });
});

describe('pointer repulsion', () => {
  it('pushes a nearby particle away from an active pointer', () => {
    const ps = createParticles(1, bounds.w, bounds.h, mulberry32(4));
    Object.assign(ps[0]!, { x: 210, y: 210, vx: 0, vy: 0, tx: 210, ty: 210 });
    step(ps, 'form', 0, 1 / 60, { x: 200, y: 200, active: true }, bounds);
    expect(ps[0]!.vx).toBeGreaterThan(0);
    expect(ps[0]!.vy).toBeGreaterThan(0);
  });
  it('ignores an inactive pointer', () => {
    const ps = createParticles(1, bounds.w, bounds.h, mulberry32(4));
    Object.assign(ps[0]!, { x: 210, y: 210, vx: 0, vy: 0, tx: 210, ty: 210 });
    step(ps, 'form', 0, 1 / 60, { x: 200, y: 200, active: false }, bounds);
    expect(ps[0]!.vx).toBe(0);
  });
});

describe('burst', () => {
  it('imparts outward velocity from the origin', () => {
    const ps = createParticles(1, bounds.w, bounds.h, mulberry32(5));
    Object.assign(ps[0]!, { x: 300, y: 200, vx: 0, vy: 0 });
    burst(ps, { x: 200, y: 200 }, 10, () => 0.5);
    expect(ps[0]!.vx).toBeGreaterThan(0);
  });
});

describe('tiltToGravity', () => {
  it('returns zero gravity when orientation data is missing', () => {
    expect(tiltToGravity(null, null)).toEqual({ x: 0, y: 0 });
    expect(tiltToGravity(undefined, undefined)).toEqual({ x: 0, y: 0 });
  });
  it('clamps each axis to [-1, 1]', () => {
    expect(tiltToGravity(90, 180)).toEqual({ x: 1, y: 1 });
    expect(tiltToGravity(-90, -90)).toEqual({ x: -1, y: -1 });
  });
  it('treats a phone held at ~45deg beta as neutral', () => {
    expect(tiltToGravity(0, 45).y).toBeCloseTo(0);
  });
});
