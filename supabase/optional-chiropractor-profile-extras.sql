-- Optional: run in Supabase SQL editor if these are missing.
-- Enables insurance + budget fields edited on Account → Specialties.

alter table chiropractors add column if not exists budget_range text;

create table if not exists chiropractor_insurances (
  chiropractor_id uuid not null references chiropractors (id) on delete cascade,
  insurance_id uuid not null references insurances (id) on delete cascade,
  primary key (chiropractor_id, insurance_id)
);
