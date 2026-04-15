import Link from "next/link";
import {
  BadgeCheck,
  Blocks,
  Heart,
  LineChart,
  Lock,
  MousePointerClick,
  PictureInPicture,
  Sparkles,
  Star,
  Tablet,
  Target,
  Wallet,
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
import { SectionContainer, SectionHeader } from "@/app/components/home/section-layout";
import { cn } from "@/lib/utils";

const benefitList = [
  {
    icon: Blocks,
    title: "Matching beyond the map",
    description:
      "Placeholder — explain how Movyn weighs modalities, philosophy, and logistics so patients and practices actually fit.",
  },
  {
    icon: LineChart,
    title: "Clearer expectations upfront",
    description:
      "Placeholder — cash vs insurance, visit style, and focus areas surface before the first call.",
  },
  {
    icon: Wallet,
    title: "Less wasted time for everyone",
    description:
      "Placeholder — fewer mismatched inquiries because filters reflect how you really practice.",
  },
  {
    icon: Sparkles,
    title: "Room to grow your presence",
    description:
      "Placeholder — profiles, storytelling, and discovery features you can expand as you ship.",
  },
] as const;

const serviceList = [
  {
    title: "Patient search",
    description:
      "Placeholder — zip-first discovery, preference filters, and saved context for returning visitors.",
    pro: false,
  },
  {
    title: "Practice profiles",
    description:
      "Placeholder — rich listings, match signals, and calls-to-action tuned for chiropractors.",
    pro: true,
  },
  {
    title: "Network programs",
    description:
      "Placeholder — employer, referral, or partner bundles when you are ready to describe them.",
    pro: false,
  },
  {
    title: "Trust & safety",
    description:
      "Placeholder — verification, reporting, and privacy commitments (run past counsel).",
    pro: false,
  },
] as const;

const featureList = [
  {
    icon: Tablet,
    title: "Search tuned for chiropractic care",
    description:
      "Placeholder — describe how filters reflect real-world choices patients make before booking.",
  },
  {
    icon: BadgeCheck,
    title: "Signals that build confidence",
    description:
      "Placeholder — education, licensure, modalities, and philosophy cues you want highlighted.",
  },
  {
    icon: Target,
    title: "Fit-first discovery",
    description:
      "Placeholder — explain match scoring or ranking in plain language once the product is final.",
  },
  {
    icon: PictureInPicture,
    title: "Profiles that feel human",
    description:
      "Placeholder — photos, voice, and clinic culture so listings feel like more than a pin.",
  },
  {
    icon: MousePointerClick,
    title: "Clear next steps",
    description:
      "Placeholder — booking, call, or website handoffs that you control per practice.",
  },
  {
    icon: Lock,
    title: "Privacy-minded by design",
    description:
      "Placeholder — how you minimize data collection and protect accounts (legal review required).",
  },
] as const;

const testimonials = [
  {
    quote:
      "Placeholder — swap for a patient story about finding someone who matched their preferences, not just distance.",
    name: "Alex P.",
    role: "Patient",
  },
  {
    quote:
      "Placeholder — swap for a DC quote on lead quality or fewer mismatched calls after joining Movyn.",
    name: "Dr. Jordan Lee",
    role: "Chiropractor",
  },
  {
    quote:
      "Placeholder — swap for staff or office-manager perspective if that supports your narrative.",
    name: "Sam Rivera",
    role: "Clinic team",
  },
] as const;

const teamPlaceholders = [
  { initials: "NB", name: "Name", role: "Title (placeholder)" },
  { initials: "TM", name: "Name", role: "Title (placeholder)" },
  { initials: "CK", name: "Name", role: "Title (placeholder)" },
  { initials: "DL", name: "Name", role: "Title (placeholder)" },
] as const;

const faqItems = [
  {
    q: "Is Movyn medical advice?",
    a: "No. Movyn helps you discover professionals; care decisions stay between you and your provider. Replace with counsel-approved language.",
  },
  {
    q: "What does it cost to search?",
    a: "Placeholder — state your patient pricing story. Practices: point to your join page or pricing section.",
  },
  {
    q: "How do you use my data?",
    a: "Placeholder — summarize retention, sharing, and rights. Link to /privacy when it is finalized.",
  },
  {
    q: "Can practices list multiple locations?",
    a: "Placeholder — describe org accounts or multi-location support the way you plan to ship it.",
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
            title="Why Movyn exists"
            description="Placeholder — replace with the outcomes you deliver for patients who feel lost in generic directories and for practices tired of poor-fit leads."
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
        title="Everything patients and practices need to connect"
        description="Placeholder — swap for your platform story. Layout mirrors Cosmic’s feature grid (icon ring + copy)."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureList.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="relative flex items-start gap-6 overflow-hidden rounded-lg border p-6"
            >
              <div className="min-w-0 flex-1 space-y-4">
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <p className="text-muted-foreground font-normal">{card.description}</p>
              </div>
              <div className="bg-primary/20 ring-primary/10 shrink-0 rounded-full p-2 ring-8">
                <Icon className="text-primary size-6" />
              </div>
            </div>
          );
        })}
      </div>
    </SectionContainer>
  );
}

export function HomeServices() {
  return (
    <SectionContainer id="solutions">
      <SectionHeader
        subTitle="Services"
        title="Grow with Movyn"
        description="Placeholder — map these cards to real offerings: discovery, listings, partnerships, and compliance."
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
            <Badge
              data-pro={pro}
              variant="secondary"
              className="absolute -top-2 -right-3 data-[pro=false]:hidden"
            >
              PRO
            </Badge>
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
        title="Loved by people finding the right fit"
        description="Placeholder — swap for real quotes when you have them. Static grid matches Cosmic card styling (no carousel dependency)."
      />
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((review) => (
          <Card key={review.name} className="bg-muted">
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p>{review.quote}</p>
              <div className="flex flex-col space-y-1">
                <CardTitle>{review.name}</CardTitle>
                <CardDescription>{review.role}</CardDescription>
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
      <SectionHeader subTitle="Team" title="People behind Movyn" />
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teamPlaceholders.map((member) => (
          <Card
            key={member.initials}
            className="bg-muted group/hoverimg flex h-full flex-col overflow-hidden pt-0"
          >
            <figure className="overflow-hidden">
              <div className="bg-muted-foreground/15 text-muted-foreground flex aspect-square w-full items-center justify-center text-3xl font-bold transition-all duration-200 ease-linear group-hover/hoverimg:scale-[1.05]">
                {member.initials}
              </div>
            </figure>
            <CardHeader className="pt-0">
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto space-x-4">
              <Button variant="ghost" size="sm" className="px-0" type="button" disabled>
                Social links TBD
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}

export function HomeCommunity() {
  return (
    <SectionContainer>
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-3 text-center">
              <Heart className="text-primary size-10" aria-hidden />
              <CardTitle className="text-center text-3xl font-bold md:text-4xl">
                Ready to join this{" "}
                <span className="bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent">
                  community?
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground mx-auto max-w-screen-sm space-y-4 text-center text-xl">
            <p>
              Placeholder — invite people to your real community touchpoint (Discord, Slack, events, or a simple
              mailing list).
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

export function HomeFAQ() {
  return (
    <SectionContainer id="faq">
      <SectionHeader subTitle="FAQs" title="Common questions" />
      <div className="mx-auto max-w-sm space-y-3">
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
