import { describe, expect, it } from 'vitest';
import { blobPath, mulberry32, seedFromString } from './rand';

describe('seedFromString', () => {
  it('is deterministic and differs between inputs', () => {
    expect(seedFromString('abc')).toBe(seedFromString('abc'));
    expect(seedFromString('abc')).not.toBe(seedFromString('abd'));
  });
});

describe('mulberry32', () => {
  it('yields the same sequence for the same seed, in [0,1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('blobPath', () => {
  it('returns a deterministic closed path with one Q per point', () => {
    const p1 = blobPath(mulberry32(7), 200, 150, 100, 8, 0.25);
    const p2 = blobPath(mulberry32(7), 200, 150, 100, 8, 0.25);
    expect(p1).toBe(p2);
    expect(p1.startsWith('M')).toBe(true);
    expect(p1.endsWith('Z')).toBe(true);
    expect((p1.match(/Q/g) ?? []).length).toBe(8);
  });
});
