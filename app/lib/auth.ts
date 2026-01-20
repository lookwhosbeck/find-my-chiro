import { createSupabaseClient } from './supabase-client';

export interface SignUpData {
  // Step 1: Account
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  
  // Step 2: Professional Details
  college: string;
  graduationYear: string;
  licenseNumber: string;
  bio: string;
  
  // Step 3: Matching Data
  modalities: string[];
  focusAreas: string[];
  businessModel: string;
  insurances: string[];
  
  // Step 4: Organization/Location
  clinicName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  instagram: string;
}

export interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Register a new chiropractor user
 * Creates auth user and stores all data in chiropractors table
 * Uses JSON columns for arrays to work with existing database structure
 */
export async function signUpChiropractor(data: SignUpData): Promise<SignUpResult> {
  try {
    const supabase = createSupabaseClient();

    // Step 1: Create auth user
    // Note: If email confirmation is required, the user will be created but not confirmed
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'chiropractor',
        },
        // Only set redirect if we're in the browser and email confirmation is enabled
        // For local development, you may want to disable email confirmation in Supabase settings
        emailRedirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback` 
          : undefined,
      },
    });

    // Check if signup was successful
    if (authError) {
      console.error('Auth signup error:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      });

      let errorMessage = authError.message || 'Failed to create account.';
      if (authError.message?.includes('Database error')) {
        errorMessage = 'Database error: There may be a database trigger or constraint issue. Please check the database logs or contact support.';
      } else if (authError.message?.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (authError.message?.includes('Password')) {
        errorMessage = 'Password does not meet requirements. Please use a stronger password.';
      }
      return { success: false, error: errorMessage };
    }

    // Check if we have a user
    if (!authData?.user) {
      return { success: false, error: 'Failed to create user account. Please try again.' };
    }

    const userId = authData.user.id;

    if (!userId) {
      return { success: false, error: 'Failed to create user account. Please try again.' };
    }

    // Step 2: Create/update profile record (basic user info)
    // Note: The trigger may have already created the profile, so we use upsert
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        email: data.email || null,
        updated_at: new Date().toISOString(),
        role: 'chiropractor', // Ensure role is set
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Continue - profile might not be critical
    }

    // Step 3: Create chiropractor record with all data
    // Only insert fields that actually exist in the database schema
    const chiropractorData = {
      id: userId,
      bio: data.bio || null,
      chiropractic_college: data.college || null,
      graduation_year: data.graduationYear ? parseInt(data.graduationYear) : null,
      license_number: data.licenseNumber || null,
      website_url: data.website || null,
      instagram_handle: data.instagram || null,
      accepting_new_patients: true,
      updated_at: new Date().toISOString(),
    };

    // Try to insert into chiropractors table
    const { error: chiroError } = await supabase
      .from('chiropractors')
      .insert(chiropractorData);

    if (chiroError) {
      // Log detailed error for debugging
      console.error('Chiropractor creation error:', {
        message: chiroError.message,
        details: chiroError.details,
        hint: chiroError.hint,
        code: chiroError.code,
      });
      
      // Still update profiles table with basic info
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          email: data.email || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
      }

      // Provide user-friendly error message
      let errorMessage = 'Account created, but there was an issue saving your profile. ';
      if (chiroError.code === '42P01') {
        errorMessage += 'The chiropractors table does not exist. Please run the database migration.';
      } else if (chiroError.code === '23505') {
        errorMessage += 'A profile with this information already exists.';
      } else {
        errorMessage += `Error: ${chiroError.message}`;
      }

      return { 
        success: false, 
        error: errorMessage
      };
    }

    return { success: true, userId };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Helper function to infer philosophy from modalities
 */
function inferPhilosophy(modalities: string[]): string {
  if (!modalities || modalities.length === 0) {
    return 'Evidence-Based';
  }
  
  // Map modalities to philosophies
  const vitalisticModalities = ['SOT', 'TRT', 'Webster'];
  const evidenceModalities = ['Activator', 'Cox'];
  const traditionalModalities = ['Gonstead', 'Diversified', 'Thompson'];
  
  if (modalities.some(m => vitalisticModalities.includes(m))) {
    return 'Vitalistic';
  }
  if (modalities.some(m => evidenceModalities.includes(m))) {
    return 'Evidence-Based';
  }
  if (modalities.some(m => traditionalModalities.includes(m))) {
    return 'Traditional';
  }
  
  return 'Evidence-Based';
}

