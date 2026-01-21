import { supabase } from './supabase';

export interface Chiropractor {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  philosophy?: string;
  modality?: string;
  modalities?: string[];
  focusAreas?: string[];
  businessModel?: string;
  clinicName?: string;
  city?: string;
  state?: string;
  acceptingPatients?: boolean;
  avatarUrl?: string;
  matchScore?: number;
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
        organizations(id, name, city, state, zip_code),
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

/**
 * Map database data to Chiropractor interface from normalized schema
 */
function mapChiropractorDataFromNormalizedSchema(data: any[]): Chiropractor[] {
  return data.map((item) => {
    // Extract modalities from joined data
    const modalities: string[] = item.chiropractor_modalities?.map((cm: any) => cm.modalities?.name).filter(Boolean) || [];

    // Extract focus areas from joined data
    const focusAreas: string[] = item.chiropractor_focus_areas?.map((cfa: any) => cfa.focus_areas?.name).filter(Boolean) || [];

    // Extract payment models from joined data
    const paymentModels: string[] = item.chiropractor_payment_models?.map((cpm: any) => cpm.payment_models?.name).filter(Boolean) || [];

    return {
      id: item.id?.toString() || '',
      firstName: item.profiles?.first_name || '',
      lastName: item.profiles?.last_name || '',
      bio: item.bio || '',
      philosophy: getPhilosophyFromModalities(modalities),
      modality: getPrimaryModality(modalities),
      modalities: modalities,
      clinicName: item.organizations?.name || '',
      city: item.organizations?.city || '',
      state: item.organizations?.state || '',
      acceptingPatients: item.accepting_new_patients ?? true,
      avatarUrl: item.profiles?.avatar_url || null,
      // Add additional fields for matching
      focusAreas: focusAreas,
      businessModel: paymentModels.length > 0 ? paymentModels[0].toLowerCase() : undefined,
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
 * Search chiropractors based on patient preferences and matching algorithm
 */
export async function searchChiropractors(filters: PatientSearchFilters, limit: number = 20): Promise<Chiropractor[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('Supabase not configured. Returning empty array.');
      return [];
    }

    // Build a complex query that joins with organizations for location data
    let query = supabase
      .from('chiropractors')
      .select(`
        *,
        profiles!inner(first_name, last_name, email),
        organizations!left(city, state, zip_code),
        chiropractor_modalities(modality_id, modalities!inner(name)),
        chiropractor_focus_areas(focus_area_id, focus_areas!inner(name)),
        chiropractor_payment_models(payment_model_id, payment_models!inner(name))
      `)
      .eq('accepting_new_patients', true);

    // Location-based filtering using organizations table
    if (filters.zipCode && filters.zipCode.trim()) {
      query = query.ilike('organizations.zip_code', `%${filters.zipCode.trim()}%`);
    }

    // Get initial results
    const { data, error } = await query.limit(limit * 2); // Get more for scoring

    if (error) {
      console.error('Error searching chiropractors:', error);
      return [];
    }

    let chiropractors = mapChiropractorDataFromNormalizedSchema(data || []);

    // Apply matching algorithm scoring
    chiropractors = scoreChiropractors(chiropractors, filters);

    // Sort by score and return top results
    return chiropractors
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, limit);

  } catch (error) {
    console.error('Error searching chiropractors:', error);
    return [];
  }
}

/**
 * Score chiropractors based on patient preferences (matching algorithm)
 */
function scoreChiropractors(chiropractors: Chiropractor[], filters: PatientSearchFilters): Chiropractor[] {
  return chiropractors.map(chiro => {
    let score = 0;
    const maxScore = 100;

    // Modality matching (40 points)
    if (filters.preferredModalities && filters.preferredModalities.length > 0 && chiro.modalities) {
      const matchingModalities = filters.preferredModalities.filter(mod =>
        chiro.modalities!.some(chiroMod => chiroMod.toLowerCase().includes(mod.toLowerCase()))
      );
      score += (matchingModalities.length / filters.preferredModalities.length) * 40;
    }

    // Focus area matching (30 points)
    if (filters.focusAreas && filters.focusAreas.length > 0 && chiro.focusAreas) {
      const matchingFocusAreas = filters.focusAreas.filter(area =>
        chiro.focusAreas!.some(chiroArea => chiroArea.toLowerCase().includes(area.toLowerCase()))
      );
      score += (matchingFocusAreas.length / filters.focusAreas.length) * 30;
    }

    // Business model matching (20 points)
    if (filters.preferredBusinessModel && chiro.businessModel) {
      const patientPref = filters.preferredBusinessModel.toLowerCase();
      const chiroModel = chiro.businessModel.toLowerCase();

      // Exact match gets full points
      if (patientPref === chiroModel) {
        score += 20;
      }
      // Partial match (e.g., patient wants "hybrid" but chiropractor has "cash" - still some compatibility)
      else if ((patientPref === 'hybrid' && (chiroModel === 'cash' || chiroModel === 'insurance')) ||
               ((patientPref === 'cash' || patientPref === 'insurance') && chiroModel === 'hybrid')) {
        score += 10;
      }
    }

    // Insurance matching (10 points)
    if (filters.insuranceType && filters.insuranceType !== 'No Insurance / Self-Pay') {
      // This would need insurance data from chiropractors table
      // For now, give benefit of doubt if they accept insurance in general
      if (chiro.businessModel && (chiro.businessModel.toLowerCase() === 'insurance' || chiro.businessModel.toLowerCase() === 'hybrid')) {
        score += 10;
      }
    }

    return {
      ...chiro,
      matchScore: Math.min(score, maxScore)
    };
  });
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