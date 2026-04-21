import type { Metadata } from "next";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { MarketingShell } from "@/app/components/MarketingShell";
import { AboutHero } from "@/app/components/about/AboutHero";
import {
  AboutCta,
  AboutHowItWorks,
  AboutMission,
  AboutProblem,
  AboutStatsBanner,
  AboutValues,
} from "@/app/components/about/about-sections";

export const metadata: Metadata = {
  title: "About — Movyn",
  description:
    "Movyn is a doctor-to-doctor referral network built for the chiropractic profession — connecting providers by philosophy, specialty, and patient fit so care never gets interrupted when a patient relocates.",
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        {/* Cosmic order: Hero → Problem → Stats → Mission → How it works → Values → CTA */}
        <AboutHero />
        <AboutProblem />
        <AboutStatsBanner />
        <AboutMission />
        <AboutHowItWorks />
        <AboutValues />
        <AboutCta />
      </main>
      <Footer />
    </MarketingShell>
  );
}
