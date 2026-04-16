import type { Metadata } from "next";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MarketingShell } from "./components/MarketingShell";
import { HomeHero } from "./components/home/HomeHero";
import { HomeMarquee } from "./components/home/HomeMarquee";
import {
  HomeBenefits,
  HomeCommunity,
  HomeFAQ,
  HomeFeatures,
  HomeServices,
  HomeTeam,
  HomeTestimonials,
} from "./components/home/home-marketing-sections";
import { HomeContact } from "./components/home/HomeContact";
import { HomePricing } from "./components/home/HomePricing";
import { HomeNewsletter } from "./components/home/HomeNewsletter";
import { getChiropractors } from "./lib/queries";

export const metadata: Metadata = {
  title: "Movyn — Find a chiropractor who actually fits you",
  description:
    "Movyn matches you with verified chiropractors based on technique, philosophy, payment model, and focus areas—not just distance. Free for patients to search.",
};

export default async function Home() {
  // One bigger fetch powers both the marquee (14 most recent) and the live browse-mode map preview below the hero.
  const directory = await getChiropractors(2000);
  const marqueeChiropractors = directory.slice(0, 14);

  return (
    <MarketingShell>
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        {/* Cosmic order: Hero → Sponsors → Benefits → Features → Services → Testimonials → Team → Pricing → Community → Contact → FAQ → Newsletter */}
        <HomeHero mapChiropractors={directory} />
        <HomeMarquee chiropractors={marqueeChiropractors} />
        <HomeBenefits />
        <HomeFeatures />
        <HomeServices />
        <HomeTestimonials />
        <HomeTeam />
        <HomePricing />
        <HomeCommunity />
        <HomeContact />
        <HomeFAQ />
        <HomeNewsletter />
      </main>
      <Footer />
    </MarketingShell>
  );
}
