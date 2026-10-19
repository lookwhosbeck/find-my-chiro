import type { Chiropractor } from "@/app/lib/queries";
import { DualMarqueeCarousels } from "@/app/components/DualMarqueeCarousels";
import styles from "./home-marketing.module.css";

export function HomeMarquee({ chiropractors }: { chiropractors: Chiropractor[] }) {
  return (
    <section className={styles.marquee}>
      <p className={`${styles.marqueeLabel} app-container`}>
        Independent chiropractors already on Movyn
      </p>
      {chiropractors.length > 0 ? (
        <DualMarqueeCarousels chiropractors={chiropractors} edgeFade />
      ) : (
        <p className="text-muted-foreground app-container text-center text-sm">
          Practices will appear here as they join the network.
        </p>
      )}
    </section>
  );
}
