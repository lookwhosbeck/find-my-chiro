import { supabase } from './supabase';

export interface Chiropractor {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  philosophy?: string;
  modality?: string;
  modalities?: string[];
  clinicName?: string;
  city?: string;
  state?: string;
  acceptingPatients?: boolean;
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
      .select('*')
      .limit(limit)
      .order('created_at', { ascending: false });

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

    return mapChiropractorData(data || []);
  } catch (error) {
    console.error('Error fetching chiropractors:', error);
    return [];
  }
}

/**
 * Map database data to Chiropractor interface
 */
function mapChiropractorData(data: any[]): Chiropractor[] {
  return data.map((item) => {
    // Handle modalities - could be JSON array or string array
    let modalities: string[] = [];
    if (Array.isArray(item.modalities)) {
      modalities = item.modalities;
    } else if (typeof item.modalities === 'string') {
      try {
        modalities = JSON.parse(item.modalities);
      } catch {
        // If not JSON, treat as single value
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