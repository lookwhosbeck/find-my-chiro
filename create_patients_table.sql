-- Create patients table for storing patient preferences and matching data
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_modalities TEXT[], -- Array of preferred chiropractic modalities
  health_focus_areas TEXT[], -- Array of health conditions/symptoms seeking treatment for
  preferred_business_model TEXT, -- 'cash', 'insurance', or 'hybrid'
  insurance_coverage TEXT[], -- Array of insurance providers the patient has
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policy for patients to read/write their own data
CREATE POLICY "Patients can view their own data" ON public.patients
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Patients can update their own data" ON public.patients
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Patients can insert their own data" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policy for chiropractors to read patient data (for matching purposes)
-- This allows chiropractors to see patient preferences for matching
CREATE POLICY "Chiropractors can view patient preferences for matching" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chiropractor'
    )
  );

-- Create index for efficient matching queries
CREATE INDEX IF NOT EXISTS idx_patients_modalities ON public.patients USING GIN(preferred_modalities);
CREATE INDEX IF NOT EXISTS idx_patients_focus_areas ON public.patients USING GIN(health_focus_areas);
CREATE INDEX IF NOT EXISTS idx_patients_business_model ON public.patients(preferred_business_model);
CREATE INDEX IF NOT EXISTS idx_patients_insurance ON public.patients USING GIN(insurance_coverage);
CREATE INDEX IF NOT EXISTS idx_patients_location ON public.patients(city, state, zip);