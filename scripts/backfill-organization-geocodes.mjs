#!/usr/bin/env node
/**
 * Retroactively geocode organizations missing latitude/longitude using Mapbox.
 *
 * Prerequisites:
 * - Migration applied (organizations.latitude, longitude, geocoded_at, geocode_error).
 * - .env.local or env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   and MAPBOX_ACCESS_TOKEN (or NEXT_PUBLIC_MAPBOX_TOKEN).
 *
 * Usage (from repo root):
 *   node scripts/backfill-organization-geocodes.mjs
 *   node scripts/backfill-organization-geocodes.mjs --dry-run
 *
 * Loads `.env.local` then `.env` from the repo root (same parser as before). Optional:
 *   node --env-file=.env.local scripts/backfill-organization-geocodes.mjs
 *
 * Using env vars from Vercel (linked project: `vercel link`):
 *   npm run backfill:geocode-orgs:vercel:dry   # pull production env, dry-run
 *   npm run backfill:geocode-orgs:vercel      # pull production env, then backfill
 * Preview env: npm run backfill:geocode-orgs:vercel:preview
 * (Script still runs on your machine; it only downloads secrets via the Vercel CLI.)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseEnvFileIntoEnv(raw) {
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function loadEnvFiles() {
  const root = join(__dirname, '..');
  for (const name of ['.env.local', '.env']) {
    try {
      parseEnvFileIntoEnv(readFileSync(join(root, name), 'utf8'));
    } catch {
      /* missing */
    }
  }
  // Some projects only set SUPABASE_URL (Dashboard "Project URL")
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_URL?.trim()) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL.trim();
  }
}

loadEnvFiles();

const dryRun = process.argv.includes('--dry-run');
const DELAY_MS = 200;

function getMapboxToken() {
  return (
    process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ||
    ''
  );
}

function buildUsAddressQuery(row) {
  const line1 = row.address_line_1?.trim?.() ?? '';
  const line2 = row.address_line_2?.trim?.() ?? '';
  const city = row.city?.trim?.() ?? '';
  const state = row.state?.trim?.() ?? '';
  const zip = row.zip_code?.trim?.() ?? '';
  if (!line1 && !city && !zip) return null;
  const cityState = [city, state].filter(Boolean).join(', ').trim();
  const segments = [line1, line2, cityState, zip].filter((s) => s && s.length > 0);
  const q = segments.join(', ');
  return q.length > 0 ? q : null;
}

async function mapboxForwardGeocode(query, token) {
  const encoded = encodeURIComponent(query);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=US&limit=1&types=address,place,postcode&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const center = json.features?.[0]?.center;
  if (!center || center.length < 2) return null;
  const [longitude, latitude] = center;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = getMapboxToken();

  if (!url || !service || url.includes('placeholder')) {
    console.error('Missing Supabase credentials for the backfill script.');
    console.error('Required in .env.local or .env (or pass via environment):');
    console.error('  NEXT_PUBLIC_SUPABASE_URL   — same as in your Next app');
    console.error('  SUPABASE_SERVICE_ROLE_KEY  — Dashboard → Settings → API → service_role (secret)');
    console.error('Optional alias: SUPABASE_URL is copied to NEXT_PUBLIC_SUPABASE_URL if the latter is unset.');
    console.error('Present:', {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(url && !url.includes('placeholder')),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(service),
    });
    process.exit(1);
  }
  if (!token) {
    console.error('Missing MAPBOX_ACCESS_TOKEN or NEXT_PUBLIC_MAPBOX_TOKEN.');
    process.exit(1);
  }

  const admin = createClient(url, service);
  const pageSize = 200;
  let totalOk = 0;
  let totalFail = 0;
  let totalSkip = 0;

  // Always take the first N rows still missing coords (no offset). Using offset would skip
  // rows after earlier pages are updated, because the result set shrinks.
  for (;;) {
    const { data: rows, error } = await admin
      .from('organizations')
      .select('id, address_line_1, address_line_2, city, state, zip_code, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .order('id', { ascending: true })
      .limit(pageSize);

    if (error) {
      console.error('Supabase query failed:', error.message);
      console.error('If columns are missing, apply the geocode migration first.');
      process.exit(1);
    }

    if (!rows?.length) break;

    for (const row of rows) {
      const q = buildUsAddressQuery(row);
      if (!q) {
        console.log(`skip ${row.id} (no address fields)`);
        totalSkip += 1;
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] would geocode ${row.id}: ${q}`);
        totalOk += 1;
        await sleep(DELAY_MS);
        continue;
      }

      const coords = await mapboxForwardGeocode(q, token);
      await sleep(DELAY_MS);

      if (!coords) {
        await admin
          .from('organizations')
          .update({
            geocode_error: 'Mapbox returned no results (backfill)',
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        console.log(`fail ${row.id}: no results`);
        totalFail += 1;
        continue;
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
        .eq('id', row.id);

      if (upErr) {
        console.error(`fail ${row.id}:`, upErr.message);
        totalFail += 1;
      } else {
        console.log(`ok ${row.id}`);
        totalOk += 1;
      }
    }

    if (rows.length < pageSize) break;
  }

  console.log(
    dryRun
      ? `\nDone (dry-run). Would process ${totalOk} rows, skipped ${totalSkip}.`
      : `\nDone. Updated ${totalOk}, failed ${totalFail}, skipped ${totalSkip}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
