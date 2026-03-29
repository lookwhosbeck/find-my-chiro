-- Store forward-geocoded coordinates for organizations (Mapbox / server-side geocoder).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS geocoded_at timestamptz,
  ADD COLUMN IF NOT EXISTS geocode_error text;

COMMENT ON COLUMN public.organizations.latitude IS 'WGS84 latitude from geocoding; preferred over ZIP centroid for map/distance.';
COMMENT ON COLUMN public.organizations.longitude IS 'WGS84 longitude from geocoding.';
COMMENT ON COLUMN public.organizations.geocoded_at IS 'When coordinates were last successfully written by geocoder.';
COMMENT ON COLUMN public.organizations.geocode_error IS 'Last geocoding failure message, if any; cleared on success.';
