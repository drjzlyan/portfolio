import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ACCENT,
  buildSections,
  chapterId,
  pickVisual,
  shipNumbers,
  sortProjects,
  splitTiers,
  type Project,
} from './model';

const make = (slug: string, tier: Project['tier'], accent = '#112233'): Project => ({
  slug,
  name: slug,
  tagline: `${slug} tagline`,
  description: `${slug} description`,
  status: 'live',
  tier,
  accent,
  url: `https://example.com/${slug}`,
  stack: [],
});

describe('sortProjects', () => {
  it('keeps array order and returns a copy', () => {
    const input = [make('a', 'flagship'), make('b', 'lab')];
    const out = sortProjects(input);
    expect(out.map((p) => p.slug)).toEqual(['a', 'b']);
    expect(out).not.toBe(input);
  });
});

describe('shipNumbers', () => {
  it('numbers the newest (first) highest', () => {
    const n = shipNumbers([make('new', 'flagship'), make('mid', 'lab'), make('old', 'lab')]);
    expect(n.get('new')).toBe(3);
    expect(n.get('old')).toBe(1);
  });
  it('gives a newly prepended project the highest number', () => {
    const base = [make('a', 'flagship'), make('b', 'lab')];
    const n = shipNumbers([make('fresh', 'flagship'), ...base]);
    expect(n.get('fresh')).toBe(3);
    expect(n.get('a')).toBe(2);
  });
});

describe('splitTiers', () => {
  it('splits by tier preserving order', () => {
    const { flagships, labs } = splitTiers([
      make('a', 'flagship'),
      make('b', 'lab'),
      make('c', 'flagship'),
    ]);
    expect(flagships.map((p) => p.slug)).toEqual(['a', 'c']);
    expect(labs.map((p) => p.slug)).toEqual(['b']);
  });
});

describe('buildSections', () => {
  it('derives hero, one chapter per flagship, one lab chapter, about, contact', () => {
    const s = buildSections([make('a', 'flagship', '#111'), make('b', 'lab', '#222'), make('c', 'lab')]);
    expect(s.map((x) => x.id)).toEqual(['hero', chapterId('a'), 'lab', 'about', 'contact']);
    expect(s.find((x) => x.id === 'lab')?.accent).toBe('#222');
    expect(s[0]?.accent).toBe(DEFAULT_ACCENT);
  });
  it('handles an empty list without dead chapters', () => {
    expect(buildSections([]).map((x) => x.id)).toEqual(['hero', 'about', 'contact']);
  });
  it('omits the lab chapter when there are only flagships', () => {
    expect(buildSections([make('a', 'flagship')]).map((x) => x.id)).toEqual([
      'hero',
      chapterId('a'),
      'about',
      'contact',
    ]);
  });
  it('includes a lab chapter when there are only labs', () => {
    expect(buildSections([make('b', 'lab')]).map((x) => x.id)).toEqual(['hero', 'lab', 'about', 'contact']);
  });
  it('adding one entry adds exactly one chapter and nothing else', () => {
    const before = buildSections([make('a', 'flagship')]);
    const after = buildSections([make('z', 'flagship'), make('a', 'flagship')]);
    expect(after.length).toBe(before.length + 1);
  });
});

describe('pickVisual', () => {
  const fallback = 'fallback';
  it('returns the registered visual', () => {
    expect(pickVisual('x', { x: 'X' }, fallback)).toBe('X');
  });
  it('falls back for undefined and unknown keys', () => {
    expect(pickVisual(undefined, { x: 'X' }, fallback)).toBe(fallback);
    expect(pickVisual('nope', { x: 'X' }, fallback)).toBe(fallback);
  });
});
