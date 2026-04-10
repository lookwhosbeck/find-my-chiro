# Transactional Email Trigger Map

This project keeps email trigger ownership explicit and simple:

- Auth-owned events are sent by the Supabase Send Email hook.
- Product lifecycle events are sent by Next.js server routes/helpers.
- Scheduled nudges are sent by a cron route.

## Templates and triggers

| Template | Name | Trigger | Owner |
|---|---|---|---|
| 11 | E1 Email verification | user signup / verify flows | Supabase Send Email hook (`/api/webhooks/supabase-auth-email`) |
| 12 | E2 Welcome + Loom | first confirmed chiropractor login | `sendChiropractorWelcomeEmailIfNeeded()` |
| 13 | Password reset | recovery flow | Supabase Send Email hook |
| 14 | E3 Complete profile nudge | 48h after email confirmed AND required profile fields are incomplete | `/api/cron/chiropractor-profile-nudge` |
| 15 | E4 Profile is live | admin transition to `approved` license status | `PATCH /api/admin/chiropractors` |
| 16-20 | Referral emails | referral lifecycle events | Deferred until referral domain events are fully wired |

## Idempotency fields

- `profiles.chiropractor_welcome_email_sent_at` (E2)
- `profiles.profile_nudge_email_sent_at` (E3)
- `profiles.license_approved_email_sent_at` (E4)

Each sender helper follows the same pattern:

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
