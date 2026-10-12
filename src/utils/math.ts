import { SECONDS_PER_MINUTE, XP_CURVE } from '../config';

const PAD_LENGTH = 2;

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / SECONDS_PER_MINUTE)).padStart(PAD_LENGTH, '0');
  const ss = String(s % SECONDS_PER_MINUTE).padStart(PAD_LENGTH, '0');
  return `${mm}:${ss}`;
}

/** Elige una clave según pesos (los pesos ≤ 0 nunca salen). */
export function weightedPick<K extends string>(weights: Record<K, number>, keys: readonly K[]): K {
  let total = 0;
  for (const k of keys) total += Math.max(0, weights[k]);
  let r = Math.random() * total;
  for (const k of keys) {
    const w = Math.max(0, weights[k]);
    if (r < w) return k;
    r -= w;
  }
  return keys[0];
}

/** Punto aleatorio en un anillo alrededor de (cx, cy), recortado al rectángulo [0, w] × [0, h]. */
export function randomPointInRing(
  cx: number,
  cy: number,
  minR: number,
  maxR: number,
  w: number,
  h: number,
  out: { x: number; y: number },
): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const dist = minR + Math.random() * (maxR - minR);
  out.x = Math.min(w, Math.max(0, cx + Math.cos(angle) * dist));
  out.y = Math.min(h, Math.max(0, cy + Math.sin(angle) * dist));
  return out;
}

/** XP necesaria para pasar del nivel n al n+1. */
export function xpToNext(level: number): number {
  return XP_CURVE.base + (level - 1) * XP_CURVE.step;
}
