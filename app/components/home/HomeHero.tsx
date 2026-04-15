import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProximitySearchBar } from "@/app/components/ProximitySearchBar";

/** Large hero visual — swap `src` for your map/search product screenshot when ready. */
const HERO_IMAGE_SRC = "/hero/home-hero-bg.jpg";

export function HomeHero() {
  return (
    <section className="container w-full">
      <div className="mx-auto grid max-w-7xl place-items-center py-16 pb-8 md:py-32 md:pb-14">
        <div className="space-y-8 pb-8 text-center lg:pb-20">
          <Badge variant="outline" className="bg-muted py-2 text-sm">
            Find care that fits
          </Badge>
          <div className="mx-auto max-w-3xl text-center text-4xl font-bold md:text-6xl md:leading-tight">
            <h1>Find a chiropractor who aligns with you.</h1>
          </div>
          <p className="text-muted-foreground mx-auto max-w-xl text-xl">
            Search by location and what matters to you—modalities, philosophy, and how practices
            work with patients. Movyn matches people with practices, not just pins on a map.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 md:flex-row">
            <Button className="h-12 px-10 text-base" asChild>
              <Link href="/signup-patient">
                Patient signup
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="outline" className="h-12 px-10 text-base" asChild>
              <Link href="/join">Join the network</Link>
            </Button>
          </div>
          <div className="text-muted-foreground mt-6 flex flex-col items-center justify-center gap-4 text-sm md:flex-row">
            <div className="flex items-center gap-1">
              <Check className="text-primary size-4" />
              <span>Search by zip and preferences</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="text-primary size-4" />
              <span>Built for patient–practice fit</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="text-primary size-4" />
              <span>Free to search</span>
            </div>
          </div>
          <div className="mx-auto mt-4 max-w-xl">
            <ProximitySearchBar variant="onLight" />
          </div>
        </div>

        <div className="group relative w-full">
          <div className="bg-primary/60 absolute top-2 left-1/2 mx-auto h-24 w-[90%] -translate-x-1/2 transform rounded-full blur-3xl lg:-top-8 lg:h-80" />
          <div className="relative mx-auto w-full leading-none">
            <Image
              width={1240}
              height={800}
              className="relative mx-auto w-full rounded-lg object-cover shadow-lg"
              src={HERO_IMAGE_SRC}
              alt="Movyn — search and discovery for chiropractic care (replace with product screenshot)"
              sizes="(max-width: 1280px) 100vw, 1240px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
