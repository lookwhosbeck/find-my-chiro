import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase-client';
import { clampSearchRadiusMiles } from './search-radius';

function normalizePatientInsuranceForDb(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t || t.toLowerCase() === 'none') return null;
  return t;
}

function normalizePatientBudgetForDb(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t || t.toLowerCase() === 'none') return null;
  return t;
}

/** Signup form uses BCBS; DB seed uses full carrier name */
const SIGNUP_INSURANCE_TO_DB_NAME: Record<string, string> = {
  BCBS: 'Blue Cross Blue Shield',
  Aetna: 'Aetna',
  Cigna: 'Cigna',
  UnitedHealthcare: 'UnitedHealthcare',
  Medicare: 'Medicare',
  Medicaid: 'Medicaid',
};

function mapSignupBusinessModelToPaymentModelName(raw: string): string | null {
  const k = raw?.toLowerCase().trim();
  if (k === 'cash') return 'Cash';
  if (k === 'insurance') return 'Insurance';
  if (k === 'hybrid') return 'Hybrid';
  if (raw === 'Cash' || raw === 'Insurance' || raw === 'Hybrid') return raw;
  return null;
}

/**
 * Inserts junction rows for the new chiropractor (same tables as account Specialties save).
 */
async function insertChiropractorJunctionSelections(
  supabase: SupabaseClient,
  chiropractorId: string,
  data: SignUpData,
): Promise<{ error: Error | null }> {
  const paymentName = mapSignupBusinessModelToPaymentModelName(data.businessModel);
  const paymentNames = paymentName ? [paymentName] : [];

  const insuranceNames = data.insurances.map((label) => SIGNUP_INSURANCE_TO_DB_NAME[label] ?? label);

  const specs: [string, string, string, string[]][] = [
    ['chiropractor_modalities', 'modalities', 'modality_id', data.modalities],
    ['chiropractor_focus_areas', 'focus_areas', 'focus_area_id', data.focusAreas],
    ['chiropractor_payment_models', 'payment_models', 'payment_model_id', paymentNames],
    ['chiropractor_insurances', 'insurances', 'insurance_id', insuranceNames],
  ];

  for (const [table, refTable, fkCol, names] of specs) {
    if (!names.length) continue;
    const { data: rows, error: refErr } = await supabase.from(refTable).select('id,name');
    if (refErr) return { error: new Error(refErr.message) };
    const ids = names
      .map((n) => rows?.find((r: { name: string }) => r.name === n)?.id)
      .filter((id): id is string => Boolean(id));
    if (!ids.length) continue;
    const payload = ids.map((id) => ({ chiropractor_id: chiropractorId, [fkCol]: id }));
    const { error: insErr } = await supabase.from(table).insert(payload);
    if (insErr) return { error: new Error(insErr.message) };
  }

  return { error: null };
}

function hasSignupClinicLocationData(data: SignUpData): boolean {
  return !!(
    data.clinicName?.trim() ||
    data.address?.trim() ||
    data.city?.trim() ||
    data.state?.trim() ||
    data.zip?.trim()
  );
}

/**
 * Same pattern as account practice save: insert organization, then link via chiropractors.organization_id.
 * Runs after the chiropractor row exists so RLS and FK behavior match a logged-in save.
 */
async function attachClinicOrganizationFromSignup(
  supabase: SupabaseClient,
  userId: string,
  data: SignUpData,
): Promise<void> {
  if (!hasSignupClinicLocationData(data)) return;

  const orgPayload = {
    name: data.clinicName?.trim() || 'My practice',
    address_line_1: data.address?.trim() || null,
    city: data.city?.trim() || null,
    state: data.state?.trim() || null,
    zip_code: data.zip?.trim() || null,
  };

  const { data: insertedRows, error: orgErr } = await supabase
    .from('organizations')
    .insert(orgPayload)
    .select('id');

  if (orgErr) {
    console.error('Organization creation during signup:', orgErr);
    return;
  }

  const newId = insertedRows?.[0]?.id as string | undefined;
  if (!newId) {
    console.error(
      'Organization insert returned no row id — check RLS policies allow SELECT on new organization rows after INSERT.',
    );
    return;
  }

  const { error: linkErr } = await supabase
    .from('chiropractors')
    .update({ organization_id: newId, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (linkErr) {
    console.error('Could not link clinic organization to chiropractor:', linkErr);
  }
}

async function tryAttachClinicViaApi(accessToken: string, data: SignUpData): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/signup/attach-chiropractor-clinic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        clinicName: data.clinicName,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
      }),
    });
    if (!res.ok) return false;
    const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return json?.ok === true;
  } catch {
    return false;
  }
}

