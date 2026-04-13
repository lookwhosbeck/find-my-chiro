-- Patient referrals between chiropractors (server-side API + service_role; RLS on, no policies = deny direct client access).

BEGIN;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  referring_chiropractor_id uuid NOT NULL REFERENCES public.chiropractors (id) ON DELETE RESTRICT,
  receiving_chiropractor_id uuid NOT NULL REFERENCES public.chiropractors (id) ON DELETE RESTRICT,

  patient_email text NOT NULL,
  patient_first_name text NOT NULL,
  patient_last_initial text NOT NULL,
  notes text,

  search_filters_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_summary text,

  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'viewed', 'accepted', 'declined')),

  viewed_at timestamptz,
  responded_at timestamptz,

  patient_intro_email_sent_at timestamptz,
  referring_copy_email_sent_at timestamptz,
  receiving_dc_email_sent_at timestamptz,

  CONSTRAINT referrals_no_self_referral CHECK (referring_chiropractor_id <> receiving_chiropractor_id),
  CONSTRAINT referrals_patient_last_initial_one_alpha CHECK (
    char_length(patient_last_initial) = 1 AND patient_last_initial ~ '^[A-Za-z]$'
  ),
  CONSTRAINT referrals_patient_email_trimmed CHECK (
    patient_email = lower(trim(patient_email)) AND length(trim(patient_email)) > 3
  )
);

COMMENT ON TABLE public.referrals IS 'Chiropractor-to-chiropractor patient referrals; accessed via Next.js API using service role after JWT verification.';

CREATE INDEX IF NOT EXISTS referrals_referring_created_idx
  ON public.referrals (referring_chiropractor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS referrals_receiving_created_idx
  ON public.referrals (receiving_chiropractor_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.referrals_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referrals_set_updated_at ON public.referrals;
CREATE TRIGGER referrals_set_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE PROCEDURE public.referrals_set_updated_at();

-- Append-only audit trail (inserted by API / service_role).
CREATE TABLE IF NOT EXISTS public.referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('created', 'emails_sent', 'viewed', 'accepted', 'declined')),
  actor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS referral_events_referral_created_idx
  ON public.referral_events (referral_id, created_at ASC);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.referrals FROM anon, authenticated;
REVOKE ALL ON TABLE public.referral_events FROM anon, authenticated;

COMMIT;
