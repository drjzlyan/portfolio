export type Status = 'live' | 'building' | 'open-source';
export type Tier = 'flagship' | 'lab';

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: Status;
  tier: Tier;
  /** #rgb or #rrggbb; drives the page theme while this chapter is on screen */
  accent: string;
  url: string;
  links?: ProjectLink[];
  stack: string[];
  /** Key of a registered mini-visual; unknown/absent falls back to the ink motif */
  visual?: string;
}

export const DEFAULT_ACCENT = '#ff5d3a';

/** Array order IS the order (newest first). Returns a copy. */
export function sortProjects(list: readonly Project[]): Project[] {
  return [...list];
}

/** Oldest = 1, newest (index 0) = list.length. */
export function shipNumbers(list: readonly Project[]): Map<string, number> {
  const map = new Map<string, number>();
  list.forEach((p, i) => map.set(p.slug, list.length - i));
  return map;
}

export function splitTiers(list: readonly Project[]): { flagships: Project[]; labs: Project[] } {
  return {
    flagships: list.filter((p) => p.tier === 'flagship'),
    labs: list.filter((p) => p.tier === 'lab'),
  };
}

export type SectionKind = 'hero' | 'flagship' | 'lab' | 'about' | 'contact';

export interface Section {
  id: string;
  label: string;
  kind: SectionKind;
  accent: string;
}

export const chapterId = (slug: string) => `p-${slug}`;

export function buildSections(list: readonly Project[]): Section[] {
  const { flagships, labs } = splitTiers(list);
  const sections: Section[] = [{ id: 'hero', label: 'Intro', kind: 'hero', accent: DEFAULT_ACCENT }];
  for (const p of flagships) {
    sections.push({ id: chapterId(p.slug), label: p.name, kind: 'flagship', accent: p.accent });
  }
  if (labs.length > 0) {
    sections.push({ id: 'lab', label: 'Lab', kind: 'lab', accent: labs[0]!.accent });
  }
  sections.push({ id: 'about', label: 'About', kind: 'about', accent: DEFAULT_ACCENT });
  sections.push({ id: 'contact', label: 'Contact', kind: 'contact', accent: DEFAULT_ACCENT });
  return sections;
}

export function pickVisual<T>(key: string | undefined, registry: Record<string, T>, fallback: T): T {
  if (key && Object.prototype.hasOwnProperty.call(registry, key)) return registry[key] as T;
  return fallback;
}
