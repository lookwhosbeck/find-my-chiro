'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flex, Text, Button, Heading, Card, TextField, TextArea, Box, Avatar, Badge, Tabs } from '@radix-ui/themes';
import { supabase } from '@/app/lib/supabase';
import { Container } from '@/app/components/Container';

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

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chiropractorProfile, setChiropractorProfile] = useState<ChiropractorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
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

  const handleSignIn = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInForm.email,
        password: signInForm.password,
      });

      if (error) throw error;

      // Refresh the page to load user data
      window.location.reload();
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert(error.message || 'Error signing in. Please try again.');
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

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
          <Text>Loading...</Text>
        </Flex>
      </Container>
    );
  }

  if (!user || !profile) {
    return (
      <Container>
        <Flex direction="column" gap="6" py="9">
          <Flex justify="center">
            <Heading size="6">Sign In to Your Account</Heading>
          </Flex>

          <Card style={{ maxWidth: '400px', margin: '0 auto' }}>
            <Flex direction="column" gap="4">
              <Box>
                <Text size="2" weight="bold" mb="2">Email</Text>
                <TextField.Root
                  value={signInForm.email}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  type="email"
                />
              </Box>

              <Box>
                <Text size="2" weight="bold" mb="2">Password</Text>
                <TextField.Root
                  value={signInForm.password}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  type="password"
                />
              </Box>

              <Button onClick={handleSignIn} disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Signing In...' : 'Sign In'}
              </Button>

              <Flex justify="center">
                <Text size="2">
                  Don't have an account?{' '}
                  <Button variant="ghost" size="1" asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </Text>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Container>
    );
  }

  return (
    <Container>
      <Flex direction="column" gap="6" py="9">
        {/* Header */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="4">
            <Avatar
              size="4"
              src={profile.avatar_url}
              fallback={profile.first_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
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
          </Tabs.List>

          {/* Account Details Tab */}
          <Tabs.Content value="profile">
            <Card>
              <Flex direction="column" gap="4">
                <Heading size="4">Account Information</Heading>

                <Flex direction="column" gap="3">
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
        </Tabs.Root>
      </Flex>
    </Container>
  );
}