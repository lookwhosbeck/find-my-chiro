import { supabase } from './supabase';

export interface Chiropractor {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  philosophy?: string;
  /** Declared practice philosophies from DB (preferred for matching). */
  philosophies?: string[];
  modality?: string;
  modalities?: string[];
  focusAreas?: string[];
  businessModel?: string;
  /** All payment models from DB (lowercase), when available — used for matching. */
  paymentModels?: string[];
  clinicName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  /** Practice / organization contact and address (public profile). */
  addressLine1?: string;
  practicePhone?: string;
  practiceWebsite?: string;
  chiropracticCollege?: string;
  graduationYear?: number;
  licenseNumber?: string;
  budgetRange?: string | null;
  acceptingPatients?: boolean;
  avatarUrl?: string;
  matchScore?: number;
  /** Miles from search ZIP when radius search ran (server-computed). */
  distanceMiles?: number;
  /** Latitude: geocoded org coords when set, else ZIP centroid for map/distance. */
  latitude?: number;
  /** Longitude: geocoded org coords when set, else ZIP centroid for map/distance. */
  longitude?: number;
}

export interface PatientSearchFilters {
  zipCode?: string;
  preferredModalities?: string[];
  focusAreas?: string[];
  preferredBusinessModel?: string;
  insuranceType?: string;
  budgetRange?: string;
  searchRadius?: number;
  city?: string;
  state?: string;
  preferredPhilosophies?: string[];
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  preferredModalities?: string[];
  focusAreas?: string[];
  preferredBusinessModel?: string;
  insuranceType?: string;
  budgetRange?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  searchRadius?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
  avatarUrl?: string;
}

/**
 * Fetch chiropractors from the database
 * Assumes a table named 'chiropractors' or 'profiles' with chiropractor data
 */
export async function getChiropractors(limit: number = 4): Promise<Chiropractor[]> {
  try {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('Supabase not configured. Returning empty array.');
      return [];
    }

    // Try 'chiropractors' table first, fallback to 'profiles' if needed
    const { data, error } = await supabase
      .from('chiropractors')
      .select(`
        *,
        profiles!inner(id, first_name, last_name, avatar_url),
        organizations(name, city, state, zip_code, phone, website, address_line_1, latitude, longitude),
        chiropractor_modalities(modalities(name)),
        chiropractor_focus_areas(focus_areas(name)),
        chiropractor_payment_models(payment_models(name)),
        chiropractor_philosophies(philosophies(name))
      `)
      .eq('accepting_new_patients', true)
      .limit(limit)
      .order('updated_at', { ascending: false });

    if (error) {
      // If chiropractors table doesn't exist, try profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false });

      if (profileError) {
        console.error('Error fetching chiropractors:', profileError);
        return [];
      }

      return mapProfileDataToChiropractor(profileData || []);
    }

    return mapChiropractorDataFromNormalizedSchema(data || []);
  } catch (error) {
    console.error('Error fetching chiropractors:', error);
    return [];
  }
}

function toFiniteNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Map database data to Chiropractor interface from normalized schema
 */
export function mapChiropractorDataFromNormalizedSchema(data: any[]): Chiropractor[] {
  return data.map((item) => {
    // Extract modalities from joined data
    const modalities: string[] = item.chiropractor_modalities?.map((cm: any) => cm.modalities?.name).filter(Boolean) || [];

    // Extract focus areas from joined data
    const focusAreas: string[] = item.chiropractor_focus_areas?.map((cfa: any) => cfa.focus_areas?.name).filter(Boolean) || [];

    // Extract payment models from joined data
    const paymentModels: string[] = item.chiropractor_payment_models?.map((cpm: any) => cpm.payment_models?.name).filter(Boolean) || [];
    const paymentModelsLower = paymentModels.map((n) => n.toLowerCase());

    const philosophies: string[] =
      item.chiropractor_philosophies?.map((cp: any) => cp.philosophies?.name).filter(Boolean) || [];

    return {
      id: item.id?.toString() || '',
      firstName: item.profiles?.first_name || '',
      lastName: item.profiles?.last_name || '',
      bio: item.bio || '',
      philosophy: philosophies[0] || getPhilosophyFromModalities(modalities),
      philosophies: philosophies.length > 0 ? philosophies : undefined,
      modality: getPrimaryModality(modalities),
      modalities: modalities,
      clinicName: item.organizations?.name || '',
      city: item.organizations?.city || '',
      state: item.organizations?.state || '',
      addressLine1: item.organizations?.address_line_1 || undefined,
      practicePhone: item.organizations?.phone || undefined,
      practiceWebsite: item.organizations?.website || undefined,
      chiropracticCollege: item.chiropractic_college || undefined,
      graduationYear: typeof item.graduation_year === 'number' ? item.graduation_year : undefined,
      licenseNumber: item.license_number || undefined,
      budgetRange: item.budget_range ?? undefined,
      acceptingPatients: item.accepting_new_patients ?? true,
      avatarUrl: item.profiles?.avatar_url || null,
      focusAreas: focusAreas,
      businessModel: paymentModelsLower[0],
      paymentModels: paymentModelsLower.length > 0 ? paymentModelsLower : undefined,
      zipCode: item.organizations?.zip_code || undefined,
      latitude: toFiniteNumber(item.organizations?.latitude),
      longitude: toFiniteNumber(item.organizations?.longitude),
    };
  });
}

