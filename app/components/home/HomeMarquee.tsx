import type { Chiropractor } from "@/app/lib/queries";
import { DualMarqueeCarousels } from "@/app/components/DualMarqueeCarousels";
import { SectionHeader } from "@/app/components/home/section-layout";

export function HomeMarquee({ chiropractors }: { chiropractors: Chiropractor[] }) {
  return (
    <section className="pb-12 lg:pb-24">
      <div className="container mb-10 text-center lg:mb-12">
        <SectionHeader
          subTitle="Community"
          title="Practices on Movyn"
          description="Placeholder headline — swap for social proof or logos when you have it."
        />
      </div>
      {chiropractors.length > 0 ? (
        <DualMarqueeCarousels chiropractors={chiropractors} />
      ) : (
        <p className="text-muted-foreground container text-center">
          No listings yet — be the first practice to appear here.
        </p>
      )}
    </section>
  );
}
