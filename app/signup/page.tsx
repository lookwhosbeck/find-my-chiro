"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Grid,
  Flex,
  Text,
  Heading,
  TextField,
  Button,
  Select,
  TextArea,
  Tabs,
  Checkbox,
  RadioGroup,
  Box,
  Callout,
} from "@radix-ui/themes";
import {
  GlobeIcon,
  InstagramLogoIcon,
  MagicWandIcon,
  InfoCircledIcon,
  CheckCircledIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignupSplitShell } from "../components/SignupSplitShell";
import layoutStyles from "../components/SignupSplitShell.module.css";
import { signUpChiropractor, type SignUpData } from "../lib/auth";
import {
  getChiropracticColleges,
  type ChiropracticCollege,
} from "../lib/queries";
import { supabase } from "../lib/supabase";

const steps = [
  { number: 1, label: "Membership" },
  { number: 2, label: "Account" },
  { number: 3, label: "Professional Details" },
  { number: 4, label: "Matching" },
  { number: 5, label: "Organization" },
];

/** Display copy aligned with Figma membership cards (117:1677 monthly, 117:1724 annual) */
const CHIRO_MEMBERSHIP_FEATURES = [
  "Profile and license verification",
  "Chiropractor Network Messaging",
  "Send and Receive Referrals",
  "Chiropractor Community Groups",
  "Boosted profile placement",
  "Request new features",
] as const;

const CHIRO_PLAN_DISPLAY = {
  monthly: { priceLine: "$30/month", billingNote: "(Billed monthly)" },
  annual: { priceLine: "$24/month", billingNote: "(Billed annually)" },
} as const;

type SignupPlan = "free" | "monthly" | "annual";