/**
 * Map profile data to Chiropractor interface (if using profiles table)
 */
function mapProfileDataToChiropractor(data: any[]): Chiropractor[] {
  return data.map((item) => {
    // Handle modalities - could be JSON array or string array
    let modalities: string[] = [];
    if (Array.isArray(item.modalities)) {
      modalities = item.modalities;
    } else if (typeof item.modalities === 'string') {
      try {
        modalities = JSON.parse(item.modalities);
      } catch {
        modalities = item.modalities ? [item.modalities] : [];
      }
    }

    return {
      id: item.id?.toString() || '',
      firstName: item.first_name || item.firstName || '',
      lastName: item.last_name || item.lastName || '',
      bio: item.bio || '',
      philosophy: item.philosophy || getPhilosophyFromModalities(modalities),
      modality: item.modality || getPrimaryModality(modalities),
      modalities: modalities,
      clinicName: item.clinic_name || item.clinicName || '',
      city: item.city || '',
      state: item.state || '',
      acceptingPatients: item.accepting_patients ?? item.acceptingPatients ?? true,
      avatarUrl: item.avatar_url || item.avatarUrl || null,
    };
  });
}

/**
 * Helper to extract philosophy from modalities or return default
 */
function getPhilosophyFromModalities(modalities: string[] | null | undefined): string {
  if (!modalities || !Array.isArray(modalities)) return 'Evidence-Based';
  // You can add logic here to determine philosophy based on modalities
  return 'Evidence-Based';
}

/**
 * Helper to get primary modality from array
 */
function getPrimaryModality(modalities: string[] | null | undefined): string {
  if (!modalities || !Array.isArray(modalities) || modalities.length === 0) {
    return 'Diversified';
  }
  return modalities[0];
}

export interface ChiropracticCollege {
  id: number;
  name: string;
  state?: string;
  websiteUrl?: string;
  logoUrl?: string;
}

/**
 * Search chiropractors based on patient preferences and matching algorithm.
 * Runs on the server: prefers org lat/lng from DB (Mapbox geocode), else ZIP centroids + radius.
 */
export async function searchChiropractors(filters: PatientSearchFilters, limit: number = 20): Promise<Chiropractor[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('Supabase not configured. Returning empty array.');
      return [];
    }

    const searchUrl = (() => {
      if (typeof window !== 'undefined') {
        return '/api/search-chiropractors';
      }
      const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
      if (explicit) {
        return `${explicit.replace(/\/$/, '')}/api/search-chiropractors`;
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}/api/search-chiropractors`;
      }
      return 'http://localhost:3000/api/search-chiropractors';
    })();

    const res = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters, limit }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Search request failed:', res.status);
      return [];
    }

    return (await res.json()) as Chiropractor[];
  } catch (error) {
    console.error('Error searching chiropractors:', error);
    return [];
  }
}

/**
 * Fetch chiropractic colleges from the database
 */
export async function getChiropracticColleges(): Promise<ChiropracticCollege[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('Supabase not configured. Returning empty array.');
      return [];
    }

    const { data, error } = await supabase
      .from('chiropractic_colleges')
      .select('id, name, state, website_url, logo_url')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching chiropractic colleges:', error);
      return [];
    }    return (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      state: item.state || undefined,
      websiteUrl: item.website_url || undefined,
      logoUrl: item.logo_url || undefined,
    }));
  } catch (error) {
    console.error('Error fetching chiropractic colleges:', error);
    return [];
  }
}