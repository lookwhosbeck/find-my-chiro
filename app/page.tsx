import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MarketingShell } from "./components/MarketingShell";
import { ProximitySearchBar } from "./components/ProximitySearchBar";
import { FeatureCard } from "./components/FeatureCard";
import {
  FeatureIconMatching,
  FeatureIconFriction,
  FeatureIconCulture,
} from "./components/FeatureIcons";
import { DualMarqueeCarousels } from "./components/DualMarqueeCarousels";
import { getChiropractors } from "./lib/queries";
import styles from "./page.module.css";

function ArrowUpRight() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M1 11L11 1M11 1H1M11 1V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function Home() {
  const chiropractors = await getChiropractors(14);

  return (
    <MarketingShell>
      <Header />
      <div className={styles.page}>
        <main className="flex min-h-0 flex-1 flex-col">
          {/* Hero — Cosmic-style centered stack + Movyn search + photo panel */}
          <section className="container w-full pb-6 pt-3 sm:pb-8 sm:pt-4">
            <div className={styles.heroPanel}>
              <div className={styles.heroPanelStack} aria-hidden="true">
                <div className={styles.heroPanelSolid} />
                <div className={styles.heroPanelPhoto}>
                  <Image
                    src="/hero/home-hero-bg.jpg"
                    alt=""
                    fill
                    className={styles.heroPanelPhotoImg}
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    priority
                  />
                </div>
              </div>
              <div className={styles.heroPanelForeground}>
                <div className={styles.heroContent}>
                  <div className="space-y-6 text-center">
                    <Badge
                      variant="outline"
                      className="border-white/30 bg-white/5 text-white/90 hover:bg-white/10"
                    >
                      Find care that fits
                    </Badge>
                    <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl md:leading-[1.08]">
                      Find a chiropractor who
                      <br />
                      aligns with you.
                    </h1>
                    <p className="mx-auto max-w-xl text-base text-primary-foreground/85 md:text-lg">
                      Search by location and what matters to you—modalities, philosophy, and how
                      practices work with patients.
                    </p>
                  </div>
                  <ProximitySearchBar variant="onDark" />
                  <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full border-0 bg-white px-8 text-[hsl(var(--marketing-hero-surface))] hover:bg-white/90"
                    >
                      <Link href="/signup-patient" className="inline-flex items-center gap-2">
                        Patient signup
                        <ArrowUpRight />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      <Link href="/join" className="inline-flex items-center gap-2">
                        Chiropractor signup
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Marquee */}
          <section className="pb-20 sm:pb-32">
            <div className="container mb-10 text-center sm:mb-12">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Join top chiropractors like…
              </h2>
            </div>
            {chiropractors.length > 0 ? (
              <DualMarqueeCarousels chiropractors={chiropractors} />
            ) : (
              <p className="text-muted-foreground container text-center text-base">
                No chiropractors found. Be the first to join!
              </p>
            )}
          </section>

          {/* Features */}
          <section className="container scroll-mt-20 pb-20 sm:pb-32">
            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Why join <span className="font-serif italic font-normal">another</span> network?
              </h2>
            </div>
            <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="pb-6 pt-8">
                  <FeatureCard
                    icon={<FeatureIconMatching />}
                    title="The Matching Engine"
                    description="We don't just list you; we match you based on Modalities (Gonstead, TRT) and Philosophies (Vitalistic, Evidence-Based)."
                  />
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="pb-6 pt-8">
                  <FeatureCard
                    icon={<FeatureIconFriction />}
                    title="Reduce Friction"
                    description="Patients filter by Insurance/Cash right away, so you only get calls from people who know your business model."
                  />
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm sm:col-span-2 lg:col-span-1">
                <CardContent className="pb-6 pt-8">
                  <FeatureCard
                    icon={<FeatureIconCulture />}
                    title="Show Your Culture"
                    description="Showcase your clinic vibe, not just your address, because good patient fit isn’t only about proximity."
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </MarketingShell>
  );
}
