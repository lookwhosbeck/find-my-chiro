export type CompletenessKey =
  | 'address'
  | 'modalities'
  | 'philosophy'
  | 'focusAreas'
  | 'businessModel';

export type CompletenessItem = {
  key: CompletenessKey;
  label: string;
  complete: boolean;
};

export type ChiropractorCompletenessInput = {
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  modalities?: string[] | null;
  philosophies?: string[] | null;
  focusAreas?: string[] | null;
  paymentModels?: string[] | null;
};

export type ChiropractorCompletenessResult = {
  isSearchReady: boolean;
  score: number;
  items: CompletenessItem[];
  missing: CompletenessKey[];
};

function hasText(v: string | null | undefined): boolean {
  return Boolean(v && v.trim().length > 0);
}

function hasAny(v: string[] | null | undefined): boolean {
  return Boolean(v && v.length > 0);
}

export function evaluateChiropractorSearchReadiness(
  input: ChiropractorCompletenessInput,
): ChiropractorCompletenessResult {
  const items: CompletenessItem[] = [
    {
      key: 'address',
      label: 'Practice address',
      complete: hasText(input.addressLine1) && hasText(input.city) && hasText(input.state) && hasText(input.zipCode),
    },
    {
      key: 'modalities',
      label: 'Techniques / modalities',
      complete: hasAny(input.modalities),
    },
    {
      key: 'philosophy',
      label: 'Philosophy',
      complete: hasAny(input.philosophies),
    },
    {
      key: 'focusAreas',
      label: 'Specialties / focus areas',
      complete: hasAny(input.focusAreas),
    },
    {
      key: 'businessModel',
      label: 'Business model',
      complete: hasAny(input.paymentModels),
    },
  ];

  const completeCount = items.filter((i) => i.complete).length;
  const score = Math.round((completeCount / items.length) * 100);
  const missing = items.filter((i) => !i.complete).map((i) => i.key);
  return {
    isSearchReady: missing.length === 0,
    score,
    items,
    missing,
  };
}
