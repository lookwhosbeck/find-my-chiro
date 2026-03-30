-- Add unique constraint to the license_number column in the chiropractors table
ALTER TABLE public.chiropractors
ADD CONSTRAINT chiropractors_license_number_key UNIQUE (license_number);
