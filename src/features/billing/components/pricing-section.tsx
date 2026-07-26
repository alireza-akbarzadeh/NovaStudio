"use client";

import { PricingTable } from "@clerk/nextjs";
import { Manrope } from "next/font/google";
import { Sparkles } from "lucide-react";

import { useBilling } from "@/features/billing/hooks/use-billing";
import { clerkPricingAppearance } from "@/features/billing/lib/clerk-appearance";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

type PricingSectionProps = {
  id?: string;
  className?: string;
};

export function PricingSection({
  id = "pricing",
  className,
}: PricingSectionProps) {
  const { isLoaded, isPro } = useBilling();

  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 border-t border-white/5 py-24 md:py-32",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Pricing
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-semibold tracking-tight text-white sm:text-5xl",
            )}
          >
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/50">
            Flat plans from Clerk Billing. Pick a tier and checkout opens in-app
            — no surprise usage invoices.
          </p>
          {isLoaded && isPro ? (
            <p className="mt-4 text-sm text-emerald-400">
              You&apos;re on Pro. Manage billing from your account menu → Manage
              account → Billing.
            </p>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <PricingTable
            for="user"
            highlightedPlan="pro"
            newSubscriptionRedirectUrl="/projects"
            appearance={clerkPricingAppearance}
            checkoutProps={{ appearance: clerkPricingAppearance }}
          />
        </div>
      </div>
    </section>
  );
}
