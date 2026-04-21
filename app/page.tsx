import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MarketingShell } from "./components/MarketingShell";
import { HomeHero } from "./components/home/HomeHero";
import { HomeMapPreviewLoader } from "./components/home/home-map-preview-loader";
import { HomeMapPreviewSkeleton } from "./components/home/HomeMapPreviewSkeleton";
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
import { getCachedHomeMarqueeChiropractors } from "./lib/home-chiropractors.server";

export const metadata: Metadata = {
  title: "Movyn — Find a chiropractor who actually fits you",
  description:
    "Movyn matches you with verified chiropractors based on technique, philosophy, payment model, and focus areas—not just distance. Free for patients to search.",
};

export default async function Home() {
  const marqueeChiropractors = await getCachedHomeMarqueeChiropractors();

  return (
    <MarketingShell>
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        {/* Cosmic order: Hero → Sponsors → Benefits → Features → Services → Testimonials → Team → Pricing → Community → Contact → FAQ → Newsletter */}
        <HomeHero
          mapPreview={
            <Suspense fallback={<HomeMapPreviewSkeleton />}>
              <HomeMapPreviewLoader />
            </Suspense>
          }
        />
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
