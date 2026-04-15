import Image from "next/image";
import Link from "next/link";
import { CheckIcon, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackgroundBeamsWithCollision } from "@/components/ui/extras/background-beams-with-collision";
import { ProximitySearchBar } from "@/app/components/ProximitySearchBar";

/** Swap this path for your map/search product screenshot when ready. */
const HERO_IMAGE_SRC = "/hero/home-hero-bg.jpg";

/**
 * Cosmic `HeroSection` structure — same DOM/classes as the template, with Movyn copy,
 * ProximitySearchBar after the trust row, and CTAs linking to your signup flows.
 */
export function HomeHero() {
  return (
    <section className="app-container w-full">
      <div className="mx-auto grid max-w-screen-xl place-items-center py-16 pb-8 md:py-32 md:pb-14">
        <BackgroundBeamsWithCollision>
          <div className="relative z-10 w-full space-y-8 pb-8 text-center lg:pb-20">
            <Badge variant="outline" className="bg-muted py-2 text-sm">
              <span className="text-primary mr-2">
                <Badge className="bg-background text-foreground hover:bg-background">New</Badge>
              </span>
              <span>Find care that fits</span>
            </Badge>
            <div className="mx-auto max-w-3xl text-center text-4xl font-bold md:text-6xl">
              <h1>Find a chiropractor who aligns with you.</h1>
            </div>
            <p className="text-muted-foreground mx-auto max-w-md text-xl">
              Search by location and what matters to you—modalities, philosophy, and how practices
              work with patients. Movyn matches people with practices, not just pins on a map.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 md:flex-row">
              <Button className="h-12 px-10 text-base" asChild>
                <Link href="/signup-patient">
                  Patient signup
                  <ChevronRight className="ml-1 inline size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="h-12 px-10 text-base" asChild>
                <Link href="/join">Join the network</Link>
              </Button>
            </div>
            <div className="text-muted-foreground mt-6 flex flex-col items-center justify-center gap-4 text-sm md:flex-row">
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4" />
                <span>Search by zip and preferences</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4" />
                <span>Built for patient–practice fit</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckIcon className="text-primary size-4" />
                <span>Free to search</span>
              </div>
            </div>
            <div className="mx-auto w-full max-w-xl px-1">
              <ProximitySearchBar variant="onLight" />
            </div>
          </div>
        </BackgroundBeamsWithCollision>

        <div className="group relative w-full">
          <div className="bg-primary/60 absolute top-2 left-1/2 mx-auto h-24 w-[90%] -translate-x-1/2 transform rounded-full blur-3xl lg:-top-8 lg:h-80" />
          <Image
            width={1240}
            height={1200}
            className="relative mx-auto flex w-full items-center rounded-lg leading-none"
            src={HERO_IMAGE_SRC}
            alt="Movyn product preview — replace with map search screenshot"
            sizes="(max-width: 1280px) 100vw, 1240px"
            priority
          />
        </div>
      </div>
    </section>
  );
}
