import { themeVars } from './color';

export function applyAccent(accent: string): void {
  const vars = themeVars(accent);
  document.documentElement.style.setProperty('--accent', vars['--accent']);
}
