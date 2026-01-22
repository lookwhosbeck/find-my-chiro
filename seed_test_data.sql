-- Seed data for testing the chiropractic matching algorithm
-- This matches your EXACT database schema
--
-- SAFE TO RUN MULTIPLE TIMES: All INSERT statements use ON CONFLICT DO NOTHING
-- to gracefully handle existing data without errors.
--
-- If you want to start fresh, truncate first:
-- TRUNCATE TABLE chiropractor_philosophies, chiropractor_payment_models,
--                chiropractor_focus_areas, chiropractor_modalities,
--                patient_preferred_philosophies, patient_preferred_payment_models,
--                patient_preferred_modalities, patient_preferred_focus_areas,
--                patient_preferred_insurances, patients, chiropractors, 
--                profiles, auth.users CASCADE;

-- ========================================
-- REFERENCE DATA (Lookup Tables)
-- ========================================

-- Insert modalities (techniques) - Skip if already exists
INSERT INTO modalities (name) VALUES
('Gonstead'),
('Diversified'),
('Activator'),
('TRT'),
('SOT'),
('Thompson'),
('Webster'),
('Cox'),
('Applied Kinesiology'),
('Logan Basic'),
('Palmer Package'),
('Upper Cervical')
ON CONFLICT (name) DO NOTHING;

-- Insert focus areas (specialties) - Skip if already exists
INSERT INTO focus_areas (name) VALUES
('Pediatrics'),
('Sports'),
('Auto Injury'),
('Wellness'),
('Prenatal'),
('Geriatric'),
('Neurological'),
('Orthopedic'),
('Rehabilitation'),
('Nutrition'),
('Stress Management'),
('Posture Correction')
ON CONFLICT (name) DO NOTHING;

-- Insert payment models - Skip if already exists
INSERT INTO payment_models (name) VALUES
('Cash'),
('Insurance'),
('Hybrid')
ON CONFLICT (name) DO NOTHING;

-- Insert philosophies - Skip if already exists
INSERT INTO philosophies (name) VALUES
('Evidence-Based'),
('Holistic'),
('Traditional'),
('Functional'),
('Sports Medicine'),
('Neurological'),
('Holistic Wellness'),
('Structural Correction'),
('Functional Medicine'),
('Integrative')
ON CONFLICT (name) DO NOTHING;

-- Insert insurances - Skip if already exists
INSERT INTO insurances (name) VALUES
('Blue Cross Blue Shield'),
('Aetna'),
('Cigna'),
('UnitedHealthcare'),
('Medicare'),
('Medicaid')
ON CONFLICT (name) DO NOTHING;

-- Insert languages - Skip if already exists
INSERT INTO languages (name) VALUES
('English'),
('Spanish'),
('Mandarin'),
('French'),
('Hindi')
ON CONFLICT (name) DO NOTHING;

-- Insert chiropractic colleges - Skip if already exists
INSERT INTO chiropractic_colleges (name, state) VALUES
('Palmer College of Chiropractic', 'IA'),
('Cleveland Chiropractic College', 'CA'),
('Life University', 'GA'),
('Parker University', 'TX'),
('Northwestern Health Sciences University', 'MN'),
('Texas Chiropractic College', 'TX'),
('Logan University', 'MO'),
('Southern California University of Health Sciences', 'CA')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- ORGANIZATIONS (Clinics)
-- ========================================

