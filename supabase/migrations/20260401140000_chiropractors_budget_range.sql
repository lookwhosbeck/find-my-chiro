-- Add budget_range column to chiropractors table.
-- This column already exists on the patients table; chiropractors need it too
-- so providers can indicate their typical per-visit price range.

ALTER TABLE public.chiropractors
  ADD COLUMN IF NOT EXISTS budget_range text;

COMMENT ON COLUMN public.chiropractors.budget_range
  IS 'Provider''s typical per-visit price range (e.g. under-50, 50-100, 100-150, over-150).';
