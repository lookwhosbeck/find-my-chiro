import type { PatientSearchFilters } from './queries';
import { clampSearchRadiusMiles } from './search-radius';

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

/** Serialize filters to query params (same shape as appendSearchFiltersToQuery). */
export function filtersToSearchParams(filters: PatientSearchFilters): URLSearchParams {
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
  return q;
}

/** Append serialized search filters so the profile page can reproduce match / radar axes. */
export function appendSearchFiltersToQuery(basePath: string, filters: PatientSearchFilters): string {
  const q = filtersToSearchParams(filters);
  const qs = q.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** True when `filters` round-trip to the same parsed shape as the current URL (order-insensitive). */
export function filtersMatchCurrentUrl(filters: PatientSearchFilters, searchParams: URLSearchParams): boolean {
  const fromFilters = parseSearchFiltersFromParams(filtersToSearchParams(filters));
  const fromUrl = parseSearchFiltersFromParams(new URLSearchParams(searchParams.toString()));
  return JSON.stringify(fromFilters) === JSON.stringify(fromUrl);
}

export function parseSearchFiltersFromParams(searchParams: URLSearchParams): PatientSearchFilters {
  const zip = searchParams.get(KEYS.zip) || '';
  const radiusRaw = searchParams.get(KEYS.radius);
  const radiusParsed = radiusRaw != null && radiusRaw !== '' ? parseInt(radiusRaw, 10) : 25;
  const radius = Number.isNaN(radiusParsed) ? 25 : clampSearchRadiusMiles(radiusParsed);
  return {
    zipCode: zip,
    searchRadius: radius,
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

export function getDefaultEmptySearchFilters(): PatientSearchFilters {
  return {
    zipCode: '',
    preferredModalities: [],
    focusAreas: [],
    preferredBusinessModel: '',
    insuranceType: '',
    budgetRange: '',
    searchRadius: 25,
    city: '',
    state: '',
    preferredPhilosophies: [],
  };
}

/** Map DB `insurance_type` / legacy full names to search filter tokens (e.g. BCBS). */
const DB_INSURANCE_TO_SEARCH: Record<string, string> = {
  'Blue Cross Blue Shield': 'BCBS',
};

export function patientRowToSearchFilters(row: Record<string, unknown> | null | undefined): PatientSearchFilters {
  const base = getDefaultEmptySearchFilters();
  if (!row) return base;

  const rawIns = row.insurance_type;
  let insuranceType = '';
  if (rawIns != null && String(rawIns).trim() !== '' && String(rawIns).toLowerCase() !== 'none') {
    const s = String(rawIns);
    insuranceType = DB_INSURANCE_TO_SEARCH[s] ?? s;
  }

  const sr = row.search_radius_miles;
  const radius =
    typeof sr === 'number' && !Number.isNaN(sr) ? clampSearchRadiusMiles(sr) : 25;

  const modalities = row.preferred_modalities;
  const focus = row.focus_areas;

  const rawBudget = row.budget_range;
  const budgetStr =
    rawBudget != null && String(rawBudget).trim() !== '' && String(rawBudget).toLowerCase() !== 'none'
      ? String(rawBudget)
      : '';

  const phil = row.preferred_philosophies;

  return {
    ...base,
    zipCode: typeof row.preferred_zip_code === 'string' ? row.preferred_zip_code : '',
    searchRadius: radius,
    city: typeof row.city === 'string' ? row.city : '',
    state: typeof row.state === 'string' ? row.state : '',
    preferredModalities: Array.isArray(modalities) ? [...(modalities as string[])] : [],
    focusAreas: Array.isArray(focus) ? [...(focus as string[])] : [],
    preferredBusinessModel:
      typeof row.preferred_business_model === 'string' ? row.preferred_business_model : '',
    insuranceType,
    budgetRange: budgetStr,
    preferredPhilosophies: Array.isArray(phil) ? [...(phil as string[])] : [],
  };
}

/** Profile defaults first; any key present in `params` overrides (same keys as appendSearchFiltersToQuery). */
export function mergeProfileDefaultsWithUrlParams(
  defaults: PatientSearchFilters,
  params: URLSearchParams,
): PatientSearchFilters {
  const out: PatientSearchFilters = { ...defaults };
  if (params.has(KEYS.zip)) out.zipCode = params.get(KEYS.zip) || '';
  if (params.has(KEYS.radius)) {
    const n = parseInt(params.get(KEYS.radius) || '', 10);
    if (!Number.isNaN(n)) out.searchRadius = clampSearchRadiusMiles(n);
  }
  if (params.has(KEYS.city)) out.city = params.get(KEYS.city) || '';
  if (params.has(KEYS.state)) out.state = params.get(KEYS.state) || '';
  const mods = params.getAll(KEYS.modalities).filter(Boolean);
  if (mods.length) out.preferredModalities = mods;
  const focus = params.getAll(KEYS.focus).filter(Boolean);
  if (focus.length) out.focusAreas = focus;
  const phil = params.getAll(KEYS.philosophies).filter(Boolean);
  if (phil.length) out.preferredPhilosophies = phil;
  if (params.has(KEYS.business)) out.preferredBusinessModel = params.get(KEYS.business) || '';
  if (params.has(KEYS.insurance)) out.insuranceType = params.get(KEYS.insurance) || '';
  if (params.has(KEYS.budget)) out.budgetRange = params.get(KEYS.budget) || '';
  return out;
}
