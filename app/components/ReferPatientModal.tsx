'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Dialog, Flex, Text, TextArea, TextField } from '@radix-ui/themes';

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

  const reset = useCallback(() => {
    setPatientEmail('');
    setPatientFirstName('');
    setPatientLastInitial('');
    setNotes('');
    setFormError(null);
    setDone(false);
    setBusy(false);
    setEmailWarning(null);
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
      setDone(true);
    } finally {
      setBusy(false);
    }
  }, [notes, patientEmail, patientFirstName, patientLastInitial, receivingChiropractorId, searchFilters]);

  const matchHint =
    clientMatchScore != null && Number.isFinite(clientMatchScore)
      ? `Match from this search (for your notes): ${Math.round(clientMatchScore)}%`
      : null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 440 }} aria-describedby={undefined}>
        <Dialog.Title>Refer a patient</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          To {receivingDoctorLabel}. The patient does not need a Movyn account. Use first name and one letter for last
          initial only.
        </Dialog.Description>

        {done ? (
          <Flex direction="column" gap="3">
            {emailWarning ? (
              <Text size="2" color="orange">
                Referral saved, but email delivery had an issue: {emailWarning}
              </Text>
            ) : (
              <Text size="2" color="green">
                Referral sent. Confirmation emails go to you, the patient, and the receiving doctor when Brevo is
                configured.
              </Text>
            )}
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" gap="3">
            {matchHint ? (
              <Text size="1" color="gray">
                {matchHint}
              </Text>
            ) : null}
            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="ref-patient-email">
                Patient email
              </Text>
              <TextField.Root
                id="ref-patient-email"
                type="email"
                autoComplete="email"
                placeholder="patient@email.com"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                mt="1"
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="ref-patient-first">
                Patient first name
              </Text>
              <TextField.Root
                id="ref-patient-first"
                autoComplete="given-name"
                placeholder="First name"
                value={patientFirstName}
                onChange={(e) => setPatientFirstName(e.target.value)}
                mt="1"
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="ref-patient-li">
                Last initial (one letter)
              </Text>
              <TextField.Root
                id="ref-patient-li"
                maxLength={1}
                placeholder="S"
                value={patientLastInitial}
                onChange={(e) => handleLastInitialChange(e.target.value)}
                mt="1"
                style={{ maxWidth: 64, textTransform: 'uppercase' }}
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="ref-notes">
                Notes for the receiving doctor (optional)
              </Text>
              <TextArea
                id="ref-notes"
                placeholder="Clinical context you are comfortable sharing…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                mt="1"
                rows={3}
              />
            </Box>
            {formError ? (
              <Text size="2" color="red">
                {formError}
              </Text>
            ) : null}
            <Flex gap="2" justify="end" mt="2">
              <Button type="button" variant="soft" color="gray" disabled={busy} onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={() => void handleSubmit()}>
                {busy ? 'Sending…' : 'Send referral'}
              </Button>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
