import Image from "next/image";
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
    title: "Matching, not just mapping",
    description:
      "We weigh technique, treatment philosophy, focus areas, and how a practice runs—then surface chiropractors who actually fit, instead of ranking by distance alone.",
  },
  {
    icon: LineChart,
    title: "Know what to expect before you book",
    description:
      "Cash, insurance, sliding scale, visit length, follow-up cadence—every profile spells it out up front, so you walk in with no surprises and the right questions.",
  },
  {
    icon: Wallet,
    title: "Less wasted time on both sides",
    description:
      "Patients stop calling around. Chiropractors stop fielding inquiries that were never going to be a fit. Everyone gets to the right conversation faster.",
  },
  {
    icon: Sparkles,
    title: "A profile that actually represents you",
    description:
      "For practices: tell the story behind your care—your philosophy, your team, your room, your rates—in a profile patients read before they reach out.",
  },
] as const;

const serviceList = [
  {
    title: "For patients — Smart search",
    description:
      "Search by ZIP and the things that actually matter: technique, philosophy, payment model, focus areas, even preferred days and times. Save your preferences once and your matches keep getting sharper.",
    pro: false,
  },
  {
    title: "For practices — Living profiles",
    description:
      "Show how you really practice. Bio, modalities, focus areas, rates, payment models, and accepting-new-patients status all surface as match signals—so the people who reach out are the people you want to treat.",
    pro: true,
  },
  {
    title: "Referrals between providers",
    description:
      "Refer patients to a colleague who's a better fit for what they need, in a network of vetted chiropractors. Built in collaboration with the providers who use it.",
    pro: true,
  },
  {
    title: "Trust & verification",
    description:
      "Every chiropractor on Movyn has their license verified before their profile goes live. Patient privacy is protected by default—no selling data, no aggressive remarketing.",
    pro: false,
  },
] as const;

const featureList = [
  {
    icon: Tablet,
    title: "Search built for chiropractic, not generic health",
    description:
      "Filter by adjustment style, soft-tissue work, instrument-assisted technique, decompression, prenatal, pediatric—the choices patients actually weigh before they book.",
  },
  {
    icon: BadgeCheck,
    title: "Verified, licensed providers only",
    description:
      "Every chiropractor on Movyn has had their state license verified. Education, graduation year, and credentials are visible on every profile.",
  },
  {
    icon: Target,
    title: "Fit-first match scoring",
    description:
      "When you set your preferences, Movyn ranks practices by how well they line up with what you want—not by who paid the most for placement.",
  },
  {
    icon: PictureInPicture,
    title: "Profiles that read like a real practice",
    description:
      "A bio in the chiropractor's own words, the room they treat in, their team, their approach. Enough to know if it feels right before you pick up the phone.",
  },
  {
    icon: MousePointerClick,
    title: "One step to make contact",
    description:
      "Visit the practice's website, call the office, or send a direct request through Movyn—whichever the chiropractor prefers. No middleman, no playing phone tag.",
  },
  {
    icon: Lock,
    title: "Privacy-minded by default",
    description:
      "We don't sell your data, and we don't share your search activity with practices. Your information is used to find you better matches—nothing else.",
  },
] as const;

const testimonials = [
  {
    quote:
      "I don't want anyone who'll just crack my back. I wanted someone who does soft-tissue work and explains what they're doing. Movyn was the first place that let me filter for that.",
    name: "What patients tell us",
    role: "Patient research",
  },
  {
    quote:
      "Most directory leads were the wrong fit—people calling about insurance I don't take, or expecting a model of care I don't practice. The patients reaching out through Movyn already know what I do.",
    name: "What chiropractors tell us",
    role: "Provider research",
  },
  {
    quote:
      "We finally have a way to send a patient to a colleague we trust, knowing they'll get exactly the care that's right for them.",
    name: "What network providers tell us",
    role: "Referral partner research",
  },
] as const;

const founders = [
  {
    name: "Dr. Lance Gard",
    role: "Co-founder",
    bio: "Practicing chiropractor shaping how Movyn represents real-world care—so patients find the right fit on the first visit, not the fifth.",
  },
  {
    name: "Dr. Stephen Kosterman",
    role: "Co-founder",
    bio: "Brings the provider's perspective to every feature, making sure Movyn works for the way chiropractors actually run their practices.",
  },
  {
    name: "Nick Becker",
    role: "Co-founder",
    bio: "Leads product and design, turning conversations with patients and providers into the Movyn experience you see today.",
  },
] as const;