-- Insert organizations (matching your schema) - Skip if already exists (by name)
-- Note: Organizations table doesn't have unique constraint on name, so we'll check manually
INSERT INTO organizations (name, website, phone, city, state, zip_code, address_line_1)
SELECT * FROM (VALUES
  ('Downtown Chiropractic Center', 'https://downtownchiro.com', '212-555-0101', 'New York', 'NY', '10001', '123 Main St'),
  ('Suburban Wellness Clinic', 'https://suburbanwellness.com', '718-555-0202', 'Brooklyn', 'NY', '11201', '456 Oak Ave'),
  ('Sports Medicine Specialists', 'https://sportsmedny.com', '347-555-0303', 'Queens', 'NY', '11301', '789 Pine St'),
  ('Family Health Chiropractic', 'https://familyhealthchiro.com', '718-555-0404', 'Bronx', 'NY', '10401', '321 Elm St'),
  ('Holistic Healing Center', 'https://holistichealing.com', '718-555-0505', 'Staten Island', 'NY', '10301', '654 Maple Ave'),
  ('Precision Spine Care', 'https://precisionspine.com', '212-555-0606', 'Manhattan', 'NY', '10002', '987 Cedar St'),
  ('Wellness First Chiropractic', 'https://wellnessfirst.com', '718-555-0707', 'Long Island City', 'NY', '11101', '147 Birch St'),
  ('Advanced Chiropractic Solutions', 'https://advancedchiro.com', '718-555-0808', 'Brooklyn', 'NY', '11202', '258 Spruce Ave')
) AS v(name, website, phone, city, state, zip_code, address_line_1)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE organizations.name = v.name);

-- ========================================
-- CHIROPRACTOR PROFILES
-- ========================================

