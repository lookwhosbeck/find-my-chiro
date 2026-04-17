'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Circle, ShieldCheck, Clock3, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  AccountFormCard,
  AccountFormField,
  AccountFormPage,
  AccountGridPage,
} from '@/components/layout/account-content';
import { supabase } from '@/app/lib/supabase';
import {
  flushPendingChiropractorSignupIfAny,
  flushPendingPatientSignupIfAny,
} from '@/app/lib/auth';
import { uploadAvatar, deleteAvatar, updateProfileAvatarUrl } from '@/app/lib/avatar-upload';
import { dispatchProfileUpdated } from '@/app/lib/profile-events';
import { UserAvatar } from '@/app/components/UserAvatar';
import { accountToolbarActions } from '@/components/layout/account-toolbar-actions';
import { getMovynDashboardProviderStyle } from '@/components/layout/movyn-dashboard-layout';
import { MovynAppSidebar } from '@/components/layout/sidebar/movyn-app-sidebar';
import { MovynNavUser } from '@/components/layout/sidebar/movyn-nav-user';
import { MovynSiteHeader } from '@/components/layout/header/movyn-site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { accountPageTitle, buildAccountSettingsNavGroups } from '@/lib/movyn-account-nav';
import {
  accountSettingsHref,
  navKeyFromSettingsSlug,
  parseSettingsSlugFromPathname,
  type AccountNavKey,
} from '@/lib/movyn-account-routes';
import {
  MODALITY_OPTIONS,
  FOCUS_AREA_OPTIONS,
  PREFERRED_DAY_OPTIONS,
  PREFERRED_TIME_OPTIONS,
  PHILOSOPHY_OPTIONS,
  PAYMENT_MODEL_OPTIONS,
  CHIRO_INSURANCE_OPTIONS,
  CHIRO_BUDGET_RANGE_OPTIONS,
} from '../constants';
import { SEARCH_RADIUS_MILES_OPTIONS, clampSearchRadiusMiles } from '@/app/lib/search-radius';
import { isPremiumProfile } from '@/app/lib/subscription';
import { canUseTrustSensitiveFeatures } from '@/app/lib/capabilities';
import { evaluateChiropractorSearchReadiness } from '@/app/lib/profile-completeness';
import styles from '../page.module.css';
import { ReferralsWorkspace } from '../ReferralsWorkspace';

function supabaseErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const o = err as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [o.message, o.details, o.hint].filter(Boolean);
    if (parts.length) return parts.join(' — ');
    if (o.code) return o.code;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

const COMING_SOON_NAV_KEYS: AccountNavKey[] = ['messages', 'favorites', 'groups'];

function isComingSoonNavKey(k: AccountNavKey): boolean {
  return COMING_SOON_NAV_KEYS.includes(k);
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'patient' | 'chiropractor' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string | null;
  subscription_status?: string | null;
  subscription_price_id?: string | null;
  current_period_end?: string | null;
  /** Set when Brevo E2 welcome email was sent */
  chiropractor_welcome_email_sent_at?: string | null;
}

interface ChiropractorProfile {
  id: string;
  bio?: string;
  chiropractic_college?: string;
  graduation_year?: number;
  license_number?: string;
  accepting_new_patients?: boolean;
  organization_id?: string | null;
  budget_range?: string | null;
  updated_at: string;
  license_verification_status?: string | null;
  onboarding_completed_at?: string | null;
  submitted_for_review_at?: string | null;
}

interface PatientProfile {
  id: string;
  phone?: string;
  date_of_birth?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  preferred_modalities?: string[];
  focus_areas?: string[];
  preferred_business_model?: string;
  insurance_type?: string;
  budget_range?: string;
  city?: string;
  state?: string;
  /** Legacy / alternate column name in some DBs */
  zip_code?: string;
  /** Written by patient signup (`signUpPatient`) */
  preferred_zip_code?: string | null;
  search_radius?: number;
  search_radius_miles?: number;
  preferred_days?: string[];
  preferred_times?: string[];
  updated_at: string;
}

