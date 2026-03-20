import type { Chiropractor, PatientSearchFilters } from './queries';
import { normalizeUsZip } from './geo';

/** Max points per dimension when that preference is set (only active dimensions contribute to the denominator). */
const WEIGHT_LOCATION = 22;
const WEIGHT_MODALITIES = 28;
const WEIGHT_FOCUS = 22;
const WEIGHT_PHILOSOPHY = 15;
const WEIGHT_BUSINESS = 8;
const WEIGHT_INSURANCE = 5;

export type MatchAxisId = 'location' | 'modalities' | 'focus' | 'philosophy' | 'business' | 'insurance';

export type MatchAxisBreakdown = {
  id: MatchAxisId;
  label: string;
  /** Patient set a preference for this dimension (included in overall match denominator). */
  active: boolean;
  /** 0–100 match quality on this axis when `active`; otherwise null. */
  score: number | null;
};

function preferenceMatchesOption(pref: string, option: string): boolean {
  const a = pref.toLowerCase().trim();
  const b = option.toLowerCase().trim();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function countMatchingPreferences(patientValues: string[], chiroValues: string[]): number {
  if (!patientValues.length || !chiroValues.length) return 0;
  return patientValues.filter((pref) => chiroValues.some((opt) => preferenceMatchesOption(pref, opt))).length;
}

function chiroPhilosophyList(chiro: Chiropractor): string[] {
  if (chiro.philosophies?.length) return chiro.philosophies;
  if (chiro.philosophy) return [chiro.philosophy];
  return [];
}

function chiroPaymentModels(chiro: Chiropractor): string[] {
  if (chiro.paymentModels?.length) return chiro.paymentModels;
  const one = chiro.businessModel?.toLowerCase().trim();
  return one ? [one] : [];
}

function businessModelMatch(models: string[], patientPref: string): number {
  if (!models.length) return 0;
  if (models.includes(patientPref)) return 1;
  if (
    patientPref === 'hybrid' &&
    models.some((m) => m === 'cash' || m === 'insurance')
  ) {
    return 1;
  }
  if (
    (patientPref === 'cash' || patientPref === 'insurance') &&
    models.includes('hybrid')
  ) {
    return 0.55;
  }
  return 0;
}

function clampScore100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Per-axis match scores (same rules as overall `matchScore`).
 * Only axes the patient activated via search filters appear as `active` with a numeric `score`.
 */
export function computeMatchAxes(chiro: Chiropractor, filters: PatientSearchFilters): MatchAxisBreakdown[] {
  const filterZip = filters.zipCode ? normalizeUsZip(filters.zipCode) : null;

  let locActive = false;
  let locScore: number | null = null;
  if (filterZip) {
    locActive = true;
    const chiroZip = normalizeUsZip(chiro.zipCode);
    let achievedFrac: number;
    if (chiroZip === filterZip) {
      achievedFrac = 1;
    } else if (
      filters.city &&
      filters.state &&
      chiro.city &&
      chiro.state &&
      chiro.city === filters.city &&
      chiro.state === filters.state
    ) {
      achievedFrac = 0.65;
    } else {
      achievedFrac = 0.45;
    }
    locScore = clampScore100(achievedFrac * 100);
  }

  let modActive = false;
  let modScore: number | null = null;
  const prefsMods = filters.preferredModalities;
  if (prefsMods && prefsMods.length > 0) {
    modActive = true;
    const chiroMods = chiro.modalities ?? [];
    if (chiroMods.length > 0) {
      const n = countMatchingPreferences(prefsMods, chiroMods);
      modScore = clampScore100((n / prefsMods.length) * 100);
    } else {
      modScore = 0;
    }
  }

  let focusActive = false;
  let focusScore: number | null = null;
  const prefsFocus = filters.focusAreas;
  if (prefsFocus && prefsFocus.length > 0) {
    focusActive = true;
    const chiroFocus = chiro.focusAreas ?? [];
    if (chiroFocus.length > 0) {
      const n = countMatchingPreferences(prefsFocus, chiroFocus);
      focusScore = clampScore100((n / prefsFocus.length) * 100);
    } else {
      focusScore = 0;
    }
  }

  let philActive = false;
  let philScore: number | null = null;
  const prefsPhil = filters.preferredPhilosophies;
  if (prefsPhil && prefsPhil.length > 0) {
    philActive = true;
    const chiroPhil = chiroPhilosophyList(chiro);
    if (chiroPhil.length > 0) {
      const n = countMatchingPreferences(prefsPhil, chiroPhil);
      philScore = clampScore100((n / prefsPhil.length) * 100);
    } else {
      philScore = 0;
    }
  }

  let bizActive = false;
  let bizScore: number | null = null;
  const biz = filters.preferredBusinessModel?.toLowerCase().trim();
  if (biz && biz !== '' && biz !== 'any') {
    bizActive = true;
    const models = chiroPaymentModels(chiro);
    bizScore = clampScore100(businessModelMatch(models, biz) * 100);
  }

  let insActive = false;
  let insScore: number | null = null;
  const ins = filters.insuranceType?.trim();
  if (ins && ins !== '' && ins.toLowerCase() !== 'any' && ins.toLowerCase() !== 'none') {
    insActive = true;
    const models = chiroPaymentModels(chiro);
    if (models.some((m) => m === 'insurance' || m === 'hybrid')) {
      insScore = 100;
    } else {
      insScore = 0;
    }
  }

  return [
    { id: 'location', label: 'Location', active: locActive, score: locScore },
    { id: 'modalities', label: 'Techniques', active: modActive, score: modScore },
    { id: 'focus', label: 'Specialties', active: focusActive, score: focusScore },
    { id: 'philosophy', label: 'Philosophy', active: philActive, score: philScore },
    { id: 'business', label: 'Payment', active: bizActive, score: bizScore },
    { id: 'insurance', label: 'Insurance fit', active: insActive, score: insScore },
  ];
}

function overallFromAxes(axes: MatchAxisBreakdown[]): { achieved: number; possible: number } {
  let achieved = 0;
  let possible = 0;
  for (const a of axes) {
    if (!a.active || a.score == null) continue;
    const w = weightForAxis(a.id);
    possible += w;
    achieved += (a.score / 100) * w;
  }
  return { achieved, possible };
}

/** Same combined % as search results, from per-axis breakdown (e.g. profile page). */
export function matchPercentFromAxes(axes: MatchAxisBreakdown[]): number {
  const { achieved, possible } = overallFromAxes(axes);
  return possible > 0 ? Math.min(100, Math.round((achieved / possible) * 100)) : 0;
}

function weightForAxis(id: MatchAxisId): number {
  switch (id) {
    case 'location':
      return WEIGHT_LOCATION;
    case 'modalities':
      return WEIGHT_MODALITIES;
    case 'focus':
      return WEIGHT_FOCUS;
    case 'philosophy':
      return WEIGHT_PHILOSOPHY;
    case 'business':
      return WEIGHT_BUSINESS;
    case 'insurance':
      return WEIGHT_INSURANCE;
    default:
      return 0;
  }
}

/**
 * Score each chiropractor as overlap between this provider and the patient's active filters.
 * Only preferences the patient actually set are included; score is achieved ÷ possible × 100.
 */
export function scoreChiropractors(chiropractors: Chiropractor[], filters: PatientSearchFilters): Chiropractor[] {
  return chiropractors.map((chiro) => {
    const axes = computeMatchAxes(chiro, filters);
    const { achieved, possible } = overallFromAxes(axes);
    const matchScore = possible > 0 ? Math.min(100, Math.round((achieved / possible) * 100)) : 0;

    return {
      ...chiro,
      matchScore,
    };
  });
}