-- Create chiropractor user profiles - Skip if already exists
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'dr.sarah.johnson@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'dr.michael.chen@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'dr.emily.rodriguez@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'dr.david.williams@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'dr.lisa.patel@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'dr.mark.thompson@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'dr.jennifer.brown@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'dr.robert.davis@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert basic profiles for chiropractors - Skip if already exists
INSERT INTO profiles (id, first_name, last_name, email, role, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Johnson', 'dr.sarah.johnson@example.com', 'chiropractor', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Michael', 'Chen', 'dr.michael.chen@example.com', 'chiropractor', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Emily', 'Rodriguez', 'dr.emily.rodriguez@example.com', 'chiropractor', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'David', 'Williams', 'dr.david.williams@example.com', 'chiropractor', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Lisa', 'Patel', 'dr.lisa.patel@example.com', 'chiropractor', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Mark', 'Thompson', 'dr.mark.thompson@example.com', 'chiropractor', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Jennifer', 'Brown', 'dr.jennifer.brown@example.com', 'chiropractor', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Robert', 'Davis', 'dr.robert.davis@example.com', 'chiropractor', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert detailed chiropractor profiles (matching your schema) - Skip if already exists
INSERT INTO chiropractors (id, bio, years_in_practice, chiropractic_college, graduation_year, license_number, organization_id, accepting_new_patients, updated_at, website_url, instagram_handle, college_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Dr. Sarah Johnson is a dedicated chiropractor with over 10 years of experience specializing in family wellness and pediatric care. She uses evidence-based techniques to help patients achieve optimal health.', 12, 'Palmer College of Chiropractic', 2012, 'DC-12345-NY', (SELECT id FROM organizations WHERE name = 'Downtown Chiropractic Center'), true, NOW(), 'https://downtownchiro.com/dr-sarah', '@drsarahchiro', (SELECT id FROM chiropractic_colleges WHERE name = 'Palmer College of Chiropractic')),

('550e8400-e29b-41d4-a716-446655440002', 'Dr. Michael Chen focuses on sports medicine and athletic performance. He works with professional athletes and weekend warriors to optimize performance and prevent injuries.', 14, 'Cleveland Chiropractic College', 2010, 'DC-23456-NY', (SELECT id FROM organizations WHERE name = 'Suburban Wellness Clinic'), true, NOW(), 'https://suburbanwellness.com/dr-michael', '@drchenchiro', (SELECT id FROM chiropractic_colleges WHERE name = 'Cleveland Chiropractic College')),

('550e8400-e29b-41d4-a716-446655440003', 'Dr. Emily Rodriguez specializes in prenatal and pediatric chiropractic care. She helps expecting mothers and children achieve better health through gentle, effective treatments.', 10, 'Life University', 2014, 'DC-34567-NY', (SELECT id FROM organizations WHERE name = 'Sports Medicine Specialists'), true, NOW(), 'https://sportsmedny.com/dr-emily', '@dremilyrodriguez', (SELECT id FROM chiropractic_colleges WHERE name = 'Life University')),

('550e8400-e29b-41d4-a716-446655440004', 'Dr. David Williams is an expert in auto injury rehabilitation and pain management. He helps accident victims recover and regain their quality of life.', 16, 'Parker University', 2008, 'DC-45678-NY', (SELECT id FROM organizations WHERE name = 'Family Health Chiropractic'), true, NOW(), 'https://familyhealthchiro.com/dr-david', '@drdavidwilliams', (SELECT id FROM chiropractic_colleges WHERE name = 'Parker University')),

('550e8400-e29b-41d4-a716-446655440005', 'Dr. Lisa Patel takes a holistic approach to chiropractic care, combining traditional techniques with nutrition and lifestyle counseling for complete wellness.', 8, 'Northwestern Health Sciences University', 2016, 'DC-56789-NY', (SELECT id FROM organizations WHERE name = 'Holistic Healing Center'), true, NOW(), 'https://holistichealing.com/dr-lisa', '@drlisapchiro', (SELECT id FROM chiropractic_colleges WHERE name = 'Northwestern Health Sciences University')),

('550e8400-e29b-41d4-a716-446655440006', 'Dr. Mark Thompson specializes in neurological chiropractic care and works with patients dealing with chronic conditions and neurological disorders.', 15, 'Texas Chiropractic College', 2009, 'DC-67890-NY', (SELECT id FROM organizations WHERE name = 'Precision Spine Care'), true, NOW(), 'https://precisionspine.com/dr-mark', '@drthompsonchiro', (SELECT id FROM chiropractic_colleges WHERE name = 'Texas Chiropractic College')),

('550e8400-e29b-41d4-a716-446655440007', 'Dr. Jennifer Brown focuses on geriatric care and senior wellness. She helps older adults maintain mobility and independence through chiropractic care.', 13, 'Logan University', 2011, 'DC-78901-NY', (SELECT id FROM organizations WHERE name = 'Wellness First Chiropractic'), true, NOW(), 'https://wellnessfirst.com/dr-jennifer', '@drjenniferbrown', (SELECT id FROM chiropractic_colleges WHERE name = 'Logan University')),

('550e8400-e29b-41d4-a716-446655440008', 'Dr. Robert Davis is a sports medicine specialist working with athletes of all levels. He combines chiropractic care with rehabilitation exercises for optimal recovery.', 11, 'Southern California University of Health Sciences', 2013, 'DC-89012-NY', (SELECT id FROM organizations WHERE name = 'Advanced Chiropractic Solutions'), true, NOW(), 'https://advancedchiro.com/dr-robert', '@drrobertdavis', (SELECT id FROM chiropractic_colleges WHERE name = 'Southern California University of Health Sciences'))
ON CONFLICT (id) DO NOTHING;

-- Assign modalities to chiropractors - Skip if already exists
INSERT INTO chiropractor_modalities (chiropractor_id, modality_id) VALUES
-- Dr. Sarah Johnson - Evidence-based family practice
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM modalities WHERE name = 'Gonstead')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM modalities WHERE name = 'Diversified')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM modalities WHERE name = 'Activator')),

-- Dr. Michael Chen - Sports medicine
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM modalities WHERE name = 'Diversified')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM modalities WHERE name = 'Thompson')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM modalities WHERE name = 'Applied Kinesiology')),

-- Dr. Emily Rodriguez - Prenatal/Pediatric
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM modalities WHERE name = 'Webster')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM modalities WHERE name = 'Gonstead')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM modalities WHERE name = 'SOT')),

