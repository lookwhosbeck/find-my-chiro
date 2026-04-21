"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionContainer, SectionHeader } from "@/app/components/home/section-layout";
import { HomePricingCta } from "@/app/components/home/HomePricingCta";
import {
  FOUNDING_COUPON_CODE,
  FOUNDING_MEMBERS_CAP,
  LICENSE_VERIFICATION_FEE_USD,
} from "@/lib/founding-promo";
import { cn } from "@/lib/utils";

type Period = "monthly" | "annually";

const discountRatio = 0.2;
const premiumMonthly = 30;
const premiumAnnualTotal = Math.round(premiumMonthly * 12 * (1 - discountRatio));
const premiumAnnualMonthly = Math.round(premiumMonthly * (1 - discountRatio));
const verificationFee = LICENSE_VERIFICATION_FEE_USD;

type PlanRow = {
  name: string;
  price: { monthly: number; annually: number };
  /** What unit appears next to the price ("month" or "year"). */
  period: { monthly: string; annually: string };
  /** Optional helper line shown under the price (e.g. equivalent monthly cost). */
  priceCaption?: { monthly?: string; annually?: string };
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
};

const plans: PlanRow[] = [
  {
    name: "Free",
    price: { monthly: 0, annually: 0 },
    period: { monthly: "month", annually: "year" },
    description:
      "Get a verified profile on Movyn at no monthly cost. Patients can find you, see your credentials, and reach out directly.",
    features: [
      "Verified license badge on your profile",
      "Searchable basic profile (location, contact, credentials)",
      "Up to 3 modalities and 3 focus areas",
      `One-time $${verificationFee} license verification fee`,
    ],
    cta: "Sign up — Free",
    href: "/signup",
    popular: false,
  },
  {
    name: "Premium",
    price: { monthly: premiumMonthly, annually: premiumAnnualTotal },
    period: { monthly: "month", annually: "year" },
    priceCaption: {
      annually: `Just $${premiumAnnualMonthly}/month, billed annually`,
    },
    description:
      "Unlock everything Movyn offers—built for chiropractors who want to be matched on what they actually do and stand out in their area.",
    features: [
      "Everything in Free",
      "Unlimited modalities, philosophies, and focus areas",
      "Priority placement in fit-matched search results",
      "Full bio, photos, room and team highlights",
      "Direct messaging from interested patients",
      "Provider-to-provider referrals",
      `One-time $${verificationFee} license verification fee`,
    ],
    cta: "Sign up — Premium",
    href: "/signup",
    popular: true,
  },
];

export function HomePricing() {
  const [period, setPeriod] = useState<Period>("monthly");

  return (
    <SectionContainer id="pricing">
      <SectionHeader
        subTitle="Pricing for chiropractors"
        title="Free to be listed. Affordable to be found."
        description="Patients always search Movyn for free. Chiropractors choose between a free verified profile or a Premium membership that unlocks every match-making feature—no contracts, cancel anytime."
      />
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col gap-3 rounded-xl border border-[#0190ff]/35 bg-[#e6f6ff] px-6 py-4 text-center shadow-sm sm:text-left dark:border-blue-500/40 dark:bg-blue-950/85 dark:shadow-none">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-3">
            <Badge className="shrink-0 gap-1 border-0 bg-[#0190ff] text-white hover:bg-[#0190ff]">
              <Sparkles className="size-3.5" />
              Coupon · {FOUNDING_COUPON_CODE}
            </Badge>
            <p className="text-sm text-[#0c4a6e] sm:text-base dark:text-blue-50">
              <span className="font-semibold">Use coupon code {FOUNDING_COUPON_CODE} at sign up</span> for free
              license verification.{" "}
              <span className="text-[#0369a1] dark:text-blue-200/95">
                Limited to the first {FOUNDING_MEMBERS_CAP} chiropractors (waives the usual ${verificationFee}{" "}
                verification). After that, a one-time ${verificationFee} verification fee on any plan.
              </span>
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="mb-8 flex justify-center rounded-lg border p-1">
            <Button
              type="button"
              variant={period === "monthly" ? "secondary" : "ghost"}
              onClick={() => setPeriod("monthly")}
            >
              Monthly
            </Button>
            <Button
              type="button"
              variant={period === "annually" ? "secondary" : "ghost"}
              onClick={() => setPeriod("annually")}
            >
              Annually
              <Badge className="ms-1 border-0 bg-transparent text-green-600 dark:text-green-400">
                Save {discountRatio * 100}%
              </Badge>
            </Button>
          </div>
        </div>
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2 md:gap-8">
          {plans.map((plan) => {
            const amount = period === "monthly" ? plan.price.monthly : plan.price.annually;
            const periodLabel = period === "monthly" ? plan.period.monthly : plan.period.annually;
            const caption =
              period === "monthly" ? plan.priceCaption?.monthly : plan.priceCaption?.annually;
            return (
              <Card
                key={plan.name}
                className={cn("relative h-full overflow-hidden", plan.popular && "border-primary")}
              >
                {plan.popular ? (
                  <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-xs font-medium">
                    Most popular
                  </div>
                ) : null}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="flex text-4xl font-bold">${amount}</span>
                    <span className="text-muted-foreground text-sm lowercase">
                      /{periodLabel}
                    </span>
                  </div>
                  {caption ? (
                    <p className="text-muted-foreground mt-1 text-sm">{caption}</p>
                  ) : null}
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                  <ul className="my-6 flex-grow space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="text-primary size-4 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.popular ? "default" : "outline"} asChild>
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <HomePricingCta />
      </div>
    </SectionContainer>
  );
}
