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
  title: "Movyn — Find a chiropractor who aligns with you",
  description:
    "Search by location and what matters to you—modalities, philosophy, and how practices work with patients.",
};

export default async function Home() {
  const chiropractors = await getChiropractors(14);

  return (
    <MarketingShell>
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        {/* Cosmic order: Hero → Sponsors → Benefits → Features → Services → Testimonials → Team → Pricing → Community → Contact → FAQ → Newsletter */}
        <HomeHero />
        <HomeMarquee chiropractors={chiropractors} />
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
