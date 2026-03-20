# Chiropractor-Patient Matching Algorithm

## Overview

The matching algorithm scores **each chiropractor individually** against the patient’s **active** search filters. Only preferences the patient actually sets are included in the denominator. The percentage is `achieved ÷ possible × 100`, capped at 100.

Implementation: `app/lib/patient-match.ts` (`scoreChiropractors`, `computeMatchAxes`).

## Scoring factors (weights when that filter is active)

| Dimension | Weight (when patient sets it) | How it’s computed |
|-----------|------------------------------|-------------------|
| Location (ZIP search) | 22 | **Same ZIP** → 100%. **Inside search radius** (using `distanceMiles` from ZIP centroids) → **90–100%**: closer to the search ZIP scores higher; at the radius edge still **90%** (no large dock for “not exact ZIP”). **Same city+state** as filters (when provided) → **84%**. **Fallback** (e.g. profile with no distance) → **74%**. |
| Modalities | 28 | Multi-select **blend**: rewards overlap without linear `n/prefs` harshness — e.g. 4 of 5 techniques match ≈ **88%** on this axis (see `listPreferenceAxisScore`). Substring match, case-insensitive. |
| Focus areas | 22 | Same blend pattern as modalities. |
| Philosophies | 15 | Same blend pattern vs `chiropractor_philosophies` from DB. |
| Business model | 8 | Exact match → full; hybrid ↔ cash/insurance → **70%** partial (was 55%). |
| Insurance carrier | 5 | Full points if practice is insurance or hybrid (carrier-level junction not queried yet). |

`possible` is the sum of weights for only the dimensions the patient specified. If `possible === 0`, match score is `0` (badge hidden on cards).

### List-style filters (techniques, specialties, philosophy)

Pure `n / prefsCount` made “one extra checkbox” drop the axis sharply. We use a **floor + scale**:  
`score% = round(100 × (LIST_MATCH_SCORE_BASE + (1 − LIST_MATCH_SCORE_BASE) × (n / prefsCount)))` with `LIST_MATCH_SCORE_BASE = 0.38`, when `n ≥ 1`. If `n = 0`, axis score is 0.

### UI note

The search page summary badges use the **average** of per-provider `matchScore` values in the current result list.

### Scoring formula

```
matchScore = round( (sum of achieved partial scores) / (sum of active dimension weights) × 100 ), capped at 100
```

### Search radius (miles)

Allowed values: **5, 10, 15, 20, 25, 50** (`app/lib/search-radius.ts`). Legacy values (e.g. 100) are **clamped** to the nearest allowed radius in the API, URL parsing, and proximity bar.

### Search and Filtering

- **Geographic radius**: Haversine distance between search ZIP and practice ZIP centroids; results filtered to `distance ≤ radius`.
- **Results sorting**: Primarily by distance when ZIP search is active, then by match score as tiebreaker.

## Database Schema Requirements

### Patients Table
```sql
- preferred_modalities: TEXT[] (array of preferred techniques)
- focus_areas: TEXT[] (array of specialty needs)
- preferred_business_model: TEXT (cash/insurance/hybrid)
- insurance_type: TEXT (specific insurance provider)
- budget_range: TEXT (under-50/50-100/100-150/over-150)
- city/state/zip_code: TEXT (location data)
- search_radius: INTEGER (miles)
```

### Chiropractors Table Enhancements Needed
```sql
- modalities: TEXT[] (array of offered techniques)
- focus_areas: TEXT[] (array of specialties)
- business_model: TEXT (cash/insurance/hybrid)
- accepted_insurances: TEXT[] (array of accepted insurance types)
- price_range: TEXT (budget compatibility indicator)
```

## Technical Implementation

- **Frontend**: React/Next.js with Radix UI components
- **Backend**: Supabase with PostgreSQL
- **Search**: Custom scoring with `distanceMiles` on each chiropractor row during search
