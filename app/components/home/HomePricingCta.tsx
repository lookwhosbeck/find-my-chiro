import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTA_IMAGE = "/hero/home-hero-bg.jpg";

/** Cosmic `PricingCtaSection` layout — static (no motion), Movyn copy and CTA targets. */
export function HomePricingCta() {
  return (
    <div className="pt-10 lg:pt-20">
      <div className="from-muted to-muted/50 relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border bg-gradient-to-br lg:flex-row lg:gap-10">
        <div className="flex max-w-lg flex-col gap-6 py-4 ps-4 pe-4 md:py-10 md:ps-10 md:pe-0">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Ready to list your practice on Movyn?
          </h2>
          <p className="text-muted-foreground md:text-lg">
            Placeholder copy — replace with your conversion story. Point patients to search and
            providers to your join flow.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button variant="outline" asChild>
              <Link href="/search">Browse directory</Link>
            </Button>
            <Button asChild>
              <Link href="/join">
                Join the network
                <ChevronRight className="ml-1 inline size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <figure className="relative h-64 w-full shrink-0 lg:mt-10 lg:h-80 lg:max-w-md">
          <Image
            fill
            className="object-cover lg:rounded-tl-lg"
            src={CTA_IMAGE}
            alt=""
            sizes="(max-width: 1024px) 100vw, 400px"
          />
        </figure>
      </div>
    </div>
  );
}
