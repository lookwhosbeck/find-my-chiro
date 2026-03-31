"use client";

import { useState } from "react";
import {
  CalendarIcon,
  InfoCircledIcon,
  CheckCircledIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignupSplitShell } from "../components/SignupSplitShell";
import layoutStyles from "../components/SignupSplitShell.module.css";
import { signUpPatient, type PatientSignUpData } from "../lib/auth";
import { SEARCH_RADIUS_MILES_OPTIONS } from "../lib/search-radius";

const steps = [
  { number: 1, label: "Account" },
  { number: 2, label: "Personal Info" },
  { number: 3, label: "Preferences" },
  { number: 4, label: "Location" },
];

export default function PatientSignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [patientPrefsTab, setPatientPrefsTab] = useState<
    "modalities" | "focus" | "payment"
  >("modalities");
  const [formData, setFormData] = useState({
    // Step 1
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    // Step 2
    phone: "",
    dateOfBirth: "",
    emergencyContact: "",
    emergencyPhone: "",
    // Step 3
    preferredModalities: [] as string[],
    focusAreas: [] as string[],
    preferredBusinessModel: "",
    insuranceType: "",
    budgetRange: "",
    // Step 4
    city: "",
    state: "",
    zipCode: "",
    searchRadius: 25,
    preferredDays: [] as string[],
    preferredTimes: [] as string[],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTextFieldChange = (field: string) => (e: any) => {
    const value = e.target.value;
    handleInputChange(field, value);
  };

  const handleCheckboxChange = (
    category:
      | "preferredModalities"
      | "focusAreas"
      | "preferredDays"
      | "preferredTimes",
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

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      setSubmitError("Please complete all required fields in Step 1");
      setStep(1);
      return;
    }

    if (formData.password.length < 6) {
      setSubmitError("Password must be at least 6 characters long");
      setStep(1);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitError("Please enter a valid email address");
      setStep(1);
      return;
    }

    // Validate location (required for Step 4)
    if (!formData.city || !formData.state || !formData.zipCode) {
      setSubmitError("Please provide your location information");
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await signUpPatient(formData satisfies PatientSignUpData);

      if (result.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push("/account");
        }, 2000);
      } else {
        setSubmitError(
          result.error || "Failed to create account. Please try again.",
        );
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setSubmitError(
        error.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhyDetailText = () => {
    switch (step) {
      case 1:
        return "Creating an account ensures secure access and personalized matching.";
      case 2:
        return "Personal information helps us provide better, more relevant matches.";
      case 3:
        return "Detailed preferences ensure you find chiropractors who match your needs and values.";
      case 4:
        return "Location data helps us show you chiropractors in your area.";
      default:
        return "";
    }
  };

  return (
    <SignupSplitShell
      currentStep={step}
      steps={steps}
      headline="Find your perfect chiropractor."
      subtext="Complete this profile to get matched with chiropractors who align with your preferences and needs."
      whyDetail={getWhyDetailText()}
    >
      {step === 1 ? (
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
                aria-selected={false}
                className={layoutStyles.signupMembershipRoleTab}
                onClick={() => router.push("/signup")}
              >
                Chiropractor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected
                className={`${layoutStyles.signupMembershipRoleTab} ${layoutStyles.signupMembershipRoleTabActive}`}
              >
                Patient
              </button>
            </div>
          </div>

          <div className={layoutStyles.signupMembershipCardColumn}>
            <div className={layoutStyles.signupCard}>
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
                    <label
                      className={layoutStyles.signupLabel}
                      htmlFor="signup-patient-first"
                    >
                      First Name
                    </label>
                    <input
                      id="signup-patient-first"
                      className={layoutStyles.signupInput}
                      value={formData.firstName}
                      onChange={handleTextFieldChange("firstName")}
                      placeholder="John"
                      autoComplete="given-name"
                      required
                    />
                  </div>
                  <div className={layoutStyles.signupField}>
                    <label
                      className={layoutStyles.signupLabel}
                      htmlFor="signup-patient-last"
                    >
                      Last Name
                    </label>
                    <input
                      id="signup-patient-last"
                      className={layoutStyles.signupInput}
                      value={formData.lastName}
                      onChange={handleTextFieldChange("lastName")}
                      placeholder="Doe"
                      autoComplete="family-name"
                      required
                    />
                  </div>
                  <div className={layoutStyles.signupField}>
                    <label
                      className={layoutStyles.signupLabel}
                      htmlFor="signup-patient-email"
                    >
                      Email
                    </label>
                    <input
                      id="signup-patient-email"
                      className={layoutStyles.signupInput}
                      type="email"
                      value={formData.email}
                      onChange={handleTextFieldChange("email")}
                      placeholder="email@email.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className={layoutStyles.signupField}>
                    <label
                      className={layoutStyles.signupLabel}
                      htmlFor="signup-patient-password"
                    >
                      Password
                    </label>
                    <input
                      id="signup-patient-password"
                      className={layoutStyles.signupInput}
                      type="password"
                      value={formData.password}
                      onChange={handleTextFieldChange("password")}
                      placeholder="Password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className={layoutStyles.signupSubmit}>
                  Next step
                </button>
              </form>

              <p className={layoutStyles.signupFooterNote}>
                Already have an account?{" "}
                <Link href="/signin" className={layoutStyles.signupInlineLink}>
                  Sign in
                </Link>
              </p>
            </div>

            <div
              className={`${layoutStyles.signupMembershipFooterLinks} ${layoutStyles.signupMembershipFooterBelowCard}`}
            >
              <Link href="/" className={layoutStyles.signupMembershipBlueLink}>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h1 className={layoutStyles.signupTitle}>Create your account</h1>
          <div
            className={`${layoutStyles.signupCard} ${layoutStyles.signupCardWide}`}
          >
            <div className={layoutStyles.signupWideBody}>
              {submitSuccess && (
                <div
                  className={`${layoutStyles.signupAlert} ${layoutStyles.signupAlertSuccess}`}
                >
                  <CheckCircledIcon className={layoutStyles.signupAlertIcon} />
                  <span>Account created successfully! Redirecting...</span>
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

              {step === 2 && (
                <div className={layoutStyles.signupFormStack}>
                  <h2 className={layoutStyles.signupFormSectionTitle}>
                    Personal Information
                  </h2>
                  <div className={layoutStyles.signupFields}>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-patient-phone"
                      >
                        Phone Number
                      </label>
                      <div className={layoutStyles.signupInputWithIconWrap}>
                        <PersonIcon
                          className={layoutStyles.signupFieldIconLeft}
                          aria-hidden
                        />
                        <input
                          id="signup-patient-phone"
                          className={`${layoutStyles.signupInput} ${layoutStyles.signupInputIconPad}`}
                          type="tel"
                          value={formData.phone}
                          onChange={handleTextFieldChange("phone")}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-patient-dob"
                      >
                        Date of Birth
                      </label>
                      <div className={layoutStyles.signupInputWithIconWrap}>
                        <CalendarIcon
                          className={layoutStyles.signupFieldIconLeft}
                          aria-hidden
                        />
                        <input
                          id="signup-patient-dob"
                          className={`${layoutStyles.signupInput} ${layoutStyles.signupInputIconPad}`}
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleTextFieldChange("dateOfBirth")}
                        />
                      </div>
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-patient-em-name"
                      >
                        Emergency Contact Name
                      </label>
                      <input
                        id="signup-patient-em-name"
                        className={layoutStyles.signupInput}
                        value={formData.emergencyContact}
                        onChange={handleTextFieldChange("emergencyContact")}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-patient-em-phone"
                      >
                        Emergency Contact Phone
                      </label>
                      <div className={layoutStyles.signupInputWithIconWrap}>
                        <PersonIcon
                          className={layoutStyles.signupFieldIconLeft}
                          aria-hidden
                        />
                        <input
                          id="signup-patient-em-phone"
                          className={`${layoutStyles.signupInput} ${layoutStyles.signupInputIconPad}`}
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={handleTextFieldChange("emergencyPhone")}
                          placeholder="(555) 123-4567"
                        />
                      </div>
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

              {step === 3 && (
                <div className={layoutStyles.signupFormStack}>
                  <div>
                    <h2 className={layoutStyles.signupFormSectionTitle}>
                      Your Preferences
                    </h2>
                    <p className={layoutStyles.signupFormSubtext}>
                      Select what matters most to you in a chiropractor. This
                      helps us find the best matches.
                    </p>
                  </div>

                  <div
                    className={layoutStyles.signupFormTabs}
                    role="tablist"
                    aria-label="Preference categories"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={patientPrefsTab === "modalities"}
                      className={`${layoutStyles.signupFormTab} ${patientPrefsTab === "modalities" ? layoutStyles.signupFormTabActive : ""}`}
                      onClick={() => setPatientPrefsTab("modalities")}
                    >
                      Treatment Styles
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={patientPrefsTab === "focus"}
                      className={`${layoutStyles.signupFormTab} ${patientPrefsTab === "focus" ? layoutStyles.signupFormTabActive : ""}`}
                      onClick={() => setPatientPrefsTab("focus")}
                    >
                      Specialties
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={patientPrefsTab === "payment"}
                      className={`${layoutStyles.signupFormTab} ${patientPrefsTab === "payment" ? layoutStyles.signupFormTabActive : ""}`}
                      onClick={() => setPatientPrefsTab("payment")}
                    >
                      Payment &amp; Insurance
                    </button>
                  </div>

                  <div className={layoutStyles.signupFormTabPanel}>
                    {patientPrefsTab === "modalities" && (
                      <div className={layoutStyles.signupFormStack}>
                        <p className={layoutStyles.signupLabel}>
                          Which chiropractic techniques interest you?
                        </p>
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
                                checked={formData.preferredModalities.includes(
                                  modality,
                                )}
                                onChange={() =>
                                  handleCheckboxChange(
                                    "preferredModalities",
                                    modality,
                                  )
                                }
                              />
                              <span>{modality}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {patientPrefsTab === "focus" && (
                      <div className={layoutStyles.signupFormStack}>
                        <p className={layoutStyles.signupLabel}>
                          Do you need care for specific conditions or life
                          stages?
                        </p>
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
                      </div>
                    )}

                    {patientPrefsTab === "payment" && (
                      <div className={layoutStyles.signupFormStack}>
                        <div className={layoutStyles.signupField}>
                          <p className={layoutStyles.signupLabel}>
                            Preferred Payment Method
                          </p>
                          <div className={layoutStyles.signupRadioStack}>
                            <label className={layoutStyles.signupCheckRow}>
                              <input
                                type="radio"
                                name="patient-pay-model"
                                value="cash"
                                checked={
                                  formData.preferredBusinessModel === "cash"
                                }
                                onChange={() =>
                                  handleInputChange(
                                    "preferredBusinessModel",
                                    "cash",
                                  )
                                }
                              />
                              <span>Cash-Based (Direct Pay)</span>
                            </label>
                            <label className={layoutStyles.signupCheckRow}>
                              <input
                                type="radio"
                                name="patient-pay-model"
                                value="insurance"
                                checked={
                                  formData.preferredBusinessModel ===
                                  "insurance"
                                }
                                onChange={() =>
                                  handleInputChange(
                                    "preferredBusinessModel",
                                    "insurance",
                                  )
                                }
                              />
                              <span>Insurance-Based</span>
                            </label>
                            <label className={layoutStyles.signupCheckRow}>
                              <input
                                type="radio"
                                name="patient-pay-model"
                                value="hybrid"
                                checked={
                                  formData.preferredBusinessModel === "hybrid"
                                }
                                onChange={() =>
                                  handleInputChange(
                                    "preferredBusinessModel",
                                    "hybrid",
                                  )
                                }
                              />
                              <span>Either (Cash or Insurance)</span>
                            </label>
                          </div>
                        </div>
                        <div className={layoutStyles.signupField}>
                          <label
                            className={layoutStyles.signupLabel}
                            htmlFor="signup-patient-insurance"
                          >
                            Insurance Type (if applicable)
                          </label>
                          <select
                            id="signup-patient-insurance"
                            className={layoutStyles.signupSelect}
                            value={formData.insuranceType}
                            onChange={(e) =>
                              handleInputChange("insuranceType", e.target.value)
                            }
                          >
                            <option value="none">
                              No Insurance / Self-Pay
                            </option>
                            <option value="BCBS">Blue Cross Blue Shield</option>
                            <option value="Aetna">Aetna</option>
                            <option value="Cigna">Cigna</option>
                            <option value="UnitedHealthcare">
                              UnitedHealthcare
                            </option>
                            <option value="Medicare">Medicare</option>
                            <option value="Medicaid">Medicaid</option>
                          </select>
                        </div>
                        <div className={layoutStyles.signupField}>
                          <label
                            className={layoutStyles.signupLabel}
                            htmlFor="signup-patient-budget"
                          >
                            Budget Range (Monthly)
                          </label>
                          <select
                            id="signup-patient-budget"
                            className={layoutStyles.signupSelect}
                            value={formData.budgetRange}
                            onChange={(e) =>
                              handleInputChange("budgetRange", e.target.value)
                            }
                          >
                            <option value="none">No Preference</option>
                            <option value="under-50">Under $50</option>
                            <option value="50-100">$50 - $100</option>
                            <option value="100-150">$100 - $150</option>
                            <option value="over-150">Over $150</option>
                          </select>
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

              {step === 4 && (
                <div className={layoutStyles.signupFormStack}>
                  <h2 className={layoutStyles.signupFormSectionTitle}>
                    Location & Availability
                  </h2>
                  <div className={layoutStyles.signupFields}>
                    <div className={layoutStyles.signupGrid3}>
                      <div className={layoutStyles.signupField}>
                        <label
                          className={layoutStyles.signupLabel}
                          htmlFor="signup-patient-city"
                        >
                          City
                        </label>
                        <input
                          id="signup-patient-city"
                          className={layoutStyles.signupInput}
                          value={formData.city}
                          onChange={handleTextFieldChange("city")}
                          placeholder="City"
                          required
                        />
                      </div>
                      <div className={layoutStyles.signupField}>
                        <label
                          className={layoutStyles.signupLabel}
                          htmlFor="signup-patient-state"
                        >
                          State
                        </label>
                        <input
                          id="signup-patient-state"
                          className={layoutStyles.signupInput}
                          value={formData.state}
                          onChange={handleTextFieldChange("state")}
                          placeholder="State"
                          required
                        />
                      </div>
                      <div className={layoutStyles.signupField}>
                        <label
                          className={layoutStyles.signupLabel}
                          htmlFor="signup-patient-zip"
                        >
                          Zip Code
                        </label>
                        <input
                          id="signup-patient-zip"
                          className={layoutStyles.signupInput}
                          value={formData.zipCode}
                          onChange={handleTextFieldChange("zipCode")}
                          placeholder="12345"
                          required
                        />
                      </div>
                    </div>
                    <div className={layoutStyles.signupField}>
                      <label
                        className={layoutStyles.signupLabel}
                        htmlFor="signup-patient-radius"
                      >
                        Search Radius (miles)
                      </label>
                      <select
                        id="signup-patient-radius"
                        className={layoutStyles.signupSelect}
                        value={formData.searchRadius.toString()}
                        onChange={(e) =>
                          handleInputChange(
                            "searchRadius",
                            parseInt(e.target.value, 10).toString(),
                          )
                        }
                      >
                        {SEARCH_RADIUS_MILES_OPTIONS.map((n) => (
                          <option key={n} value={String(n)}>
                            {n} miles
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={layoutStyles.signupField}>
                      <p className={layoutStyles.signupLabel}>
                        Preferred Days (optional)
                      </p>
                      <div className={layoutStyles.signupGrid2}>
                        {[
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                          "Sunday",
                        ].map((day) => (
                          <label
                            key={day}
                            className={layoutStyles.signupCheckRow}
                          >
                            <input
                              type="checkbox"
                              checked={formData.preferredDays.includes(day)}
                              onChange={() =>
                                handleCheckboxChange("preferredDays", day)
                              }
                            />
                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className={layoutStyles.signupField}>
                      <p className={layoutStyles.signupLabel}>
                        Preferred Times (optional)
                      </p>
                      <div className={layoutStyles.signupGrid2}>
                        {[
                          "Morning (8-12)",
                          "Afternoon (12-5)",
                          "Evening (5-8)",
                        ].map((time) => (
                          <label
                            key={time}
                            className={layoutStyles.signupCheckRow}
                          >
                            <input
                              type="checkbox"
                              checked={formData.preferredTimes.includes(time)}
                              onChange={() =>
                                handleCheckboxChange("preferredTimes", time)
                              }
                            />
                            <span>{time}</span>
                          </label>
                        ))}
                      </div>
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
                      onClick={handleSubmit}
                      disabled={isSubmitting || submitSuccess}
                    >
                      {isSubmitting
                        ? "Creating account…"
                        : submitSuccess
                          ? "Success!"
                          : "Complete sign-up"}
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
