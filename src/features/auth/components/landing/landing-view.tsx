"use client";

import { useEffect } from "react";

import { PricingSection } from "@/features/billing/components/pricing-section";

import { LandingCta } from "./landing-cta";
import { LandingFaq } from "./landing-faq";
import { LandingFeatures } from "./landing-features";
import { LandingFooter } from "./landing-footer";
import { LandingHero } from "./landing-hero";
import { LandingNav } from "./landing-nav";
import { LandingProductShowcases } from "./landing-product-showcases";
import { LandingRoadmap } from "./landing-roadmap";
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
    <div className="min-h-dvh bg-[#121316] font-sans text-[#dfdfdf] selection:bg-ws-accent/30 selection:text-white">
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingProductShowcases />
      <LandingRoadmap />
      <LandingWorkflow />
      <PricingSection />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
