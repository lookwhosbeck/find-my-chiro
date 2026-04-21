import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Box,
  HeartHandshake,
  Home,
  HelpCircle,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionContainer, SectionHeader } from "@/app/components/home/section-layout";

/* -------------------------------------------------------------------------- */
/*  The Problem — cosmic 2-col layout (text / visual)                         */
/* -------------------------------------------------------------------------- */

const chainNodes = [
  {
    icon: Home,
    title: "Patient in active care",
    body: "Months or years of consistent chiropractic visits",
    broken: false,
  },
  {
    icon: Box,
    title: "Patient relocates",
    body: "New city, new zip code, fresh start",
    broken: false,
  },
  {
    icon: HelpCircle,
    title: "No referral. No network. No connection.",
    body: "Patient drops out of chiropractic care entirely",
    broken: true,
  },
] as const;

export function AboutProblem() {
  return (
    <SectionContainer id="problem" className="bg-muted/40">
      <div className="mx-auto grid max-w-screen-xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="mb-4 bg-gradient-to-b from-primary/60 to-primary bg-clip-text font-semibold tracking-wider text-transparent uppercase">
            The Problem
          </div>
          <h2 className="mb-4 text-2xl font-bold text-balance sm:text-3xl md:text-4xl">
            A patient&apos;s care shouldn&apos;t end at a zip code.
          </h2>
          <div className="text-muted-foreground space-y-4 text-base text-pretty sm:text-lg">
            <p>
              Chiropractic care is relationship-based. Patients who&apos;ve been under care for
              months or years have found something that works — a technique, a philosophy, a
              level of trust. When they move, that relationship breaks. Most never find a
              replacement. They simply fall out of care.
            </p>
            <p>That&apos;s not just a loss for the patient. It&apos;s a loss for the profession.</p>
          </div>
        </div>

        <div className="relative">
          <ol className="space-y-0">
            {chainNodes.map((node, index) => {
              const Icon = node.icon;
              const isLast = index === chainNodes.length - 1;
              return (
                <li key={node.title}>
                  <div
                    className={
                      node.broken
                        ? "bg-background/40 flex items-start gap-4 rounded-xl border-2 border-dashed p-5 opacity-70"
                        : "bg-background flex items-start gap-4 rounded-xl border p-5 shadow-sm"
                    }
                  >
                    <div className="bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{node.title}</p>
                      <p className="text-muted-foreground text-sm">{node.body}</p>
                    </div>
                  </div>

                  {!isLast ? (
                    node.title === "Patient relocates" ? (
                      <div className="flex items-center gap-3 py-3 pl-5">
                        <span className="bg-destructive/40 h-px flex-1" />
                        <span className="text-destructive text-xs font-bold tracking-widest uppercase">
                          Care interruption
                        </span>
                        <span className="bg-destructive/40 h-px flex-1" />
                      </div>
                    ) : (
                      <div className="ml-10 h-6 w-0.5 bg-primary/70" aria-hidden />
                    )
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </SectionContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stats banner — full-bleed primary-accent strip                            */
/* -------------------------------------------------------------------------- */

const bigStats = [
  {
    num: "~5.6M",
    label: "Estimated chiropractic patients who move each year in the US",
  },
  {
    num: "13%",
    label: "Current chiropractic utilization in the United States",
  },
  {
    num: "16%",
    label: "Target utilization to achieve mainstream adoption",
  },
  {
    num: "3pts",
    label: "The gap Movyn is helping close",
  },
] as const;

export function AboutStatsBanner() {
  return (
    <section className="bg-primary text-primary-foreground py-12 sm:py-16">
      <div className="app-container">
        <dl className="mx-auto grid max-w-screen-xl grid-cols-2 gap-y-10 text-center lg:grid-cols-4">
          {bigStats.map((stat, index) => (
            <div
              key={stat.num}
              className={
                index > 0 && index % 2 !== 0
                  ? "border-primary-foreground/20 border-l px-4"
                  : index > 0
                    ? "border-primary-foreground/20 px-4 lg:border-l"
                    : "px-4"
              }
            >
              <dt className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                {stat.num}
              </dt>
              <dd className="text-primary-foreground/80 mx-auto mt-2 max-w-[14rem] text-sm leading-snug font-medium sm:text-base">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mission — cosmic 2-col with text + 4-card grid                            */
/* -------------------------------------------------------------------------- */

const missionCards = [
  {
    icon: MapPin,
    title: "Relocation Referrals",
    body: "Connect patients who move to a compatible provider in their new city — fast.",
  },
  {
    icon: Baby,
    title: "Specialty Matching",
    body: "Pediatrics, prenatal, geriatrics, rehab — refer within your community confidently.",
  },
  {
    icon: HeartHandshake,
    title: "Philosophy Alignment",
    body: "Match by technique and care model so patients land somewhere they'll stay.",
  },
  {
    icon: TrendingUp,
    title: "Profession Growth",
    body: "Every retained patient is a step toward mainstream chiropractic utilization.",
  },
] as const;

export function AboutMission() {
  return (
    <SectionContainer id="mission">
      <div className="mx-auto grid max-w-screen-xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <div className="mb-4 bg-gradient-to-b from-primary/60 to-primary bg-clip-text font-semibold tracking-wider text-transparent uppercase">
            Our Mission
          </div>
          <h2 className="mb-4 text-2xl font-bold text-balance sm:text-3xl md:text-4xl">
            Building the connective tissue of the chiropractic profession.
          </h2>
          <p className="text-muted-foreground text-base text-pretty sm:text-lg">
            Movyn exists to close the referral gap — not just for relocating patients, but for
            every moment a provider needs to send a patient to someone they can trust. We match
            on what actually matters: technique, philosophy, patient demographics, and
            specialty.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {missionCards.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="bg-muted/60 hover:bg-primary/5 hover:border-primary/30 transition-colors"
            >
              <CardHeader>
                <div className="bg-primary/15 text-primary ring-primary/10 mb-3 flex size-10 items-center justify-center rounded-full ring-8">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">{body}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works — cosmic 3-step grid                                         */
/* -------------------------------------------------------------------------- */

const howSteps = [
  {
    title: "Create your provider profile",
    body: "List your technique, adjusting style, specialties, and the type of patients you serve best. Your profile is your referral identity.",
  },
  {
    title: "Search or submit a referral",
    body: "When a patient moves or needs a specialty outside your scope, search the Movyn network by location, philosophy, or patient fit.",
  },
  {
    title: "Connect and keep care going",
    body: "Send the referral directly through the platform. The receiving provider gets context. The patient gets continuity.",
  },
] as const;

export function AboutHowItWorks() {
  return (
    <SectionContainer id="how-it-works">
      <SectionHeader
        subTitle="How It Works"
        title="Simple for providers. Seamless for patients."
        description="Movyn is built by chiropractors, for chiropractors. It respects how you practice and makes the referral process as natural as a conversation."
      />
      <div className="relative mx-auto grid max-w-screen-lg gap-6 md:grid-cols-3">
        <div
          aria-hidden
          className="via-primary/40 pointer-events-none absolute top-[3.75rem] left-[16.66%] right-[16.66%] hidden h-px bg-gradient-to-r from-primary/60 via-primary/40 to-primary/10 md:block"
        />
        {howSteps.map((step, index) => (
          <Card
            key={step.title}
            className="relative text-center transition-transform hover:-translate-y-1 hover:shadow-lg"
          >
            <CardHeader className="items-center">
              <div className="bg-primary text-primary-foreground relative z-[1] mx-auto mb-2 flex size-12 items-center justify-center rounded-full text-base font-bold ring-8 ring-background">
                {index + 1}
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">{step.body}</CardContent>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Values — 3x2 grid of principle cards                                      */
/* -------------------------------------------------------------------------- */

const values = [
  {
    title: "Continuity of care is a right",
    body: "A patient who has invested in their health shouldn't have to start over from scratch just because they moved across state lines.",
  },
  {
    title: "Providers know best",
    body: "No algorithm replaces clinical judgment. Movyn empowers the referring doctor — it doesn't replace them.",
  },
  {
    title: "A rising tide lifts all practices",
    body: "Every retained chiropractic patient strengthens the profession's case for mainstream adoption and utilization.",
  },
  {
    title: "Technique diversity is a strength",
    body: "From diversified to Gonstead, Webster to SOT — Movyn is philosophy-neutral and built to serve the whole profession.",
  },
  {
    title: "The referral is an act of trust",
    body: "When you refer a patient, you're putting your name on it. We make sure the match is worthy of that trust.",
  },
  {
    title: "Data tells a bigger story",
    body: "Tracking retained patients across state lines gives the profession real numbers to prove chiropractic's impact at scale.",
  },
] as const;

export function AboutValues() {
  return (
    <SectionContainer id="values" className="bg-muted/40">
      <SectionHeader
        subTitle="What We Believe"
        title="Principles we build on."
      />
      <div className="mx-auto grid max-w-screen-xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((v) => (
          <Card
            key={v.title}
            className="bg-background border-t-primary rounded-2xl border-t-[3px]"
          >
            <CardHeader>
              <CardTitle className="text-base">{v.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">{v.body}</CardContent>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*  CTA — cosmic centered community-style card                                */
/* -------------------------------------------------------------------------- */

export function AboutCta() {
  return (
    <SectionContainer id="about-cta">
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-balance sm:text-3xl md:text-4xl">
              Ready to keep your patients{" "}
              <span className="bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent">
                moving?
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground mx-auto max-w-screen-sm space-y-4 text-center text-base text-pretty sm:text-lg md:text-xl">
            <p>
              Join a growing network of chiropractors committed to keeping patients under care —
              wherever life takes them.
            </p>
          </CardContent>
          <CardFooter className="flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild>
              <Link href="/join">
                Join the Movyn network
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup-patient">I&apos;m looking for care</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </SectionContainer>
  );
}
