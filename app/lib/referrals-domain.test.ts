import { describe, expect, it } from 'vitest';

import {
  buildSearchContextSummary,
  canTransitionReferralStatus,
  normalizePatientLastInitial,
  validateReferralCreate,
} from './referrals-domain';

describe('validateReferralCreate', () => {
  const base = {
    receivingChiropractorId: 'uuid-1',
    patientEmail: 'pat@example.com',
    patientFirstName: 'Jane',
    patientLastInitial: 'S',
    searchFilters: { zipCode: '90210' },
  };

  it('accepts valid payload', () => {
    const r = validateReferralCreate(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized.patientEmail).toBe('pat@example.com');
      expect(r.normalized.patientLastInitial).toBe('S');
    }
  });

  it('rejects multi-char last initial', () => {
    const r = validateReferralCreate({ ...base, patientLastInitial: 'Sm' });
    expect(r.ok).toBe(false);
  });

  it('rejects digit last initial', () => {
    const r = validateReferralCreate({ ...base, patientLastInitial: '1' });
    expect(r.ok).toBe(false);
  });

  it('rejects invalid email', () => {
    const r = validateReferralCreate({ ...base, patientEmail: 'not-an-email' });
    expect(r.ok).toBe(false);
  });
});

describe('normalizePatientLastInitial', () => {
  it('takes first letter uppercase', () => {
    expect(normalizePatientLastInitial('smith')).toBe('S');
    expect(normalizePatientLastInitial(' s')).toBe('S');
  });
});

describe('canTransitionReferralStatus', () => {
  it('allows sent → viewed', () => {
    expect(canTransitionReferralStatus('sent', 'viewed')).toBe(true);
  });
  it('allows sent → accepted', () => {
    expect(canTransitionReferralStatus('sent', 'accepted')).toBe(true);
  });
  it('blocks accepted → declined', () => {
    expect(canTransitionReferralStatus('accepted', 'declined')).toBe(false);
  });
});

describe('buildSearchContextSummary', () => {
  it('includes zip and modalities', () => {
    const s = buildSearchContextSummary({
      zipCode: '55101',
      searchRadius: 25,
      preferredModalities: ['Gonstead'],
    });
    expect(s).toContain('55101');
    expect(s).toContain('Gonstead');
  });
});
