'use client';

import { useState, useEffect } from 'react';
import { Grid, Card, Flex, Text, Heading, TextField, Button, Select, TextArea, Tabs, Checkbox, RadioGroup, Box, Callout } from '@radix-ui/themes';
import { GlobeIcon, CalendarIcon, InfoCircledIcon, CheckCircledIcon, PersonIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Container } from '../components/Container';
import { signUpPatient, type PatientSignUpData } from '../lib/auth';

const steps = [
  { number: 1, label: 'Account' },
  { number: 2, label: 'Personal Info' },
  { number: 3, label: 'Location' },
];

export default function PatientSignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    // Step 2
    phone: '',
    dateOfBirth: '',
    emergencyContact: '',
    emergencyPhone: '',
    // Step 3
    preferredModalities: [] as string[],
    focusAreas: [] as string[],
    preferredBusinessModel: '',
    insuranceType: '',
    budgetRange: '',
    // Step 4
    city: '',
    state: '',
    zipCode: '',
    searchRadius: 25,
    preferredDays: [] as string[],
    preferredTimes: [] as string[],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTextFieldChange = (field: string) => (e: any) => {
    const value = e.target.value;
    handleInputChange(field, value);
  };

  const handleCheckboxChange = (category: 'preferredModalities' | 'focusAreas' | 'preferredDays' | 'preferredTimes' | 'focusAreas', value: string) => {
    setFormData(prev => {
      const currentArray = prev[category];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [category]: newArray };
    });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
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

    if (formData.password.length < 6) {
      setSubmitError('Password must be at least 6 characters long');
      setStep(1);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitError('Please enter a valid email address');
      setStep(1);
      return;
    }

    // Validate location (required for Step 4)
    if (!formData.city || !formData.state || !formData.zipCode) {
      setSubmitError('Please provide your location information');
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await signUpPatient(formData as PatientSignUpData);

      if (result.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push('/account');
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
        return 'Create your account to get started finding the right chiropractor.';
      case 2:
        return 'Tell us a bit about yourself for personalized matching.';
      case 3:
        return 'Help us match you with chiropractors who fit your preferences.';
      case 4:
        return 'Set your location preferences for finding nearby care.';
      default:
        return '';
    }
  };

  const getWhyDetailText = () => {
    switch (step) {
      case 1:
        return 'Creating an account ensures secure access and personalized matching.';
      case 2:
        return 'Personal information helps us provide better, more relevant matches.';
      case 3:
        return 'Detailed preferences ensure you find chiropractors who match your needs and values.';
      case 4:
        return 'Location data helps us show you chiropractors in your area.';
      default:
        return '';
    }
  };

  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Header />

      <Box py="9" style={{ flex: 1, paddingTop: '160px' }}>
        <Container>
        <Grid columns={{ initial: '1', lg: '2' }} gap="9">
          {/* Left Column: Progress and Value Proposition */}
          <Flex direction="column" gap="6" style={{ maxWidth: '400px' }}>
            <Flex direction="column" gap="2">
              <Heading size="8">Find Your Perfect Chiropractor</Heading>
              <Text size="4" color="gray">
                Complete this profile to get matched with chiropractors who align with your preferences and needs.
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

              {/* Step 2: Personal Details */}
              {step === 2 && (
                <Flex direction="column" gap="4">
                  <Heading size="6">Personal Information</Heading>
                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Phone Number</Text>
                      <TextField.Root
                        size="3"
                        type="tel"
                        value={formData.phone}
                        onChange={handleTextFieldChange('phone')}
                        placeholder="(555) 123-4567"
                      >
                        <TextField.Slot>
                          <PersonIcon />
                        </TextField.Slot>
                      </TextField.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Date of Birth</Text>
                      <TextField.Root
                        size="3"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleTextFieldChange('dateOfBirth')}
                      >
                        <TextField.Slot>
                          <CalendarIcon />
                        </TextField.Slot>
                      </TextField.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Emergency Contact Name</Text>
                      <TextField.Root
                        size="3"
                        value={formData.emergencyContact}
                        onChange={handleTextFieldChange('emergencyContact')}
                        placeholder="Jane Doe"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Emergency Contact Phone</Text>
                      <TextField.Root
                        size="3"
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={handleTextFieldChange('emergencyPhone')}
                        placeholder="(555) 123-4567"
                      >
                        <TextField.Slot>
                          <PersonIcon />
                        </TextField.Slot>
                      </TextField.Root>
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

              {/* Step 3: Matching Preferences */}
              {step === 3 && (
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="2">
                    <Heading size="6">Your Preferences</Heading>
                    <Text size="2" color="gray">
                      Select what matters most to you in a chiropractor. This helps us find the best matches.
                    </Text>
                  </Flex>

                  <Tabs.Root defaultValue="modalities">
                    <Tabs.List>
                      <Tabs.Trigger value="modalities">Treatment Styles</Tabs.Trigger>
                      <Tabs.Trigger value="focus">Specialties</Tabs.Trigger>
                      <Tabs.Trigger value="payment">Payment & Insurance</Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="4">
                      <Tabs.Content value="modalities">
                        <Flex direction="column" gap="4">
                          <Text size="2" weight="medium">Which chiropractic techniques interest you?</Text>
                          <Grid columns="2" gap="3">
                            {['Gonstead', 'Diversified', 'Activator', 'TRT', 'SOT', 'Thompson', 'Webster', 'Cox'].map((modality) => (
                              <Flex key={modality} gap="2" align="center">
                                <Checkbox
                                  checked={formData.preferredModalities.includes(modality)}
                                  onCheckedChange={() => handleCheckboxChange('preferredModalities', modality)}
                                />
                                <Text size="2">{modality}</Text>
                              </Flex>
                            ))}
                          </Grid>
                        </Flex>
                      </Tabs.Content>

                      <Tabs.Content value="focus">
                        <Flex direction="column" gap="4">
                          <Text size="2" weight="medium">Do you need care for specific conditions or life stages?</Text>
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

                      <Tabs.Content value="payment">
                        <Flex direction="column" gap="4">
                          <Flex direction="column" gap="3">
                            <Text size="2" weight="bold">Preferred Payment Method</Text>
                            <RadioGroup.Root
                              value={formData.preferredBusinessModel}
                              onValueChange={(value) => handleInputChange('preferredBusinessModel', value)}
                            >
                              <Flex direction="column" gap="2">
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item value="cash" id="cash" />
                                  <Text as="label" htmlFor="cash" size="2">Cash-Based (Direct Pay)</Text>
                                </Flex>
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item value="insurance" id="insurance" />
                                  <Text as="label" htmlFor="insurance" size="2">Insurance-Based</Text>
                                </Flex>
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item value="hybrid" id="hybrid" />
                                  <Text as="label" htmlFor="hybrid" size="2">Either (Cash or Insurance)</Text>
                                </Flex>
                              </Flex>
                            </RadioGroup.Root>
                          </Flex>

                          <Flex direction="column" gap="3">
                            <Text size="2" weight="bold">Insurance Type (if applicable)</Text>
                            <Select.Root
                              value={formData.insuranceType}
                              onValueChange={(value) => handleInputChange('insuranceType', value)}
                            >
                              <Select.Trigger />
                              <Select.Content>
                                <Select.Item value="none">No Insurance / Self-Pay</Select.Item>
                                <Select.Item value="BCBS">Blue Cross Blue Shield</Select.Item>
                                <Select.Item value="Aetna">Aetna</Select.Item>
                                <Select.Item value="Cigna">Cigna</Select.Item>
                                <Select.Item value="UnitedHealthcare">UnitedHealthcare</Select.Item>
                                <Select.Item value="Medicare">Medicare</Select.Item>
                                <Select.Item value="Medicaid">Medicaid</Select.Item>
                              </Select.Content>
                            </Select.Root>
                          </Flex>

                          <Flex direction="column" gap="3">
                            <Text size="2" weight="bold">Budget Range (Monthly)</Text>
                            <Select.Root
                              value={formData.budgetRange}
                              onValueChange={(value) => handleInputChange('budgetRange', value)}
                            >
                              <Select.Trigger />
                              <Select.Content>
                                <Select.Item value="none">No Preference</Select.Item>
                                <Select.Item value="under-50">Under $50</Select.Item>
                                <Select.Item value="50-100">$50 - $100</Select.Item>
                                <Select.Item value="100-150">$100 - $150</Select.Item>
                                <Select.Item value="over-150">Over $150</Select.Item>
                              </Select.Content>
                            </Select.Root>
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

              {/* Step 4: Location & Schedule */}
              {step === 4 && (
                <Flex direction="column" gap="4">
                  <Heading size="6">Location & Availability</Heading>
                  <Flex direction="column" gap="3">
                    <Grid columns="3" gap="3">
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">City</Text>
                        <TextField.Root
                          size="3"
                          value={formData.city}
                          onChange={handleTextFieldChange('city')}
                          placeholder="City"
                          required
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">State</Text>
                        <TextField.Root
                          size="3"
                          value={formData.state}
                          onChange={handleTextFieldChange('state')}
                          placeholder="State"
                          required
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">Zip Code</Text>
                        <TextField.Root
                          size="3"
                          value={formData.zipCode}
                          onChange={handleTextFieldChange('zipCode')}
                          placeholder="12345"
                          required
                        />
                      </Flex>
                    </Grid>

                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">Search Radius (miles)</Text>
                      <Select.Root
                        value={formData.searchRadius.toString()}
                        onValueChange={(value) => handleInputChange('searchRadius', parseInt(value).toString())}
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
                    </Flex>

                    <Flex direction="column" gap="3">
                      <Text size="2" weight="bold">Preferred Days (optional)</Text>
                      <Grid columns="2" gap="3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <Flex key={day} gap="2" align="center">
                            <Checkbox
                              checked={formData.preferredDays.includes(day)}
                              onCheckedChange={() => handleCheckboxChange('preferredDays', day)}
                            />
                            <Text size="2">{day}</Text>
                          </Flex>
                        ))}
                      </Grid>
                    </Flex>

                    <Flex direction="column" gap="3">
                      <Text size="2" weight="bold">Preferred Times (optional)</Text>
                      <Grid columns="2" gap="3">
                        {['Morning (8-12)', 'Afternoon (12-5)', 'Evening (5-8)'].map((time) => (
                          <Flex key={time} gap="2" align="center">
                            <Checkbox
                              checked={formData.preferredTimes.includes(time)}
                              onCheckedChange={() => handleCheckboxChange('preferredTimes', time)}
                            />
                            <Text size="2">{time}</Text>
                          </Flex>
                        ))}
                      </Grid>
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