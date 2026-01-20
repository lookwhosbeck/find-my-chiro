'use client';

import { useState, useEffect } from 'react';
import { Grid, Card, Flex, Text, Heading, TextField, Button, Select, TextArea, Tabs, Checkbox, RadioGroup, Box, Callout } from '@radix-ui/themes';
import { GlobeIcon, InstagramLogoIcon, MagicWandIcon, InfoCircledIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Container } from '../components/Container';
import { signUpChiropractor, type SignUpData } from '../lib/auth';
import { getChiropracticColleges, type ChiropracticCollege } from '../lib/queries';

const steps = [
  { number: 1, label: 'Account' },
  { number: 2, label: 'Professional Details' },
  { number: 3, label: 'Matching' },
  { number: 4, label: 'Organization' },
];

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [colleges, setColleges] = useState<ChiropracticCollege[]>([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState(true);
  const [formData, setFormData] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    // Step 2
    college: '',
    graduationYear: '2015',
    licenseNumber: '',
    bio: '',
    // Step 3
    modalities: [] as string[],
    focusAreas: [] as string[],
    businessModel: '',
    insurances: [] as string[],
    // Step 4
    clinicName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    instagram: '',
  });

  // Fetch colleges on component mount
  useEffect(() => {
    async function fetchColleges() {
      setIsLoadingColleges(true);
      try {
        const collegesData = await getChiropracticColleges();
        setColleges(collegesData);
        // Set default college if available and not already set
        if (collegesData.length > 0) {
          setFormData(prev => {
            if (!prev.college) {
              return { ...prev, college: collegesData[0].name };
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error fetching colleges:', error);
      } finally {
        setIsLoadingColleges(false);
      }
    }
    fetchColleges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTextFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = 'value' in e.target ? e.target.value : (e.target as HTMLInputElement).value;
    handleInputChange(field, value);
  };

  const handleTextAreaChange = (field: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(field, e.target.value);
  };

  const handleCheckboxChange = (category: 'modalities' | 'focusAreas' | 'insurances', value: string) => {
    setFormData(prev => {
      const currentArray = prev[category];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [category]: newArray };
    });
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setSubmitError('Please complete all required fields in Step 1');
      setStep(1);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setSubmitError('Password must be at least 6 characters long');
      setStep(1);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitError('Please enter a valid email address');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await signUpChiropractor(formData as SignUpData);
      
      if (result.success) {
        setSubmitSuccess(true);
        // Redirect to a success page or home after a delay
        setTimeout(() => {
          router.push('/?signup=success');
        }, 2000);
      } else {
        setSubmitError(result.error || 'Failed to create account. Please try again.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setSubmitError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepDescriptions = () => {
    switch (step) {
      case 1:
        return 'Create your account to get started.';
      case 2:
        return 'Tell us about your professional background.';
      case 3:
        return 'Help patients find you by selecting your specialties.';
      case 4:
        return 'Add your practice location and contact information.';
      default:
        return '';
    }
  };

  const getWhyDetailText = () => {
    switch (step) {
      case 1:
        return 'Creating an account ensures secure access and personalized matching.';
      case 2:
        return 'Granular data (like specific techniques) helps us reduce mismatched inquiries by 40%.';
      case 3:
        return 'Detailed matching preferences ensure patients find exactly what they need.';
      case 4:
        return 'Location data enables geo-search so patients can find nearby care.';
      default:
        return '';
    }
  };

  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Header />
      
      <Box py="9" style={{ flex: 1 }}>
        <Container>
        <Grid columns={{ initial: '1', lg: '2' }} gap="9">
          {/* Left Column: Progress and Value Proposition */}
          <Flex direction="column" gap="6" style={{ maxWidth: '400px' }}>
            <Flex direction="column" gap="2">
              <Heading size="8">Let's build your profile.</Heading>
              <Text size="4" color="gray">
                Completing this application allows our algorithms to match you with ideal patients.
              </Text>
            </Flex>

            {/* Vertical Progress Indicator */}
            <Flex direction="column" gap="4" mt="4">
              {steps.map((s, index) => (
                <Flex key={s.number} gap="3" align="center">
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: step >= s.number ? 'var(--gray-12)' : 'transparent',
                      border: step >= s.number ? 'none' : '2px solid var(--gray-6)',
                      color: step >= s.number ? 'white' : 'var(--gray-9)',
                      fontWeight: '600',
                      fontSize: '14px',
                      flexShrink: 0,
                    }}
                  >
                    {s.number}
                  </Flex>
                  <Text
                    size="3"
                    weight={step >= s.number ? 'medium' : 'regular'}
                    color={step >= s.number ? 'gray' : 'gray'}
                  >
                    {s.number} {s.label}
                  </Text>
                </Flex>
              ))}
            </Flex>

            {/* Why this detail? Box */}
            <Card
              style={{
                background: 'var(--teal-2)',
                border: '1px solid var(--teal-4)',
                marginTop: 'auto',
              }}
            >
              <Flex direction="column" gap="2">
                <Heading size="4">Why this detail?</Heading>
                <Text size="2" color="gray">
                  {getWhyDetailText()}
                </Text>
              </Flex>
            </Card>
          </Flex>

          {/* Right Column: Form Steps */}
          <Card size="4" style={{ maxWidth: '600px' }}>
            <Flex direction="column" gap="6">
              {/* Success Message */}
              {submitSuccess && (
                <Callout.Root color="green">
                  <Callout.Icon>
                    <CheckCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    Account created successfully! Redirecting...
                  </Callout.Text>
                </Callout.Root>
              )}

              {/* Error Message */}
              {submitError && (
                <Callout.Root color="red">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    {submitError}
                  </Callout.Text>
                </Callout.Root>
              )}

              {/* Step 1: Account & Identity */}
              {step === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                  <Flex direction="column" gap="4">
                    <Heading size="6">Create Your Account</Heading>
                    <Flex direction="column" gap="3">
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">First Name</Text>
                        <TextField.Root
                          size="3"
                          value={formData.firstName}
                          onChange={handleTextFieldChange('firstName')}
                          placeholder="John"
                          required
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">Last Name</Text>
                        <TextField.Root
                          size="3"
                          value={formData.lastName}
                          onChange={handleTextFieldChange('lastName')}
                          placeholder="Doe"
                          required
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">Email</Text>
                        <TextField.Root
                          size="3"
                          type="email"
                          value={formData.email}
                          onChange={handleTextFieldChange('email')}
                          placeholder="john@example.com"
                          required
                          autoComplete="email"
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">Password</Text>
                        <TextField.Root
                          size="3"
                          type="password"
                          value={formData.password}
                          onChange={handleTextFieldChange('password')}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          autoComplete="new-password"
                        />
                      </Flex>
                    </Flex>
                    <Flex gap="3" justify="end" mt="4">
                      <Button type="submit" size="3" variant="solid">
                        Next Step
                      </Button>
                    </Flex>
                  </Flex>
                </form>
              )}

              {/* Step 2: Professional Details */}
              {step === 2 && (
                <Flex direction="column" gap="4">
                  <Heading size="6">Professional Details</Heading>
                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Chiropractic College</Text>
                      {isLoadingColleges ? (
                        <TextField.Root size="3" disabled placeholder="Loading colleges..." />
                      ) : (
                        <Select.Root 
                          value={formData.college} 
                          onValueChange={(value) => handleInputChange('college', value)}
                        >
                          <Select.Trigger />
                          <Select.Content>
                            {colleges.length > 0 ? (
                              colleges.map((college) => (
                                <Select.Item key={college.id} value={college.name}>
                                  {college.name}
                                  {college.state && ` (${college.state})`}
                                </Select.Item>
                              ))
                            ) : (
                              <Select.Item value="" disabled>
                                No colleges available
                              </Select.Item>
                            )}
                          </Select.Content>
                        </Select.Root>
                      )}
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Graduation Year</Text>
                      <TextField.Root
                        size="3"
                        type="number"
                        value={formData.graduationYear}
                        onChange={handleTextFieldChange('graduationYear')}
                        placeholder="2020"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">License Number</Text>
                      <TextField.Root
                        size="3"
                        value={formData.licenseNumber}
                        onChange={handleTextFieldChange('licenseNumber')}
                        placeholder="DC12345"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Flex align="center" justify="between" mb="1">
                        <Text as="label" size="2" weight="bold">Professional Bio</Text>
                        <Button size="1" variant="ghost" style={{ gap: '4px' }}>
                          <MagicWandIcon width="12" height="12" />
                          Auto-Write Bio
                        </Button>
                      </Flex>
                      <TextArea
                        size="3"
                        resize="vertical"
                        value={formData.bio}
                        onChange={handleTextAreaChange('bio')}
                        placeholder="AI Preview: Unable to connect."
                        style={{ minHeight: '120px' }}
                      />
                    </Flex>
                  </Flex>
                  <Flex gap="3" justify="between" mt="4">
                    <Button size="3" variant="ghost" onClick={handleBack} style={{ color: 'var(--gray-11)' }}>
                      Back
                    </Button>
                    <Button size="3" variant="solid" onClick={handleNext}>
                      Next Step
                    </Button>
                  </Flex>
                </Flex>
              )}

              {/* Step 3: Matching Data */}
              {step === 3 && (
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="2">
                    <Heading size="6">Help Patients Find You</Heading>
                    <Text size="2" color="gray">
                      Select all that apply. This helps patients match with your practice.
                    </Text>
                  </Flex>
                  
                  <Tabs.Root defaultValue="modalities">
                    <Tabs.List>
                      <Tabs.Trigger value="modalities">Techniques & Modalities</Tabs.Trigger>
                      <Tabs.Trigger value="focus">Focus Areas</Tabs.Trigger>
                      <Tabs.Trigger value="insurance">Insurance & Payment</Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="4">
                      <Tabs.Content value="modalities">
                        <Flex direction="column" gap="4">
                          <Grid columns="2" gap="3">
                            {['Gonstead', 'Diversified', 'Activator', 'TRT', 'SOT', 'Thompson', 'Webster', 'Cox'].map((modality) => (
                              <Flex key={modality} gap="2" align="center">
                                <Checkbox
                                  checked={formData.modalities.includes(modality)}
                                  onCheckedChange={() => handleCheckboxChange('modalities', modality)}
                                />
                                <Text size="2">{modality}</Text>
                              </Flex>
                            ))}
                          </Grid>
                        </Flex>
                      </Tabs.Content>

                      <Tabs.Content value="focus">
                        <Flex direction="column" gap="4">
                          <Grid columns="2" gap="3">
                            {['Pediatrics', 'Sports', 'Auto Injury', 'Wellness', 'Prenatal', 'Geriatric'].map((area) => (
                              <Flex key={area} gap="2" align="center">
                                <Checkbox
                                  checked={formData.focusAreas.includes(area)}
                                  onCheckedChange={() => handleCheckboxChange('focusAreas', area)}
                                />
                                <Text size="2">{area}</Text>
                              </Flex>
                            ))}
                          </Grid>
                        </Flex>
                      </Tabs.Content>

                      <Tabs.Content value="insurance">
                        <Flex direction="column" gap="4">
                          <Flex direction="column" gap="3">
                            <Text size="2" weight="bold">What is your primary business model?</Text>
                            <RadioGroup.Root
                              value={formData.businessModel}
                              onValueChange={(value) => handleInputChange('businessModel', value)}
                            >
                              <Flex direction="column" gap="2">
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item value="cash" id="cash" />
                                  <Text as="label" htmlFor="cash" size="2">Cash-Based</Text>
                                </Flex>
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item value="insurance" id="insurance" />
                                  <Text as="label" htmlFor="insurance" size="2">Insurance-Based</Text>
                                </Flex>
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item value="hybrid" id="hybrid" />
                                  <Text as="label" htmlFor="hybrid" size="2">Hybrid (Cash + Insurance)</Text>
                                </Flex>
                              </Flex>
                            </RadioGroup.Root>
                          </Flex>

                          <Flex direction="column" gap="3">
                            <Text size="2" weight="bold">Which insurances do you accept?</Text>
                            <Grid columns="2" gap="3">
                              {['BCBS', 'Aetna', 'Cigna', 'UnitedHealthcare', 'Medicare', 'Medicaid'].map((insurance) => (
                                <Flex key={insurance} gap="2" align="center">
                                  <Checkbox
                                    checked={formData.insurances.includes(insurance)}
                                    onCheckedChange={() => handleCheckboxChange('insurances', insurance)}
                                  />
                                  <Text size="2">{insurance}</Text>
                                </Flex>
                              ))}
                            </Grid>
                          </Flex>
                        </Flex>
                      </Tabs.Content>
                    </Box>
                  </Tabs.Root>

                  <Flex gap="3" justify="between" mt="4">
                    <Button size="3" variant="ghost" onClick={handleBack} style={{ color: 'var(--gray-11)' }}>
                      Back
                    </Button>
                    <Button size="3" variant="solid" onClick={handleNext}>
                      Next Step
                    </Button>
                  </Flex>
                </Flex>
              )}

              {/* Step 4: Organization/Location */}
              {step === 4 && (
                <Flex direction="column" gap="4">
                  <Heading size="6">Where do you practice?</Heading>
                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Clinic Name</Text>
                      <TextField.Root
                        size="3"
                        value={formData.clinicName}
                        onChange={handleTextFieldChange('clinicName')}
                        placeholder="Wellness Chiropractic"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Street Address</Text>
                      <TextField.Root
                        size="3"
                        value={formData.address}
                        onChange={handleTextFieldChange('address')}
                        placeholder="123 Main St"
                      />
                    </Flex>
                    <Grid columns="3" gap="3">
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">City</Text>
                        <TextField.Root
                          size="3"
                          value={formData.city}
                          onChange={handleTextFieldChange('city')}
                          placeholder="City"
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">State</Text>
                        <TextField.Root
                          size="3"
                          value={formData.state}
                          onChange={handleTextFieldChange('state')}
                          placeholder="State"
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">Zip Code</Text>
                        <TextField.Root
                          size="3"
                          value={formData.zip}
                          onChange={handleTextFieldChange('zip')}
                          placeholder="12345"
                        />
                      </Flex>
                    </Grid>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Website</Text>
                      <TextField.Root
                        size="3"
                        value={formData.website}
                        onChange={handleTextFieldChange('website')}
                        placeholder="https://yourclinic.com"
                      >
                        <TextField.Slot>
                          <GlobeIcon />
                        </TextField.Slot>
                      </TextField.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Instagram Handle</Text>
                      <TextField.Root
                        size="3"
                        value={formData.instagram}
                        onChange={handleTextFieldChange('instagram')}
                        placeholder="@yourclinic"
                      >
                        <TextField.Slot>
                          <InstagramLogoIcon />
                        </TextField.Slot>
                      </TextField.Root>
                    </Flex>
                  </Flex>
                  <Flex gap="3" justify="between" mt="4">
                    <Button size="3" variant="ghost" onClick={handleBack} style={{ color: 'var(--gray-11)' }}>
                      Back
                    </Button>
                    <Button 
                      size="3" 
                      variant="solid" 
                      onClick={handleSubmit}
                      disabled={isSubmitting || submitSuccess}
                    >
                      {isSubmitting ? 'Creating Account...' : submitSuccess ? 'Success!' : 'Complete Sign-Up'}
                    </Button>
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Card>
        </Grid>
        </Container>
      </Box>

      <Footer />
    </Flex>
  );
}
