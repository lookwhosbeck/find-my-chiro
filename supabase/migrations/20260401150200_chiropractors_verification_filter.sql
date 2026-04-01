-- =============================================================================
-- 2.1  Filter public chiropractor visibility by verification status
-- =============================================================================
-- Only 'approved' chiropractors appear in public search. The owner can still
-- see their own draft/pending/rejected profile on the account page.
--
-- New signups start as 'draft'. You approve them manually in the DB:
--   UPDATE chiropractors SET license_verification_status = 'approved' WHERE id = '<uuid>';
-- =============================================================================

BEGIN;

-- Replace the current USING (true) SELECT policy with a verification filter
DROP POLICY IF EXISTS "chiropractors_select_all" ON public.chiropractors;

-- Anon: can only see approved chiropractors (public directory / search)
CREATE POLICY "chiropractors_select_approved"
  ON public.chiropractors FOR SELECT
  TO anon
  USING (license_verification_status = 'approved');

-- Authenticated: see approved chiropractors + own row (for account page editing)
CREATE POLICY "chiropractors_select_approved_or_own"
  ON public.chiropractors FOR SELECT
  TO authenticated
  USING (license_verification_status = 'approved' OR id = auth.uid());

COMMIT;
