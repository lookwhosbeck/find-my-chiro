import type { ReactNode } from "react";
import Link from "next/link";
import { CheckIcon, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProximitySearchBar } from "@/app/components/ProximitySearchBar";

interface HomeHeroProps {
  /** Map preview (typically a Suspense-wrapped async server subtree + dynamic map client). */
  mapPreview: ReactNode;
}

/**
 * Cosmic `HeroSection` structure — same DOM/classes as the template, with Movyn copy,
 * ProximitySearchBar after the trust row, and CTAs linking to your signup flows.
 */
export function HomeHero({ mapPreview }: HomeHeroProps) {
  return (
    <section className="app-container w-full">
      <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 place-items-center py-12 pb-8 sm:py-16 md:py-32 md:pb-14">
        <div className="relative flex w-full min-w-0 items-center justify-center">
          <div className="relative z-10 w-full min-w-0 space-y-6 pb-8 text-center sm:space-y-8 lg:pb-20">
            <Badge
              variant="outline"
              className="bg-muted mx-auto max-w-full whitespace-normal px-3 py-2 text-center text-xs leading-tight sm:text-sm"
            >
              <span className="text-primary mr-2">
                <Badge className="bg-background text-foreground hover:bg-background">New</Badge>
              </span>
              <span>The chiropractor finder built around fit</span>
            </Badge>
            <div className="mx-auto max-w-3xl text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
              <h1 className="text-balance">Find a chiropractor that fits.</h1>
            </div>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base text-pretty sm:text-lg md:text-xl">
              Most directories show you whoever is closest. Movyn matches you on the things that actually shape your experience. Treatment style, payment model, and more because we know a good fit is more than just proximity.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Button className="h-12 w-full px-6 text-base sm:w-auto sm:px-10" asChild>
                <Link href="/signup-patient">
                  Find my chiropractor
                  <ChevronRight className="ml-1 inline size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full px-6 text-base sm:w-auto sm:px-10"
                asChild
              >
                <Link href="/join">List your practice</Link>
              </Button>
            </div>
            <div className="text-muted-foreground mt-6 flex flex-col items-center justify-center gap-3 text-sm sm:gap-4 md:flex-row">
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4 shrink-0" />
                <span>Free for patients to search</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4 shrink-0" />
                <span>Filter by technique &amp; philosophy</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4 shrink-0" />
                <span>No insurance hoops to start</span>
              </div>
            </div>
            <div className="mx-auto w-full max-w-xl px-1">
              <ProximitySearchBar variant="onLight" />
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full min-w-0">{mapPreview}</div>
      </div>
    </section>
  );
}
