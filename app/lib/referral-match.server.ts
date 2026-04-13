import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { mapChiropractorDataFromNormalizedSchema, type Chiropractor, type PatientSearchFilters } from './queries';
import { scoreChiropractors } from './patient-match';

const CHIRO_SELECT = `
  *,
  profiles!inner(first_name, last_name, avatar_url),
  organizations!inner(name, city, state, zip_code, phone, website, address_line_1, latitude, longitude),
  chiropractor_modalities(modality_id, modalities!inner(name)),
  chiropractor_focus_areas(focus_area_id, focus_areas!inner(name)),
  chiropractor_payment_models(payment_model_id, payment_models!inner(name)),
  chiropractor_philosophies(philosophy_id, philosophies!inner(name))
`;

/**
 * Load one chiropractor (approved directory only) and compute match % for the given filters.
 */
export async function computeMatchForReferral(
  supabase: SupabaseClient,
  chiropractorId: string,
  filters: PatientSearchFilters,
): Promise<{ chiropractor: Chiropractor; matchScore: number } | null> {
  const { data, error } = await supabase
    .from('chiropractors')
    .select(CHIRO_SELECT)
    .eq('id', chiropractorId)
    .eq('accepting_new_patients', true)
    .eq('license_verification_status', 'approved')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const [mapped] = mapChiropractorDataFromNormalizedSchema([data]);
  if (!mapped?.id) return null;

  const [scored] = scoreChiropractors([mapped], filters);
  const matchScore =
    typeof scored.matchScore === 'number' && Number.isFinite(scored.matchScore)
      ? Math.round(Math.max(0, Math.min(100, scored.matchScore)))
      : 0;

  return { chiropractor: scored, matchScore };
}
