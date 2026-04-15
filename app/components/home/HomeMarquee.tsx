import type { Chiropractor } from "@/app/lib/queries";
import { DualMarqueeCarousels } from "@/app/components/DualMarqueeCarousels";

/** Cosmic `SponsorsSection` — `section` + `container` + marquee track (no extra headings). */
export function HomeMarquee({ chiropractors }: { chiropractors: Chiropractor[] }) {
  return (
    <section className="pb-12 lg:pb-24">
      <div className="container">
        {chiropractors.length > 0 ? (
          <DualMarqueeCarousels chiropractors={chiropractors} />
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            Practices will appear here as they join the network.
          </p>
        )}
      </div>
    </section>
  );
}
