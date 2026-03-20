# Chiropractor-Patient Matching Algorithm

## Overview

The matching algorithm scores **each chiropractor individually** against the patient’s **active** search filters. Only preferences the patient actually sets are included in the score. The percentage is `achieved ÷ possible × 100`, so adding more filters can lower the score if the provider does not match those new dimensions (this is intentional).

Implementation: `app/lib/patient-match.ts` (`scoreChiropractors`).

## Current Implementation

### Scoring factors (weights when that filter is active)

| Dimension | Weight (when patient sets it) | How it’s computed |
|-----------|------------------------------|-------------------|
| Location (ZIP search) | 22 | Exact ZIP match → full points; same city+state as filters → ~65%; otherwise in-radius baseline → ~45% |
| Modalities | 28 | `(matching preferred techniques / count preferred) × 28` (substring match, case-insensitive) |
| Focus areas | 22 | Same ratio pattern vs chiropractor focus areas |
| Philosophies | 15 | Same ratio vs `chiropractor_philosophies` from DB (fuzzy substring match) |
| Business model | 8 | Exact match → full; hybrid ↔ cash/insurance → partial |
| Insurance carrier | 5 | Full points if practice is insurance or hybrid (carrier-level junction not queried yet) |

`possible` is the sum of weights for only the dimensions the patient specified. If `possible === 0`, match score is `0` (badge hidden on cards).

### UI note

The search page **does not** show a “percent” for how many filter fields you filled in. Summary badges use the **average** of per-provider `matchScore` values in the current result list.

### Scoring formula

```
matchScore = round( (sum of achieved partial scores) / (sum of active dimension weights) × 100 ), capped at 100
```

### Search and Filtering

- **Location-based filtering**: Uses zip code/city/state matching (basic implementation)
- **Geographic radius**: Configurable search radius (5-100 miles)
- **Results sorting**: Ordered by match score (highest to lowest)

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

## User Experience Flow

### Simple Search
1. Enter zip code on homepage
2. Basic location filtering
3. Results ordered by relevance

### Advanced Search
1. Detailed preference selection
2. Multi-criteria filtering
3. Algorithmic scoring and ranking
4. Match percentage display

## Future Enhancements

### Algorithm Improvements
- Geographic distance calculations using geocoding
- Historical success rates for specific patient-chiropractor combinations
- Patient feedback integration
- Seasonal/trend-based recommendations

### Database Enhancements
- Complete focus areas mapping
- Business model and insurance data
- Price range compatibility
- Treatment success metrics

### User Experience
- Save search preferences
- Personalized recommendations
- Match explanation details
- Follow-up matching suggestions

## Technical Implementation

- **Frontend**: React/Next.js with Radix UI components
- **Backend**: Supabase with PostgreSQL
- **Authentication**: Supabase Auth with role-based access
- **Search**: Custom scoring algorithm with database queries
- **State Management**: React hooks for filter state

## Testing and Validation

- A/B testing between simple and advanced search
- User feedback on match quality
- Conversion rate tracking
- Algorithm accuracy validation