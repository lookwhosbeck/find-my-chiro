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