/** Email-confirm-off: session can lag one tick behind signUp; RPC needs a JWT with auth.uid(). */
async function resolveAccessTokenAfterSignup(
  supabase: SupabaseClient,
  signupSessionToken: string | null | undefined,
  maxAttempts = 25,
  delayMs = 120,
): Promise<string | null> {
  const first = signupSessionToken?.trim();
  if (first) return first;
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase.auth.getSession();
    const t = data.session?.access_token?.trim();
    if (t) return t;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

async function ensureSignupClinicLinked(
  supabase: SupabaseClient,
  userId: string,
  data: SignUpData,
  signupAccessToken: string | null | undefined,
): Promise<void> {
  if (!hasSignupClinicLocationData(data)) return;

  const accessToken = await resolveAccessTokenAfterSignup(supabase, signupAccessToken ?? null);

  if (accessToken && (await tryAttachClinicViaApi(accessToken, data))) {
    return;
  }

  const { data: rpcOrgId, error: rpcErr } = await supabase.rpc('signup_attach_chiropractor_organization', {
    p_clinic_name: data.clinicName ?? '',
    p_address_line_1: data.address ?? '',
    p_city: data.city ?? '',
    p_state: data.state ?? '',
    p_zip_code: data.zip ?? '',
  });

  const rpcOk =
    !rpcErr &&
    rpcOrgId != null &&
    String(rpcOrgId).length > 0 &&
    String(rpcOrgId).toLowerCase() !== 'null';

  if (rpcOk) {
    return;
  }

  if (rpcErr) {
    console.warn('signup_attach_chiropractor_organization RPC skipped or failed:', rpcErr.message);
  }

  await attachClinicOrganizationFromSignup(supabase, userId, data);

  const { data: chiroRow } = await supabase
    .from('chiropractors')
    .select('organization_id')
    .eq('id', userId)
    .maybeSingle();

  if (chiroRow?.organization_id) return;

  if (accessToken) {
    await tryAttachClinicViaApi(accessToken, data);
  }
}

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

export interface PatientSignUpData {
  // Step 1: Account
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  // Step 2: Personal Details
  phone?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyPhone?: string;

  // Step 3: Matching Preferences
  preferredModalities: string[];
  focusAreas: string[];
  preferredBusinessModel: string;
  insuranceType?: string;
  budgetRange?: string;

  // Step 4: Location & schedule
  city: string;
  state: string;
  zipCode: string;
  searchRadius: number; // miles
  preferredDays: string[];
  preferredTimes: string[];
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

    if (authData.session) {
      await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });
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

    // Step 3: Create chiropractor record (clinic org is attached after insert — see attachClinicOrganizationFromSignup)
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

    const { error: junctionError } = await insertChiropractorJunctionSelections(supabase, userId, data);
    if (junctionError) {
      console.error('Could not save signup specialties (modalities, focus areas, payment, insurance):', junctionError);
    }

    const signupToken = authData.session?.access_token;
    await ensureSignupClinicLinked(supabase, userId, data, signupToken);

    return { success: true, userId };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Register a new patient user
 * Creates auth user and stores patient preferences in profiles and patients tables
 */
export async function signUpPatient(data: PatientSignUpData): Promise<SignUpResult> {
  try {
    const supabase = createSupabaseClient();

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'patient',
        },
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      let errorMessage = authError.message || 'Failed to create account.';
      if (authError.message?.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      }
      return { success: false, error: errorMessage };
    }

    if (!authData?.user) {
      return { success: false, error: 'Failed to create user account. Please try again.' };
    }

    const userId = authData.user.id;

    if (authData.session) {
      await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });
    }

    // Step 2: Create/update profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        email: data.email || null,
        role: 'patient',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Step 3: Patient row — same fields as account preferences save
    const patientPayload = {
      id: userId,
      phone: data.phone?.trim() || null,
      date_of_birth: data.dateOfBirth?.trim() || null,
      emergency_contact: data.emergencyContact?.trim() || null,
      emergency_phone: data.emergencyPhone?.trim() || null,
      preferred_modalities: data.preferredModalities ?? [],
      focus_areas: data.focusAreas ?? [],
      preferred_business_model: data.preferredBusinessModel?.trim() || null,
      insurance_type: normalizePatientInsuranceForDb(data.insuranceType),
      budget_range: normalizePatientBudgetForDb(data.budgetRange),
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      preferred_zip_code: data.zipCode?.trim() || null,
      search_radius_miles: clampSearchRadiusMiles(data.searchRadius ?? 25),
      preferred_days: data.preferredDays ?? [],
      preferred_times: data.preferredTimes ?? [],
      updated_at: new Date().toISOString(),
    };

    const { error: patientError } = await supabase
      .from('patients')
      .upsert(patientPayload, { onConflict: 'id' });

    if (patientError) {
      console.error('Patient creation error:', patientError);
      const errorMessage = 'Account created, but there was an issue saving your preferences. ';
      return {
        success: false,
        error: errorMessage + patientError.message,
      };
    }

    return { success: true, userId };
  } catch (error: any) {
    console.error('Patient sign up error:', error);
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

