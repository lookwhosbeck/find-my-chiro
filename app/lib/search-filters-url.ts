import type { PatientSearchFilters } from './queries';

const KEYS = {
  zip: 'zip',
  radius: 'radius',
  city: 'city',
  state: 'state',
  modalities: 'mods',
  focus: 'focus',
  philosophies: 'phil',
  business: 'biz',
  insurance: 'ins',
  budget: 'budget',
} as const;

/** Append serialized search filters so the profile page can reproduce match / radar axes. */
export function appendSearchFiltersToQuery(basePath: string, filters: PatientSearchFilters): string {
  const q = new URLSearchParams();
  if (filters.zipCode) q.set(KEYS.zip, filters.zipCode);
  if (filters.searchRadius != null && filters.searchRadius !== 25) {
    q.set(KEYS.radius, String(filters.searchRadius));
  }
  if (filters.city) q.set(KEYS.city, filters.city);
  if (filters.state) q.set(KEYS.state, filters.state);
  filters.preferredModalities?.forEach((m) => q.append(KEYS.modalities, m));
  filters.focusAreas?.forEach((f) => q.append(KEYS.focus, f));
  filters.preferredPhilosophies?.forEach((p) => q.append(KEYS.philosophies, p));
  if (filters.preferredBusinessModel) q.set(KEYS.business, filters.preferredBusinessModel);
  if (filters.insuranceType) q.set(KEYS.insurance, filters.insuranceType);
  if (filters.budgetRange) q.set(KEYS.budget, filters.budgetRange);
  const qs = q.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function parseSearchFiltersFromParams(searchParams: URLSearchParams): PatientSearchFilters {
  const zip = searchParams.get(KEYS.zip) || '';
  const radiusRaw = searchParams.get(KEYS.radius);
  const radius = radiusRaw != null && radiusRaw !== '' ? parseInt(radiusRaw, 10) : 25;
  return {
    zipCode: zip,
    searchRadius: Number.isNaN(radius) ? 25 : radius,
    city: searchParams.get(KEYS.city) || '',
    state: searchParams.get(KEYS.state) || '',
    preferredModalities: searchParams.getAll(KEYS.modalities).filter(Boolean),
    focusAreas: searchParams.getAll(KEYS.focus).filter(Boolean),
    preferredPhilosophies: searchParams.getAll(KEYS.philosophies).filter(Boolean),
    preferredBusinessModel: searchParams.get(KEYS.business) || '',
    insuranceType: searchParams.get(KEYS.insurance) || '',
    budgetRange: searchParams.get(KEYS.budget) || '',
  };
}
