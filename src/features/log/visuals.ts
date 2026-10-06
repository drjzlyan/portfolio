import type { ComponentType } from 'react';
import { pickVisual } from './model';
import { InkMotif, type VisualProps } from './InkMotif';

export type { VisualProps };

/** Register bespoke mini-visuals here by key, then set `visual: 'key'` on a project. */
export const visuals: Record<string, ComponentType<VisualProps>> = {};

export function resolveVisual(key?: string): ComponentType<VisualProps> {
  return pickVisual(key, visuals, InkMotif);
}
