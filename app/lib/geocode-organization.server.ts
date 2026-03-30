import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mapboxForwardGeocodeUs } from './mapbox-geocode.server';
import { getSupabaseServiceApiKey } from './supabase-keys';

export type GeocodeOrganizationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: 'not_configured' | 'no_address' | 'geocode_failed' | 'not_found' };

function hasMapboxToken(): boolean {
  return Boolean(
    process.env.MAPBOX_ACCESS_TOKEN?.trim() || process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim(),
  );
}

/**
 * Load organization address fields, geocode with Mapbox, persist lat/lng (service role).
 */
export async function geocodeOrganizationWithAdmin(
  admin: SupabaseClient,
  organizationId: string,
): Promise<GeocodeOrganizationResult> {
  const { data: row, error } = await admin
    .from('organizations')
    .select('id, address_line_1, city, state, zip_code')
    .eq('id', organizationId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, reason: 'not_found' };
  }

  const queryEmpty =
    !row.address_line_1?.trim() && !row.city?.trim() && !row.zip_code?.trim();
  if (queryEmpty) {
    return { ok: false, reason: 'no_address' };
  }

  if (!hasMapboxToken()) {
    return { ok: false, reason: 'not_configured' };
  }

  const coords = await mapboxForwardGeocodeUs({
    address_line_1: row.address_line_1,
    city: row.city,
    state: row.state,
    zip_code: row.zip_code,
  });

  if (!coords) {
    await admin
      .from('organizations')
      .update({
        geocode_error: 'Mapbox returned no results',
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);
    return { ok: false, reason: 'geocode_failed' };
  }

  const { error: upErr } = await admin
    .from('organizations')
    .update({
      latitude: coords.latitude,
      longitude: coords.longitude,
      geocoded_at: new Date().toISOString(),
      geocode_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (upErr) {
    console.error('geocodeOrganizationWithAdmin update:', upErr);
    return { ok: false, reason: 'not_found' };
  }

  return { ok: true, latitude: coords.latitude, longitude: coords.longitude };
}

export function createSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = getSupabaseServiceApiKey();
  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return null;
  }
  return createClient(url, service);
}
