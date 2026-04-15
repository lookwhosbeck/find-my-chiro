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
    name: "Starter (placeholder)",
    price: { monthly: 29, annually: Math.round(29 * 12 * discountRatio) },
    description: "For solo providers testing the waters on Movyn.",
    features: ["Placeholder feature", "Placeholder feature", "Email support (placeholder)"],
    cta: "Start free trial",
    href: "/join",
    popular: false,
  },
  {
    name: "Professional (placeholder)",
    price: { monthly: 79, annually: Math.round(79 * 12 * discountRatio) },
    description: "For growing clinics that want more visibility and leads.",
    features: [
      "Placeholder feature",
      "Placeholder feature",
      "Placeholder feature",
      "Priority support (placeholder)",
    ],
    cta: "Start free trial",
    href: "/join",
    popular: true,
  },
  {
    name: "Enterprise (placeholder)",
    price: { monthly: 199, annually: Math.round(199 * 12 * discountRatio) },
    description: "For groups, MSOs, or custom integrations.",
    features: [
      "Placeholder feature",
      "Placeholder feature",
      "Placeholder feature",
      "Placeholder feature",
    ],
    cta: "Contact sales",
    href: "mailto:hello@movyn.com?subject=Enterprise%20pricing",
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
        subTitle="Pricing"
        title="Plans you can refine later"
        description="Placeholder pricing — mirror Cosmic’s layout while you finalize packaging. Toggle matches the template’s monthly / annual control."
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
