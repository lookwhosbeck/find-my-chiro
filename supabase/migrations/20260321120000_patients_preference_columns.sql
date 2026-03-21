-- Columns expected by patient signup + account preferences upsert (app/account, app/lib/auth).
-- Run via: supabase db push — or paste into SQL Editor if migrations are not applied.

alter table public.patients add column if not exists preferred_modalities text[];
alter table public.patients add column if not exists focus_areas text[];
alter table public.patients add column if not exists preferred_business_model text;
alter table public.patients add column if not exists insurance_type text;
alter table public.patients add column if not exists budget_range text;
