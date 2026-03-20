import type { Chiropractor, PatientSearchFilters } from './queries';
import { normalizeUsZip } from './geo';

/**
 * Score chiropractors based on patient preferences (matching algorithm)
 */
export function scoreChiropractors(chiropractors: Chiropractor[], filters: PatientSearchFilters): Chiropractor[] {
  const filterZip = filters.zipCode ? normalizeUsZip(filters.zipCode) : null;

  return chiropractors.map((chiro) => {
    let score = 0;
    const maxScore = 100;

    score = 10;

    if (filterZip) {
      const chiroZip = normalizeUsZip(chiro.zipCode);
      if (chiroZip === filterZip) {
        score += 20;
      } else if (chiro.city === filters.city || chiro.state === filters.state) {
        score += 10;
      }
    } else {
      score += 10;
    }

    if (filters.preferredModalities && filters.preferredModalities.length > 0 && chiro.modalities) {
      const matchingModalities = filters.preferredModalities.filter((mod) =>
        chiro.modalities!.some((chiroMod) => chiroMod.toLowerCase().includes(mod.toLowerCase()))
      );
      score += (matchingModalities.length / filters.preferredModalities.length) * 30;
    }

    if (filters.focusAreas && filters.focusAreas.length > 0 && chiro.focusAreas) {
      const matchingFocusAreas = filters.focusAreas.filter((area) =>
        chiro.focusAreas!.some((chiroArea) => chiroArea.toLowerCase().includes(area.toLowerCase()))
      );
      score += (matchingFocusAreas.length / filters.focusAreas.length) * 20;
    }

    if (filters.preferredBusinessModel && chiro.businessModel) {
      const patientPref = filters.preferredBusinessModel.toLowerCase();
      const chiroModel = chiro.businessModel.toLowerCase();

      if (patientPref === chiroModel) {
        score += 20;
      } else if (
        (patientPref === 'hybrid' && (chiroModel === 'cash' || chiroModel === 'insurance')) ||
        ((patientPref === 'cash' || patientPref === 'insurance') && chiroModel === 'hybrid')
      ) {
        score += 10;
      }
    }

    if (filters.insuranceType && filters.insuranceType !== 'none') {
      if (
        chiro.businessModel &&
        (chiro.businessModel.toLowerCase() === 'insurance' || chiro.businessModel.toLowerCase() === 'hybrid')
      ) {
        score += 10;
      }
    }

    return {
      ...chiro,
      matchScore: Math.min(score, maxScore),
    };
  });
}