-- Dr. David Williams - Auto injury
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM modalities WHERE name = 'Diversified')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM modalities WHERE name = 'Cox')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM modalities WHERE name = 'Logan Basic')),

-- Dr. Lisa Patel - Holistic
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM modalities WHERE name = 'Gonstead')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM modalities WHERE name = 'SOT')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM modalities WHERE name = 'TRT')),

-- Dr. Mark Thompson - Neurological
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM modalities WHERE name = 'Upper Cervical')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM modalities WHERE name = 'Palmer Package')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM modalities WHERE name = 'Gonstead')),

-- Dr. Jennifer Brown - Geriatric
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM modalities WHERE name = 'Diversified')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM modalities WHERE name = 'Activator')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM modalities WHERE name = 'Logan Basic')),

-- Dr. Robert Davis - Sports medicine
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM modalities WHERE name = 'Diversified')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM modalities WHERE name = 'Thompson')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM modalities WHERE name = 'Applied Kinesiology'))
ON CONFLICT (chiropractor_id, modality_id) DO NOTHING;

-- Assign focus areas to chiropractors - Skip if already exists
INSERT INTO chiropractor_focus_areas (chiropractor_id, focus_area_id) VALUES
-- Dr. Sarah Johnson - Family/Pediatrics
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM focus_areas WHERE name = 'Pediatrics')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM focus_areas WHERE name = 'Wellness')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM focus_areas WHERE name = 'Nutrition')),

-- Dr. Michael Chen - Sports/Athletic
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM focus_areas WHERE name = 'Sports')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM focus_areas WHERE name = 'Orthopedic')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM focus_areas WHERE name = 'Rehabilitation')),

-- Dr. Emily Rodriguez - Prenatal/Pediatrics
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM focus_areas WHERE name = 'Pediatrics')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM focus_areas WHERE name = 'Prenatal')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM focus_areas WHERE name = 'Wellness')),

-- Dr. David Williams - Auto Injury
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM focus_areas WHERE name = 'Auto Injury')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM focus_areas WHERE name = 'Rehabilitation')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM focus_areas WHERE name = 'Orthopedic')),

-- Dr. Lisa Patel - Holistic
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM focus_areas WHERE name = 'Wellness')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM focus_areas WHERE name = 'Nutrition')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM focus_areas WHERE name = 'Stress Management')),

-- Dr. Mark Thompson - Neurological
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM focus_areas WHERE name = 'Neurological')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM focus_areas WHERE name = 'Rehabilitation')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM focus_areas WHERE name = 'Posture Correction')),

-- Dr. Jennifer Brown - Geriatric
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM focus_areas WHERE name = 'Geriatric')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM focus_areas WHERE name = 'Posture Correction')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM focus_areas WHERE name = 'Rehabilitation')),

-- Dr. Robert Davis - Sports
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM focus_areas WHERE name = 'Sports')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM focus_areas WHERE name = 'Orthopedic')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM focus_areas WHERE name = 'Rehabilitation'))
ON CONFLICT (chiropractor_id, focus_area_id) DO NOTHING;

-- Assign payment models to chiropractors - Skip if already exists
INSERT INTO chiropractor_payment_models (chiropractor_id, payment_model_id) VALUES
-- Most chiropractors accept multiple payment types
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM payment_models WHERE name = 'Cash')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM payment_models WHERE name = 'Insurance')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM payment_models WHERE name = 'Cash')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM payment_models WHERE name = 'Hybrid')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM payment_models WHERE name = 'Cash')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM payment_models WHERE name = 'Insurance')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM payment_models WHERE name = 'Insurance')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM payment_models WHERE name = 'Hybrid')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM payment_models WHERE name = 'Cash')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM payment_models WHERE name = 'Cash')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM payment_models WHERE name = 'Insurance')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM payment_models WHERE name = 'Cash')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM payment_models WHERE name = 'Insurance')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM payment_models WHERE name = 'Hybrid'))
ON CONFLICT (chiropractor_id, payment_model_id) DO NOTHING;

