/** Match signup flows — used for chiropractor junction tables & patient array fields */
export const MODALITY_OPTIONS = [
  'Gonstead',
  'Diversified',
  'Activator',
  'TRT',
  'SOT',
  'Thompson',
  'Webster',
  'Cox',
] as const;

export const FOCUS_AREA_OPTIONS = [
  'Pediatrics',
  'Sports',
  'Auto Injury',
  'Wellness',
  'Prenatal',
  'Geriatric',
] as const;

export const PREFERRED_DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const PREFERRED_TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'] as const;

/** philosophies.name — matches seed / DB */
export const PHILOSOPHY_OPTIONS = [
  'Evidence-Based',
  'Holistic',
  'Traditional',
  'Functional',
  'Sports Medicine',
  'Neurological',
  'Holistic Wellness',
  'Structural Correction',
  'Functional Medicine',
  'Integrative',
] as const;

/** payment_models.name — matches seed / DB */
export const PAYMENT_MODEL_OPTIONS = ['Cash', 'Insurance', 'Hybrid'] as const;

/** insurances.name — matches seed / DB */
export const CHIRO_INSURANCE_OPTIONS = [
  'Blue Cross Blue Shield',
  'Aetna',
  'Cigna',
  'UnitedHealthcare',
  'Medicare',
  'Medicaid',
] as const;

/** Stored on chiropractors.budget_range when column exists */
export const CHIRO_BUDGET_RANGE_OPTIONS = [
  { value: '', label: 'No preference' },
  { value: 'under-50', label: 'Under $50 / visit' },
  { value: '50-100', label: '$50 – $100 / visit' },
  { value: '100-150', label: '$100 – $150 / visit' },
  { value: 'over-150', label: 'Over $150 / visit' },
] as const;
