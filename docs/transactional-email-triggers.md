# Transactional Email Trigger Map

This project keeps email trigger ownership explicit and simple:

- Auth-owned events are sent by the Supabase Send Email hook.
- Product lifecycle events are sent by Next.js server routes/helpers.
- Scheduled nudges are sent by a cron route.

## Product stance: referral accept / decline outcomes

**Dashboard-first:** When a receiving chiropractor accepts or declines, the canonical state is `referrals.status` plus `referral_events`. The referring chiropractor sees this under **Account → Referrals** without depending on email.

**Optional outcome email:** `BREVO_REFERRAL_ACCEPTED_TEMPLATE_ID` and `BREVO_REFERRAL_DECLINED_TEMPLATE_ID` are **optional**. If unset, `sendReferralOutcomeEmailToReferringIfNeeded()` does nothing; the workflow is still complete. Use them only when you want a lightweight push notification in addition to the dashboard (see [`app/lib/referral-emails.server.ts`](../app/lib/referral-emails.server.ts)).

**Not the same as longitudinal follow-up:** A separate question is “did the patient continue care weeks later?” (e.g. a 60-day check-in). That requires **different** Brevo templates, consent/copy, and merge params. Do **not** map those campaigns onto the accept/decline env vars.

## Templates and triggers

Numeric IDs below match the current Brevo transactional templates (names as in Brevo). If you duplicate the account, re-map IDs in env.

| Template ID | Name (Brevo) | Trigger | Owner |
|---|---|---|---|
| 11 | E1 Email verification | user signup / verify flows | Supabase Send Email hook (`/api/webhooks/supabase-auth-email`) |
| 12 | E2 Welcome + Loom | first confirmed chiropractor login | `sendChiropractorWelcomeEmailIfNeeded()` |
| 13 | Password reset | recovery flow | Supabase Send Email hook |
| 14 | E3 Complete profile nudge | 48h after email confirmed AND required profile fields are incomplete | `/api/cron/chiropractor-profile-nudge` |
| 15 | E4 Profile is live | admin transition to `approved` license status | `PATCH /api/admin/chiropractors` |
| 17 | E6 Patient Intro (HIPAA-Safe) | `POST /api/referrals` after row insert | `sendInitialReferralEmailsIfNeeded()` → `BREVO_REFERRAL_PATIENT_TEMPLATE_ID` |
| 16 | E5 Referral Sent Confirmation (referring DC) | same | `BREVO_REFERRAL_SENDER_COPY_TEMPLATE_ID` |
| 18 | E7 New Referral Received (receiving DC) | same | `BREVO_REFERRAL_RECEIVING_DC_TEMPLATE_ID` |
| — | *(optional)* Accept / decline notify referring | `POST /api/referrals/respond` | `BREVO_REFERRAL_ACCEPTED_TEMPLATE_ID` / `BREVO_REFERRAL_DECLINED_TEMPLATE_ID` (omit to skip) |
| 19 | E8 60-Day Outcome Check | *(not wired in app)* | Longitudinal product; separate spec — do not use as accept/decline |
| 20 | E9 First Referral Received Milestone | *(not wired in app)* | Engagement; separate from referral respond flow |

Template HTML merge fields must match what the app sends (or add aliases in code). The intro trio in Brevo often expects names like `params.referringDocName`; the referral sender currently passes different keys — align templates or [`buildParams` in referral-emails.server.ts](../app/lib/referral-emails.server.ts) before go-live.

## Longitudinal / patient follow-up (future)

If you add “did they continue care?” flows:

- **Separate** Brevo templates from immediate accept/decline.
- Define **consent** for any patient-facing message and keep copy HIPAA-safe.
- Pass explicit params (e.g. outcome URLs, patient initials) from a dedicated cron or lifecycle job — not from `applyReferralResponse`.

## Idempotency fields

- `profiles.chiropractor_welcome_email_sent_at` (E2)
- `profiles.profile_nudge_email_sent_at` (E3)
- `profiles.license_approved_email_sent_at` (E4)
- `referrals.patient_intro_email_sent_at`, `referrals.referring_copy_email_sent_at`, `referrals.receiving_dc_email_sent_at` (referral intro trio)

Outcome notify emails (if enabled) are **not** idempotency-stamped in the DB today; they fire once per successful `applyReferralResponse` call. Rely on referral status transitions (409 if already answered) to prevent duplicate responses, not duplicate emails from retries of the same action.

Each intro sender helper follows the same pattern:

1. Confirm eligible state.
2. Confirm matching `*_sent_at` is null.
3. Send email via Brevo template.
4. Write `*_sent_at` timestamp.

## Completeness gate (used for E3 + UI)

`evaluateChiropractorSearchReadiness()` requires:

- Practice address (`address_line_1`, `city`, `state`, `zip_code`)
- At least one modality
- At least one philosophy
- At least one focus area
- At least one payment/business model

The same evaluator is used in the account Welcome UI and the E3 cron route to avoid logic drift.
