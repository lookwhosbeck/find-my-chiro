import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FOUNDING_COUPON_CODE,
  FOUNDING_MEMBERS_CAP,
  LICENSE_VERIFICATION_FEE_USD,
} from "@/lib/founding-promo";

const CTA_IMAGE = "/hero/home-hero-bg.jpg";

/** Cosmic `PricingCtaSection` layout — static (no motion), Movyn copy and CTA targets. */
export function HomePricingCta() {
  return (
    <div className="pt-10 lg:pt-20">
      <div className="from-muted to-muted/50 relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border bg-gradient-to-br lg:flex-row lg:gap-10">
        <div className="flex max-w-lg flex-col gap-5 p-6 sm:gap-6 sm:p-8 md:p-10 lg:pe-0">
          <h2 className="text-xl font-bold tracking-tight text-balance sm:text-2xl md:text-3xl">
            Get the right patients reaching out for the right reasons.
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            Build a profile that explains how you actually practice—then let Movyn match you with
            patients who are looking for exactly that. Setup takes about ten minutes, and listing is
            free.
          </p>
          <p className="rounded-lg border border-[#0190ff]/35 bg-[#e6f6ff] px-4 py-3 text-sm leading-snug text-[#0c4a6e] dark:border-blue-500/40 dark:bg-blue-950/85 dark:text-blue-50">
            <span className="font-semibold">Use coupon code {FOUNDING_COUPON_CODE} at sign up</span> for free
            license verification — limited to the first {FOUNDING_MEMBERS_CAP} chiropractors (${LICENSE_VERIFICATION_FEE_USD}{" "}
            value).
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/search">Browse the directory</Link>
            </Button>
            <Button className="w-full sm:w-auto" asChild>
              <Link href="/signup">
                Sign up — list your practice
                <ChevronRight className="ml-1 inline size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <figure className="relative h-56 w-full shrink-0 sm:h-64 lg:mt-10 lg:h-80 lg:max-w-md">
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
