import { describe, expect, it } from 'vitest';
import { hexToRgb, themeVars } from './color';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#7c5cff')).toEqual([124, 92, 255]);
  });
  it('parses 3-digit hex', () => {
    expect(hexToRgb('#abc')).toEqual([170, 187, 204]);
  });
  it('parses hex without a leading #', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });
  it('throws a clear error on invalid input', () => {
    expect(() => hexToRgb('#12')).toThrow(/Invalid hex colour/);
    expect(() => hexToRgb('not-a-colour')).toThrow(/Invalid hex colour/);
  });
});

describe('themeVars', () => {
  it('produces an rgb() accent variable', () => {
    expect(themeVars('#fff')).toEqual({ '--accent': 'rgb(255 255 255)' });
  });
});