-- Assign philosophies to chiropractors - Skip if already exists
INSERT INTO chiropractor_philosophies (chiropractor_id, philosophy_id) VALUES
-- Dr. Sarah Johnson - Evidence-Based
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM philosophies WHERE name = 'Evidence-Based')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440001'), (SELECT id FROM philosophies WHERE name = 'Holistic Wellness')),

-- Dr. Michael Chen - Sports Medicine
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM philosophies WHERE name = 'Sports Medicine')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440002'), (SELECT id FROM philosophies WHERE name = 'Evidence-Based')),

-- Dr. Emily Rodriguez - Holistic
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM philosophies WHERE name = 'Holistic')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440003'), (SELECT id FROM philosophies WHERE name = 'Functional Medicine')),

-- Dr. David Williams - Traditional
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM philosophies WHERE name = 'Traditional')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440004'), (SELECT id FROM philosophies WHERE name = 'Structural Correction')),

-- Dr. Lisa Patel - Holistic
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM philosophies WHERE name = 'Holistic')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440005'), (SELECT id FROM philosophies WHERE name = 'Integrative')),

-- Dr. Mark Thompson - Neurological
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM philosophies WHERE name = 'Neurological')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440006'), (SELECT id FROM philosophies WHERE name = 'Functional')),

-- Dr. Jennifer Brown - Holistic Wellness
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM philosophies WHERE name = 'Holistic Wellness')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440007'), (SELECT id FROM philosophies WHERE name = 'Functional Medicine')),

-- Dr. Robert Davis - Sports Medicine
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM philosophies WHERE name = 'Sports Medicine')),
((SELECT id FROM chiropractors WHERE id = '550e8400-e29b-41d4-a716-446655440008'), (SELECT id FROM philosophies WHERE name = 'Evidence-Based'))
ON CONFLICT (chiropractor_id, philosophy_id) DO NOTHING;

-- ========================================
-- PATIENT PROFILES
-- ========================================

