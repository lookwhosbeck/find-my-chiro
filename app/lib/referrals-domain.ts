import type { PatientSearchFilters } from './queries';

/** Persisted referral lifecycle status (Postgres check constraint must stay in sync). */
export const REFERRAL_STATUSES = ['sent', 'viewed', 'accepted', 'declined'] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_EVENT_TYPES = ['created', 'emails_sent', 'viewed', 'accepted', 'declined'] as const;
export type ReferralEventType = (typeof REFERRAL_EVENT_TYPES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export type ReferralCreateInput = {
  receivingChiropractorId: string;
  patientEmail: string;
  patientFirstName: string;
  patientLastInitial: string;
  notes?: string | null;
  /** Client may send filters; server recomputes match score. */
  searchFilters: PatientSearchFilters;
};

export type ReferralValidationResult =
  | { ok: true; normalized: NormalizedReferralCreate }
  | { ok: false; error: string; field?: string };

export type NormalizedReferralCreate = {
  receivingChiropractorId: string;
  patientEmail: string;
  patientFirstName: string;
  patientLastInitial: string;
  notes: string | null;
  searchFilters: PatientSearchFilters;
};

export function normalizePatientLastInitial(raw: string): string {
  const t = raw.trim();
  if (t.length === 0) return '';
  return t.slice(0, 1).toUpperCase();
}

export function validateReferralCreate(input: ReferralCreateInput): ReferralValidationResult {
  const receivingChiropractorId = input.receivingChiropractorId?.trim() ?? '';
  if (!receivingChiropractorId) {
    return { ok: false, error: 'Receiving chiropractor is required.', field: 'receivingChiropractorId' };
  }

  const patientEmail = (input.patientEmail ?? '').trim().toLowerCase();
  if (!patientEmail || !EMAIL_RE.test(patientEmail)) {
    return { ok: false, error: 'Enter a valid patient email.', field: 'patientEmail' };
  }

  const patientFirstName = (input.patientFirstName ?? '').trim();
  if (!patientFirstName || patientFirstName.length > 100) {
    return { ok: false, error: 'Enter the patient first name.', field: 'patientFirstName' };
  }

  const li = (input.patientLastInitial ?? '').trim();
  if (li.length !== 1 || !/^[A-Za-z]$/.test(li)) {
    return {
      ok: false,
      error: 'Last initial must be exactly one letter (privacy-safe).',
      field: 'patientLastInitial',
    };
  }
  const patientLastInitial = li.toUpperCase();

  const notesRaw = input.notes?.trim();
  const notes = notesRaw && notesRaw.length > 0 ? notesRaw.slice(0, 4000) : null;

  const searchFilters = input.searchFilters && typeof input.searchFilters === 'object' ? input.searchFilters : {};

  return {
    ok: true,
    normalized: {
      receivingChiropractorId,
      patientEmail,
      patientFirstName,
      patientLastInitial,
      notes,
      searchFilters,
    },
  };
}

export function canTransitionReferralStatus(
  current: ReferralStatus,
  next: 'viewed' | 'accepted' | 'declined',
): boolean {
  if (current === 'accepted' || current === 'declined') return false;
  if (next === 'viewed') return current === 'sent';
  if (next === 'accepted' || next === 'declined') {
    return current === 'sent' || current === 'viewed';
  }
  return false;
}

export function nextStatusForAction(action: 'view' | 'accept' | 'decline'): ReferralStatus {
  if (action === 'view') return 'viewed';
  if (action === 'accept') return 'accepted';
  return 'declined';
}

/**
 * Human-readable summary of active search preferences for referral notes / email merge fields.
 */
export function buildSearchContextSummary(filters: PatientSearchFilters): string {
  const parts: string[] = [];
  const z = filters.zipCode?.trim();
  if (z) parts.push(`ZIP ${z}${filters.searchRadius != null ? ` · ${filters.searchRadius} mi radius` : ''}`);
  const mods = filters.preferredModalities?.filter(Boolean) ?? [];
  if (mods.length) parts.push(`Techniques: ${mods.join(', ')}`);
  const focus = filters.focusAreas?.filter(Boolean) ?? [];
  if (focus.length) parts.push(`Specialties: ${focus.join(', ')}`);
  const phil = filters.preferredPhilosophies?.filter(Boolean) ?? [];
  if (phil.length) parts.push(`Philosophy: ${phil.join(', ')}`);
  if (filters.preferredBusinessModel?.trim()) {
    parts.push(`Payment model preference: ${filters.preferredBusinessModel}`);
  }
  if (filters.insuranceType?.trim()) parts.push(`Insurance: ${filters.insuranceType.trim()}`);
  if (filters.budgetRange?.trim() && filters.budgetRange !== 'any') {
    parts.push(`Budget: ${filters.budgetRange}`);
  }
  return parts.length ? parts.join(' · ') : 'No specific search filters were saved with this referral.';
}
