"use client";

import { useEffect } from "react";

import { PricingSection } from "@/features/billing/components/pricing-section";

import { CursorGlow } from "./cursor-glow";
import { LandingAi } from "./landing-ai";
import { LandingCollab } from "./landing-collab";
import { LandingCommunity } from "./landing-community";
import { LandingContact } from "./landing-contact";
import { LandingCta } from "./landing-cta";
import { LandingFaq } from "./landing-faq";
import { LandingFeatures } from "./landing-features";
import { LandingFooter } from "./landing-footer";
import { LandingHero } from "./landing-hero";
import { LandingLogoMarquee } from "./landing-logo-marquee";
import { LandingNav } from "./landing-nav";
import { LandingStats } from "./landing-stats";
import { LandingTestimonials } from "./landing-testimonials";
import { LandingWorkflow } from "./landing-workflow";

export function LandingView() {
  useEffect(() => {
    if (window.location.hash !== "#pricing") return;
    const id = window.setTimeout(() => {
      document.getElementById("pricing")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#06070d] font-sans text-white antialiased selection:bg-ws-accent/30 selection:text-white">
      <CursorGlow />
      <LandingNav />
      <main>
        <LandingHero />
        <LandingLogoMarquee />
        <LandingStats />
        <LandingFeatures />
        <LandingAi />
        <LandingCollab />
        <LandingWorkflow />
        <LandingTestimonials />
        <LandingCommunity />
        <PricingSection />
        <LandingFaq />
        <LandingContact />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
