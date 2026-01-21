# Chiropractor-Patient Matching Algorithm

## Overview

The matching algorithm scores chiropractors based on patient preferences to help patients find the most suitable healthcare providers. The algorithm considers multiple factors with weighted scoring to provide personalized recommendations.

## Current Implementation

### Scoring Factors

The algorithm evaluates chiropractors across several dimensions:

1. **Modalities/Techniques (40% weight)**
   - Compares patient's preferred chiropractic techniques against chiropractor's offered modalities
   - Available modalities: Gonstead, Diversified, Activator, TRT, SOT, Thompson, Webster, Cox
   - Score = (matching modalities / total preferred modalities) × 40

2. **Focus Areas/Specialties (30% weight)**
   - Matches patient needs with chiropractor specialties
   - Available focus areas: Pediatrics, Sports, Auto Injury, Wellness, Prenatal, Geriatric
   - Currently uses placeholder scoring - needs database enhancement

3. **Business Model Compatibility (20% weight)**
   - Ensures alignment between patient payment preferences and chiropractor's business model
   - Options: Cash-Based, Insurance-Based, Hybrid
   - Currently uses placeholder scoring - needs database enhancement

4. **Insurance Compatibility (10% weight)**
   - Matches patient's insurance with chiropractor's accepted insurance types
   - Available options: BCBS, Aetna, Cigna, UnitedHealthcare, Medicare, Medicaid
   - Currently uses placeholder scoring - needs database enhancement

### Scoring Formula

```
Total Score = (Modality Score) + (Focus Area Score) + (Business Model Score) + (Insurance Score)
Maximum Score = 100 points
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