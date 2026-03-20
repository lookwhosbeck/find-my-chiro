import type { Chiropractor, PatientSearchFilters } from './queries';
import { normalizeUsZip } from './geo';

/** Max points per dimension when that preference is set (only active dimensions contribute to the denominator). */
const WEIGHT_LOCATION = 22;
const WEIGHT_MODALITIES = 28;
const WEIGHT_FOCUS = 22;
const WEIGHT_PHILOSOPHY = 15;
const WEIGHT_BUSINESS = 8;
const WEIGHT_INSURANCE = 5;

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

/**
 * Score each chiropractor as overlap between this provider and the patient's active filters.
 * Only preferences the patient actually set are included; score is achieved ÷ possible × 100.
 */
export function scoreChiropractors(chiropractors: Chiropractor[], filters: PatientSearchFilters): Chiropractor[] {
  const filterZip = filters.zipCode ? normalizeUsZip(filters.zipCode) : null;

  return chiropractors.map((chiro) => {
    let achieved = 0;
    let possible = 0;

    if (filterZip) {
      possible += WEIGHT_LOCATION;
      const chiroZip = normalizeUsZip(chiro.zipCode);
      if (chiroZip === filterZip) {
        achieved += WEIGHT_LOCATION;
      } else if (
        filters.city &&
        filters.state &&
        chiro.city &&
        chiro.state &&
        chiro.city === filters.city &&
        chiro.state === filters.state
      ) {
        achieved += Math.round(WEIGHT_LOCATION * 0.65);
      } else {
        // In radius (or same-ZIP fallback filter) but not exact ZIP match
        achieved += Math.round(WEIGHT_LOCATION * 0.45);
      }
    }

    const prefsMods = filters.preferredModalities;
    if (prefsMods && prefsMods.length > 0) {
      possible += WEIGHT_MODALITIES;
      const chiroMods = chiro.modalities ?? [];
      if (chiroMods.length > 0) {
        const n = countMatchingPreferences(prefsMods, chiroMods);
        achieved += (n / prefsMods.length) * WEIGHT_MODALITIES;
      }
    }

    const prefsFocus = filters.focusAreas;
    if (prefsFocus && prefsFocus.length > 0) {
      possible += WEIGHT_FOCUS;
      const chiroFocus = chiro.focusAreas ?? [];
      if (chiroFocus.length > 0) {
        const n = countMatchingPreferences(prefsFocus, chiroFocus);
        achieved += (n / prefsFocus.length) * WEIGHT_FOCUS;
      }
    }

    const prefsPhil = filters.preferredPhilosophies;
    if (prefsPhil && prefsPhil.length > 0) {
      possible += WEIGHT_PHILOSOPHY;
      const chiroPhil = chiroPhilosophyList(chiro);
      if (chiroPhil.length > 0) {
        const n = countMatchingPreferences(prefsPhil, chiroPhil);
        achieved += (n / prefsPhil.length) * WEIGHT_PHILOSOPHY;
      }
    }

    const biz = filters.preferredBusinessModel?.toLowerCase().trim();
    if (biz && biz !== '' && biz !== 'any') {
      possible += WEIGHT_BUSINESS;
      const models = chiroPaymentModels(chiro);
      const frac = businessModelMatch(models, biz);
      achieved += frac * WEIGHT_BUSINESS;
    }

    const ins = filters.insuranceType?.trim();
    if (ins && ins !== '' && ins.toLowerCase() !== 'any' && ins.toLowerCase() !== 'none') {
      possible += WEIGHT_INSURANCE;
      const models = chiroPaymentModels(chiro);
      if (models.some((m) => m === 'insurance' || m === 'hybrid')) {
        achieved += WEIGHT_INSURANCE;
      }
    }

    const matchScore = possible > 0 ? Math.min(100, Math.round((achieved / possible) * 100)) : 0;

    return {
      ...chiro,
      matchScore,
    };
  });
}
