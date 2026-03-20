import type { CSSProperties } from 'react';

/**
 * Pill colors for a 0–100 match score: high → green (hue 120°), low → red (hue 0°).
 */
export function matchScorePillColors(percent: number): Pick<CSSProperties, 'backgroundColor' | 'color'> {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const hue = (p / 100) * 120;
  return {
    backgroundColor: `hsl(${hue} 52% 90%)`,
    color: `hsl(${hue} 72% 22%)`,
  };
}
