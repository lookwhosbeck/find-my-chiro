'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flex, Text, Button, Heading, Card, TextField, TextArea, Box, Avatar, Badge, Tabs, Grid, Select } from '@radix-ui/themes';
import { supabase } from '@/app/lib/supabase';
import { Container } from '@/app/components/Container';
import { uploadAvatar, deleteAvatar, updateProfileAvatarUrl } from '@/app/lib/avatar-upload';

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
  website_url?: string;
  instagram_handle?: string;
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

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chiropractorProfile, setChiropractorProfile] = useState<ChiropractorProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  const [chiropractorForm, setChiropractorForm] = useState({
    bio: '',
    chiropractic_college: '',
    graduation_year: '',
    license_number: '',
    website_url: '',
    instagram_handle: '',
    accepting_new_patients: true
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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/signin');
        return;
      }

      setUser(user);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
        setProfileForm({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || ''
        });
      }

      // Fetch chiropractor profile if user is a chiropractor
      if (profileData?.role === 'chiropractor') {
        const { data: chiroData, error: chiroError } = await supabase
          .from('chiropractors')
          .select('*')
          .eq('id', user.id)
          .single();

        if (chiroError) {
          console.error('Error fetching chiropractor profile:', chiroError);
        } else {
          setChiropractorProfile(chiroData);
          setChiropractorForm({
            bio: chiroData.bio || '',
            chiropractic_college: chiroData.chiropractic_college || '',
            graduation_year: chiroData.graduation_year?.toString() || '',
            license_number: chiroData.license_number || '',
            website_url: chiroData.website_url || '',
            instagram_handle: chiroData.instagram_handle || '',
            accepting_new_patients: chiroData.accepting_new_patients ?? true
          });
        }
      }

      // Fetch patient profile if user is a patient
      if (profileData?.role === 'patient') {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id)
          .single();

        if (patientError) {
          console.error('Error fetching patient profile:', patientError);
        } else {
          setPatientProfile(patientData);
          setPatientForm({
            phone: patientData.phone || '',
            date_of_birth: patientData.date_of_birth || '',
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

    } catch (error) {
      console.error('Error checking user:', error);
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
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setUploadingAvatar(true);

    try {
      // Upload the avatar
      const avatarUrl = await uploadAvatar(file, user.id);
      
      if (!avatarUrl) {
        throw new Error('Failed to upload avatar');
      }

      // Update the profile with the new avatar URL
      const success = await updateProfileAvatarUrl(user.id, avatarUrl);
      
      if (!success) {
        throw new Error('Failed to update profile');
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      } : null);

      alert('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    if (!user || !profile?.avatar_url) return;

    if (!confirm('Are you sure you want to remove your avatar?')) {
      return;
    }

    setUploadingAvatar(true);

    try {
      // Delete the avatar from storage
      await deleteAvatar(user.id);

      // Update the profile to remove the avatar URL
      const success = await updateProfileAvatarUrl(user.id, null);
      
      if (!success) {
        throw new Error('Failed to update profile');
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        avatar_url: undefined,
        updated_at: new Date().toISOString()
      } : null);

      alert('Avatar removed successfully!');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      alert('Error removing avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          email: profileForm.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        updated_at: new Date().toISOString()
      } : null);

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  const saveChiropractorProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updateData = {
        bio: chiropractorForm.bio,
        chiropractic_college: chiropractorForm.chiropractic_college,
        graduation_year: chiropractorForm.graduation_year ? parseInt(chiropractorForm.graduation_year) : null,
        license_number: chiropractorForm.license_number,
        website_url: chiropractorForm.website_url,
        instagram_handle: chiropractorForm.instagram_handle,
        accepting_new_patients: chiropractorForm.accepting_new_patients,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('chiropractors')
        .upsert(updateData, { onConflict: 'id' });

      if (error) throw error;

      // Update local state
      setChiropractorProfile(prev => prev ? {
        ...prev,
        ...updateData
      } : updateData as ChiropractorProfile);

      alert('Chiropractor profile updated successfully!');
    } catch (error) {
      console.error('Error updating chiropractor profile:', error);
      alert('Error updating chiropractor profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const savePatientProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updateData = {
        phone: patientForm.phone || null,
        date_of_birth: patientForm.date_of_birth ? new Date(patientForm.date_of_birth).toISOString().split('T')[0] : null,
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
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('patients')
        .upsert(updateData, { onConflict: 'id' });

      if (error) throw error;

      // Update local state
      setPatientProfile(prev => prev ? {
        ...prev,
        ...updateData
      } : updateData as PatientProfile);

      alert('Patient profile updated successfully!');
    } catch (error) {
      console.error('Error updating patient profile:', error);
      alert('Error updating patient profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
          <Text>Loading...</Text>
        </Flex>
      </Container>
    );
  }

  // If user is not authenticated, redirect happens in checkUser
  // This component should only render for authenticated users

  return (
    <Container>
      <Flex direction="column" gap="6" py="9">
        {/* Header */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="4">
            <Avatar
              size="4"
              src={profile.avatar_url}
              fallback={profile.first_name?.[0]?.toUpperCase() || profile.last_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
            />
            <Box>
              <Heading size="6">
                Welcome back, {profile.first_name || 'User'}!
              </Heading>
              <Flex align="center" gap="2" mt="1">
                <Badge color={profile.role === 'chiropractor' ? 'blue' : 'green'}>
                  {profile.role}
                </Badge>
                <Text size="2" color="gray">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </Text>
              </Flex>
            </Box>
          </Flex>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Flex>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="profile">Account Details</Tabs.Trigger>
            {profile.role === 'chiropractor' && (
              <Tabs.Trigger value="chiropractor">Chiropractor Profile</Tabs.Trigger>
            )}
            {profile.role === 'patient' && (
              <Tabs.Trigger value="patient">Patient Preferences</Tabs.Trigger>
            )}
          </Tabs.List>

          {/* Account Details Tab */}
          <Tabs.Content value="profile">
            <Card>
              <Flex direction="column" gap="4">
                <Heading size="4">Account Information</Heading>

                <Flex direction="column" gap="3">
                  {/* Avatar Upload Section */}
                  <Box>
                    <Text size="2" weight="bold" mb="2">Profile Photo</Text>
                    <Flex gap="4" align="center">
                      <Avatar
                        size="6"
                        src={profile.avatar_url}
                        fallback={profile.first_name?.[0]?.toUpperCase() || profile.last_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                      />
                      <Flex direction="column" gap="2">
                        <Flex gap="2">
                          <label htmlFor="avatar-upload">
                            <Button 
                              as="span" 
                              variant="outline" 
                              size="2"
                              disabled={uploadingAvatar}
                            >
                              {uploadingAvatar ? 'Uploading...' : profile.avatar_url ? 'Change Photo' : 'Upload Photo'}
                            </Button>
                          </label>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleAvatarUpload}
                            disabled={uploadingAvatar}
                          />
                          {profile.avatar_url && (
                            <Button 
                              variant="outline" 
                              size="2"
                              color="red"
                              onClick={handleAvatarDelete}
                              disabled={uploadingAvatar}
                            >
                              Remove
                            </Button>
                          )}
                        </Flex>
                        <Text size="1" color="gray">
                          JPG, PNG or GIF. Max size 5MB.
                        </Text>
                      </Flex>
                    </Flex>
                  </Box>

                  <Box>
                    <Text size="2" weight="bold" mb="2">First Name</Text>
                    <TextField.Root
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </Box>

                  <Box>
                    <Text size="2" weight="bold" mb="2">Last Name</Text>
                    <TextField.Root
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </Box>

                  <Box>
                    <Text size="2" weight="bold" mb="2">Email</Text>
                    <TextField.Root
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      type="email"
                    />
                  </Box>
                </Flex>

                <Flex justify="end" gap="2">
                  <Button variant="outline" onClick={() => setProfileForm({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    email: profile.email || ''
                  })}>
                    Reset
                  </Button>
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Flex>
              </Flex>
            </Card>
          </Tabs.Content>

          {/* Chiropractor Profile Tab */}
          {profile.role === 'chiropractor' && (
            <Tabs.Content value="chiropractor">
              <Card>
                <Flex direction="column" gap="4">
                  <Heading size="4">Chiropractor Profile</Heading>

                  <Flex direction="column" gap="3">
                    <Box>
                      <Text size="2" weight="bold" mb="2">Professional Bio</Text>
                      <TextArea
                        value={chiropractorForm.bio}
                        onChange={(e) => setChiropractorForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell patients about your experience and approach..."
                        rows={4}
                      />
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Chiropractic College</Text>
                      <TextField.Root
                        value={chiropractorForm.chiropractic_college}
                        onChange={(e) => setChiropractorForm(prev => ({ ...prev, chiropractic_college: e.target.value }))}
                        placeholder="Where did you study chiropractic?"
                      />
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Graduation Year</Text>
                      <TextField.Root
                        value={chiropractorForm.graduation_year}
                        onChange={(e) => setChiropractorForm(prev => ({ ...prev, graduation_year: e.target.value }))}
                        placeholder="e.g. 2020"
                        type="number"
                      />
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">License Number</Text>
                      <TextField.Root
                        value={chiropractorForm.license_number}
                        onChange={(e) => setChiropractorForm(prev => ({ ...prev, license_number: e.target.value }))}
                        placeholder="Your chiropractic license number"
                      />
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Website</Text>
                      <TextField.Root
                        value={chiropractorForm.website_url}
                        onChange={(e) => setChiropractorForm(prev => ({ ...prev, website_url: e.target.value }))}
                        placeholder="https://your-website.com"
                        type="url"
                      />
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Instagram Handle</Text>
                      <TextField.Root
                        value={chiropractorForm.instagram_handle}
                        onChange={(e) => setChiropractorForm(prev => ({ ...prev, instagram_handle: e.target.value }))}
                        placeholder="@yourhandle"
                      />
                    </Box>

                    <Box>
                      <Flex align="center" gap="2">
                        <input
                          type="checkbox"
                          id="accepting_patients"
                          checked={chiropractorForm.accepting_new_patients}
                          onChange={(e) => setChiropractorForm(prev => ({ ...prev, accepting_new_patients: e.target.checked }))}
                        />
                        <label htmlFor="accepting_patients">
                          <Text size="2" weight="bold">Currently accepting new patients</Text>
                        </label>
                      </Flex>
                    </Box>
                  </Flex>

                  <Flex justify="end" gap="2">
                    <Button variant="outline" onClick={() => setChiropractorForm({
                      bio: chiropractorProfile?.bio || '',
                      chiropractic_college: chiropractorProfile?.chiropractic_college || '',
                      graduation_year: chiropractorProfile?.graduation_year?.toString() || '',
                      license_number: chiropractorProfile?.license_number || '',
                      website_url: chiropractorProfile?.website_url || '',
                      instagram_handle: chiropractorProfile?.instagram_handle || '',
                      accepting_new_patients: chiropractorProfile?.accepting_new_patients ?? true
                    })}>
                      Reset
                    </Button>
                    <Button onClick={saveChiropractorProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </Tabs.Content>
          )}

          {/* Patient Profile Tab */}
          {profile.role === 'patient' && (
            <Tabs.Content value="patient">
              <Card>
                <Flex direction="column" gap="4">
                  <Heading size="4">Patient Preferences</Heading>

                  <Flex direction="column" gap="3">
                    <Box>
                      <Text size="2" weight="bold" mb="2">Phone Number</Text>
                      <TextField.Root
                        value={patientForm.phone}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Date of Birth</Text>
                      <TextField.Root
                        type="date"
                        value={patientForm.date_of_birth}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Emergency Contact Name</Text>
                      <TextField.Root
                        value={patientForm.emergency_contact}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
                        placeholder="Emergency contact name"
                      />
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Emergency Contact Phone</Text>
                      <TextField.Root
                        value={patientForm.emergency_phone}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_phone: e.target.value }))}
                        placeholder="Emergency contact phone"
                      />
                    </Box>

                    <Grid columns="3" gap="3">
                      <Box>
                        <Text size="2" weight="bold" mb="2">City</Text>
                        <TextField.Root
                          value={patientForm.city}
                          onChange={(e) => setPatientForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                        />
                      </Box>
                      <Box>
                        <Text size="2" weight="bold" mb="2">State</Text>
                        <TextField.Root
                          value={patientForm.state}
                          onChange={(e) => setPatientForm(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                        />
                      </Box>
                      <Box>
                        <Text size="2" weight="bold" mb="2">Zip Code</Text>
                        <TextField.Root
                          value={patientForm.zip_code}
                          onChange={(e) => setPatientForm(prev => ({ ...prev, zip_code: e.target.value }))}
                          placeholder="12345"
                        />
                      </Box>
                    </Grid>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Search Radius (miles)</Text>
                      <Select.Root
                        value={patientForm.search_radius.toString()}
                        onValueChange={(value) => setPatientForm(prev => ({ ...prev, search_radius: parseInt(value) }))}
                      >
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Item value="5">5 miles</Select.Item>
                          <Select.Item value="10">10 miles</Select.Item>
                          <Select.Item value="15">15 miles</Select.Item>
                          <Select.Item value="25">25 miles</Select.Item>
                          <Select.Item value="50">50 miles</Select.Item>
                          <Select.Item value="100">100 miles</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Preferred Business Model</Text>
                      <Select.Root
                        value={patientForm.preferred_business_model}
                        onValueChange={(value) => setPatientForm(prev => ({ ...prev, preferred_business_model: value }))}
                      >
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Item value="">No Preference</Select.Item>
                          <Select.Item value="cash">Cash-Based</Select.Item>
                          <Select.Item value="insurance">Insurance-Based</Select.Item>
                          <Select.Item value="hybrid">Hybrid</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Insurance Type</Text>
                      <Select.Root
                        value={patientForm.insurance_type}
                        onValueChange={(value) => setPatientForm(prev => ({ ...prev, insurance_type: value }))}
                      >
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Item value="">No Insurance</Select.Item>
                          <Select.Item value="BCBS">Blue Cross Blue Shield</Select.Item>
                          <Select.Item value="Aetna">Aetna</Select.Item>
                          <Select.Item value="Cigna">Cigna</Select.Item>
                          <Select.Item value="UnitedHealthcare">UnitedHealthcare</Select.Item>
                          <Select.Item value="Medicare">Medicare</Select.Item>
                          <Select.Item value="Medicaid">Medicaid</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Box>

                    <Box>
                      <Text size="2" weight="bold" mb="2">Budget Range (Monthly)</Text>
                      <Select.Root
                        value={patientForm.budget_range}
                        onValueChange={(value) => setPatientForm(prev => ({ ...prev, budget_range: value }))}
                      >
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Item value="">No Preference</Select.Item>
                          <Select.Item value="under-50">Under $50</Select.Item>
                          <Select.Item value="50-100">$50 - $100</Select.Item>
                          <Select.Item value="100-150">$100 - $150</Select.Item>
                          <Select.Item value="over-150">Over $150</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Box>
                  </Flex>

                  <Flex justify="end" gap="2">
                    <Button variant="outline" onClick={() => {
                      if (patientProfile) {
                        setPatientForm({
                          phone: patientProfile.phone || '',
                          date_of_birth: patientProfile.date_of_birth || '',
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
                    }}>
                      Reset
                    </Button>
                    <Button onClick={savePatientProfile} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </Tabs.Content>
          )}
        </Tabs.Root>
      </Flex>
    </Container>
  );
}