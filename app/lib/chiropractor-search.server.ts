import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import zipcodes from 'zipcodes';
import { haversineMiles, normalizeUsZip } from './geo';
import { mapChiropractorDataFromNormalizedSchema, type Chiropractor, type PatientSearchFilters } from './queries';
import { scoreChiropractors } from './patient-match';

const GEO_CANDIDATE_CAP = 500;

export async function searchChiropractorsWithClient(
  supabase: SupabaseClient,
  filters: PatientSearchFilters,
  limit: number = 20
): Promise<Chiropractor[]> {
  const baseZip = filters.zipCode ? normalizeUsZip(filters.zipCode) : null;
  const radiusMiles = filters.searchRadius ?? 25;

  const query = supabase
    .from('chiropractors')
    .select(
      `
        *,
        profiles!inner(first_name, last_name, email),
        organizations!inner(name, city, state, zip_code),
        chiropractor_modalities(modality_id, modalities!inner(name)),
        chiropractor_focus_areas(focus_area_id, focus_areas!inner(name)),
        chiropractor_payment_models(payment_model_id, payment_models!inner(name)),
        chiropractor_philosophies(philosophy_id, philosophies!inner(name))
      `
    )
    .eq('accepting_new_patients', true);

  const fetchCap = baseZip ? GEO_CANDIDATE_CAP : limit * 3;
  const { data, error } = await query.limit(fetchCap);

  if (error) {
    console.error('Error searching chiropractors:', error);
    return [];
  }

  let chiropractors = mapChiropractorDataFromNormalizedSchema(data || []);

  if (baseZip) {
    const origin = zipcodes.lookup(baseZip);
    if (origin && origin.latitude != null && origin.longitude != null) {
      chiropractors = chiropractors
        .map((c) => {
          const z = normalizeUsZip(c.zipCode);
          if (!z) return { ...c, distanceMiles: Number.POSITIVE_INFINITY };
          const loc = zipcodes.lookup(z);
          if (!loc || loc.latitude == null || loc.longitude == null) {
            return { ...c, distanceMiles: Number.POSITIVE_INFINITY };
          }
          const distanceMiles = haversineMiles(origin.latitude, origin.longitude, loc.latitude, loc.longitude);
          return { ...c, distanceMiles };
        })
        .filter((c) => c.distanceMiles <= radiusMiles);
    } else {
      chiropractors = chiropractors.filter((c) => normalizeUsZip(c.zipCode) === baseZip);
    }
  }

  chiropractors = scoreChiropractors(chiropractors, filters);

  const hasFiniteDistance = chiropractors.some((c) => c.distanceMiles != null && Number.isFinite(c.distanceMiles));

  if (baseZip && hasFiniteDistance) {
    chiropractors.sort((a, b) => {
      const da = a.distanceMiles ?? Number.POSITIVE_INFINITY;
      const db = b.distanceMiles ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return (b.matchScore || 0) - (a.matchScore || 0);
    });
  } else {
    chiropractors.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  return chiropractors.slice(0, limit);
}
