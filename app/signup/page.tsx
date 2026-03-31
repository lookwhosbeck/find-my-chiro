"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [matchTab, setMatchTab] = useState<
    "modalities" | "focus" | "insurance"
  >("modalities");
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
              <div
                className={layoutStyles.signupFormStack}
                style={{ alignItems: "center", textAlign: "center" }}
              >
                <p className={layoutStyles.signupFormSectionTitle}>
                  Verifying your payment…
                </p>
                <p
                  className={layoutStyles.signupFormSubtext}
                  style={{ margin: 0 }}
                >
                  One moment.
                </p>
              </div>
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
                  <div
                    className={`${layoutStyles.signupAlert} ${layoutStyles.signupAlertSuccess}`}
                  >
                    <CheckCircledIcon className={layoutStyles.signupAlertIcon} />
                    <span>
                      Payment received ({paidCheckoutInfo.plan} ·{" "}
                      {paidCheckoutInfo.subscriptionStatus}). Continue with your
                      profile below.
                    </span>
                  </div>
                )}

                {submitError && (
                  <div
                    className={`${layoutStyles.signupAlert} ${layoutStyles.signupAlertError}`}
                  >
                    <InfoCircledIcon className={layoutStyles.signupAlertIcon} />
                    <span>{submitError}</span>
                  </div>
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
                <div
                  className={`${layoutStyles.signupAlert} ${layoutStyles.signupAlertInfo}`}
                >
                  <InfoCircledIcon className={layoutStyles.signupAlertIcon} />
                  <span>
                    Check your email to confirm your address, then{" "}
                    <Link
                      href="/signin"
                      className={layoutStyles.signupInlineLink}
                    >
                      sign in
                    </Link>{" "}
                    to open your dashboard.
                  </span>
                </div>
              )}

              {submitSuccess && !needsEmailVerify && (
                <div
                  className={`${layoutStyles.signupAlert} ${layoutStyles.signupAlertSuccess}`}
                >
                  <CheckCircledIcon className={layoutStyles.signupAlertIcon} />
                  <span>Welcome! Redirecting to your account…</span>
                </div>
              )}

              {submitError && !submitSuccess && (
                <div
                  className={`${layoutStyles.signupAlert} ${layoutStyles.signupAlertError}`}
                >
                  <InfoCircledIcon className={layoutStyles.signupAlertIcon} />
                  <span>{submitError}</span>
                </div>
              )}

              {step === 2 && !submitSuccess && (
                <div className={layoutStyles.signupFormStack}>
                  <h2 className={layoutStyles.signupFormSectionTitle}>
                    Account
                  </h2>
                  {paidCheckoutInfo && (
                    <div
                      className={`${layoutStyles.signupAlert} ${layoutStyles.signupAlertInfo}`}
                    >
                      <InfoCircledIcon
                        className={layoutStyles.signupAlertIcon}
                      />
                      <span>
                        Subscribed as {paidCheckoutInfo.email}. Use the same
                        email below.
                      </span>
                    </div>
                  )}
                  <div className={layoutStyles.signupFields}>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-first"
                      >
                        First name
                      </label>
                      <input
                        id="signup-chiro-first"
                        className={layoutStyles.signupInput}
                        value={formData.firstName}
                        onChange={handleTextFieldChange("firstName")}
                        placeholder="John"
                        autoComplete="given-name"
                      />
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-last"
                      >
                        Last name
                      </label>
                      <input
                        id="signup-chiro-last"
                        className={layoutStyles.signupInput}
                        value={formData.lastName}
                        onChange={handleTextFieldChange("lastName")}
                        placeholder="Doe"
                        autoComplete="family-name"
                      />
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-email"
                      >
                        Email
                      </label>
                      <input
                        id="signup-chiro-email"
                        className={layoutStyles.signupInput}
                        type="email"
                        value={formData.email}
                        onChange={handleTextFieldChange("email")}
                        readOnly={!!paidCheckoutInfo}
                        placeholder="email@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-password"
                      >
                        Password
                      </label>
                      <input
                        id="signup-chiro-password"
                        className={layoutStyles.signupInput}
                        type="password"
                        value={formData.password}
                        onChange={handleTextFieldChange("password")}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div className={layoutStyles.signupFormActions}>
                    <button
                      type="button"
                      className={layoutStyles.signupButtonGhost}
                      onClick={handleBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className={layoutStyles.signupSubmit}
                      onClick={handleNext}
                    >
                      Next step
                    </button>
                  </div>
                  <p className={layoutStyles.signupFooterNote}>
                    Already have an account?{" "}
                    <Link
                      href="/signin"
                      className={layoutStyles.signupInlineLink}
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              )}

              {step === 3 && !submitSuccess && (
                <div className={layoutStyles.signupFormStack}>
                  <h2 className={layoutStyles.signupFormSectionTitle}>
                    Professional Details
                  </h2>
                  <div className={layoutStyles.signupFields}>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-college"
                      >
                        Chiropractic College
                      </label>
                      {isLoadingColleges ? (
                        <input
                          id="signup-chiro-college"
                          className={layoutStyles.signupInput}
                          disabled
                          placeholder="Loading colleges..."
                        />
                      ) : (
                        <>
                          <select
                            id="signup-chiro-college"
                            className={layoutStyles.signupSelect}
                            value={formData.college}
                            onChange={(e) =>
                              handleInputChange("college", e.target.value)
                            }
                            disabled={colleges.length === 0}
                          >
                            {colleges.length > 0 ? (
                              colleges.map((college) => (
                                <option key={college.id} value={college.name}>
                                  {college.name}
                                  {college.state ? ` (${college.state})` : ""}
                                </option>
                              ))
                            ) : (
                              <option value="">No colleges available</option>
                            )}
                          </select>
                          {colleges.length === 0 && (
                            <button
                              type="button"
                              className={layoutStyles.signupButtonOutline}
                              onClick={() => void loadColleges()}
                            >
                              Retry loading colleges
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-grad-year"
                      >
                        Graduation Year
                      </label>
                      <input
                        id="signup-chiro-grad-year"
                        className={layoutStyles.signupInput}
                        type="number"
                        value={formData.graduationYear}
                        onChange={handleTextFieldChange("graduationYear")}
                        placeholder="2020"
                      />
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-license"
                      >
                        License number{" "}
                        <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input
                        id="signup-chiro-license"
                        className={layoutStyles.signupInput}
                        value={formData.licenseNumber}
                        onChange={handleTextFieldChange("licenseNumber")}
                        placeholder="DC12345"
                      />
                    </div>
                    <div className={layoutStyles.signupField}>
                      <div className={layoutStyles.signupFieldRowHeader}>
                        <label
                          className={layoutStyles.signupLabel}
                          htmlFor="signup-chiro-bio"
                        >
                          Professional Bio
                        </label>
                        <button
                          type="button"
                          className={layoutStyles.signupButtonLink}
                        >
                          <MagicWandIcon width={12} height={12} aria-hidden />
                          Auto-Write Bio
                        </button>
                      </div>
                      <textarea
                        id="signup-chiro-bio"
                        className={layoutStyles.signupTextarea}
                        value={formData.bio}
                        onChange={handleTextAreaChange("bio")}
                        placeholder="Tell patients about your approach."
                        rows={5}
                      />
                    </div>
                  </div>
                  <div className={layoutStyles.signupFormActions}>
                    <button
                      type="button"
                      className={layoutStyles.signupButtonGhost}
                      onClick={handleBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className={layoutStyles.signupSubmit}
                      onClick={handleNext}
                    >
                      Next step
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && !submitSuccess && (
                <div className={layoutStyles.signupFormStack}>
                  <div>
                    <h2 className={layoutStyles.signupFormSectionTitle}>
                      Help Patients Find You
                    </h2>
                    <p className={layoutStyles.signupFormSubtext}>
                      Select all that apply. This helps patients match with your
                      practice.
                    </p>
                  </div>

                  <div
                    className={layoutStyles.signupFormTabs}
                    role="tablist"
                    aria-label="Matching categories"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={matchTab === "modalities"}
                      className={`${layoutStyles.signupFormTab} ${matchTab === "modalities" ? layoutStyles.signupFormTabActive : ""}`}
                      onClick={() => setMatchTab("modalities")}
                    >
                      Techniques &amp; Modalities
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={matchTab === "focus"}
                      className={`${layoutStyles.signupFormTab} ${matchTab === "focus" ? layoutStyles.signupFormTabActive : ""}`}
                      onClick={() => setMatchTab("focus")}
                    >
                      Focus Areas
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={matchTab === "insurance"}
                      className={`${layoutStyles.signupFormTab} ${matchTab === "insurance" ? layoutStyles.signupFormTabActive : ""}`}
                      onClick={() => setMatchTab("insurance")}
                    >
                      Insurance &amp; Payment
                    </button>
                  </div>

                  <div className={layoutStyles.signupFormTabPanel}>
                    {matchTab === "modalities" && (
                      <div className={layoutStyles.signupGrid2}>
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
                          <label
                            key={modality}
                            className={layoutStyles.signupCheckRow}
                          >
                            <input
                              type="checkbox"
                              checked={formData.modalities.includes(modality)}
                              onChange={() =>
                                handleCheckboxChange("modalities", modality)
                              }
                            />
                            <span>{modality}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {matchTab === "focus" && (
                      <div className={layoutStyles.signupGrid2}>
                        {[
                          "Pediatrics",
                          "Sports",
                          "Auto Injury",
                          "Wellness",
                          "Prenatal",
                          "Geriatric",
                        ].map((area) => (
                          <label
                            key={area}
                            className={layoutStyles.signupCheckRow}
                          >
                            <input
                              type="checkbox"
                              checked={formData.focusAreas.includes(area)}
                              onChange={() =>
                                handleCheckboxChange("focusAreas", area)
                              }
                            />
                            <span>{area}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {matchTab === "insurance" && (
                      <div className={layoutStyles.signupFormStack}>
                        <div className={layoutStyles.signupField}>
                          <p className={layoutStyles.signupLabel}>
                            What is your primary business model?
                          </p>
                          <div className={layoutStyles.signupRadioStack}>
                            <label className={layoutStyles.signupCheckRow}>
                              <input
                                type="radio"
                                name="chiro-business-model"
                                value="cash"
                                checked={formData.businessModel === "cash"}
                                onChange={() =>
                                  handleInputChange("businessModel", "cash")
                                }
                              />
                              <span>Cash-Based</span>
                            </label>
                            <label className={layoutStyles.signupCheckRow}>
                              <input
                                type="radio"
                                name="chiro-business-model"
                                value="insurance"
                                checked={formData.businessModel === "insurance"}
                                onChange={() =>
                                  handleInputChange(
                                    "businessModel",
                                    "insurance",
                                  )
                                }
                              />
                              <span>Insurance-Based</span>
                            </label>
                            <label className={layoutStyles.signupCheckRow}>
                              <input
                                type="radio"
                                name="chiro-business-model"
                                value="hybrid"
                                checked={formData.businessModel === "hybrid"}
                                onChange={() =>
                                  handleInputChange("businessModel", "hybrid")
                                }
                              />
                              <span>Hybrid (Cash + Insurance)</span>
                            </label>
                          </div>
                        </div>
                        <div className={layoutStyles.signupField}>
                          <p className={layoutStyles.signupLabel}>
                            Which insurances do you accept?
                          </p>
                          <div className={layoutStyles.signupGrid2}>
                            {[
                              "BCBS",
                              "Aetna",
                              "Cigna",
                              "UnitedHealthcare",
                              "Medicare",
                              "Medicaid",
                            ].map((insurance) => (
                              <label
                                key={insurance}
                                className={layoutStyles.signupCheckRow}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.insurances.includes(
                                    insurance,
                                  )}
                                  onChange={() =>
                                    handleCheckboxChange(
                                      "insurances",
                                      insurance,
                                    )
                                  }
                                />
                                <span>{insurance}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={layoutStyles.signupFormActions}>
                    <button
                      type="button"
                      className={layoutStyles.signupButtonGhost}
                      onClick={handleBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className={layoutStyles.signupSubmit}
                      onClick={handleNext}
                    >
                      Next step
                    </button>
                  </div>
                </div>
              )}

              {step === 5 && !submitSuccess && (
                <div className={layoutStyles.signupFormStack}>
                  <h2 className={layoutStyles.signupFormSectionTitle}>
                    Where do you practice?
                  </h2>
                  <div className={layoutStyles.signupFields}>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-clinic"
                      >
                        Clinic Name
                      </label>
                      <input
                        id="signup-chiro-clinic"
                        className={layoutStyles.signupInput}
                        value={formData.clinicName}
                        onChange={handleTextFieldChange("clinicName")}
                        placeholder="Wellness Chiropractic"
                      />
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-address"
                      >
                        Street Address
                      </label>
                      <input
                        id="signup-chiro-address"
                        className={layoutStyles.signupInput}
                        value={formData.address}
                        onChange={handleTextFieldChange("address")}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className={layoutStyles.signupGrid3}>
                      <div className={layoutStyles.signupField}>
                        <label
                          className={layoutStyles.signupLabel}
                          htmlFor="signup-chiro-city"
                        >
                          City
                        </label>
                        <input
                          id="signup-chiro-city"
                          className={layoutStyles.signupInput}
                          value={formData.city}
                          onChange={handleTextFieldChange("city")}
                          placeholder="City"
                        />
                      </div>
                      <div className={layoutStyles.signupField}>
                        <label
                          className={layoutStyles.signupLabel}
                          htmlFor="signup-chiro-state"
                        >
                          State
                        </label>
                        <input
                          id="signup-chiro-state"
                          className={layoutStyles.signupInput}
                          value={formData.state}
                          onChange={handleTextFieldChange("state")}
                          placeholder="State"
                        />
                      </div>
                      <div className={layoutStyles.signupField}>
                        <label
                          className={layoutStyles.signupLabel}
                          htmlFor="signup-chiro-zip"
                        >
                          Zip Code
                        </label>
                        <input
                          id="signup-chiro-zip"
                          className={layoutStyles.signupInput}
                          value={formData.zip}
                          onChange={handleTextFieldChange("zip")}
                          placeholder="12345"
                        />
                      </div>
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-website"
                      >
                        Website
                      </label>
                      <div className={layoutStyles.signupInputWithIconWrap}>
                        <GlobeIcon
                          className={layoutStyles.signupFieldIconLeft}
                          aria-hidden
                        />
                        <input
                          id="signup-chiro-website"
                          className={`${layoutStyles.signupInput} ${layoutStyles.signupInputIconPad}`}
                          value={formData.website}
                          onChange={handleTextFieldChange("website")}
                          placeholder="https://yourclinic.com"
                        />
                      </div>
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-chiro-insta"
                      >
                        Instagram Handle
                      </label>
                      <div className={layoutStyles.signupInputWithIconWrap}>
                        <InstagramLogoIcon
                          className={layoutStyles.signupFieldIconLeft}
                          aria-hidden
                        />
                        <input
                          id="signup-chiro-insta"
                          className={`${layoutStyles.signupInput} ${layoutStyles.signupInputIconPad}`}
                          value={formData.instagram}
                          onChange={handleTextFieldChange("instagram")}
                          placeholder="@yourclinic"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${layoutStyles.signupAlert} ${layoutStyles.signupAlertInfo}`}
                  >
                    <InfoCircledIcon className={layoutStyles.signupAlertIcon} />
                    <span>
                      Submitting sends your profile for license review. You can
                      still edit details later from your account.
                    </span>
                  </div>

                  <div className={layoutStyles.signupFormActions}>
                    <button
                      type="button"
                      className={layoutStyles.signupButtonGhost}
                      onClick={handleBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className={layoutStyles.signupSubmit}
                      disabled={finalSubmitLoading}
                      onClick={() => void submitFinal()}
                    >
                      {finalSubmitLoading
                        ? "Working…"
                        : "Create account & submit for review"}
                    </button>
                  </div>
                </div>
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
