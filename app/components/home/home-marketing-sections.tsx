import Link from "next/link";
import {
  Building2,
  Check,
  Clock,
  Heart,
  LineChart,
  Mail,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeatureCard } from "@/app/components/FeatureCard";
import {
  FeatureIconMatching,
  FeatureIconFriction,
  FeatureIconCulture,
} from "@/app/components/FeatureIcons";
import { SectionContainer, SectionHeader } from "@/app/components/home/section-layout";
import { cn } from "@/lib/utils";

const benefitList = [
  {
    icon: Sparkles,
    title: "Smarter matching (placeholder)",
    description:
      "Copy for how Movyn pairs patients with practices beyond distance—replace with your real positioning.",
  },
  {
    icon: LineChart,
    title: "Clearer intake for practices (placeholder)",
    description:
      "Placeholder: fewer unqualified leads because patients see insurance, cash, and approach up front.",
  },
  {
    icon: Heart,
    title: "Human-centered discovery (placeholder)",
    description:
      "Placeholder: highlight culture, modalities, and philosophy so the right people find you.",
  },
] as const;

const serviceList = [
  {
    title: "For patients",
    description:
      "Placeholder: search by location and preferences, save profiles, and compare practices—edit when your patient flow is defined.",
    pro: false,
  },
  {
    title: "For practices",
    description:
      "Placeholder: profile, match insights, and network visibility—tune to your actual product tiers.",
    pro: true,
  },
  {
    title: "For partners",
    description:
      "Placeholder: integrations, listings, or employer programs—replace with what you actually offer.",
    pro: false,
  },
  {
    title: "Data & privacy",
    description:
      "Placeholder: how you handle health-adjacent data and communications—have legal review before launch.",
    pro: false,
  },
] as const;

const testimonials = [
  {
    quote:
      "Placeholder testimonial — swap for a real patient quote about finding the right fit, not just the closest clinic.",
    name: "Alex P.",
    role: "Patient (placeholder)",
  },
  {
    quote:
      "Placeholder testimonial — swap for a DC quote on quality of leads or time saved on the phone.",
    name: "Dr. Jordan Lee",
    role: "Chiropractor (placeholder)",
  },
  {
    quote:
      "Placeholder testimonial — swap for an office manager or front-desk perspective if that fits your story.",
    name: "Sam Rivera",
    role: "Clinic staff (placeholder)",
  },
] as const;

const teamPlaceholders = [
  { initials: "NB", name: "Name", role: "Role / title (placeholder)" },
  { initials: "TM", name: "Name", role: "Role / title (placeholder)" },
  { initials: "CK", name: "Name", role: "Role / title (placeholder)" },
  { initials: "DL", name: "Name", role: "Role / title (placeholder)" },
] as const;

const faqItems = [
  {
    q: "Is Movyn a substitute for medical advice?",
    a: "No. Placeholder copy: Movyn helps you find professionals; care decisions stay between you and your provider. Replace with your legal-approved disclaimer.",
  },
  {
    q: "How much does it cost to search?",
    a: "Placeholder: searching is free for patients. Practices: replace with your real pricing and tiers.",
  },
  {
    q: "How do you handle my data?",
    a: "Placeholder: summarize your privacy policy here and link to /privacy. Have counsel review before publishing.",
  },
  {
    q: "Can I list more than one location?",
    a: "Placeholder: describe multi-location and organization accounts the way you plan to ship them.",
  },
] as const;

