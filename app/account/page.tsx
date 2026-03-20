'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Checkbox } from '@radix-ui/themes';
import { EnvelopeClosedIcon } from '@radix-ui/react-icons';
import { supabase } from '@/app/lib/supabase';
import { uploadAvatar, deleteAvatar, updateProfileAvatarUrl } from '@/app/lib/avatar-upload';
import { FindMyChiroLogo } from '@/app/components/FindMyChiroLogo';
import {
  MODALITY_OPTIONS,
  FOCUS_AREA_OPTIONS,
  PREFERRED_DAY_OPTIONS,
  PREFERRED_TIME_OPTIONS,
} from './constants';
import styles from './page.module.css';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'patient' | 'chiropractor' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface ChiropractorProfile {
  id: string;
  bio?: string;
  chiropractic_college?: string;
  graduation_year?: number;
  license_number?: string;
  accepting_new_patients?: boolean;
  updated_at: string;
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
  zip_code?: string;
  search_radius?: number;
  preferred_days?: string[];
  preferred_times?: string[];
  updated_at: string;
}

type NavKey = 'profile' | 'practice' | 'specialties' | 'preferences' | 'referrals' | 'messages';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chiropractorProfile, setChiropractorProfile] = useState<ChiropractorProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeNav, setActiveNav] = useState<NavKey>('profile');
  const [profileEditing, setProfileEditing] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [chiroModalityNames, setChiroModalityNames] = useState<string[]>([]);
  const [chiroFocusNames, setChiroFocusNames] = useState<string[]>([]);

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

  const loadChiroSpecialties = useCallback(async (userId: string) => {
    try {
      const [mods, focus] = await Promise.all([
        supabase.from('chiropractor_modalities').select('modalities(name)').eq('chiropractor_id', userId),
        supabase.from('chiropractor_focus_areas').select('focus_areas(name)').eq('chiropractor_id', userId),
      ]);
      const pickName = (rel: unknown): string | undefined => {
        if (rel == null) return undefined;
        if (Array.isArray(rel)) return (rel[0] as { name?: string })?.name;
        return (rel as { name?: string }).name;
      };
      const mn = mods.data?.map((r) => pickName((r as { modalities?: unknown }).modalities)).filter(Boolean) || [];
      const fn =
        focus.data?.map((r) => pickName((r as { focus_areas?: unknown }).focus_areas)).filter(Boolean) || [];
      setChiroModalityNames(mn as string[]);
      setChiroFocusNames(fn as string[]);
    } catch {
      setChiroModalityNames([]);
      setChiroFocusNames([]);
    }
  }, []);

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

  const checkUser = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/signin');
        return;
      }

      setUser(authUser);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData as UserProfile);
      setProfileForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
      });

      if (profileData.role === 'chiropractor') {
        const { data: chiroData, error: chiroError } = await supabase
          .from('chiropractors')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!chiroError && chiroData) {
          setChiropractorProfile(chiroData as ChiropractorProfile);
          setChiropractorForm({
            bio: chiroData.bio || '',
            chiropractic_college: chiroData.chiropractic_college || '',
            graduation_year: chiroData.graduation_year?.toString() || '',
            license_number: chiroData.license_number || '',
            accepting_new_patients: chiroData.accepting_new_patients ?? true,
          });
          await loadChiroSpecialties(authUser.id);
        }
      }

      if (profileData.role === 'patient') {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!patientError && patientData) {
          setPatientProfile(patientData as PatientProfile);
          setPatientForm({
            phone: patientData.phone || '',
            date_of_birth: patientData.date_of_birth?.slice(0, 10) || '',
            emergency_contact: patientData.emergency_contact || '',
            emergency_phone: patientData.emergency_phone || '',
            preferred_modalities: patientData.preferred_modalities || [],
            focus_areas: patientData.focus_areas || [],
            preferred_business_model: patientData.preferred_business_model || '',
            insurance_type: patientData.insurance_type || '',
            budget_range: patientData.budget_range || '',
            city: patientData.city || '',
            state: patientData.state || '',
            zip_code: patientData.zip_code || '',
            search_radius: patientData.search_radius || 25,
            preferred_days: patientData.preferred_days || [],
            preferred_times: patientData.preferred_times || [],
          });
        }
      }
    } catch (e) {
      console.error('Error checking user:', e);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          email: profileForm.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              first_name: profileForm.first_name,
              last_name: profileForm.last_name,
              email: profileForm.email,
              updated_at: new Date().toISOString(),
            }
          : null,
      );
      setProfileEditing(false);
    } catch (e) {
      console.error(e);
      alert('Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const saveChiropractorProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updateData = {
        id: user.id,
        bio: chiropractorForm.bio,
        chiropractic_college: chiropractorForm.chiropractic_college,
        graduation_year: chiropractorForm.graduation_year ? parseInt(chiropractorForm.graduation_year, 10) : null,
        license_number: chiropractorForm.license_number,
        accepting_new_patients: chiropractorForm.accepting_new_patients,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('chiropractors').upsert(updateData, { onConflict: 'id' });
      if (error) throw error;

      setChiropractorProfile((prev) => (prev ? { ...prev, ...updateData } : (updateData as ChiropractorProfile)));
    } catch (e) {
      console.error(e);
      alert('Could not update practice profile.');
    } finally {
      setSaving(false);
    }
  };

  const saveChiroSpecialties = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const sync = async (
        table: 'chiropractor_modalities' | 'chiropractor_focus_areas',
        refTable: 'modalities' | 'focus_areas',
        fk: 'modality_id' | 'focus_area_id',
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
    } catch (e) {
      console.error(e);
      alert('Could not update specialties. Your database may use different table names or permissions.');
    } finally {
      setSaving(false);
    }
  };

  const savePatientProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updateData = {
        id: user.id,
        phone: patientForm.phone || null,
        date_of_birth: patientForm.date_of_birth || null,
        emergency_contact: patientForm.emergency_contact || null,
        emergency_phone: patientForm.emergency_phone || null,
        preferred_modalities: patientForm.preferred_modalities,
        focus_areas: patientForm.focus_areas,
        preferred_business_model: patientForm.preferred_business_model || null,
        insurance_type: patientForm.insurance_type || null,
        budget_range: patientForm.budget_range || null,
        city: patientForm.city || null,
        state: patientForm.state || null,
        zip_code: patientForm.zip_code || null,
        search_radius: patientForm.search_radius,
        preferred_days: patientForm.preferred_days,
        preferred_times: patientForm.preferred_times,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('patients').upsert(updateData, { onConflict: 'id' });
      if (error) throw error;

      setPatientProfile((prev) => (prev ? { ...prev, ...updateData } : (updateData as PatientProfile)));
    } catch (e) {
      console.error(e);
      alert('Could not update preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.loadingBox}>Loading…</div>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className={styles.shell}>
        <div className={styles.loadingBox}>Unable to load your profile.</div>
      </div>
    );
  }

  const isChiro = profile.role === 'chiropractor';
  const isPatient = profile.role === 'patient';

  const chiroNav: { key: NavKey; label: string; disabled?: boolean }[] = [
    { key: 'practice', label: 'Your practice' },
    { key: 'profile', label: 'Your profile' },
    { key: 'specialties', label: 'Specialties' },
    { key: 'referrals', label: 'Referrals', disabled: true },
    { key: 'messages', label: 'Messages', disabled: true },
  ];

  const patientNav: { key: NavKey; label: string; disabled?: boolean }[] = [
    { key: 'profile', label: 'Your profile' },
    { key: 'preferences', label: 'Your preferences' },
    { key: 'referrals', label: 'Referrals', disabled: true },
    { key: 'messages', label: 'Messages', disabled: true },
  ];

  const navItems = isChiro ? chiroNav : patientNav;

  const displayName =
    [profileForm.first_name, profileForm.last_name].filter(Boolean).join(' ') || 'there';

  const initialsRaw =
    `${profileForm.first_name?.[0] || ''}${profileForm.last_name?.[0] || ''}`.trim() ||
    profileForm.email?.[0] ||
    '?';
  const initials = initialsRaw.toUpperCase();

  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const emailUpdated = new Date(profile.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const openAvatarPicker = () => {
    if (uploadingAvatar) return;
    document.getElementById('account-avatar-input')?.click();
  };

  const renderProfilePanel = () => (
    <>
      <div className={styles.profileHeaderOverlap}>
        <button
          type="button"
          className={styles.avatarButton}
          onClick={openAvatarPicker}
          disabled={uploadingAvatar}
          aria-label="Change profile photo"
          title="Change profile photo"
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.avatar} src={profile.avatar_url} alt="" width={100} height={100} />
          ) : (
            <span className={styles.avatarFallback}>{initials}</span>
          )}
        </button>
        <div className={styles.profileHeaderTextCol}>
          <div className={styles.profileHeaderTopRow}>
            <div className={styles.welcomeBlock}>
              <p className={styles.welcomeTitle}>Welcome, {displayName}</p>
              <p className={styles.welcomeEmail}>{profileForm.email}</p>
              <p className={styles.welcomeMeta}>Member since {memberSince}</p>
            </div>
            <button
              type="button"
              className={profileEditing ? `${styles.editBtn} ${styles.editBtnMuted}` : styles.editBtn}
              onClick={() => setProfileEditing((e) => !e)}
            >
              {profileEditing ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      <input
        id="account-avatar-input"
        type="file"
        accept="image/*"
        className={styles.hiddenFile}
        onChange={handleAvatarUpload}
        disabled={uploadingAvatar}
      />
      {profileEditing && (
        <div className={styles.avatarActions}>
          <button type="button" className={styles.secondaryBtn} onClick={openAvatarPicker} disabled={uploadingAvatar}>
            {uploadingAvatar ? 'Uploading…' : profile.avatar_url ? 'Change photo' : 'Upload photo'}
          </button>
          {profile.avatar_url && (
            <button type="button" className={styles.secondaryBtn} onClick={handleAvatarDelete} disabled={uploadingAvatar}>
              Remove
            </button>
          )}
        </div>
      )}
      <p className={styles.mutedNote}>Click your photo to upload. JPG, PNG or GIF. Max 5MB.</p>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pf-first">
            First name
          </label>
          <input
            id="pf-first"
            className={styles.input}
            value={profileForm.first_name}
            onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
            disabled={!profileEditing}
            placeholder="First name"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pf-last">
            Last name
          </label>
          <input
            id="pf-last"
            className={styles.input}
            value={profileForm.last_name}
            onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
            disabled={!profileEditing}
            placeholder="Last name"
          />
        </div>
        <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.fieldLabel} htmlFor="pf-email">
            Email
          </label>
          <input
            id="pf-email"
            className={styles.input}
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
            disabled={!profileEditing}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className={styles.emailSection}>
        <h3 className={styles.sectionTitle}>My email address</h3>
        <div className={styles.emailRow}>
          <div className={styles.emailIconWrap}>
            <div className={styles.emailIconBg} />
            <EnvelopeClosedIcon className={styles.emailIcon} aria-hidden />
          </div>
          <div className={styles.emailTextBlock}>
            <span>{profileForm.email}</span>
            <span className={styles.emailSub}>Last updated {emailUpdated}</span>
          </div>
        </div>
        <button type="button" className={styles.addEmailBtn} disabled title="Secondary email is not available yet">
          + Add email address
        </button>
      </div>

      {profileEditing && (
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              setProfileForm({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || '',
              });
            }}
          >
            Reset
          </button>
          <button type="button" className={styles.primaryBtn} onClick={saveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </>
  );

  const renderPracticePanel = () => (
    <>
      <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>
        Your practice
      </h3>
      <div className={styles.fieldGrid}>
        <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.fieldLabel} htmlFor="ch-bio">
            Professional bio
          </label>
          <textarea
            id="ch-bio"
            className={`${styles.input} ${styles.textarea}`}
            value={chiropractorForm.bio}
            onChange={(e) => setChiropractorForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Tell patients about your experience and approach…"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="ch-college">
            Chiropractic college
          </label>
          <input
            id="ch-college"
            className={styles.input}
            value={chiropractorForm.chiropractic_college}
            onChange={(e) => setChiropractorForm((p) => ({ ...p, chiropractic_college: e.target.value }))}
            placeholder="College name"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="ch-year">
            Graduation year
          </label>
          <input
            id="ch-year"
            className={styles.input}
            type="number"
            value={chiropractorForm.graduation_year}
            onChange={(e) => setChiropractorForm((p) => ({ ...p, graduation_year: e.target.value }))}
            placeholder="e.g. 2020"
          />
        </div>
        <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.fieldLabel} htmlFor="ch-license">
            License number
          </label>
          <input
            id="ch-license"
            className={styles.input}
            value={chiropractorForm.license_number}
            onChange={(e) => setChiropractorForm((p) => ({ ...p, license_number: e.target.value }))}
            placeholder="License number"
          />
        </div>
        <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.checkboxRow}>
            <Checkbox
              checked={chiropractorForm.accepting_new_patients}
              onCheckedChange={(v) =>
                setChiropractorForm((p) => ({ ...p, accepting_new_patients: v === true }))
              }
            />
            Currently accepting new patients
          </label>
        </div>
      </div>
      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => {
            if (chiropractorProfile) {
              setChiropractorForm({
                bio: chiropractorProfile.bio || '',
                chiropractic_college: chiropractorProfile.chiropractic_college || '',
                graduation_year: chiropractorProfile.graduation_year?.toString() || '',
                license_number: chiropractorProfile.license_number || '',
                accepting_new_patients: chiropractorProfile.accepting_new_patients ?? true,
              });
            }
          }}
        >
          Reset
        </button>
        <button type="button" className={styles.primaryBtn} onClick={saveChiropractorProfile} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </>
  );

  const renderSpecialtiesPanel = () => (
    <>
      <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>
        Techniques &amp; modalities
      </h3>
      <div className={styles.checkboxGrid}>
        {MODALITY_OPTIONS.map((m) => (
          <label key={m} className={styles.checkboxRow}>
            <Checkbox checked={chiroModalityNames.includes(m)} onCheckedChange={() => toggleChiroMod(m)} />
            {m}
          </label>
        ))}
      </div>
      <h3 className={styles.sectionTitle}>Focus areas</h3>
      <div className={styles.checkboxGrid}>
        {FOCUS_AREA_OPTIONS.map((m) => (
          <label key={m} className={styles.checkboxRow}>
            <Checkbox checked={chiroFocusNames.includes(m)} onCheckedChange={() => toggleChiroFocus(m)} />
            {m}
          </label>
        ))}
      </div>
      <div className={styles.actionsRow}>
        <button type="button" className={styles.primaryBtn} onClick={saveChiroSpecialties} disabled={saving}>
          {saving ? 'Saving…' : 'Save specialties'}
        </button>
      </div>
    </>
  );

  const renderPreferencesPanel = () => (
    <>
      <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>
        Contact &amp; personal
      </h3>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Phone</label>
          <input
            className={styles.input}
            value={patientForm.phone}
            onChange={(e) => setPatientForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Phone number"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Date of birth</label>
          <input
            className={styles.input}
            type="date"
            value={patientForm.date_of_birth}
            onChange={(e) => setPatientForm((p) => ({ ...p, date_of_birth: e.target.value }))}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Emergency contact</label>
          <input
            className={styles.input}
            value={patientForm.emergency_contact}
            onChange={(e) => setPatientForm((p) => ({ ...p, emergency_contact: e.target.value }))}
            placeholder="Name"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Emergency phone</label>
          <input
            className={styles.input}
            value={patientForm.emergency_phone}
            onChange={(e) => setPatientForm((p) => ({ ...p, emergency_phone: e.target.value }))}
            placeholder="Phone"
          />
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Location</h3>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>City</label>
          <input
            className={styles.input}
            value={patientForm.city}
            onChange={(e) => setPatientForm((p) => ({ ...p, city: e.target.value }))}
            placeholder="City"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>State</label>
          <input
            className={styles.input}
            value={patientForm.state}
            onChange={(e) => setPatientForm((p) => ({ ...p, state: e.target.value }))}
            placeholder="State"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>ZIP code</label>
          <input
            className={styles.input}
            value={patientForm.zip_code}
            onChange={(e) => setPatientForm((p) => ({ ...p, zip_code: e.target.value }))}
            placeholder="ZIP"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Search radius (miles)</label>
          <div className={styles.selectWrap}>
            <span className={styles.selectChevron} />
            <select
              className={`${styles.select} ${styles.selectNative}`}
              value={patientForm.search_radius}
              onChange={(e) =>
                setPatientForm((p) => ({ ...p, search_radius: parseInt(e.target.value, 10) }))
              }
            >
              {[5, 10, 15, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} miles
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Treatment styles</h3>
      <div className={styles.checkboxGrid}>
        {MODALITY_OPTIONS.map((m) => (
          <label key={m} className={styles.checkboxRow}>
            <Checkbox
              checked={patientForm.preferred_modalities.includes(m)}
              onCheckedChange={() => togglePatientArr('preferred_modalities', m)}
            />
            {m}
          </label>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>Specialty interests</h3>
      <div className={styles.checkboxGrid}>
        {FOCUS_AREA_OPTIONS.map((m) => (
          <label key={m} className={styles.checkboxRow}>
            <Checkbox
              checked={patientForm.focus_areas.includes(m)}
              onCheckedChange={() => togglePatientArr('focus_areas', m)}
            />
            {m}
          </label>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>Payment &amp; insurance</h3>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Preferred business model</label>
          <div className={styles.selectWrap}>
            <span className={styles.selectChevron} />
            <select
              className={`${styles.select} ${styles.selectNative}`}
              value={patientForm.preferred_business_model}
              onChange={(e) => setPatientForm((p) => ({ ...p, preferred_business_model: e.target.value }))}
            >
              <option value="">No preference</option>
              <option value="cash">Cash-based</option>
              <option value="insurance">Insurance-based</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Insurance type</label>
          <div className={styles.selectWrap}>
            <span className={styles.selectChevron} />
            <select
              className={`${styles.select} ${styles.selectNative}`}
              value={patientForm.insurance_type}
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
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Budget range (monthly)</label>
          <div className={styles.selectWrap}>
            <span className={styles.selectChevron} />
            <select
              className={`${styles.select} ${styles.selectNative}`}
              value={patientForm.budget_range}
              onChange={(e) => setPatientForm((p) => ({ ...p, budget_range: e.target.value }))}
            >
              <option value="">No preference</option>
              <option value="under-50">Under $50</option>
              <option value="50-100">$50 – $100</option>
              <option value="100-150">$100 – $150</option>
              <option value="over-150">Over $150</option>
            </select>
          </div>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Availability</h3>
      <div className={styles.checkboxGrid}>
        {PREFERRED_DAY_OPTIONS.map((d) => (
          <label key={d} className={styles.checkboxRow}>
            <Checkbox
              checked={patientForm.preferred_days.includes(d)}
              onCheckedChange={() => togglePatientArr('preferred_days', d)}
            />
            {d}
          </label>
        ))}
      </div>
      <div className={styles.checkboxGrid} style={{ marginTop: 12 }}>
        {PREFERRED_TIME_OPTIONS.map((t) => (
          <label key={t} className={styles.checkboxRow}>
            <Checkbox
              checked={patientForm.preferred_times.includes(t)}
              onCheckedChange={() => togglePatientArr('preferred_times', t)}
            />
            {t}
          </label>
        ))}
      </div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => {
            if (patientProfile) {
              setPatientForm({
                phone: patientProfile.phone || '',
                date_of_birth: patientProfile.date_of_birth?.slice(0, 10) || '',
                emergency_contact: patientProfile.emergency_contact || '',
                emergency_phone: patientProfile.emergency_phone || '',
                preferred_modalities: patientProfile.preferred_modalities || [],
                focus_areas: patientProfile.focus_areas || [],
                preferred_business_model: patientProfile.preferred_business_model || '',
                insurance_type: patientProfile.insurance_type || '',
                budget_range: patientProfile.budget_range || '',
                city: patientProfile.city || '',
                state: patientProfile.state || '',
                zip_code: patientProfile.zip_code || '',
                search_radius: patientProfile.search_radius || 25,
                preferred_days: patientProfile.preferred_days || [],
                preferred_times: patientProfile.preferred_times || [],
              });
            }
          }}
        >
          Reset
        </button>
        <button type="button" className={styles.primaryBtn} onClick={savePatientProfile} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </>
  );

  const renderPlaceholder = (title: string) => (
    <div>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.placeholderPanel}>This section is coming soon.</div>
    </div>
  );

  let mainContent: ReactNode = null;
  if (activeNav === 'profile') {
    mainContent = renderProfilePanel();
  } else if (activeNav === 'practice' && isChiro) {
    mainContent = renderPracticePanel();
  } else if (activeNav === 'specialties' && isChiro) {
    mainContent = renderSpecialtiesPanel();
  } else if (activeNav === 'preferences' && isPatient) {
    mainContent = renderPreferencesPanel();
  } else if (activeNav === 'referrals') {
    mainContent = renderPlaceholder('Referrals');
  } else if (activeNav === 'messages') {
    mainContent = renderPlaceholder('Messages');
  } else {
    mainContent = renderProfilePanel();
  }

  const showHero = true;

  return (
    <div className={styles.shell}>
      <div className={styles.layout}>
        <aside className={styles.sidebarWrap}>
          <div className={styles.sidebar}>
            <Link href="/" style={{ lineHeight: 0 }}>
              <FindMyChiroLogo variant="onDark" className={styles.sidebarLogo} />
            </Link>
            <nav className={styles.nav} aria-label="Account sections">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.navItem} ${activeNav === item.key ? styles.navItemActive : ''}`}
                  onClick={() => !item.disabled && setActiveNav(item.key)}
                  disabled={item.disabled}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className={styles.sidebarFooter}>
              <Link href="/" className={styles.sidebarLink}>
                Back to home
              </Link>
              <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className={styles.mainWrap}>
          <div className={styles.mainCard}>
            {showHero && <div className={styles.heroBar} aria-hidden />}
            <div className={styles.mainInner}>{mainContent}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