export function MovynAccountDashboardShell({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const routeSlug = parseSettingsSlugFromPathname(pathname);
  const mappedFromSlug = navKeyFromSettingsSlug(routeSlug);
  const activeNav: AccountNavKey =
    routeSlug && !mappedFromSlug ? 'profile' : (mappedFromSlug ?? 'profile');

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chiropractorProfile, setChiropractorProfile] = useState<ChiropractorProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [practiceEditing, setPracticeEditing] = useState(false);
  const [preferencesEditing, setPreferencesEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [checkoutBanner, setCheckoutBanner] = useState<string | null>(null);
  const [checkoutSyncing, setCheckoutSyncing] = useState(false);

  const [chiroModalityNames, setChiroModalityNames] = useState<string[]>([]);
  const [chiroFocusNames, setChiroFocusNames] = useState<string[]>([]);
  const [chiroPhilosophyNames, setChiroPhilosophyNames] = useState<string[]>([]);
  const [chiroPaymentNames, setChiroPaymentNames] = useState<string[]>([]);
  const [chiroInsuranceNames, setChiroInsuranceNames] = useState<string[]>([]);
  const [chiroBudgetRange, setChiroBudgetRange] = useState('');

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    address_line_1: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
  });

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  const [chiropractorForm, setChiropractorForm] = useState({
    bio: '',
    chiropractic_college: '',
    graduation_year: '',
    license_number: '',
    accepting_new_patients: true,
  });

  const [patientForm, setPatientForm] = useState({
    phone: '',
    date_of_birth: '',
    emergency_contact: '',
    emergency_phone: '',
    preferred_modalities: [] as string[],
    focus_areas: [] as string[],
    preferred_business_model: '',
    insurance_type: '',
    budget_range: '',
    city: '',
    state: '',
    zip_code: '',
    search_radius: 25,
    preferred_days: [] as string[],
    preferred_times: [] as string[],
  });

  const practiceSnapshotRef = useRef<{
    org: typeof orgForm;
    chiro: typeof chiropractorForm;
  } | null>(null);
  const preferencesSnapshotRef = useRef<typeof patientForm | null>(null);
  /** One-time default tab for pending chiropractors (matches legacy `initialNavSetRef`). */
  const initialChiroWelcomeRef = useRef(false);

  /**
   * Middleware (`middleware.ts`) already validated the JWT and would have
   * redirected to `/signin` if the cookie was missing. The browser session is
   * stored synchronously in cookies/localStorage, so a single `getSession()` is
   * enough — no need for a `getUser()` network round trip or retry loop here.
   * One short retry covers the race where signIn just finished and the cookie
   * hasn't propagated to localStorage yet.
   */
  const resolveSessionFast = async () => {
    const first = (await supabase.auth.getSession()).data.session;
    if (first?.user) return first;

    await new Promise((r) => setTimeout(r, 150));
    const retry = (await supabase.auth.getSession()).data.session;
    return retry?.user ? retry : null;
  };

  useEffect(() => {
    setProfileEditing(false);
    setPracticeEditing(false);
    setPreferencesEditing(false);
    practiceSnapshotRef.current = null;
    preferencesSnapshotRef.current = null;
  }, [pathname]);

  /** Unknown settings slug → profile route. */
  useEffect(() => {
    if (!routeSlug || mappedFromSlug) return;
    router.replace(accountSettingsHref('profile'));
  }, [routeSlug, mappedFromSlug, router]);

  /** Chiropractor pending verification: first data load defaults to Getting started once; user may navigate away after. */
  useEffect(() => {
    if (!profile || profile.role !== 'chiropractor') return;
    if (!chiropractorProfile) return;
    if (initialChiroWelcomeRef.current) return;
    const status = chiropractorProfile.license_verification_status ?? 'draft';
    if (status === 'approved') {
      initialChiroWelcomeRef.current = true;
      return;
    }
    initialChiroWelcomeRef.current = true;
    if (!pathname.startsWith(accountSettingsHref('getting-started'))) {
      router.replace(accountSettingsHref('getting-started'));
    }
  }, [profile, chiropractorProfile, pathname, router]);

  /** Disallow e.g. patient URLs under chiropractor-only sections. */
  useEffect(() => {
    if (!profile) return;
    const isChiroR = profile.role === 'chiropractor';
    const isPatientR = profile.role === 'patient';
    const isAdminR = profile.role === 'admin';
    const showChiro = isChiroR || isAdminR;
    const showPatient = isPatientR || isAdminR;
    const allowed =
      (activeNav === 'welcome' && showChiro) ||
      activeNav === 'profile' ||
      (activeNav === 'practice' && showChiro) ||
      (activeNav === 'specialties' && showChiro) ||
      (activeNav === 'membership' && showChiro) ||
      (activeNav === 'referrals' && showChiro) ||
      (activeNav === 'preferences' && showPatient);
    if (!allowed && !isComingSoonNavKey(activeNav)) {
      router.replace(accountSettingsHref('profile'));
    }
  }, [profile, activeNav, router]);

  const pickRelName = (rel: unknown): string | undefined => {
    if (rel == null) return undefined;
    if (Array.isArray(rel)) return (rel[0] as { name?: string })?.name;
    return (rel as { name?: string }).name;
  };

  const toggleChiroMod = (name: string) => {
    setChiroModalityNames((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const toggleChiroFocus = (name: string) => {
    setChiroFocusNames((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const toggleChiroPhilosophy = (name: string) => {
    setChiroPhilosophyNames((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const toggleChiroPayment = (name: string) => {
    setChiroPaymentNames((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const toggleChiroInsurance = (name: string) => {
    setChiroInsuranceNames((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const togglePatientArr = (field: 'preferred_modalities' | 'focus_areas' | 'preferred_days' | 'preferred_times', value: string) => {
    setPatientForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
      };
    });
  };

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const c = params.get('checkout');
    const checkoutSessionId = params.get('session_id') || params.get('checkout_session_id');
    const isPremiumStatus = (status: string | null | undefined) => {
      const normalized = status?.toLowerCase() ?? '';
      return normalized === 'active' || normalized === 'trialing';
    };

    const confirmCheckoutSession = async () => {
      if (!checkoutSessionId) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch('/api/checkout/confirm-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId: checkoutSessionId }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || 'Could not confirm checkout session');
      }
    };

    if (c === 'success') {
      setCheckoutBanner(
        'Payment received. Syncing your membership now...',
      );
      setCheckoutSyncing(true);
      window.history.replaceState({}, '', accountSettingsHref('membership'));
      void (async () => {
        let confirmFailed = false;
        try {
          await confirmCheckoutSession();
        } catch (e) {
          console.error('confirm checkout session:', e);
          confirmFailed = true;
        }

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const userId = session?.user?.id ?? null;

          let synced = false;
          const attempts = 4;
          for (let i = 0; i < attempts; i += 1) {
            await checkUser();
            if (!userId) break;

            const { data: row } = await supabase
              .from('profiles')
              .select('subscription_status')
              .eq('id', userId)
              .maybeSingle();
            if (isPremiumStatus(row?.subscription_status)) {
              synced = true;
              break;
            }
            if (i < attempts - 1) {
              await new Promise((resolve) => window.setTimeout(resolve, 2000));
            }
          }

          if (synced) {
            setCheckoutBanner('Membership updated successfully. Your premium plan is active.');
          } else if (confirmFailed) {
            setCheckoutBanner(
              'Payment completed, but membership sync is still processing. Please refresh in a moment.',
            );
          } else {
            setCheckoutBanner(
              'Payment completed. Membership may take a few more seconds to update; please refresh shortly.',
            );
          }
        } finally {
          setCheckoutSyncing(false);
          await checkUser();
        }
      })();
    } else if (c === 'canceled') {
      setCheckoutBanner('Checkout was canceled. You can subscribe anytime from this page.');
      window.history.replaceState({}, '', accountSettingsHref('membership'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  type OrgRow = {
    id: string;
    name?: string | null;
    address_line_1?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    phone?: string | null;
  };
  type ChiroRowWithOrg = ChiropractorProfile & { organizations?: OrgRow | null };

  const applyChiroRow = useCallback((row: ChiroRowWithOrg | null) => {
    if (!row) {
      setChiropractorProfile(null);
      setOrganizationId(null);
      setChiropractorForm({
        bio: '',
        chiropractic_college: '',
        graduation_year: '',
        license_number: '',
        accepting_new_patients: true,
      });
      setChiroBudgetRange('');
      setOrgForm({
        name: '',
        address_line_1: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
      });
      return;
    }

    setChiropractorProfile(row);
    setChiropractorForm({
      bio: row.bio || '',
      chiropractic_college: row.chiropractic_college || '',
      graduation_year: row.graduation_year?.toString() || '',
      license_number: row.license_number || '',
      accepting_new_patients: row.accepting_new_patients ?? true,
    });
    setChiroBudgetRange(row.budget_range || '');

    const org = row.organizations;
    if (org) {
      setOrganizationId(org.id);
      setOrgForm({
        name: org.name || '',
        address_line_1: org.address_line_1 || '',
        city: org.city || '',
        state: org.state || '',
        zip_code: org.zip_code || '',
        phone: org.phone || '',
      });
    } else if (row.organization_id) {
      // Join didn't return the org row (e.g., RLS) — fetch separately in the
      // background; the rest of the dashboard can render in the meantime.
      setOrganizationId(row.organization_id);
      void supabase
        .from('organizations')
        .select('id, name, address_line_1, city, state, zip_code, phone')
        .eq('id', row.organization_id)
        .single()
        .then(({ data: orgOnly }) => {
          if (!orgOnly) return;
          setOrgForm({
            name: orgOnly.name || '',
            address_line_1: orgOnly.address_line_1 || '',
            city: orgOnly.city || '',
            state: orgOnly.state || '',
            zip_code: orgOnly.zip_code || '',
            phone: orgOnly.phone || '',
          });
        });
    } else {
      setOrganizationId(null);
      setOrgForm({
        name: '',
        address_line_1: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
      });
    }
  }, []);

  const applyPatientRow = useCallback((pRow: PatientProfile | null) => {
    if (!pRow) return;
    setPatientProfile(pRow);
    setPatientForm({
      phone: pRow.phone || '',
      date_of_birth: pRow.date_of_birth?.slice(0, 10) || '',
      emergency_contact: pRow.emergency_contact || '',
      emergency_phone: pRow.emergency_phone || '',
      preferred_modalities: pRow.preferred_modalities || [],
      focus_areas: pRow.focus_areas || [],
      preferred_business_model: pRow.preferred_business_model || '',
      insurance_type: pRow.insurance_type || '',
      budget_range: pRow.budget_range || '',
      city: pRow.city || '',
      state: pRow.state || '',
      zip_code: pRow.zip_code || pRow.preferred_zip_code || '',
      search_radius: clampSearchRadiusMiles(
        pRow.search_radius ?? pRow.search_radius_miles ?? 25,
      ),
      preferred_days: pRow.preferred_days || [],
      preferred_times: pRow.preferred_times || [],
    });
  }, []);

  /**
   * Loads everything the dashboard needs in one parallel fan-out.
   *
   * Auth was already validated by `middleware.ts`, so we trust the cookie
   * `getSession()` returns and skip the (slow) `getUser()` network round trip.
   * All role-relevant queries fire concurrently keyed on the user id; RLS
   * cleanly returns empty rows for the wrong role. The `flushPending*` signup
   * helpers run in the background — they short-circuit when nothing is pending,
   * and when they DO have work it's safe to apply asynchronously after the
   * dashboard has rendered.
   */
  const checkUser = async () => {
    try {
      const session = await resolveSessionFast();
      if (!session?.user) {
        router.replace('/signin');
        return;
      }
      const authUser = session.user;
      setUser(authUser);

      void Promise.allSettled([
        flushPendingChiropractorSignupIfAny(supabase),
        flushPendingPatientSignupIfAny(supabase),
      ]);

      const userId = authUser.id;
      const [profileRes, chiroRes, patientRes, modsRes, focusRes, philRes, payRes, insRes] =
        await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase
            .from('chiropractors')
            .select(
              `*, organizations ( id, name, address_line_1, city, state, zip_code, phone )`,
            )
            .eq('id', userId)
            .maybeSingle(),
          supabase.from('patients').select('*').eq('id', userId).maybeSingle(),
          supabase.from('chiropractor_modalities').select('modalities(name)').eq('chiropractor_id', userId),
          supabase.from('chiropractor_focus_areas').select('focus_areas(name)').eq('chiropractor_id', userId),
          supabase.from('chiropractor_philosophies').select('philosophies(name)').eq('chiropractor_id', userId),
          supabase.from('chiropractor_payment_models').select('payment_models(name)').eq('chiropractor_id', userId),
          supabase.from('chiropractor_insurances').select('insurances(name)').eq('chiropractor_id', userId),
        ]);

      if (profileRes.error || !profileRes.data) {
        console.error('Error fetching profile:', profileRes.error);
        return;
      }

      const profileData = profileRes.data as UserProfile;
      setProfile(profileData);
      setProfileForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
      });

      if (
        profileData.role === 'chiropractor' &&
        authUser.email_confirmed_at &&
        !profileData.chiropractor_welcome_email_sent_at
      ) {
        void fetch('/api/email/chiropractor-welcome', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }

      const isChiroRole = profileData.role === 'chiropractor' || profileData.role === 'admin';
      const isPatientRole = profileData.role === 'patient' || profileData.role === 'admin';

      if (isChiroRole) {
        applyChiroRow((chiroRes.data as ChiroRowWithOrg | null) ?? null);
        setChiroModalityNames(
          (modsRes.data?.map((r) => pickRelName((r as { modalities?: unknown }).modalities)).filter(Boolean) as string[]) || [],
        );
        setChiroFocusNames(
          (focusRes.data?.map((r) => pickRelName((r as { focus_areas?: unknown }).focus_areas)).filter(Boolean) as string[]) || [],
        );
        setChiroPhilosophyNames(
          (philRes.data?.map((r) => pickRelName((r as { philosophies?: unknown }).philosophies)).filter(Boolean) as string[]) || [],
        );
        setChiroPaymentNames(
          (payRes.data?.map((r) => pickRelName((r as { payment_models?: unknown }).payment_models)).filter(Boolean) as string[]) || [],
        );
        setChiroInsuranceNames(
          (insRes.data?.map((r) => pickRelName((r as { insurances?: unknown }).insurances)).filter(Boolean) as string[]) || [],
        );
      }

      if (isPatientRole) {
        applyPatientRow((patientRes.data as PatientProfile | null) ?? null);
      }
    } catch (e) {
      console.error('Error checking user:', e);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  const startSubscriptionCheckout = async (plan: 'monthly' | 'annual') => {
    setBillingBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('You need to be signed in to subscribe.');

      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Could not start checkout. Check Stripe env vars and price IDs.');
      }
      window.location.href = json.url;
    } catch (e) {
      alert(supabaseErrorMessage(e));
    } finally {
      setBillingBusy(false);
    }
  };

  const openBillingPortal = async () => {
    setBillingBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('You need to be signed in.');

      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(
          json.error || 'Could not open the billing portal. Enable the Customer Portal in Stripe.',
        );
      }
      window.location.href = json.url;
    } catch (e) {
      alert(supabaseErrorMessage(e));
    } finally {
      setBillingBusy(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.length) return;
    const file = event.target.files[0];
    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatar(file, user.id);
      if (!avatarUrl) throw new Error('Failed to upload avatar');
      const success = await updateProfileAvatarUrl(user.id, avatarUrl);
      if (!success) throw new Error('Failed to update profile');
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: avatarUrl, updated_at: new Date().toISOString() } : null,
      );
      dispatchProfileUpdated();
    } catch (e) {
      console.error(e);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    if (!user || !profile?.avatar_url) return;
    if (!confirm('Remove your profile photo?')) return;
    setUploadingAvatar(true);
    try {
      await deleteAvatar(user.id);
      await updateProfileAvatarUrl(user.id, null);
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: undefined, updated_at: new Date().toISOString() } : null,
      );
      dispatchProfileUpdated();
    } catch (e) {
      console.error(e);
      alert('Error removing avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const nextEmail = profileForm.email.trim();
      if (nextEmail !== (profile.email || '').trim()) {
        const { error: authEmailErr } = await supabase.auth.updateUser({ email: nextEmail });
        if (authEmailErr) throw authEmailErr;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileForm.first_name.trim() || null,
          last_name: profileForm.last_name.trim() || null,
          email: nextEmail || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfileForm((f) => ({ ...f, email: nextEmail }));
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              first_name: profileForm.first_name.trim() || null,
              last_name: profileForm.last_name.trim() || null,
              email: nextEmail || null,
              updated_at: new Date().toISOString(),
            }
          : null,
      );
      setProfileEditing(false);
    } catch (e) {
      console.error(e);
      alert(`Could not update profile. ${supabaseErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const saveChiropractorProfile = async () => {
    if (!user || profile?.role === 'admin') return;
    setSaving(true);
    try {
      const orgBase = {
        name: orgForm.name.trim() || 'My practice',
        address_line_1: orgForm.address_line_1.trim() || null,
        city: orgForm.city.trim() || null,
        state: orgForm.state.trim() || null,
        zip_code: orgForm.zip_code.trim() || null,
        phone: orgForm.phone.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let oid = organizationId;
      if (oid) {
        const { error: orgErr } = await supabase.from('organizations').update(orgBase).eq('id', oid);
        if (orgErr) throw orgErr;
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('organizations')
          .insert(orgBase)
          .select('id')
          .single();
        if (insErr) throw insErr;
        if (!inserted?.id) throw new Error('Organization was created but no id was returned (check RLS SELECT on organizations).');
        oid = inserted.id;
        setOrganizationId(oid);
      }

      const gyRaw = chiropractorForm.graduation_year.trim();
      let graduation_year: number | null = null;
      if (gyRaw) {
        const y = parseInt(gyRaw, 10);
        if (!Number.isNaN(y) && y >= 1900 && y <= 2100) graduation_year = y;
      }

      const chiroPayload = {
        organization_id: oid,
        bio: chiropractorForm.bio.trim() || null,
        chiropractic_college: chiropractorForm.chiropractic_college.trim() || null,
        graduation_year,
        license_number: chiropractorForm.license_number.trim() || null,
        accepting_new_patients: chiropractorForm.accepting_new_patients,
        updated_at: new Date().toISOString(),
      };

      const { data: existingChiro, error: existingErr } = await supabase
        .from('chiropractors')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (existingErr) throw existingErr;

      if (existingChiro) {
        const { error: chiroErr } = await supabase.from('chiropractors').update(chiroPayload).eq('id', user.id);
        if (chiroErr) throw chiroErr;
      } else {
        const { error: chiroErr } = await supabase.from('chiropractors').insert({ id: user.id, ...chiroPayload });
        if (chiroErr) throw chiroErr;
      }

      const merged = { id: user.id, ...chiroPayload } as ChiropractorProfile;
      setChiropractorProfile((prev) => (prev ? { ...prev, ...merged } : merged));
      practiceSnapshotRef.current = null;

      const { data: sess } = await supabase.auth.getSession();
      const geoTok = sess.session?.access_token?.trim();
      if (geoTok && oid) {
        void fetch('/api/organizations/geocode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${geoTok}`,
          },
          body: JSON.stringify({ organizationId: oid }),
        });
      }

      setPracticeEditing(false);
    } catch (e) {
      console.error(e);
      alert(`Could not update practice profile. ${supabaseErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const saveChiroSpecialties = async () => {
    if (!user || profile?.role === 'admin') return;
    setSaving(true);
    try {
      const sync = async (
        table: string,
        refTable: string,
        fk: string,
        names: string[],
      ) => {
        const { data: rows, error: refErr } = await supabase.from(refTable).select('id,name');
        if (refErr) throw refErr;
        const ids = names
          .map((n) => rows?.find((r: { name: string }) => r.name === n)?.id)
          .filter(Boolean) as string[];

        await supabase.from(table).delete().eq('chiropractor_id', user.id);

        if (ids.length) {
          const payload = ids.map((id) => ({
            chiropractor_id: user.id,
            [fk]: id,
          }));
          const { error: insErr } = await supabase.from(table).insert(payload);
          if (insErr) throw insErr;
        }
      };

      await sync('chiropractor_modalities', 'modalities', 'modality_id', chiroModalityNames);
      await sync('chiropractor_focus_areas', 'focus_areas', 'focus_area_id', chiroFocusNames);
      await sync('chiropractor_philosophies', 'philosophies', 'philosophy_id', chiroPhilosophyNames);
      await sync('chiropractor_payment_models', 'payment_models', 'payment_model_id', chiroPaymentNames);
      await sync('chiropractor_insurances', 'insurances', 'insurance_id', chiroInsuranceNames);

      const budgetPayload = {
        id: user.id,
        budget_range: chiroBudgetRange.trim() || null,
        updated_at: new Date().toISOString(),
      };
      const { error: bErr } = await supabase.from('chiropractors').update(budgetPayload).eq('id', user.id);
      if (bErr) throw bErr;
      setChiropractorProfile((prev) => (prev ? { ...prev, budget_range: budgetPayload.budget_range ?? undefined } : prev));
    } catch (e) {
      console.error(e);
      alert(`Could not update specialties. ${supabaseErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const savePatientProfile = async () => {
    if (!user || profile?.role === 'admin') return;
    setSaving(true);
    try {
      const updateData = {
        id: user.id,
        phone: patientForm.phone.trim() || null,
        date_of_birth: patientForm.date_of_birth || null,
        emergency_contact: patientForm.emergency_contact.trim() || null,
        emergency_phone: patientForm.emergency_phone.trim() || null,
        preferred_modalities: patientForm.preferred_modalities,
        focus_areas: patientForm.focus_areas,
        preferred_business_model: patientForm.preferred_business_model || null,
        insurance_type: patientForm.insurance_type || null,
        budget_range: patientForm.budget_range || null,
        city: patientForm.city.trim() || null,
        state: patientForm.state.trim() || null,
        preferred_zip_code: patientForm.zip_code.trim() || null,
        search_radius_miles: patientForm.search_radius,
        preferred_days: patientForm.preferred_days,
        preferred_times: patientForm.preferred_times,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('patients').upsert(updateData, { onConflict: 'id' });
      if (error) throw error;

      setPatientProfile((prev) => (prev ? { ...prev, ...updateData } : (updateData as PatientProfile)));
      preferencesSnapshotRef.current = null;
      setPreferencesEditing(false);
    } catch (e) {
      console.error(e);
      alert(`Could not update preferences. ${supabaseErrorMessage(e)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex min-h-svh items-center justify-center bg-muted/40">
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
        <div className="hidden">{children}</div>
      </>
    );
  }

  if (!profile || !user) {
    return (
      <>
        <div className="flex min-h-svh items-center justify-center bg-muted/40">
          <p className="text-muted-foreground text-sm">Unable to load your profile.</p>
        </div>
        <div className="hidden">{children}</div>
      </>
    );
  }

  const isChiro = profile.role === 'chiropractor';
  const isPatient = profile.role === 'patient';
  const isAdmin = profile.role === 'admin';
  /** Admins see every account section while building (chiro + patient UI). */
  const showChiroAccountUI = isChiro || isAdmin;
  const showPatientAccountUI = isPatient || isAdmin;

  const chiroNavAvailable: { key: AccountNavKey; label: string }[] = [
    { key: 'welcome', label: 'Getting started' },
    { key: 'practice', label: 'Your practice' },
    { key: 'profile', label: 'Your profile' },
    { key: 'specialties', label: 'Specialties' },
    { key: 'membership', label: 'Membership' },
    { key: 'referrals', label: 'Referrals' },
  ];

  const patientNavAvailable: { key: AccountNavKey; label: string }[] = [
    { key: 'profile', label: 'Your profile' },
    { key: 'preferences', label: 'Your preferences' },
  ];

  const navComingSoon: { key: AccountNavKey; label: string }[] = [
    { key: 'messages', label: 'Messages' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'groups', label: 'Groups' },
  ];

  const patientOnlyNav: { key: AccountNavKey; label: string }[] = [
    { key: 'preferences', label: 'Your preferences' },
  ];

  const navAvailable = isAdmin
    ? [...chiroNavAvailable, ...patientOnlyNav]
    : isChiro
      ? chiroNavAvailable
      : patientNavAvailable;

  const navComingSoonFiltered = navComingSoon;

  const navGroups = buildAccountSettingsNavGroups(navAvailable, navComingSoonFiltered);

  const displayName =
    [profileForm.first_name, profileForm.last_name].filter(Boolean).join(' ') || 'there';
  const sidebarUserLabel =
    [profileForm.first_name, profileForm.last_name].filter(Boolean).join(' ') ||
    profile.email?.split('@')[0] ||
    'Account';
  const licenseStatus = chiropractorProfile?.license_verification_status ?? 'draft';
  const completeness = evaluateChiropractorSearchReadiness({
    addressLine1: orgForm.address_line_1,
    city: orgForm.city,
    state: orgForm.state,
    zipCode: orgForm.zip_code,
    modalities: chiroModalityNames,
    philosophies: chiroPhilosophyNames,
    focusAreas: chiroFocusNames,
    paymentModels: chiroPaymentNames,
  });

  const emailUpdated = new Date(profile.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const adminOnRoleSection =
    isAdmin && (activeNav === 'practice' || activeNav === 'specialties' || activeNav === 'preferences');
  const toolbarEditDisabled =
    isComingSoonNavKey(activeNav) ||
    activeNav === 'welcome' ||
    activeNav === 'specialties' ||
    activeNav === 'membership' ||
    adminOnRoleSection;

  const toolbarSaveDisabled =
    saving ||
    isComingSoonNavKey(activeNav) ||
    activeNav === 'welcome' ||
    activeNav === 'membership' ||
    adminOnRoleSection ||
    (activeNav === 'profile' && !profileEditing) ||
    (activeNav === 'practice' && (!showChiroAccountUI || !practiceEditing)) ||
    (activeNav === 'preferences' && (!showPatientAccountUI || !preferencesEditing));

  const handleToolbarEdit = () => {
    if (toolbarEditDisabled) return;
    if (activeNav === 'profile') {
      if (profileEditing) {
        setProfileForm({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
        });
        setProfileEditing(false);
      } else {
        setProfileEditing(true);
      }
      return;
    }
    if (activeNav === 'practice' && showChiroAccountUI) {
      if (practiceEditing) {
        const snap = practiceSnapshotRef.current;
        if (snap) {
          setOrgForm(snap.org);
          setChiropractorForm(snap.chiro);
        }
        practiceSnapshotRef.current = null;
        setPracticeEditing(false);
      } else {
        practiceSnapshotRef.current = {
          org: { ...orgForm },
          chiro: { ...chiropractorForm },
        };
        setPracticeEditing(true);
      }
      return;
    }
    if (activeNav === 'preferences' && showPatientAccountUI) {
      if (preferencesEditing) {
        if (preferencesSnapshotRef.current) {
          setPatientForm(preferencesSnapshotRef.current);
        }
        preferencesSnapshotRef.current = null;
        setPreferencesEditing(false);
      } else {
        preferencesSnapshotRef.current = { ...patientForm };
        setPreferencesEditing(true);
      }
    }
  };

  const handleToolbarSave = () => {
    switch (activeNav) {
      case 'profile':
        void saveProfile();
        break;
      case 'practice':
        if (showChiroAccountUI) void saveChiropractorProfile();
        break;
      case 'specialties':
        if (showChiroAccountUI) void saveChiroSpecialties();
        break;
      case 'preferences':
        if (showPatientAccountUI) void savePatientProfile();
        break;
      default:
        break;
    }
  };

  const openAvatarPicker = () => {
    if (uploadingAvatar) return;
    document.getElementById('account-avatar-input')?.click();
  };

  /** Figma 26:993 — Getting Started with Movyn. Narrow card with license status, profile completeness checklist, and CTAs. */
  const renderWelcomePanel = () => {
    const approved = licenseStatus === 'approved';
    const pending = licenseStatus === 'pending_review' || licenseStatus === 'draft' || licenseStatus === 'submitted';
    const rejected = licenseStatus === 'rejected';
    const licenseBadge = approved ? (
      <Badge
        variant="outline"
        className="h-9 gap-2 rounded-md border-blue-600/20 bg-blue-600/5 px-3 text-sm font-medium text-foreground"
      >
        <ShieldCheck className="size-4 text-blue-600" />
        License Verified
      </Badge>
    ) : rejected ? (
      <Badge
        variant="outline"
        className="h-9 gap-2 rounded-md border-destructive/30 bg-destructive/5 px-3 text-sm font-medium text-destructive"
      >
        <AlertTriangle className="size-4" />
        Needs attention
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="h-9 gap-2 rounded-md border-amber-500/30 bg-amber-500/5 px-3 text-sm font-medium text-foreground"
      >
        <Clock3 className="size-4 text-amber-600" />
        Pending review
      </Badge>
    );

    const submittedAt = chiropractorProfile?.submitted_for_review_at
      ? new Date(chiropractorProfile.submitted_for_review_at).toLocaleDateString(undefined, {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

    return (
      <AccountFormPage
        title="Getting Started with Movyn"
        description="Your profile will be published as a public listing when our team verifies your license."
      >
        <AccountFormCard>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">License status</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-10 gap-y-1 text-sm text-muted-foreground">
                {submittedAt ? <span>Submitted: {submittedAt}</span> : <span>No license on file yet</span>}
                {pending ? <span>Review in progress</span> : null}
              </div>
              {licenseBadge}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              Your profile is {completeness.score}% complete
            </p>
            <p className="text-sm text-muted-foreground">
              Complete your profile to show up in search results and get better match scores
            </p>
            <div className="flex items-center gap-2 pl-2">
              <div
                className="relative h-2 flex-1 overflow-hidden rounded-full bg-foreground/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completeness.score}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-foreground"
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm text-muted-foreground">{completeness.score}%</span>
            </div>
            <ul className="mt-1 flex flex-col gap-1">
              {completeness.items.map((item) => (
                <li key={item.key} className="flex items-center gap-2 py-1.5">
                  <span className="flex size-8 items-center justify-center pl-2" aria-hidden>
                    {item.complete ? (
                      <CheckCircle2 className="size-4 text-emerald-600 opacity-90" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground/60" />
                    )}
                  </span>
                  <span className="text-sm text-foreground">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => router.push(accountSettingsHref('practice'))}>
              Update practice info
            </Button>
            <Button type="button" onClick={() => router.push(accountSettingsHref('specialties'))}>
              Update specialties
            </Button>
          </div>
        </AccountFormCard>
      </AccountFormPage>
    );
  };

  /** Figma 26:1057 — Update your profile. Narrow card with license row, name/email/bio fields. */
  const renderProfilePanel = () => {
    const profileLocked = !profileEditing;
    return (
      <AccountFormPage
        title="Update your profile"
        description="Your profile will be published as a public listing when our team verifies your license."
      >
        <AccountFormCard>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">License status</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {chiropractorProfile?.submitted_for_review_at
                  ? `Submitted: ${new Date(chiropractorProfile.submitted_for_review_at).toLocaleDateString(
                      undefined,
                      { month: 'numeric', day: 'numeric', year: 'numeric' },
                    )}`
                  : 'License status managed under Practice'}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleToolbarEdit}
                  disabled={toolbarEditDisabled}
                >
                  {profileEditing ? 'Cancel' : 'Edit'}
                </Button>
                <Button
                  type="button"
                  onClick={handleToolbarSave}
                  disabled={toolbarSaveDisabled}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>

          <AccountFormField id="pf-first" label="First name">
            <Input
              id="pf-first"
              value={profileForm.first_name}
              onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
              disabled={profileLocked}
              placeholder="First name"
            />
          </AccountFormField>

          <AccountFormField id="pf-last" label="Last name">
            <Input
              id="pf-last"
              value={profileForm.last_name}
              onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
              disabled={profileLocked}
              placeholder="Last name"
            />
          </AccountFormField>

          <AccountFormField
            id="pf-email"
            label="Email"
            description="You can manage verified email addresses in your email settings."
          >
            <Input
              id="pf-email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
              disabled={profileLocked}
              placeholder="you@example.com"
            />
          </AccountFormField>

          {showChiroAccountUI ? (
            <AccountFormField
              id="pf-bio"
              label="Bio"
              description="Patients will read this on your public profile. You can @mention colleagues and organizations to link to them."
            >
              <Textarea
                id="pf-bio"
                value={chiropractorForm.bio}
                onChange={(e) => setChiropractorForm((p) => ({ ...p, bio: e.target.value }))}
                disabled={profileLocked}
                placeholder="Tell patients about your experience and approach…"
                rows={4}
              />
            </AccountFormField>
          ) : null}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium leading-none text-foreground">Profile photo</Label>
              <p className="text-sm text-muted-foreground">
                JPG, PNG, or GIF. Max 5MB. Last updated {emailUpdated}.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={profile.avatar_url}
                firstName={profileForm.first_name}
                lastName={profileForm.last_name}
                email={profileForm.email || profile.email}
                size={48}
                variant="roundedSquare"
                fallbackTone="accountHero"
                alt=""
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openAvatarPicker}
                  disabled={uploadingAvatar || profileLocked}
                >
                  {uploadingAvatar ? 'Uploading…' : profile.avatar_url ? 'Change photo' : 'Upload photo'}
                </Button>
                {profile.avatar_url ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAvatarDelete}
                    disabled={uploadingAvatar || profileLocked}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </AccountFormCard>
      </AccountFormPage>
    );
  };

  const renderPracticePanel = () => {
    const practiceLocked = !practiceEditing;
    return (
      <AccountFormPage
        title="Your practice"
        description="Where you see patients and how you present your professional profile."
      >
        <AccountFormCard>
          <AccountFormField id="org-name" label="Practice / clinic name">
            <Input
              id="org-name"
              value={orgForm.name}
              onChange={(e) => setOrgForm((p) => ({ ...p, name: e.target.value }))}
              disabled={practiceLocked}
              placeholder="Clinic name"
            />
          </AccountFormField>

          <AccountFormField id="org-street" label="Street address">
            <Input
              id="org-street"
              value={orgForm.address_line_1}
              onChange={(e) => setOrgForm((p) => ({ ...p, address_line_1: e.target.value }))}
              disabled={practiceLocked}
              placeholder="123 Main St"
            />
          </AccountFormField>

          <div className="grid grid-cols-2 gap-3">
            <AccountFormField id="org-city" label="City">
              <Input
                id="org-city"
                value={orgForm.city}
                onChange={(e) => setOrgForm((p) => ({ ...p, city: e.target.value }))}
                disabled={practiceLocked}
                placeholder="City"
              />
            </AccountFormField>
            <AccountFormField id="org-state" label="State">
              <Input
                id="org-state"
                value={orgForm.state}
                onChange={(e) => setOrgForm((p) => ({ ...p, state: e.target.value }))}
                disabled={practiceLocked}
                placeholder="ST"
              />
            </AccountFormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AccountFormField id="org-zip" label="ZIP code">
              <Input
                id="org-zip"
                value={orgForm.zip_code}
                onChange={(e) => setOrgForm((p) => ({ ...p, zip_code: e.target.value }))}
                disabled={practiceLocked}
                placeholder="12345"
              />
            </AccountFormField>
            <AccountFormField id="org-phone" label="Practice phone">
              <Input
                id="org-phone"
                value={orgForm.phone}
                onChange={(e) => setOrgForm((p) => ({ ...p, phone: e.target.value }))}
                disabled={practiceLocked}
                placeholder="Phone"
              />
            </AccountFormField>
          </div>

          <div className="h-px w-full bg-border" aria-hidden />

          <AccountFormField
            id="ch-bio"
            label="Professional bio"
            description="Patients will read this on your public profile."
          >
            <Textarea
              id="ch-bio"
              value={chiropractorForm.bio}
              onChange={(e) => setChiropractorForm((p) => ({ ...p, bio: e.target.value }))}
              disabled={practiceLocked}
              placeholder="Tell patients about your experience and approach…"
              rows={4}
            />
          </AccountFormField>

          <div className="grid grid-cols-2 gap-3">
            <AccountFormField id="ch-college" label="Chiropractic college">
              <Input
                id="ch-college"
                value={chiropractorForm.chiropractic_college}
                onChange={(e) =>
                  setChiropractorForm((p) => ({ ...p, chiropractic_college: e.target.value }))
                }
                disabled={practiceLocked}
                placeholder="College name"
              />
            </AccountFormField>
            <AccountFormField id="ch-year" label="Graduation year">
              <Input
                id="ch-year"
                type="number"
                value={chiropractorForm.graduation_year}
                onChange={(e) =>
                  setChiropractorForm((p) => ({ ...p, graduation_year: e.target.value }))
                }
                disabled={practiceLocked}
                placeholder="e.g. 2020"
              />
            </AccountFormField>
          </div>

          <AccountFormField id="ch-license" label="License number">
            <Input
              id="ch-license"
              value={chiropractorForm.license_number}
              onChange={(e) => setChiropractorForm((p) => ({ ...p, license_number: e.target.value }))}
              disabled={practiceLocked}
              placeholder="License number"
            />
          </AccountFormField>

          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Checkbox
              checked={chiropractorForm.accepting_new_patients}
              disabled={practiceLocked}
              onCheckedChange={(v) =>
                setChiropractorForm((p) => ({ ...p, accepting_new_patients: v === true }))
              }
            />
            Currently accepting new patients
          </label>
        </AccountFormCard>
      </AccountFormPage>
    );
  };

  /** Specialties intentionally stays wide + grid: lots of parallel choices that benefit from scan-ability. */
  const renderSpecialtiesPanel = () => {
    const column = (title: string, body: ReactNode) => (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
        <h4 className="text-sm font-semibold leading-5 text-foreground">{title}</h4>
        {body}
      </div>
    );

    const optionList = (
      options: readonly string[],
      checked: string[],
      toggle: (name: string) => void,
    ) => (
      <div className="flex flex-col gap-2">
        {options.map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={checked.includes(m)} onCheckedChange={() => toggle(m)} />
            {m}
          </label>
        ))}
      </div>
    );

    return (
      <AccountGridPage
        title="Specialties"
        description="How patients will filter and match to you in search. Choose all that apply."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {column('Techniques', optionList(MODALITY_OPTIONS, chiroModalityNames, toggleChiroMod))}
          {column('Specialties', optionList(FOCUS_AREA_OPTIONS, chiroFocusNames, toggleChiroFocus))}
          {column(
            'Philosophy',
            optionList(PHILOSOPHY_OPTIONS, chiroPhilosophyNames, toggleChiroPhilosophy),
          )}
          {column(
            'Business model',
            optionList(PAYMENT_MODEL_OPTIONS, chiroPaymentNames, toggleChiroPayment),
          )}
          {column(
            'Insurance',
            optionList(CHIRO_INSURANCE_OPTIONS, chiroInsuranceNames, toggleChiroInsurance),
          )}
          {column(
            'Budget range',
            <NativeSelect
              value={chiroBudgetRange}
              onChange={(e) => setChiroBudgetRange(e.target.value)}
              aria-label="Budget range"
            >
              {CHIRO_BUDGET_RANGE_OPTIONS.map((o) => (
                <option key={o.value || 'none'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>,
          )}
        </div>
      </AccountGridPage>
    );
  };

  const renderPreferencesPanel = () => {
    const prefsLocked = !preferencesEditing;
    const sectionHeader = (title: string) => (
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold leading-5 text-foreground">{title}</h3>
      </div>
    );

    const checkboxGrid = (options: readonly string[], checked: string[], key: 'preferred_modalities' | 'focus_areas' | 'preferred_days' | 'preferred_times') => (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={checked.includes(m)}
              disabled={prefsLocked}
              onCheckedChange={() => togglePatientArr(key, m)}
            />
            {m}
          </label>
        ))}
      </div>
    );

    return (
      <AccountFormPage
        title="Your preferences"
        description="Personal info and what you're looking for; used to tailor your chiropractor matches."
      >
        <AccountFormCard>
          {sectionHeader('Contact & personal')}
          <div className="grid grid-cols-2 gap-3">
            <AccountFormField id="pt-phone" label="Phone">
              <Input
                id="pt-phone"
                value={patientForm.phone}
                onChange={(e) => setPatientForm((p) => ({ ...p, phone: e.target.value }))}
                disabled={prefsLocked}
                placeholder="Phone number"
              />
            </AccountFormField>
            <AccountFormField id="pt-dob" label="Date of birth">
              <Input
                id="pt-dob"
                type="date"
                value={patientForm.date_of_birth}
                onChange={(e) => setPatientForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                disabled={prefsLocked}
              />
            </AccountFormField>
            <AccountFormField id="pt-ec" label="Emergency contact">
              <Input
                id="pt-ec"
                value={patientForm.emergency_contact}
                onChange={(e) => setPatientForm((p) => ({ ...p, emergency_contact: e.target.value }))}
                disabled={prefsLocked}
                placeholder="Name"
              />
            </AccountFormField>
            <AccountFormField id="pt-ep" label="Emergency phone">
              <Input
                id="pt-ep"
                value={patientForm.emergency_phone}
                onChange={(e) => setPatientForm((p) => ({ ...p, emergency_phone: e.target.value }))}
                disabled={prefsLocked}
                placeholder="Phone"
              />
            </AccountFormField>
          </div>

          <div className="h-px w-full bg-border" aria-hidden />
          {sectionHeader('Location')}
          <div className="grid grid-cols-2 gap-3">
            <AccountFormField id="pt-city" label="City">
              <Input
                id="pt-city"
                value={patientForm.city}
                onChange={(e) => setPatientForm((p) => ({ ...p, city: e.target.value }))}
                disabled={prefsLocked}
                placeholder="City"
              />
            </AccountFormField>
            <AccountFormField id="pt-state" label="State">
              <Input
                id="pt-state"
                value={patientForm.state}
                onChange={(e) => setPatientForm((p) => ({ ...p, state: e.target.value }))}
                disabled={prefsLocked}
                placeholder="State"
              />
            </AccountFormField>
            <AccountFormField id="pt-zip" label="ZIP code">
              <Input
                id="pt-zip"
                value={patientForm.zip_code}
                onChange={(e) => setPatientForm((p) => ({ ...p, zip_code: e.target.value }))}
                disabled={prefsLocked}
                placeholder="ZIP"
              />
            </AccountFormField>
            <AccountFormField id="pt-radius" label="Search radius (miles)">
              <NativeSelect
                id="pt-radius"
                value={patientForm.search_radius}
                disabled={prefsLocked}
                onChange={(e) =>
                  setPatientForm((p) => ({ ...p, search_radius: parseInt(e.target.value, 10) }))
                }
              >
                {SEARCH_RADIUS_MILES_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} miles
                  </option>
                ))}
              </NativeSelect>
            </AccountFormField>
          </div>

          <div className="h-px w-full bg-border" aria-hidden />
          {sectionHeader('Treatment styles')}
          {checkboxGrid(MODALITY_OPTIONS, patientForm.preferred_modalities, 'preferred_modalities')}

          {sectionHeader('Specialty interests')}
          {checkboxGrid(FOCUS_AREA_OPTIONS, patientForm.focus_areas, 'focus_areas')}

          <div className="h-px w-full bg-border" aria-hidden />
          {sectionHeader('Payment & insurance')}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AccountFormField id="pt-bm" label="Preferred business model">
              <NativeSelect
                id="pt-bm"
                value={patientForm.preferred_business_model}
                disabled={prefsLocked}
                onChange={(e) =>
                  setPatientForm((p) => ({ ...p, preferred_business_model: e.target.value }))
                }
              >
                <option value="">No preference</option>
                <option value="cash">Cash-based</option>
                <option value="insurance">Insurance-based</option>
                <option value="hybrid">Hybrid</option>
              </NativeSelect>
            </AccountFormField>
            <AccountFormField id="pt-ins" label="Insurance type">
              <NativeSelect
                id="pt-ins"
                value={patientForm.insurance_type}
                disabled={prefsLocked}
                onChange={(e) => setPatientForm((p) => ({ ...p, insurance_type: e.target.value }))}
              >
                <option value="">Select…</option>
                <option value="none">No insurance / self-pay</option>
                <option value="BCBS">Blue Cross Blue Shield</option>
                <option value="Aetna">Aetna</option>
                <option value="Cigna">Cigna</option>
                <option value="UnitedHealthcare">UnitedHealthcare</option>
                <option value="Medicare">Medicare</option>
                <option value="Medicaid">Medicaid</option>
              </NativeSelect>
            </AccountFormField>
            <AccountFormField id="pt-budget" label="Budget range (monthly)">
              <NativeSelect
                id="pt-budget"
                value={patientForm.budget_range}
                disabled={prefsLocked}
                onChange={(e) => setPatientForm((p) => ({ ...p, budget_range: e.target.value }))}
              >
                <option value="">No preference</option>
                <option value="under-50">Under $50</option>
                <option value="50-100">$50 – $100</option>
                <option value="100-150">$100 – $150</option>
                <option value="over-150">Over $150</option>
              </NativeSelect>
            </AccountFormField>
          </div>

          <div className="h-px w-full bg-border" aria-hidden />
          {sectionHeader('Availability')}
          {checkboxGrid(PREFERRED_DAY_OPTIONS, patientForm.preferred_days, 'preferred_days')}
          {checkboxGrid(PREFERRED_TIME_OPTIONS, patientForm.preferred_times, 'preferred_times')}
        </AccountFormCard>
      </AccountFormPage>
    );
  };

  const renderPlaceholder = (title: string = accountPageTitle(activeNav)) => (
    <AccountFormPage title={title} description="This section is coming soon.">
      <AccountFormCard>
        <p className="text-sm text-muted-foreground">
          We're building this area next. Nothing to do here yet.
        </p>
      </AccountFormCard>
    </AccountFormPage>
  );

  const renderMembershipPanel = () => {
    const premium = isPremiumProfile(profile);
    const renews = profile.current_period_end
      ? new Date(profile.current_period_end).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;
    const statusLabel = profile.subscription_status || 'free';

    return (
      <AccountFormPage
        title="Membership"
        description="Your Movyn plan. Premium unlocks referrals and extra discovery features."
      >
        <AccountFormCard>
          {checkoutBanner ? (
            <p className="text-sm text-muted-foreground">{checkoutBanner}</p>
          ) : null}
          {checkoutSyncing ? (
            <p className="text-sm text-muted-foreground">
              Verifying your subscription with Stripe. This usually completes in a few seconds.
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Current plan</p>
            <p className="text-sm text-muted-foreground">
              {premium
                ? `Premium — status: ${statusLabel}${renews ? ` · Renews or ends next on ${renews}` : ''}`
                : `Free — status: ${statusLabel}. Upgrade for premium features as they launch.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!premium ? (
              <>
                <Button
                  type="button"
                  onClick={() => void startSubscriptionCheckout('monthly')}
                  disabled={billingBusy}
                >
                  {billingBusy ? 'Please wait…' : 'Subscribe monthly'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void startSubscriptionCheckout('annual')}
                  disabled={billingBusy}
                >
                  {billingBusy ? 'Please wait…' : 'Subscribe annual'}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void openBillingPortal()}
                disabled={billingBusy}
              >
                {billingBusy ? 'Please wait…' : 'Manage subscription'}
              </Button>
            )}
          </div>
        </AccountFormCard>
      </AccountFormPage>
    );
  };

  const renderReferralsGate = (body: ReactNode) => (
    <AccountFormPage
      title="Referrals"
      description="Send and receive patient referrals from colleagues."
    >
      <AccountFormCard>{body}</AccountFormCard>
    </AccountFormPage>
  );

  let mainContent: ReactNode = null;
  if (activeNav === 'welcome' && showChiroAccountUI) {
    mainContent = renderWelcomePanel();
  } else if (activeNav === 'profile') {
    mainContent = renderProfilePanel();
  } else if (activeNav === 'practice' && showChiroAccountUI) {
    mainContent = renderPracticePanel();
  } else if (activeNav === 'specialties' && showChiroAccountUI) {
    mainContent = renderSpecialtiesPanel();
  } else if (activeNav === 'preferences' && showPatientAccountUI) {
    mainContent = renderPreferencesPanel();
  } else if (activeNav === 'membership' && showChiroAccountUI) {
    mainContent = renderMembershipPanel();
  } else if (activeNav === 'referrals' && showChiroAccountUI) {
    mainContent =
      !isAdmin && !isPremiumProfile(profile)
        ? renderReferralsGate(
            <div className="space-y-3">
              <p className="text-sm text-foreground">Referrals are a premium capability.</p>
              <p className="text-sm text-muted-foreground">
                Open{' '}
                <Link
                  href={accountSettingsHref('membership')}
                  className="font-medium text-foreground underline"
                >
                  Membership
                </Link>{' '}
                in the sidebar to subscribe.
              </p>
            </div>,
          )
        : !isAdmin && !canUseTrustSensitiveFeatures(profile, chiropractorProfile ?? {})
          ? renderReferralsGate(
              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  Referrals unlock after your license is verified by our team.
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: <strong>{licenseStatus.replace(/_/g, ' ')}</strong>
                  {licenseStatus === 'pending_review'
                    ? ' — we will notify you when review is complete.'
                    : ''}
                </p>
              </div>,
            )
          : (
              <AccountGridPage
                title="Referrals"
                description="Refer patients from search or a colleague's profile. Incoming referrals can be accepted or declined here."
              >
                {profile?.id ? <ReferralsWorkspace userId={profile.id} /> : null}
              </AccountGridPage>
            );
  } else if (isComingSoonNavKey(activeNav)) {
    mainContent = renderPlaceholder();
  } else {
    mainContent = renderProfilePanel();
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="min-h-svh" style={getMovynDashboardProviderStyle()}>
      <MovynAppSidebar
        variant="inset"
        navGroups={navGroups}
        footer={
          <MovynNavUser
            displayName={sidebarUserLabel}
            email={profileForm.email || profile.email}
            avatarUrl={profile.avatar_url}
            firstName={profileForm.first_name}
            lastName={profileForm.last_name}
            showAdminLink={isAdmin}
            onSignOut={() => void handleSignOut()}
          />
        }
      />
      <SidebarInset>
        <MovynSiteHeader
          title={accountPageTitle(activeNav)}
          breadcrumbParent={{ label: 'Account', href: accountSettingsHref('profile') }}
          actions={accountToolbarActions({
            onEdit: handleToolbarEdit,
            onSave: handleToolbarSave,
            editDisabled: toolbarEditDisabled,
            saveDisabled: toolbarSaveDisabled,
            saving,
          })}
        />
        <div className="bg-card text-card-foreground border-b px-4 py-3">
          <input
            id="account-avatar-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarUpload}
            disabled={uploadingAvatar}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="ring-offset-background focus-visible:ring-ring rounded-lg border border-transparent p-0.5 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={openAvatarPicker}
              disabled={uploadingAvatar}
              aria-label="Change profile photo"
              title="Change profile photo"
            >
              <UserAvatar
                avatarUrl={profile.avatar_url}
                firstName={profileForm.first_name}
                lastName={profileForm.last_name}
                email={profileForm.email || profile.email}
                size={56}
                variant="roundedSquare"
                fallbackTone="accountHero"
                alt=""
              />
            </button>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-medium">Welcome, {displayName}</p>
              <p className="text-muted-foreground truncate text-sm">{profileForm.email || profile.email}</p>
            </div>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-muted/40">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[--content-padding]">
            <div className={styles.pageSectionBody}>{mainContent}</div>
            {/* Next.js outlet for `settings/[section]` (body is driven by URL in this shell). */}
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
