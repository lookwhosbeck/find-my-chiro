/** Allowed search radii (miles) — keep UI and URL parsing in sync. */
export const SEARCH_RADIUS_MILES_OPTIONS = [5, 10, 15, 20, 25, 50] as const;

export type SearchRadiusMiles = (typeof SEARCH_RADIUS_MILES_OPTIONS)[number];

const ALLOWED = new Set<number>(SEARCH_RADIUS_MILES_OPTIONS);

/** Snap unknown values (e.g. legacy 100 mi) to the nearest allowed radius. */
export function clampSearchRadiusMiles(value: number): SearchRadiusMiles {
  if (ALLOWED.has(value)) return value as SearchRadiusMiles;
  let best: SearchRadiusMiles = SEARCH_RADIUS_MILES_OPTIONS[0];
  let bestDist = Math.abs(value - best);
  for (const n of SEARCH_RADIUS_MILES_OPTIONS) {
    const d = Math.abs(value - n);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}
