"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionContainer, SectionHeader } from "@/app/components/home/section-layout";
import { HomePricingCta } from "@/app/components/home/HomePricingCta";
import { cn } from "@/lib/utils";

type Period = "monthly" | "annually";

const discountRatio = 0.2;

type PlanRow = {
  name: string;
  price: { monthly: number; annually: number };
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
  external?: boolean;
  enterprise?: boolean;
};

const plans: PlanRow[] = [
  {
    name: "Listed",
    price: { monthly: 0, annually: 0 },
    description:
      "Get a verified profile on Movyn at no cost. Patients can find you, see your credentials, and reach out.",
    features: [
      "Verified license badge",
      "Searchable basic profile (location, contact, credentials)",
      "Up to 3 modalities and 3 focus areas",
    ],
    cta: "Create your free profile",
    href: "/join",
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 79, annually: Math.round(79 * 12 * (1 - discountRatio)) },
    description:
      "For chiropractors who want to be matched on what they actually do—and stand out in their area.",
    features: [
      "Everything in Listed",
      "Unlimited modalities, philosophies, and focus areas",
      "Priority placement in fit-matched search results",
      "Full bio, photos, room and team highlights",
      "Direct messaging from interested patients",
    ],
    cta: "Start Pro",
    href: "/join",
    popular: true,
  },
  {
    name: "Network",
    price: { monthly: 199, annually: Math.round(199 * 12 * (1 - discountRatio)) },
    description:
      "For multi-location practices, integrative groups, and clinics that want to refer between providers.",
    features: [
      "Everything in Pro",
      "Multi-location and team management",
      "Provider-to-provider referrals",
      "Group analytics and reporting",
      "Dedicated onboarding for your team",
    ],
    cta: "Talk to us",
    href: "mailto:hello@movyn.com?subject=Network%20plan",
    popular: false,
    external: true,
    enterprise: true,
  },
];

/** Cosmic `PricingSection` rhythm — billing toggle + three cards + CTA band (no SlidingNumber). */
export function HomePricing() {
  const [period, setPeriod] = useState<Period>("monthly");

  return (
    <SectionContainer id="pricing">
      <SectionHeader
        subTitle="Pricing for chiropractors"
        title="Free to be listed. Affordable to be found."
        description="Patients always search Movyn for free. Chiropractors choose the level of visibility and tools that fit their practice—no contracts, cancel anytime."
      />
      <div className="mx-auto max-w-5xl">
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
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan) => {
            const amount = period === "monthly" ? plan.price.monthly : plan.price.annually;
            const periodLabel = period === "monthly" ? "month" : "year";
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
                    {plan.enterprise ? (
                      <span className="text-4xl font-bold">Let&apos;s talk</span>
                    ) : (
                      <>
                        <span className="flex text-4xl font-bold">${amount}</span>
                        <span className="text-muted-foreground text-sm lowercase">
                          /{periodLabel}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                  <ul className="my-6 flex-grow space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="text-primary size-4 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.external ? (
                    <Button variant={plan.popular ? "default" : "outline"} asChild>
                      <a href={plan.href}>{plan.cta}</a>
                    </Button>
                  ) : (
                    <Button variant={plan.popular ? "default" : "outline"} asChild>
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  )}
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
