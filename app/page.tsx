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
  HomeBothSides,
  HomeClosingCta,
  HomeTeam,
  HomeTestimonials,
  HomeWhy,
} from "./components/home/home-marketing-sections";
import { HomeFAQ } from "./components/home/HomeFAQ";
import { HomePricing } from "./components/home/HomePricing";
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
        <HomeHero
          mapPreview={
            <Suspense fallback={<HomeMapPreviewSkeleton />}>
              <HomeMapPreviewLoader />
            </Suspense>
          }
        />
        <HomeMarquee chiropractors={marqueeChiropractors} />
        <HomeWhy />
        <HomeBothSides />
        <HomeTestimonials />
        <HomeTeam />
        <HomePricing />
        <HomeFAQ />
        <HomeClosingCta />
      </main>
      <Footer />
    </MarketingShell>
  );
}