-- Create patient user profiles - Skip if already exists
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440011', 'john.doe@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440012', 'jane.smith@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440013', 'mike.johnson@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440014', 'sarah.wilson@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440015', 'alex.brown@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440016', 'emma.davis@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440017', 'chris.miller@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440018', 'lisa.garcia@example.com', '$2a$10$dummy.hash.for.testing', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert basic profiles for patients - Skip if already exists
INSERT INTO profiles (id, first_name, last_name, email, role, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440011', 'John', 'Doe', 'john.doe@example.com', 'patient', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440012', 'Jane', 'Smith', 'jane.smith@example.com', 'patient', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440013', 'Mike', 'Johnson', 'mike.johnson@example.com', 'patient', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440014', 'Sarah', 'Wilson', 'sarah.wilson@example.com', 'patient', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440015', 'Alex', 'Brown', 'alex.brown@example.com', 'patient', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440016', 'Emma', 'Davis', 'emma.davis@example.com', 'patient', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440017', 'Chris', 'Miller', 'chris.miller@example.com', 'patient', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440018', 'Lisa', 'Garcia', 'lisa.garcia@example.com', 'patient', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert detailed patient profiles (matching your schema - no arrays, use junction tables) - Skip if already exists
INSERT INTO patients (id, phone, date_of_birth, emergency_contact, emergency_phone, city, state, preferred_zip_code, search_radius, preferred_days, preferred_times, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440011', '555-0101', '1985-03-15', 'Jane Doe', '555-0102', 'Manhattan', 'NY', '10001', 15, ARRAY['Monday', 'Wednesday', 'Friday'], ARRAY['Morning', 'Afternoon'], NOW()),

('660e8400-e29b-41d4-a716-446655440012', '555-0201', '1990-07-22', 'Bob Smith', '555-0202', 'Brooklyn', 'NY', '11201', 20, ARRAY['Tuesday', 'Thursday'], ARRAY['Afternoon', 'Evening'], NOW()),

('660e8400-e29b-41d4-a716-446655440013', '555-0301', '1982-11-08', 'Mary Johnson', '555-0302', 'Queens', 'NY', '11301', 10, ARRAY['Monday', 'Thursday'], ARRAY['Morning'], NOW()),

('660e8400-e29b-41d4-a716-446655440014', '555-0401', '1978-05-30', 'Tom Wilson', '555-0402', 'Bronx', 'NY', '10401', 25, ARRAY['Monday', 'Tuesday', 'Wednesday'], ARRAY['Afternoon'], NOW()),

('660e8400-e29b-41d4-a716-446655440015', '555-0501', '1995-01-12', 'Sam Brown', '555-0502', 'Staten Island', 'NY', '10301', 30, ARRAY['Saturday'], ARRAY['Morning', 'Afternoon'], NOW()),

('660e8400-e29b-41d4-a716-446655440016', '555-0601', '1970-09-18', 'David Davis', '555-0602', 'Brooklyn', 'NY', '11202', 12, ARRAY['Wednesday', 'Friday'], ARRAY['Morning'], NOW()),

('660e8400-e29b-41d4-a716-446655440017', '555-0701', '1988-12-05', 'Rachel Miller', '555-0702', 'Long Island City', 'NY', '11101', 18, ARRAY['Tuesday', 'Thursday', 'Saturday'], ARRAY['Afternoon'], NOW()),

('660e8400-e29b-41d4-a716-446655440018', '555-0801', '1992-06-25', 'Carlos Garcia', '555-0802', 'Manhattan', 'NY', '10002', 22, ARRAY['Monday', 'Wednesday', 'Friday'], ARRAY['Evening'], NOW())
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that all data was inserted correctly
SELECT 'Chiropractors' as table_name, COUNT(*) as count FROM chiropractors
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
SELECT 'Organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'Modalities', COUNT(*) FROM modalities
UNION ALL
SELECT 'Focus Areas', COUNT(*) FROM focus_areas
UNION ALL
SELECT 'Payment Models', COUNT(*) FROM payment_models
UNION ALL
SELECT 'Philosophies', COUNT(*) FROM philosophies
UNION ALL
SELECT 'Insurances', COUNT(*) FROM insurances
UNION ALL
SELECT 'Languages', COUNT(*) FROM languages
UNION ALL
SELECT 'Chiropractic Colleges', COUNT(*) FROM chiropractic_colleges;

-- Test that chiropractor relationships work
SELECT
  'Test: Chiropractor relationships' as test_name,
  COUNT(DISTINCT c.id) as chiropractors_with_data
FROM chiropractors c
LEFT JOIN chiropractor_modalities cm ON c.id = cm.chiropractor_id
LEFT JOIN chiropractor_focus_areas cfa ON c.id = cfa.chiropractor_id
LEFT JOIN chiropractor_payment_models cpm ON c.id = cpm.chiropractor_id
LEFT JOIN chiropractor_philosophies cp ON c.id = cp.chiropractor_id
WHERE c.accepting_new_patients = true
AND (cm.modality_id IS NOT NULL OR cfa.focus_area_id IS NOT NULL OR cpm.payment_model_id IS NOT NULL OR cp.philosophy_id IS NOT NULL);

-- Test that patient preferences work
SELECT
  'Test: Patient preferences' as test_name,
  COUNT(DISTINCT p.id) as patients_with_preferences
FROM patients p
LEFT JOIN patient_preferred_modalities ppm ON p.id = ppm.patient_id
LEFT JOIN patient_preferred_focus_areas ppfa ON p.id = ppfa.patient_id
LEFT JOIN patient_preferred_payment_models pppm ON p.id = pppm.patient_id
WHERE ppm.modality_id IS NOT NULL OR ppfa.focus_area_id IS NOT NULL OR pppm.payment_model_id IS NOT NULL;

COMMIT;