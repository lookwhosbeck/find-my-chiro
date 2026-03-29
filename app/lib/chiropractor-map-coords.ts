import zipcodes from 'zipcodes';
import { normalizeUsZip } from './geo';
import type { Chiropractor } from './queries';

function finiteCoord(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Coordinates for map markers: prefer geocoded organization lat/lng from the API,
 * then fall back to US ZIP centroid (same idea as server-side search enrichment).
 */
export function withChiropractorMapCoordinates(chiro: Chiropractor): Chiropractor {
  const lat = finiteCoord(chiro.latitude);
  const lng = finiteCoord(chiro.longitude);
  if (lat != null && lng != null) {
    return { ...chiro, latitude: lat, longitude: lng };
  }
  const z = normalizeUsZip(chiro.zipCode);
  if (!z) return chiro;
  const loc = zipcodes.lookup(z);
  if (loc?.latitude == null || loc.longitude == null) return chiro;
  return { ...chiro, latitude: loc.latitude, longitude: loc.longitude };
}
