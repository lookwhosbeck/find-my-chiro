'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { createReferralRequest } from '@/app/lib/referral-client';
import type { PatientSearchFilters } from '@/app/lib/queries';
import { normalizePatientLastInitial, validateReferralCreate } from '@/app/lib/referrals-domain';

export type ReferPatientModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivingChiropractorId: string;
  receivingDoctorLabel: string;
  searchFilters: PatientSearchFilters;
  /** Shown for context only; server recomputes match score. */
  clientMatchScore?: number | null;
};

export function ReferPatientModal({
  open,
  onOpenChange,
  receivingChiropractorId,
  receivingDoctorLabel,
  searchFilters,
  clientMatchScore,
}: ReferPatientModalProps) {
  const [patientEmail, setPatientEmail] = useState('');
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientLastInitial, setPatientLastInitial] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [referralReloadFailed, setReferralReloadFailed] = useState(false);

  const reset = useCallback(() => {
    setPatientEmail('');
    setPatientFirstName('');
    setPatientLastInitial('');
    setNotes('');
    setFormError(null);
    setDone(false);
    setBusy(false);
    setEmailWarning(null);
    setReferralReloadFailed(false);
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  const handleLastInitialChange = useCallback((raw: string) => {
    const one = normalizePatientLastInitial(raw);
    setPatientLastInitial(one.slice(0, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    const v = validateReferralCreate({
      receivingChiropractorId,
      patientEmail,
      patientFirstName,
      patientLastInitial,
      notes,
      searchFilters,
    });
    if (v.ok === false) {
      setFormError(v.error);
      return;
    }
    setBusy(true);
    try {
      const result = await createReferralRequest({
        receivingChiropractorId,
        patientEmail: v.normalized.patientEmail,
        patientFirstName: v.normalized.patientFirstName,
        patientLastInitial: v.normalized.patientLastInitial,
        notes: v.normalized.notes ?? undefined,
        searchFilters: v.normalized.searchFilters as Record<string, unknown>,
      });
      if (result.ok === false) {
        setFormError(result.error);
        return;
      }
      setEmailWarning(result.emailWarning ?? null);
      setReferralReloadFailed(Boolean(result.referralReloadFailed));
      setDone(true);
    } finally {
      setBusy(false);
    }
  }, [
    notes,
    patientEmail,
    patientFirstName,
    patientLastInitial,
    receivingChiropractorId,
    searchFilters,
  ]);

  const matchHint =
    clientMatchScore != null && Number.isFinite(clientMatchScore)
      ? `Match from this search (for your notes): ${Math.round(clientMatchScore)}%`
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Refer a patient</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            To {receivingDoctorLabel}. The patient does not need a Movyn account. Use first name
            and one letter for last initial only.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col gap-3">
            {referralReloadFailed ? (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Referral was saved, but we could not load the updated record. Open Account →
                Referrals to confirm, and do not submit this form again for the same patient.
              </p>
            ) : null}
            {emailWarning ? (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Referral saved, but email delivery had an issue: {emailWarning}
              </p>
            ) : null}
            {!referralReloadFailed && !emailWarning ? (
              <p className="text-sm text-green-700 dark:text-green-400">
                Referral sent. Confirmation emails go to you, the patient, and the receiving doctor
                when Brevo is configured.
              </p>
            ) : null}
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {matchHint ? (
              <p className="text-xs text-muted-foreground">{matchHint}</p>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="ref-patient-email" className="text-sm font-semibold">
                Patient email
              </Label>
              <Input
                id="ref-patient-email"
                type="email"
                autoComplete="email"
                placeholder="patient@email.com"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ref-patient-first" className="text-sm font-semibold">
                Patient first name
              </Label>
              <Input
                id="ref-patient-first"
                autoComplete="given-name"
                placeholder="First name"
                value={patientFirstName}
                onChange={(e) => setPatientFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ref-patient-li" className="text-sm font-semibold">
                Last initial (one letter)
              </Label>
              <Input
                id="ref-patient-li"
                maxLength={1}
                placeholder="S"
                value={patientLastInitial}
                onChange={(e) => handleLastInitialChange(e.target.value)}
                className="max-w-16 uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ref-notes" className="text-sm font-semibold">
                Notes for the receiving doctor (optional)
              </Label>
              <Textarea
                id="ref-notes"
                placeholder="Clinical context you are comfortable sharing…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={() => void handleSubmit()}>
                {busy ? 'Sending…' : 'Send referral'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
