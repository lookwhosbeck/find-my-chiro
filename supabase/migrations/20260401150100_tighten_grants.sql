-- =============================================================================
-- 1.3  Tighten table-level GRANT permissions
-- =============================================================================
-- Reduces GRANT ALL → least-privilege per table. If RLS were ever accidentally
-- disabled, these grants limit what each role can do at the SQL level.
--
-- service_role keeps GRANT ALL on every table (unchanged).
-- =============================================================================

BEGIN;

-- ─── Lookup / reference tables: SELECT only ────────────────────────────────
REVOKE ALL ON TABLE public.certifications FROM anon, authenticated;
GRANT SELECT ON TABLE public.certifications TO anon, authenticated;

REVOKE ALL ON TABLE public.chiropractic_colleges FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractic_colleges TO anon, authenticated;

REVOKE ALL ON TABLE public.modalities FROM anon, authenticated;
GRANT SELECT ON TABLE public.modalities TO anon, authenticated;

REVOKE ALL ON TABLE public.focus_areas FROM anon, authenticated;
GRANT SELECT ON TABLE public.focus_areas TO anon, authenticated;

REVOKE ALL ON TABLE public.payment_models FROM anon, authenticated;
GRANT SELECT ON TABLE public.payment_models TO anon, authenticated;

REVOKE ALL ON TABLE public.philosophies FROM anon, authenticated;
GRANT SELECT ON TABLE public.philosophies TO anon, authenticated;

REVOKE ALL ON TABLE public.insurances FROM anon, authenticated;
GRANT SELECT ON TABLE public.insurances TO anon, authenticated;

REVOKE ALL ON TABLE public.languages FROM anon, authenticated;
GRANT SELECT ON TABLE public.languages TO anon, authenticated;

-- ─── profiles: anon SELECT, authenticated SELECT/INSERT/UPDATE ─────────────
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- ─── chiropractors: anon SELECT, authenticated SELECT/INSERT/UPDATE ────────
REVOKE ALL ON TABLE public.chiropractors FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractors TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.chiropractors TO authenticated;

-- ─── patients: authenticated only (no anon access) ─────────────────────────
REVOKE ALL ON TABLE public.patients FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.patients TO authenticated;

-- ─── organizations: anon SELECT, authenticated SELECT/INSERT/UPDATE ────────
REVOKE ALL ON TABLE public.organizations FROM anon, authenticated;
GRANT SELECT ON TABLE public.organizations TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.organizations TO authenticated;

-- ─── checkout_signup_claims: service_role only ─────────────────────────────
REVOKE ALL ON TABLE public.checkout_signup_claims FROM anon, authenticated;

-- ─── Chiropractor junction tables: anon SELECT, auth SELECT/INSERT/DELETE ──
REVOKE ALL ON TABLE public.chiropractor_certifications FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractor_certifications TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.chiropractor_certifications TO authenticated;

REVOKE ALL ON TABLE public.chiropractor_focus_areas FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractor_focus_areas TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.chiropractor_focus_areas TO authenticated;

REVOKE ALL ON TABLE public.chiropractor_insurances FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractor_insurances TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.chiropractor_insurances TO authenticated;

REVOKE ALL ON TABLE public.chiropractor_languages FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractor_languages TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.chiropractor_languages TO authenticated;

REVOKE ALL ON TABLE public.chiropractor_modalities FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractor_modalities TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.chiropractor_modalities TO authenticated;

REVOKE ALL ON TABLE public.chiropractor_payment_models FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractor_payment_models TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.chiropractor_payment_models TO authenticated;

REVOKE ALL ON TABLE public.chiropractor_philosophies FROM anon, authenticated;
GRANT SELECT ON TABLE public.chiropractor_philosophies TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.chiropractor_philosophies TO authenticated;

-- ─── Patient preference junction tables: authenticated only, no anon ───────
REVOKE ALL ON TABLE public.patient_preferred_focus_areas FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.patient_preferred_focus_areas TO authenticated;

REVOKE ALL ON TABLE public.patient_preferred_insurances FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.patient_preferred_insurances TO authenticated;

REVOKE ALL ON TABLE public.patient_preferred_modalities FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.patient_preferred_modalities TO authenticated;

REVOKE ALL ON TABLE public.patient_preferred_payment_models FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.patient_preferred_payment_models TO authenticated;

REVOKE ALL ON TABLE public.patient_preferred_philosophies FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.patient_preferred_philosophies TO authenticated;

COMMIT;
