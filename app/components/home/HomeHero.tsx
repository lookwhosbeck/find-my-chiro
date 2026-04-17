import Link from "next/link";
import { CheckIcon, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProximitySearchBar } from "@/app/components/ProximitySearchBar";
import type { Chiropractor } from "@/app/lib/queries";
import { HomeMapPreview } from "./HomeMapPreview";

interface HomeHeroProps {
  /** Pre-fetched directory used to render the live browse-mode map below the hero copy. */
  mapChiropractors: Chiropractor[];
}

/**
 * Cosmic `HeroSection` structure — same DOM/classes as the template, with Movyn copy,
 * ProximitySearchBar after the trust row, and CTAs linking to your signup flows.
 */
export function HomeHero({ mapChiropractors }: HomeHeroProps) {
  return (
    <section className="app-container w-full">
      <div className="mx-auto grid max-w-screen-xl place-items-center py-16 pb-8 md:py-32 md:pb-14">
        <div className="relative flex w-full items-center justify-center">
          <div className="relative z-10 w-full space-y-8 pb-8 text-center lg:pb-20">
            <Badge variant="outline" className="bg-muted py-2 text-sm">
              <span className="text-primary mr-2">
                <Badge className="bg-background text-foreground hover:bg-background">New</Badge>
              </span>
              <span>The chiropractor finder built around fit</span>
            </Badge>
            <div className="mx-auto max-w-3xl text-center text-4xl font-bold md:text-6xl">
              <h1>Find a chiropractor that fits.</h1>
            </div>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Most directories show you whoever is closest. Movyn matches you on the things that actually shape your experience. Treatment style, payment model, and more because we know a good fit is more than just proximity.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 md:flex-row">
              <Button className="h-12 px-10 text-base" asChild>
                <Link href="/signup-patient">
                  Find my chiropractor
                  <ChevronRight className="ml-1 inline size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="h-12 px-10 text-base" asChild>
                <Link href="/join">List your practice</Link>
              </Button>
            </div>
            <div className="text-muted-foreground mt-6 flex flex-col items-center justify-center gap-4 text-sm md:flex-row">
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4" />
                <span>Free for patients to search</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4" />
                <span>Filter by technique &amp; philosophy</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4" />
                <span>No insurance hoops to start</span>
              </div>
            </div>
            <div className="mx-auto w-full max-w-xl px-1">
              <ProximitySearchBar variant="onLight" />
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full">
          <HomeMapPreview chiropractors={mapChiropractors} />
        </div>
      </div>
    </section>
  );
}
