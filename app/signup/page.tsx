'use client';

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { Grid, Flex, Text, Heading, TextField, Button, Select, TextArea, Tabs, Checkbox, RadioGroup, Box, Callout } from '@radix-ui/themes';
import { GlobeIcon, InstagramLogoIcon, MagicWandIcon, InfoCircledIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignupSplitShell } from '../components/SignupSplitShell';
import layoutStyles from '../components/SignupSplitShell.module.css';
import { signUpChiropractor, type SignUpData } from '../lib/auth';
import { getChiropracticColleges, type ChiropracticCollege } from '../lib/queries';
import { supabase } from '../lib/supabase';

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, ms = 28000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

const steps = [
  { number: 1, label: 'Account' },
  { number: 2, label: 'Professional Details' },
  { number: 3, label: 'Matching' },
  { number: 4, label: 'Organization' },
  { number: 5, label: 'Membership' },
];

type SignupPlan = 'free' | 'monthly' | 'annual';

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [premiumNeedsEmailVerify, setPremiumNeedsEmailVerify] = useState(false);
  const [checkoutReturnChecking, setCheckoutReturnChecking] = useState(false);
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState<string | null>(null);
  const [embeddedError, setEmbeddedError] = useState<string | null>(null);
  const [premiumFlowLoading, setPremiumFlowLoading] = useState(false);
  const [freeSubmitLoading, setFreeSubmitLoading] = useState(false);
  const embeddedMountRef = useRef<HTMLDivElement | null>(null);
  const embeddedCheckoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const premiumFinishRef = useRef(false);
  const premiumRunId = useRef(0);
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
    signupPlan: 'free' as SignupPlan,
  });

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const loadColleges = useCallback(async () => {
    setIsLoadingColleges(true);
    try {
      const collegesData = await getChiropracticColleges();
      setColleges(collegesData);
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
  }, []);

  useEffect(() => {
    void loadColleges();
  }, [loadColleges]);

  const finishPremiumAfterPayment = useCallback(() => {
    if (premiumFinishRef.current) return;
    premiumFinishRef.current = true;
    embeddedCheckoutRef.current?.destroy();
    embeddedCheckoutRef.current = null;
    setEmbeddedClientSecret(null);
    setPremiumFlowLoading(false);
    setSubmitSuccess(true);
    setStep(5);
    setTimeout(() => router.push('/account'), 2000);
  }, [router]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    if (!sid?.startsWith('cs_')) return;

    let cancelled = false;
    setCheckoutReturnChecking(true);

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (!cancelled) {
            window.history.replaceState({}, '', '/signup');
            setCheckoutReturnChecking(false);
          }
          return;
        }
        const res = await fetch(
          `/api/checkout/session-status?session_id=${encodeURIComponent(sid)}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );
        const json = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
        if (cancelled) return;
        window.history.replaceState({}, '', '/signup');
        setCheckoutReturnChecking(false);
        if (res.ok && json.status === 'complete') {
          finishPremiumAfterPayment();
        } else {
          setSubmitError(
            json.error ||
              'Payment was not completed. You can subscribe from your account under Membership.',
          );
          setStep(5);
        }
      } catch {
        if (!cancelled) {
          window.history.replaceState({}, '', '/signup');
          setCheckoutReturnChecking(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [finishPremiumAfterPayment]);

  useEffect(() => {
    if (!embeddedClientSecret) return;
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    if (!pk) {
      setEmbeddedError('Stripe publishable key is missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
      return;
    }

    setEmbeddedError(null);
    let cancelled = false;

    (async () => {
      try {
        const stripe = await loadStripe(pk);
        if (!stripe || cancelled) return;

        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret: embeddedClientSecret,
          onComplete: () => {
            finishPremiumAfterPayment();
          },
        });
        if (cancelled) {
          checkout.destroy();
          return;
        }
        embeddedCheckoutRef.current = checkout;
        const tryMount = () => {
          if (cancelled) return;
          const el = embeddedMountRef.current;
          if (el) {
            checkout.mount(el);
            return;
          }
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (cancelled) return;
              const el2 = embeddedMountRef.current;
              if (el2) {
                checkout.mount(el2);
              } else if (!cancelled) {
                setEmbeddedError('Checkout could not be displayed. Refresh the page or try again.');
              }
            });
          });
        };
        tryMount();
      } catch (e) {
        if (!cancelled) {
          setEmbeddedError(e instanceof Error ? e.message : 'Could not load checkout.');
        }
      }
    })();

    return () => {
      cancelled = true;
      embeddedCheckoutRef.current?.destroy();
      embeddedCheckoutRef.current = null;
    };
  }, [embeddedClientSecret, finishPremiumAfterPayment]);

  const dismissEmbeddedCheckout = () => {
    embeddedCheckoutRef.current?.destroy();
    embeddedCheckoutRef.current = null;
    setEmbeddedClientSecret(null);
    setEmbeddedError(null);
  };

  const clearPremiumSelection = () => {
    dismissEmbeddedCheckout();
    setFormData(prev => ({ ...prev, signupPlan: 'free' }));
    setPremiumFlowLoading(false);
    setPremiumNeedsEmailVerify(false);
  };

  const validateForSignup = (): string | null => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setStep(1);
      return 'Please complete all required fields in Step 1';
    }
    if (formData.password.length < 6) {
      setStep(1);
      return 'Password must be at least 6 characters long';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStep(1);
      return 'Please enter a valid email address';
    }
    if (!formData.licenseNumber?.trim()) {
      setStep(2);
      return 'Please enter your license number (Professional Details).';
    }
    return null;
  };

  const handleFreeSignup = async () => {
    const err = validateForSignup();
    if (err) {
      setSubmitError(err);
      return;
    }
    dismissEmbeddedCheckout();
    const freePayload = { ...formDataRef.current, signupPlan: 'free' as SignupPlan };
    formDataRef.current = freePayload;
    setFormData(freePayload);
    setFreeSubmitLoading(true);
    setSubmitError(null);
    setPremiumNeedsEmailVerify(false);
    premiumFinishRef.current = false;

    try {
      const { signupPlan: _, ...signupFields } = freePayload;
      const result = await signUpChiropractor(signupFields as SignUpData);
      if (!result.success) {
        setSubmitError(result.error || 'Failed to create account. Please try again.');
        return;
      }
      setSubmitSuccess(true);
      setTimeout(() => router.push('/account'), 2000);
    } catch (error: unknown) {
      console.error('Signup error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setFreeSubmitLoading(false);
    }
  };

  const runPremiumSignup = async (plan: 'monthly' | 'annual') => {
    const err = validateForSignup();
    if (err) {
      setSubmitError(err);
      return;
    }

    const runId = ++premiumRunId.current;
    dismissEmbeddedCheckout();
    const premiumPayload = { ...formDataRef.current, signupPlan: plan };
    formDataRef.current = premiumPayload;
    setFormData(premiumPayload);
    setPremiumFlowLoading(true);
    setSubmitError(null);
    setPremiumNeedsEmailVerify(false);
    premiumFinishRef.current = false;

    try {
      const { signupPlan: _, ...signupFields } = premiumPayload;
      const result = await signUpChiropractor(signupFields as SignUpData);
      if (premiumRunId.current !== runId) return;

      if (!result.success) {
        setSubmitError(result.error || 'Failed to create account. Please try again.');
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (premiumRunId.current !== runId) return;

      if (!session?.access_token) {
        setPremiumNeedsEmailVerify(true);
        return;
      }

      let checkoutRes: Response;
      try {
        checkoutRes = await fetchWithTimeout('/api/checkout/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan, embedded: true }),
        });
      } catch (e) {
        if (premiumRunId.current !== runId) return;
        const msg =
          e instanceof Error && e.name === 'AbortError'
            ? 'Checkout timed out. Check your connection and try again, or subscribe from your account.'
            : 'Could not reach checkout. Try again or subscribe from your account.';
        setSubmitError(msg);
        setTimeout(() => router.push('/account'), 4000);
        return;
      }

      const checkoutJson = (await checkoutRes.json().catch(() => ({}))) as {
        clientSecret?: string;
        error?: string;
      };
      if (premiumRunId.current !== runId) return;

      if (!checkoutRes.ok || !checkoutJson.clientSecret) {
        setSubmitError(
          checkoutJson.error ||
            'Account created, but checkout could not start. You can subscribe anytime from your account.',
        );
        setTimeout(() => router.push('/account'), 3000);
        return;
      }
      setEmbeddedClientSecret(checkoutJson.clientSecret);
    } catch (error: unknown) {
      if (premiumRunId.current !== runId) return;
      console.error('Signup error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      if (premiumRunId.current === runId) {
        setPremiumFlowLoading(false);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTextFieldChange = (field: string) => (e: any) => {
    const value = e.target.value;
    handleInputChange(field, value);
  };

  const handleTextAreaChange = (field: string) => (e: any) => {
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
    if (step === 2 && !formData.licenseNumber?.trim()) {
      setSubmitError('License number is required.');
      return;
    }
    setSubmitError(null);
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
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
      case 5:
        return 'Choose a free listing or upgrade to premium for the full provider experience.';
      default:
        return '';
    }
  };

  const showPremiumCheckoutBlock =
    step === 5 &&
    !premiumNeedsEmailVerify &&
    !submitSuccess &&
    (formData.signupPlan === 'monthly' || formData.signupPlan === 'annual') &&
    (premiumFlowLoading || !!embeddedClientSecret || !!embeddedError);

  const step5Busy = freeSubmitLoading || premiumFlowLoading;

  return (
    <SignupSplitShell
      currentStep={checkoutReturnChecking ? 5 : step}
      steps={steps}
      headline="Let's build your profile."
      subtext="Completing this application allows our algorithms to match you with ideal patients."
      whyDetail={getWhyDetailText()}
    >
      {checkoutReturnChecking ? (
        <div className={`${layoutStyles.signupCard} ${layoutStyles.signupCardWide}`}>
          <div className={layoutStyles.signupWideBody}>
            <Flex direction="column" gap="3" align="center">
              <Heading size="6">Confirming your payment…</Heading>
              <Text size="2" color="gray">
                This takes just a moment.
              </Text>
            </Flex>
          </div>
        </div>
      ) : (
        <>
      <h1 className={layoutStyles.signupTitle}>Create your account</h1>

      {step === 1 ? (
        <div className={layoutStyles.signupCard}>
          <div className={layoutStyles.signupTabs} role="tablist" aria-label="Account type">
            <button
              type="button"
              role="tab"
              aria-selected
              className={`${layoutStyles.signupTab} ${layoutStyles.signupTabActive}`}
            >
              Chiropractor
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              className={layoutStyles.signupTab}
              onClick={() => router.push('/signup-patient')}
            >
              Patient
            </button>
          </div>

          <form
            className={layoutStyles.signupStep1Form}
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
            noValidate
          >
            <div className={layoutStyles.signupFields}>
              <div className={layoutStyles.signupField}>
                <label className={layoutStyles.signupLabel} htmlFor="signup-chiro-first">
                  First Name
                </label>
                <input
                  id="signup-chiro-first"
                  className={layoutStyles.signupInput}
                  value={formData.firstName}
                  onChange={handleTextFieldChange('firstName')}
                  placeholder="John"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className={layoutStyles.signupField}>
                <label className={layoutStyles.signupLabel} htmlFor="signup-chiro-last">
                  Last Name
                </label>
                <input
                  id="signup-chiro-last"
                  className={layoutStyles.signupInput}
                  value={formData.lastName}
                  onChange={handleTextFieldChange('lastName')}
                  placeholder="Doe"
                  autoComplete="family-name"
                  required
                />
              </div>
              <div className={layoutStyles.signupField}>
                <label className={layoutStyles.signupLabel} htmlFor="signup-chiro-email">
                  Email
                </label>
                <input
                  id="signup-chiro-email"
                  className={layoutStyles.signupInput}
                  type="email"
                  value={formData.email}
                  onChange={handleTextFieldChange('email')}
                  placeholder="email@email.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className={layoutStyles.signupField}>
                <label className={layoutStyles.signupLabel} htmlFor="signup-chiro-password">
                  Password
                </label>
                <input
                  id="signup-chiro-password"
                  className={layoutStyles.signupInput}
                  type="password"
                  value={formData.password}
                  onChange={handleTextFieldChange('password')}
                  placeholder="Password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button type="submit" className={layoutStyles.signupSubmit}>
              Next Step
            </button>
          </form>

          <p className={layoutStyles.signupCardFooter}>
            Already have an account?{' '}
            <Link href="/signin" className={layoutStyles.signupInlineLink}>
              Sign in
            </Link>
          </p>
        </div>
      ) : (
        <div className={`${layoutStyles.signupCard} ${layoutStyles.signupCardWide}`}>
          <div className={layoutStyles.signupWideBody}>
            {submitSuccess && !premiumNeedsEmailVerify && (
              <Callout.Root color="green">
                <Callout.Icon>
                  <CheckCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                  {formData.signupPlan === 'free'
                    ? 'Account created successfully! Redirecting...'
                    : 'You are subscribed! Redirecting to your account...'}
                </Callout.Text>
              </Callout.Root>
            )}

            {showPremiumCheckoutBlock && premiumFlowLoading && !embeddedClientSecret && (
              <Callout.Root color="blue">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>Creating your account and opening secure checkout…</Callout.Text>
              </Callout.Root>
            )}

            {premiumNeedsEmailVerify && (
              <Callout.Root color="blue">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                  Account created. Confirm your email from the message we sent, then sign in and open{' '}
                  <Link href="/account" className={layoutStyles.signupInlineLink}>
                    your account
                  </Link>{' '}
                  to complete premium checkout.
                </Callout.Text>
              </Callout.Root>
            )}

            {submitError && (
              <Callout.Root color="red">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>{submitError}</Callout.Text>
              </Callout.Root>
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
                        <>
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
                                <Select.Item value="none" disabled>
                                  No colleges available
                                </Select.Item>
                              )}
                            </Select.Content>
                          </Select.Root>
                          {colleges.length === 0 && (
                            <Button size="2" variant="soft" mt="2" type="button" onClick={() => void loadColleges()}>
                              Retry loading colleges
                            </Button>
                          )}
                        </>
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
                      <Text as="label" size="2" weight="bold" htmlFor="signup-chiro-license">
                        License number <Text as="span" color="red">*</Text>
                      </Text>
                      <TextField.Root
                        id="signup-chiro-license"
                        size="3"
                        required
                        value={formData.licenseNumber}
                        onChange={handleTextFieldChange('licenseNumber')}
                        placeholder="DC12345"
                        aria-required="true"
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
                    <Button size="3" variant="solid" onClick={handleNext}>
                      Next Step
                    </Button>
                  </Flex>
                </Flex>
              )}

              {step === 5 && (
                <Flex direction="column" gap="4">
                  <Heading size="6">Membership &amp; checkout</Heading>
                  <Text size="2" color="gray">
                    Create a free listing, or pick a premium plan to open Stripe&apos;s secure checkout right here.
                  </Text>

                  <Flex direction="column" gap="3">
                    <Text size="2" weight="bold">
                      Free listing
                    </Text>
                    <Text size="2" color="gray">
                      Core profile and matching — no card required.
                    </Text>
                    <Button
                      size="3"
                      variant="outline"
                      disabled={step5Busy || submitSuccess || premiumNeedsEmailVerify}
                      onClick={() => void handleFreeSignup()}
                    >
                      {freeSubmitLoading ? 'Working…' : 'Create free account'}
                    </Button>
                  </Flex>

                  <Text size="2" color="gray" mt="2">
                    Or subscribe below (checkout appears on this step).
                  </Text>

                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold">
                      Premium
                    </Text>
                    <Flex gap="2" wrap="wrap">
                      <Button
                        size="3"
                        variant={formData.signupPlan === 'monthly' ? 'solid' : 'outline'}
                        disabled={step5Busy || submitSuccess || premiumNeedsEmailVerify}
                        onClick={() => void runPremiumSignup('monthly')}
                      >
                        {premiumFlowLoading && formData.signupPlan === 'monthly' && !embeddedClientSecret
                          ? 'Starting…'
                          : 'Monthly'}
                      </Button>
                      <Button
                        size="3"
                        variant={formData.signupPlan === 'annual' ? 'solid' : 'outline'}
                        disabled={step5Busy || submitSuccess || premiumNeedsEmailVerify}
                        onClick={() => void runPremiumSignup('annual')}
                      >
                        {premiumFlowLoading && formData.signupPlan === 'annual' && !embeddedClientSecret
                          ? 'Starting…'
                          : 'Annual'}
                      </Button>
                    </Flex>
                  </Flex>

                  {showPremiumCheckoutBlock && (
                    <>
                      {embeddedError && (
                        <Callout.Root color="red">
                          <Callout.Icon>
                            <InfoCircledIcon />
                          </Callout.Icon>
                          <Callout.Text>{embeddedError}</Callout.Text>
                        </Callout.Root>
                      )}
                      <div ref={embeddedMountRef} className={layoutStyles.embeddedCheckout} />
                      <Button
                        size="3"
                        variant="ghost"
                        type="button"
                        onClick={clearPremiumSelection}
                        style={{ color: 'var(--gray-11)', alignSelf: 'flex-start' }}
                      >
                        Cancel premium — choose free or another plan
                      </Button>
                    </>
                  )}

                  <Flex gap="3" justify="between" mt="4">
                    <Button size="3" variant="ghost" onClick={handleBack} style={{ color: 'var(--gray-11)' }}>
                      Back
                    </Button>
                  </Flex>
                </Flex>
              )}
          </div>
        </div>
      )}

      <Link href="/" className={layoutStyles.signupBack}>
        Back to home
      </Link>
        </>
      )}
    </SignupSplitShell>
  );
}
