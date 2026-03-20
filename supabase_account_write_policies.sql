-- Optional RLS policies for account saves (practice, profile linkage)
-- Run in Supabase SQL Editor only after reviewing existing policies.
-- Symptom without these: "new row violates row-level security policy" or inserts that return no id.
--
-- If organizations or chiropractors already have RLS enabled, merge these with your rules.
-- Do not run ENABLE ROW LEVEL SECURITY blindly if the table is currently public.

-- ---------------------------------------------------------------------------
-- Chiropractors: users may insert/update only their own row (id = auth uid)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "account_chiropractors_insert_own" ON public.chiropractors;
CREATE POLICY "account_chiropractors_insert_own"
  ON public.chiropractors
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "account_chiropractors_update_own" ON public.chiropractors;
CREATE POLICY "account_chiropractors_update_own"
  ON public.chiropractors
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Organizations: create a practice row; update only org linked to your chiro row
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "account_organizations_insert_authenticated" ON public.organizations;
CREATE POLICY "account_organizations_insert_authenticated"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "account_organizations_update_linked" ON public.organizations;
CREATE POLICY "account_organizations_update_linked"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT c.organization_id
      FROM public.chiropractors c
      WHERE c.id = auth.uid()
        AND c.organization_id IS NOT NULL
    )
  )
  WITH CHECK (
    id IN (
      SELECT c.organization_id
      FROM public.chiropractors c
      WHERE c.id = auth.uid()
        AND c.organization_id IS NOT NULL
    )
  );

-- After INSERT, the client calls .select('id'). That requires a SELECT policy that can see
-- the new row. Many projects already allow SELECT on organizations for search (public read).
-- If you get RLS errors only on select after insert, add e.g. created_by uuid on organizations,
-- set it from the app on insert, and CREATE POLICY ... FOR SELECT USING (created_by = auth.uid()).