type PaidCheckoutInfo = {
  email: string;
  plan: SignupPlan;
  subscriptionStatus: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [needsEmailVerify, setNeedsEmailVerify] = useState(false);
  const [verifyCheckoutLoading, setVerifyCheckoutLoading] = useState(false);
  const [checkoutStartLoading, setCheckoutStartLoading] = useState(false);
  const [finalSubmitLoading, setFinalSubmitLoading] = useState(false);
  const [paidCheckoutInfo, setPaidCheckoutInfo] =
    useState<PaidCheckoutInfo | null>(null);
  const [step1Billing, setStep1Billing] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [colleges, setColleges] = useState<ChiropracticCollege[]>([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    college: "",
    graduationYear: "2015",
    licenseNumber: "",
    bio: "",
    modalities: [] as string[],
    focusAreas: [] as string[],
    businessModel: "",
    insurances: [] as string[],
    clinicName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    website: "",
    instagram: "",
    signupPlan: "free" as SignupPlan,
  });

  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const verifiedSessionRef = useRef<string | null>(null);

  const loadColleges = useCallback(async () => {
    setIsLoadingColleges(true);
    try {
      const collegesData = await getChiropracticColleges();
      setColleges(collegesData);
      if (collegesData.length > 0) {
        setFormData((prev) => {
          if (!prev.college) {
            return { ...prev, college: collegesData[0].name };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setIsLoadingColleges(false);
    }
  }, []);

  useEffect(() => {
    void loadColleges();
  }, [loadColleges]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout_canceled") === "1") {
      setSubmitError("Checkout was canceled. You can try again or start free.");
      window.history.replaceState({}, "", "/signup");
      return;
    }

    const sessionId = params.get("checkout_session_id")?.trim();
    if (!sessionId?.startsWith("cs_")) return;
    if (verifiedSessionRef.current === sessionId) return;

    let cancelled = false;
    setVerifyCheckoutLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/checkout/verify-return", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          email?: string;
          plan?: string;
          subscriptionStatus?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setSubmitError(
            json.error ||
              "Could not verify payment. Start checkout again or contact support.",
          );
          window.history.replaceState({}, "", "/signup");
          return;
        }
        verifiedSessionRef.current = sessionId;
        const plan = json.plan === "annual" ? "annual" : "monthly";
        setPaidCheckoutInfo({
          email: json.email || "",
          plan,
          subscriptionStatus: json.subscriptionStatus || "active",
        });
        setFormData((prev) => ({
          ...prev,
          email: (json.email || "").trim(),
          signupPlan: plan,
        }));
        setStep(2);
        window.history.replaceState({}, "", "/signup");
      } catch {
        if (!cancelled) {
          setSubmitError("Could not verify checkout. Please try again.");
          window.history.replaceState({}, "", "/signup");
        }
      } finally {
        if (!cancelled) setVerifyCheckoutLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTextFieldChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      handleInputChange(field, e.target.value);
    };

  const handleTextAreaChange =
    (field: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(field, e.target.value);
    };

  const handleCheckboxChange = (
    category: "modalities" | "focusAreas" | "insurances",
    value: string,
  ) => {
    setFormData((prev) => {
      const currentArray = prev[category];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [category]: newArray };
    });
  };

  const startGuestCheckout = async (plan: "monthly" | "annual") => {
    setCheckoutStartLoading(true);
    setSubmitError(null);
    setFormData((prev) => ({ ...prev, signupPlan: plan }));
    try {
      const res = await fetch("/api/checkout/guest-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        setSubmitError(json.error || "Could not start checkout.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setSubmitError("Could not start checkout.");
    } finally {
      setCheckoutStartLoading(false);
    }
  };

  const handleStartFree = () => {
    setPaidCheckoutInfo(null);
    setFormData((prev) => ({ ...prev, signupPlan: "free" }));
    setSubmitError(null);
    setStep(2);
  };

  const validateAccountStep = (): string | null => {
    if (!formData.firstName || !formData.lastName || !formData.password) {
      return "Please complete first name, last name, and password.";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    const email = formData.email.trim();
    if (!email) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    if (
      paidCheckoutInfo &&
      email.toLowerCase() !== paidCheckoutInfo.email.toLowerCase()
    ) {
      return "Email must match the address used at checkout.";
    }
    return null;
  };

  const validateProfessionalStep = (): string | null => {
    if (!formData.licenseNumber?.trim()) {
      return "License number is required.";
    }
    return null;
  };

  const validateAllForSubmit = (): string | null => {
    const a = validateAccountStep();
    if (a) return a;
    const p = validateProfessionalStep();
    if (p) return p;
    return null;
  };

  const handleNext = () => {
    setSubmitError(null);
    if (step === 2) {
      const err = validateAccountStep();
      if (err) {
        setSubmitError(err);
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      const err = validateProfessionalStep();
      if (err) {
        setSubmitError(err);
        return;
      }
      setStep(4);
      return;
    }
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const submitFinal = async () => {
    const err = validateAllForSubmit();
    if (err) {
      setSubmitError(err);
      return;
    }

    const isPaid =
      formData.signupPlan === "monthly" || formData.signupPlan === "annual";
    if (isPaid && !paidCheckoutInfo) {
      setSubmitError("Complete secure checkout first, or choose Start free.");
      setStep(1);
      return;
    }

    setFinalSubmitLoading(true);
    setSubmitError(null);
    setNeedsEmailVerify(false);

    try {
      const payload = { ...formDataRef.current };
      const { signupPlan: _, ...signupFields } = payload;
      const result = await signUpChiropractor({
        ...(signupFields as SignUpData),
        markReadyForReview: true,
      });

      if (!result.success) {
        setSubmitError(result.error || "Failed to create account.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isPaid && session?.access_token) {
        const linkRes = await fetch("/api/signup/link-stripe-checkout", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!linkRes.ok) {
          const lj = (await linkRes.json().catch(() => ({}))) as {
            error?: string;
          };
          setSubmitError(
            lj.error ||
              "Account created but subscription could not be linked. Use Membership in your account to fix billing, or contact support.",
          );
          setTimeout(() => router.push("/account"), 4000);
          return;
        }
      }

      if (!session?.access_token) {
        setNeedsEmailVerify(true);
        setSubmitSuccess(true);
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => router.push("/account"), 2000);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setFinalSubmitLoading(false);
    }
  };

  const getWhyDetailText = () => {
    switch (step) {
      case 1:
        return "Select your membership to start building your profile.";
      case 2:
        return "Creating an account ensures secure access and personalized matching.";
      case 3:
        return "Granular data (like specific techniques) helps us reduce mismatched inquiries by 40%.";
      case 4:
        return "Detailed matching preferences ensure patients find exactly what they need.";
      case 5:
        return "Location data enables geo-search so patients can find nearby care.";
      default:
        return "";
    }
  };

  const membershipAsideFooter = (
    <div className={layoutStyles.signupAsideMembership}>
      <p className={layoutStyles.signupAsideMembershipLead}>
        <strong>Can&apos;t decide on a plan?</strong>
      </p>
      <p className={layoutStyles.signupAsideMembershipBody}>
        Premium members receive up to 80% more leads than free members.
      </p>
    </div>
  );

  return (
    <SignupSplitShell
      currentStep={step}
      steps={steps}
      headline={
        step === 1 ? (
          <>
            Select the membership
            <br />
            that&apos;s right for you.
          </>
        ) : (
          "Let's build your profile."
        )
      }
      subtext={
        step === 1
          ? "Select your membership to start building your profile."
          : "Completing this application allows our algorithms to match you with ideal patients."
      }
      whyDetail={getWhyDetailText()}
      asideFooter={step === 1 ? membershipAsideFooter : undefined}
    >
      {verifyCheckoutLoading && (
        <>
          <div
            className={`${layoutStyles.signupCard} ${layoutStyles.signupCardWide}`}
          >
            <div className={layoutStyles.signupWideBody}>
              <Flex direction="column" gap="3" align="center">
                <Heading size="6">Verifying your payment…</Heading>
                <Text size="2" color="gray">
                  One moment.
                </Text>
              </Flex>
            </div>
          </div>
          <Link href="/" className={layoutStyles.signupBack}>
            Back to home
          </Link>
        </>
      )}

      {!verifyCheckoutLoading && step === 1 && (
        <div className={layoutStyles.signupMembershipMain}>
          <div className={layoutStyles.signupMembershipHeader}>
            <h1 className={layoutStyles.signupMainTitleSerif}>
              Create your account
            </h1>
            <p className={layoutStyles.signupMainSubtitle}>
              Are you a chiropractor or patient?
            </p>
            <div
              className={layoutStyles.signupMembershipRoleTabs}
              role="tablist"
              aria-label="Account type"
            >
              <button
                type="button"
                role="tab"
                aria-selected
                className={`${layoutStyles.signupMembershipRoleTab} ${layoutStyles.signupMembershipRoleTabActive}`}
              >
                Chiropractor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={false}
                className={layoutStyles.signupMembershipRoleTab}
                onClick={() => router.push("/signup-patient")}
              >
                Patient
              </button>
            </div>
          </div>

          <div className={layoutStyles.signupMembershipCardColumn}>
            <div className={layoutStyles.signupCard}>
              <div className={layoutStyles.signupMembershipCardInner}>
                {paidCheckoutInfo && (
                  <Callout.Root color="green">
                    <Callout.Icon>
                      <CheckCircledIcon />
                    </Callout.Icon>
                    <Callout.Text>
                      Payment received ({paidCheckoutInfo.plan} ·{" "}
                      {paidCheckoutInfo.subscriptionStatus}). Continue with your
                      profile below.
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

                {!paidCheckoutInfo && (
                  <>
                    <div
                      className={layoutStyles.signupPlanSegment}
                      role="group"
                      aria-label="Billing period"
                    >
                      <button
                        type="button"
                        className={`${layoutStyles.signupPlanSegmentBtn} ${
                          step1Billing === "monthly"
                            ? layoutStyles.signupPlanSegmentBtnActive
                            : layoutStyles.signupPlanSegmentBtnInactive
                        }`}
                        onClick={() => setStep1Billing("monthly")}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        className={`${layoutStyles.signupPlanSegmentBtn} ${
                          step1Billing === "annual"
                            ? layoutStyles.signupPlanSegmentBtnActive
                            : layoutStyles.signupPlanSegmentBtnInactive
                        }`}
                        onClick={() => setStep1Billing("annual")}
                      >
                        Annual (Save 20%)
                      </button>
                    </div>

                    <div className={layoutStyles.signupMembershipPlanBody}>
                      <div className={layoutStyles.signupMembershipPriceWrap}>
                        <span
                          className={layoutStyles.signupMembershipPriceAmount}
                        >
                          {CHIRO_PLAN_DISPLAY[step1Billing].priceLine}
                        </span>
                        <span
                          className={layoutStyles.signupMembershipPriceNote}
                        >
                          {CHIRO_PLAN_DISPLAY[step1Billing].billingNote}
                        </span>
                      </div>
                      <div className={layoutStyles.signupMembershipFeatures}>
                        <p
                          className={
                            layoutStyles.signupMembershipFeaturesHeading
                          }
                        >
                          Membership Features
                        </p>
                        <ul
                          className={layoutStyles.signupMembershipFeaturesList}
                          aria-label="Membership features"
                        >
                          {CHIRO_MEMBERSHIP_FEATURES.map((label) => (
                            <li
                              key={label}
                              className={
                                layoutStyles.signupMembershipFeatureRow
                              }
                            >
                              <CheckIcon
                                className={
                                  layoutStyles.signupMembershipFeatureCheck
                                }
                                aria-hidden
                              />
                              <span>{label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={layoutStyles.signupSubmit}
                      disabled={checkoutStartLoading}
                      onClick={() => void startGuestCheckout(step1Billing)}
                    >
                      {checkoutStartLoading
                        ? "Redirecting to Stripe…"
                        : "Proceed to payment"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div
              className={`${layoutStyles.signupMembershipFooterLinks} ${layoutStyles.signupMembershipFooterBelowCard}`}
            >
              <button
                type="button"
                className={layoutStyles.signupMembershipMutedButton}
                onClick={handleStartFree}
              >
                Start free
              </button>
              <Link href="/" className={layoutStyles.signupMembershipBlueLink}>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      )}

      {!verifyCheckoutLoading && step >= 2 && (
        <>
          <h1 className={layoutStyles.signupTitle}>Create your account</h1>
          <div
            className={`${layoutStyles.signupCard} ${layoutStyles.signupCardWide}`}
          >
            <div className={layoutStyles.signupWideBody}>
              {submitSuccess && needsEmailVerify && (
                <Callout.Root color="blue">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    Check your email to confirm your address, then{" "}
                    <Link
                      href="/signin"
                      className={layoutStyles.signupInlineLink}
                    >
                      sign in
                    </Link>{" "}
                    to open your dashboard.
                  </Callout.Text>
                </Callout.Root>
              )}

              {submitSuccess && !needsEmailVerify && (
                <Callout.Root color="green">
                  <Callout.Icon>
                    <CheckCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    Welcome! Redirecting to your account…
                  </Callout.Text>
                </Callout.Root>
              )}

              {submitError && !submitSuccess && (
                <Callout.Root color="red">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>{submitError}</Callout.Text>
                </Callout.Root>
              )}

              {step === 2 && !submitSuccess && (
                <Flex direction="column" gap="4">
                  <Heading size="6">Account</Heading>
                  {paidCheckoutInfo && (
                    <Callout.Root color="blue">
                      <Callout.Icon>
                        <InfoCircledIcon />
                      </Callout.Icon>
                      <Callout.Text>
                        Subscribed as {paidCheckoutInfo.email}. Use the same
                        email below.
                      </Callout.Text>
                    </Callout.Root>
                  )}
                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        First name
                      </Text>
                      <TextField.Root
                        size="3"
                        value={formData.firstName}
                        onChange={handleTextFieldChange("firstName")}
                        placeholder="John"
                        autoComplete="given-name"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Last name
                      </Text>
                      <TextField.Root
                        size="3"
                        value={formData.lastName}
                        onChange={handleTextFieldChange("lastName")}
                        placeholder="Doe"
                        autoComplete="family-name"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Email
                      </Text>
                      <TextField.Root
                        size="3"
                        type="email"
                        value={formData.email}
                        onChange={handleTextFieldChange("email")}
                        readOnly={!!paidCheckoutInfo}
                        placeholder="email@example.com"
                        autoComplete="email"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Password
                      </Text>
                      <TextField.Root
                        size="3"
                        type="password"
                        value={formData.password}
                        onChange={handleTextFieldChange("password")}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                      />
                    </Flex>
                  </Flex>
                  <Flex gap="3" justify="between" mt="4">
                    <Button
                      size="3"
                      variant="ghost"
                      onClick={handleBack}
                      style={{ color: "var(--gray-11)" }}
                    >
                      Back
                    </Button>
                    <Button size="3" variant="solid" onClick={handleNext}>
                      Next step
                    </Button>
                  </Flex>
                  <Text size="1" color="gray">
                    Already have an account?{" "}
                    <Link
                      href="/signin"
                      className={layoutStyles.signupInlineLink}
                    >
                      Sign in
                    </Link>
                  </Text>
                </Flex>
              )}

              {step === 3 && !submitSuccess && (
                <Flex direction="column" gap="4">
                  <Heading size="6">Professional Details</Heading>
                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Chiropractic College
                      </Text>
                      {isLoadingColleges ? (
                        <TextField.Root
                          size="3"
                          disabled
                          placeholder="Loading colleges..."
                        />
                      ) : (
                        <>
                          <Select.Root
                            value={formData.college}
                            onValueChange={(value) =>
                              handleInputChange("college", value)
                            }
                          >
                            <Select.Trigger />
                            <Select.Content>
                              {colleges.length > 0 ? (
                                colleges.map((college) => (
                                  <Select.Item
                                    key={college.id}
                                    value={college.name}
                                  >
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
                            <Button
                              size="2"
                              variant="soft"
                              mt="2"
                              type="button"
                              onClick={() => void loadColleges()}
                            >
                              Retry loading colleges
                            </Button>
                          )}
                        </>
                      )}
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Graduation Year
                      </Text>
                      <TextField.Root
                        size="3"
                        type="number"
                        value={formData.graduationYear}
                        onChange={handleTextFieldChange("graduationYear")}
                        placeholder="2020"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text
                        as="label"
                        size="2"
                        weight="bold"
                        htmlFor="signup-chiro-license"
                      >
                        License number{" "}
                        <Text as="span" color="red">
                          *
                        </Text>
                      </Text>
                      <TextField.Root
                        id="signup-chiro-license"
                        size="3"
                        value={formData.licenseNumber}
                        onChange={handleTextFieldChange("licenseNumber")}
                        placeholder="DC12345"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Flex align="center" justify="between" mb="1">
                        <Text as="label" size="2" weight="bold">
                          Professional Bio
                        </Text>
                        <Button size="1" variant="ghost" style={{ gap: "4px" }}>
                          <MagicWandIcon width="12" height="12" />
                          Auto-Write Bio
                        </Button>
                      </Flex>
                      <TextArea
                        size="3"
                        resize="vertical"
                        value={formData.bio}
                        onChange={handleTextAreaChange("bio")}
                        placeholder="Tell patients about your approach."
                        style={{ minHeight: "120px" }}
                      />
                    </Flex>
                  </Flex>
                  <Flex gap="3" justify="between" mt="4">
                    <Button
                      size="3"
                      variant="ghost"
                      onClick={handleBack}
                      style={{ color: "var(--gray-11)" }}
                    >
                      Back
                    </Button>
                    <Button size="3" variant="solid" onClick={handleNext}>
                      Next step
                    </Button>
                  </Flex>
                </Flex>
              )}

              {step === 4 && !submitSuccess && (
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="2">
                    <Heading size="6">Help Patients Find You</Heading>
                    <Text size="2" color="gray">
                      Select all that apply. This helps patients match with your
                      practice.
                    </Text>
                  </Flex>

                  <Tabs.Root defaultValue="modalities">
                    <Tabs.List>
                      <Tabs.Trigger value="modalities">
                        Techniques & Modalities
                      </Tabs.Trigger>
                      <Tabs.Trigger value="focus">Focus Areas</Tabs.Trigger>
                      <Tabs.Trigger value="insurance">
                        Insurance & Payment
                      </Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="4">
                      <Tabs.Content value="modalities">
                        <Flex direction="column" gap="4">
                          <Grid columns="2" gap="3">
                            {[
                              "Gonstead",
                              "Diversified",
                              "Activator",
                              "TRT",
                              "SOT",
                              "Thompson",
                              "Webster",
                              "Cox",
                            ].map((modality) => (
                              <Flex key={modality} gap="2" align="center">
                                <Checkbox
                                  checked={formData.modalities.includes(
                                    modality,
                                  )}
                                  onCheckedChange={() =>
                                    handleCheckboxChange("modalities", modality)
                                  }
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
                            {[
                              "Pediatrics",
                              "Sports",
                              "Auto Injury",
                              "Wellness",
                              "Prenatal",
                              "Geriatric",
                            ].map((area) => (
                              <Flex key={area} gap="2" align="center">
                                <Checkbox
                                  checked={formData.focusAreas.includes(area)}
                                  onCheckedChange={() =>
                                    handleCheckboxChange("focusAreas", area)
                                  }
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
                            <Text size="2" weight="bold">
                              What is your primary business model?
                            </Text>
                            <RadioGroup.Root
                              value={formData.businessModel}
                              onValueChange={(value) =>
                                handleInputChange("businessModel", value)
                              }
                            >
                              <Flex direction="column" gap="2">
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item value="cash" id="cash" />
                                  <Text as="label" htmlFor="cash" size="2">
                                    Cash-Based
                                  </Text>
                                </Flex>
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item
                                    value="insurance"
                                    id="insurance"
                                  />
                                  <Text as="label" htmlFor="insurance" size="2">
                                    Insurance-Based
                                  </Text>
                                </Flex>
                                <Flex gap="2" align="center">
                                  <RadioGroup.Item value="hybrid" id="hybrid" />
                                  <Text as="label" htmlFor="hybrid" size="2">
                                    Hybrid (Cash + Insurance)
                                  </Text>
                                </Flex>
                              </Flex>
                            </RadioGroup.Root>
                          </Flex>

                          <Flex direction="column" gap="3">
                            <Text size="2" weight="bold">
                              Which insurances do you accept?
                            </Text>
                            <Grid columns="2" gap="3">
                              {[
                                "BCBS",
                                "Aetna",
                                "Cigna",
                                "UnitedHealthcare",
                                "Medicare",
                                "Medicaid",
                              ].map((insurance) => (
                                <Flex key={insurance} gap="2" align="center">
                                  <Checkbox
                                    checked={formData.insurances.includes(
                                      insurance,
                                    )}
                                    onCheckedChange={() =>
                                      handleCheckboxChange(
                                        "insurances",
                                        insurance,
                                      )
                                    }
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
                    <Button
                      size="3"
                      variant="ghost"
                      onClick={handleBack}
                      style={{ color: "var(--gray-11)" }}
                    >
                      Back
                    </Button>
                    <Button size="3" variant="solid" onClick={handleNext}>
                      Next step
                    </Button>
                  </Flex>
                </Flex>
              )}

              {step === 5 && !submitSuccess && (
                <Flex direction="column" gap="4">
                  <Heading size="6">Where do you practice?</Heading>
                  <Flex direction="column" gap="3">
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Clinic Name
                      </Text>
                      <TextField.Root
                        size="3"
                        value={formData.clinicName}
                        onChange={handleTextFieldChange("clinicName")}
                        placeholder="Wellness Chiropractic"
                      />
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Street Address
                      </Text>
                      <TextField.Root
                        size="3"
                        value={formData.address}
                        onChange={handleTextFieldChange("address")}
                        placeholder="123 Main St"
                      />
                    </Flex>
                    <Grid columns="3" gap="3">
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">
                          City
                        </Text>
                        <TextField.Root
                          size="3"
                          value={formData.city}
                          onChange={handleTextFieldChange("city")}
                          placeholder="City"
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">
                          State
                        </Text>
                        <TextField.Root
                          size="3"
                          value={formData.state}
                          onChange={handleTextFieldChange("state")}
                          placeholder="State"
                        />
                      </Flex>
                      <Flex direction="column" gap="1">
                        <Text as="label" size="2" weight="bold">
                          Zip Code
                        </Text>
                        <TextField.Root
                          size="3"
                          value={formData.zip}
                          onChange={handleTextFieldChange("zip")}
                          placeholder="12345"
                        />
                      </Flex>
                    </Grid>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Website
                      </Text>
                      <TextField.Root
                        size="3"
                        value={formData.website}
                        onChange={handleTextFieldChange("website")}
                        placeholder="https://yourclinic.com"
                      >
                        <TextField.Slot>
                          <GlobeIcon />
                        </TextField.Slot>
                      </TextField.Root>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text as="label" size="2" weight="bold">
                        Instagram Handle
                      </Text>
                      <TextField.Root
                        size="3"
                        value={formData.instagram}
                        onChange={handleTextFieldChange("instagram")}
                        placeholder="@yourclinic"
                      >
                        <TextField.Slot>
                          <InstagramLogoIcon />
                        </TextField.Slot>
                      </TextField.Root>
                    </Flex>
                  </Flex>

                  <Callout.Root color="blue">
                    <Callout.Icon>
                      <InfoCircledIcon />
                    </Callout.Icon>
                    <Callout.Text>
                      Submitting sends your profile for license review. You can
                      still edit details later from your account.
                    </Callout.Text>
                  </Callout.Root>

                  <Flex gap="3" justify="between" mt="4">
                    <Button
                      size="3"
                      variant="ghost"
                      onClick={handleBack}
                      style={{ color: "var(--gray-11)" }}
                    >
                      Back
                    </Button>
                    <Button
                      size="3"
                      variant="solid"
                      disabled={finalSubmitLoading}
                      onClick={() => void submitFinal()}
                    >
                      {finalSubmitLoading
                        ? "Working…"
                        : "Create account & submit for review"}
                    </Button>
                  </Flex>
                </Flex>
              )}
            </div>
          </div>

          <Link href="/" className={layoutStyles.signupBack}>
            Back to home
          </Link>
        </>
      )}
    </SignupSplitShell>
  );
}
