/**
 * Math & Timeline Interpolation Utilities for Xibay08 Motion Studio
 */

import { easings, EasingFn } from './easings.ts';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, value: number): number {
  if (Math.abs(b - a) < 1e-9) return 0;
  return clamp((value - a) / (b - a), 0, 1);
}

export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return map(value, inMin, inMax, outMin, outMax);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function loop(time: number, period: number): number {
  if (period <= 0) return 0;
  return (time % period + period) % period;
}

export function pingpong(time: number, period: number): number {
  if (period <= 0) return 0;
  const cycle = (time % (period * 2) + period * 2) % (period * 2);
  return cycle <= period ? cycle : period * 2 - cycle;
}

export function stagger(index: number, delay: number): number {
  return index * delay;
}

export type KeyframeTrack = Array<[number, number] | [number, number, EasingFn]>;

/**
 * Keyframe interpolator
 * Points: [[timeOrFrame, value, optionalEasing], ...]
 * Example: keyframes(currentTime, [[0, 0], [2, 100], [4, 50]], easings.inOutCubic)
 */
export function keyframes(
  t: number,
  track: KeyframeTrack,
  defaultEase: EasingFn = easings.linear
): number {
  if (!track || track.length === 0) return 0;
  if (track.length === 1) return track[0][1];

  // Sort track by time
  const sorted = [...track].sort((a, b) => a[0] - b[0]);

  if (t <= sorted[0][0]) return sorted[0][1];
  if (t >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];

  for (let i = 0; i < sorted.length - 1; i++) {
    const [t0, v0] = sorted[i];
    const [t1, v1, ease] = sorted[i + 1];

    if (t >= t0 && t <= t1) {
      const segT = (t - t0) / (t1 - t0);
      const easingFn = ease || defaultEase;
      const easedT = easingFn(segT);
      return lerp(v0, v1, easedT);
    }
  }

  return sorted[sorted.length - 1][1];
}

// Color conversion and interpolation
export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export function hexToRgb(hex: string): RGB {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 1,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgba(r: number, g: number, b: number, a = 1): string {
  return `rgba(${Math.round(clamp(r, 0, 255))}, ${Math.round(clamp(g, 0, 255))}, ${Math.round(clamp(b, 0, 255))}, ${clamp(a, 0, 1)})`;
}

export function parseColor(color: string): RGB {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  if (color.startsWith('rgb')) {
    const match = color.match(/[\d.]+/g);
    if (match && match.length >= 3) {
      return {
        r: parseFloat(match[0]),
        g: parseFloat(match[1]),
        b: parseFloat(match[2]),
        a: match[3] ? parseFloat(match[3]) : 1,
      };
    }
  }
  // Default fallback
  return { r: 255, g: 255, b: 255, a: 1 };
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const normT = clamp(t, 0, 1);
  const rgb1 = parseColor(c1);
  const rgb2 = parseColor(c2);

  const r = lerp(rgb1.r, rgb2.r, normT);
  const g = lerp(rgb1.g, rgb2.g, normT);
  const b = lerp(rgb1.b, rgb2.b, normT);
  const a = lerp(rgb1.a ?? 1, rgb2.a ?? 1, normT);

  return rgba(r, g, b, a);
}