const faqItems = [
  {
    q: "Is Movyn free for patients?",
    a: "Yes. Searching, filtering, saving preferences, and contacting a chiropractor on Movyn is free. We make money from practice memberships, not from patients.",
  },
  {
    q: "How is Movyn different from a regular directory?",
    a: "Most directories rank by distance or who pays for ads. Movyn matches on the things that actually shape your care—technique, philosophy, payment model, focus areas, and visit style—so the chiropractor you find is one who's a real fit, not just the closest one.",
  },
  {
    q: "Are the chiropractors on Movyn vetted?",
    a: "Yes. Every chiropractor goes through license verification before their profile is visible to patients. You'll see their state license, school, graduation year, and credentials on every profile.",
  },
  {
    q: "Does Movyn give medical advice or book appointments for me?",
    a: "No. Movyn helps you find the right chiropractor; care decisions and scheduling stay between you and the practice. We hand you off directly—through their booking link, phone number, or website—so there's no middleman.",
  },
  {
    q: "How do you handle my data?",
    a: "We use your information to surface better matches and to let you reach out to a practice—nothing else. We don't sell your data, and we don't share your search activity with chiropractors you haven't contacted.",
  },
  {
    q: "I'm a chiropractor—how do I list my practice?",
    a: "Create a free account, add your practice details, and submit your license for verification. Once you're approved, you can publish your profile and start receiving fit-matched patient inquiries.",
  },
  {
    q: "How much does it cost to be on Movyn?",
    a: "A verified profile is free—there's no monthly cost. Premium is $30/month (or 20% off when billed annually) and unlocks unlimited modalities, priority placement, direct messages, and provider referrals. Every plan includes a one-time $50 license verification fee, which is waived for our first 250 founding members.",
  },
] as const;

export function HomeBenefits() {
  return (
    <SectionContainer id="benefits">
      <div className="grid lg:grid-cols-2 lg:gap-24">
        <div>
          <SectionHeader
            className="sticky max-w-full text-center lg:top-[22rem] lg:text-start"
            subTitle="Why Movyn"
            title="Generic directories weren't built for chiropractic care."
            description="Patients waste hours calling around to find someone who actually does what they need. Chiropractors waste hours on inquiries that were never going to be a fit. Movyn fixes both sides of that problem."
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
        title="Everything you need to find—or be found by—the right person."
        description="A search engine, profile system, and trust layer designed specifically for chiropractic care."
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
        subTitle="What's on Movyn"
        title="Built for both sides of the appointment."
        description="Patients get a smarter way to search. Chiropractors get a profile, a referral network, and verified trust signals that turn the right kind of attention into the right kind of patient."
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
        subTitle="What we hear"
        title="The frustration we kept hearing on both sides."
        description="Quotes drawn from patient and provider conversations during Movyn's build. Real customer stories will replace these as the network grows."
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
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <figure className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Image
            src="/homepage/founders-photo.jpg"
            alt="Movyn founders Dr. Lance Gard, Dr. Stephen Kosterman, and Nick Becker"
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
            priority={false}
          />
        </figure>

        <div className="flex w-full flex-col justify-center">
          <div className="max-w-lg">
            <Badge variant="outline" className="text-muted-foreground mb-3">
              Meet the founders
            </Badge>

            <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:mb-6">
              Built by chiropractors and patients who wanted better.
            </h2>

            <p className="text-muted-foreground mb-8 lg:mb-10">
              Movyn is shaped by ongoing conversations with the providers and patients it serves.
              Here&apos;s the team making sure the product keeps reflecting how chiropractic care
              actually works.
            </p>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:gap-y-8">
              {founders.map((person) => (
                <div key={person.name}>
                  <h6 className="font-semibold">{person.name}</h6>
                  <p className="text-primary mb-2 text-sm font-medium">{person.role}</p>
                  <p className="text-muted-foreground text-sm">{person.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                Better-fit chiropractic care starts with the{" "}
                <span className="bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent">
                  right network.
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground mx-auto max-w-screen-sm space-y-4 text-center text-xl">
            <p>
              Movyn is built with—and for—the chiropractors and patients who use it. Join the
              network and help shape what better-fit care looks like.
            </p>
          </CardContent>
          <CardFooter className="flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup-patient">I&apos;m looking for care</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/join">I&apos;m a chiropractor</Link>
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
      <SectionHeader
        subTitle="FAQs"
        title="Questions we get a lot"
        description="If you don't see what you're looking for, drop us a note below."
      />
      <div className="mx-auto max-w-2xl space-y-3">
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