export function HomeBenefits() {
  return (
    <SectionContainer id="benefits">
      <div className="grid lg:grid-cols-2 lg:gap-24">
        <div>
          <SectionHeader
            className="sticky max-w-full text-center lg:top-[22rem] lg:text-start"
            subTitle="Benefits"
            title="Why people use Movyn"
            description="Placeholder section — replace with the concrete outcomes you deliver for patients and practices."
          />
        </div>
        <div className="flex w-full flex-col gap-6 lg:gap-[14rem]">
          {benefitList.map(({ icon: Icon, title, description }, index) => (
            <Card
              key={title}
              className={cn("group/number bg-background lg:sticky")}
              style={{ top: `${20 + index + 2}rem` }}
            >
              <CardHeader>
                <div className="flex justify-between">
                  <div className="text-primary bg-primary/20 ring-primary/10 mb-6 flex size-10 items-center justify-center rounded-full p-2 ring-8">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-muted-foreground/15 group-hover/number:text-muted-foreground/30 text-5xl font-bold transition-all delay-75">
                    0{index + 1}
                  </span>
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{description}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

export function HomeFeatures() {
  return (
    <SectionContainer id="features">
      <SectionHeader
        subTitle="Features"
        title="Built for fit, not just proximity"
        description="Your existing product story — refine copy anytime. Three pillars we highlight today:"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="pb-6 pt-8">
            <FeatureCard
              icon={<FeatureIconMatching />}
              title="The Matching Engine"
              description="We don't just list you; we match you based on modalities and philosophies that patients actually filter on."
            />
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="pb-6 pt-8">
            <FeatureCard
              icon={<FeatureIconFriction />}
              title="Reduce Friction"
              description="Patients see insurance and cash models early so you get calls from people aligned with how you work."
            />
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="pb-6 pt-8">
            <FeatureCard
              icon={<FeatureIconCulture />}
              title="Show Your Culture"
              description="Showcase your clinic beyond the address—fit matters as much as distance."
            />
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  );
}

export function HomeServices() {
  return (
    <SectionContainer id="solutions">
      <SectionHeader
        subTitle="Services"
        title="Something for every part of the network"
        description="Placeholder grid — align these cards with real offerings (patient vs practice vs partner)."
      />
      <div className="mx-auto grid w-full max-w-5xl gap-6 sm:grid-cols-2">
        {serviceList.map(({ title, description, pro }) => (
          <Card key={title} className="bg-muted relative h-full gap-2">
            <CardHeader>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{description}</p>
            </CardContent>
            {pro ? (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-3 border-0 bg-amber-500/15 text-amber-900 dark:text-amber-100"
              >
                Popular
              </Badge>
            ) : null}
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}

export function HomeTestimonials() {
  return (
    <SectionContainer id="testimonials">
      <SectionHeader
        subTitle="Testimonials"
        title="What people say (placeholder)"
        description="Swap these cards for real quotes, headshots, and logos when you have them."
      />
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name} className="bg-muted">
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed">{t.quote}</p>
              <div>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <CardDescription>{t.role}</CardDescription>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}

export function HomeTeam() {
  return (
    <SectionContainer id="team">
      <SectionHeader
        subTitle="Team"
        title="People behind Movyn"
        description="Placeholder roster — replace with real photos and bios, or hide this section until you are ready."
      />
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {teamPlaceholders.map((member) => (
          <Card
            key={member.initials}
            className="bg-muted group/hoverimg flex h-full flex-col overflow-hidden pt-0"
          >
            <figure className="overflow-hidden">
              <div className="bg-muted-foreground/15 text-muted-foreground flex aspect-square w-full items-center justify-center text-3xl font-bold transition-all duration-200 group-hover/hoverimg:scale-[1.02]">
                {member.initials}
              </div>
            </figure>
            <CardHeader className="pt-4">
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button variant="ghost" size="sm" className="px-0" type="button" disabled>
                Links TBD
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}

export function HomePricing() {
  const plans = [
    {
      name: "Starter (placeholder)",
      price: "$29",
      period: "/month",
      description: "Placeholder tier for solo providers — replace with real limits.",
      features: ["Placeholder feature", "Placeholder feature", "Email support (placeholder)"],
      cta: "Choose plan",
      popular: false,
    },
    {
      name: "Professional (placeholder)",
      price: "$79",
      period: "/month",
      description: "Placeholder for growing clinics — align with your actual SKUs.",
      features: [
        "Placeholder feature",
        "Placeholder feature",
        "Placeholder feature",
        "Priority support (placeholder)",
      ],
      cta: "Choose plan",
      popular: true,
    },
    {
      name: "Enterprise (placeholder)",
      price: "Let’s talk",
      period: "",
      description: "Placeholder for groups, MSOs, or custom integrations.",
      features: ["SSO (placeholder)", "Contracts (placeholder)", "Dedicated success (placeholder)"],
      cta: "Contact sales",
      popular: false,
    },
  ];

  return (
    <SectionContainer id="pricing">
      <SectionHeader
        subTitle="Pricing"
        title="Simple plans to start (placeholder)"
        description="Replace numbers and bullets with finalized packaging. This block mirrors Cosmic’s pricing rhythm without animated counters."
      />
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn("relative h-full overflow-hidden", plan.popular && "border-primary shadow-md")}
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
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period ? (
                    <span className="text-muted-foreground text-sm lowercase">{plan.period}</span>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
                <ul className="my-6 flex-grow space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="text-primary size-4 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.popular ? "default" : "outline"} asChild>
                  <Link href="/join">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

export function HomeCommunity() {
  return (
    <SectionContainer>
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-3 text-center">
              <Heart className="text-primary size-10" aria-hidden />
              <CardTitle className="text-3xl font-bold md:text-4xl">
                Ready to join this{" "}
                <span className="bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent">
                  community?
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground mx-auto max-w-screen-sm space-y-4 text-center text-lg">
            <p>
              Placeholder: describe your community (Discord, Slack, events, or newsletter). Point people where you
              actually engage.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button size="lg" asChild>
              <Link href="/about">Learn more</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </SectionContainer>
  );
}

export function HomeContact() {
  return (
    <SectionContainer id="contact">
      <SectionHeader
        subTitle="Contact"
        title="Get in touch"
        description="Placeholder contact block — update addresses, hours, and the form behavior before launch."
      />
      <section className="mx-auto grid max-w-screen-lg grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="flex flex-col gap-6 *:rounded-lg *:border *:p-6">
            <div className="bg-muted">
              <div className="mb-4 flex items-center gap-3">
                <Building2 className="size-4" />
                <div className="font-bold">Location (placeholder)</div>
              </div>
              <div className="text-muted-foreground">123 Example Ave, Suite 100, Your City, ST 00000</div>
            </div>
            <div className="bg-muted">
              <div className="mb-4 flex items-center gap-3">
                <Phone className="size-4" />
                <div className="font-bold">Phone (placeholder)</div>
              </div>
              <div className="text-muted-foreground">+1 (555) 000-0000</div>
            </div>
            <div className="bg-muted">
              <div className="mb-4 flex items-center gap-3">
                <Mail className="size-4" />
                <div className="font-bold">Email</div>
              </div>
              <div className="text-muted-foreground">hello@movyn.com (replace)</div>
            </div>
            <div className="bg-muted">
              <div className="mb-4 flex items-center gap-3">
                <Clock className="size-4" />
                <div className="font-bold">Hours (placeholder)</div>
              </div>
              <div className="text-muted-foreground">Monday–Friday, 9am–5pm (local time)</div>
            </div>
          </div>
        </div>
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
            <CardDescription>
              Placeholder form — wire to your CRM, help desk, or server action when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:hello@movyn.com?subject=Movyn%20inquiry">Email us instead</a>
            </Button>
            <p className="text-muted-foreground text-sm">
              Or paste a short-term Typeform / Cal.com link here. Full Cosmic-style fields can be added when you add
              `react-hook-form` + validation.
            </p>
          </CardContent>
        </Card>
      </section>
    </SectionContainer>
  );
}

export function HomeFAQ() {
  return (
    <SectionContainer id="faq">
      <SectionHeader subTitle="FAQs" title="Common questions" />
      <div className="mx-auto max-w-xl space-y-3">
        {faqItems.map((item) => (
          <details
            key={item.q}
            className="group rounded-lg border bg-card px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="cursor-pointer list-none text-left text-lg font-medium">
              <span className="flex items-center justify-between gap-2">
                {item.q}
                <span className="text-muted-foreground text-xl transition-transform group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="text-muted-foreground mt-3 text-base leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </SectionContainer>
  );
}
