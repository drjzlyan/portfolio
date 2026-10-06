import type { Vec } from './engine';

/** Rasterise `lines` in the display font and return the lit pixel positions. */
export async function sampleTextPoints(lines: string[], w: number, h: number): Promise<Vec[]> {
  try {
    await document.fonts.load('italic 400 100px "Instrument Serif"');
  } catch {
    /* fall back to the serif stack */
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return [];

  const family = '"Instrument Serif", serif';
  let size = lines.length > 1 ? Math.min(h * 0.2, w * 0.3) : Math.min(h * 0.2, w * 0.14);
  g.font = `italic 400 ${size}px ${family}`;
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  if (widest > w * 0.86) size *= (w * 0.86) / widest;
  g.font = `italic 400 ${size}px ${family}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';

  const lineHeight = size * 1.0;
  const startY = h * 0.42 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => g.fillText(l, w / 2, startY + i * lineHeight));

  const data = g.getImageData(0, 0, w, h).data;
  const gap = 3;
  const pts: Vec[] = [];
  for (let y = 0; y < h; y += gap) {
    for (let x = 0; x < w; x += gap) {
      if (data[(y * w + x) * 4 + 3]! > 128) pts.push({ x, y });
    }
  }
  return pts;
}
