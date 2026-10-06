import { describe, expect, it } from 'vitest';
import { hexToRgb } from '@/lib/color';
import { projects } from './projects';

describe('projects data', () => {
  it('has unique slugs (ids, ship numbers and keys depend on them)', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it('has a valid accent colour on every project (fails at test time, not at scroll time)', () => {
    for (const p of projects) expect(() => hexToRgb(p.accent), p.slug).not.toThrow();
  });
  it('has valid https urls', () => {
    for (const p of projects) expect(new URL(p.url).protocol, p.slug).toBe('https:');
  });
});
