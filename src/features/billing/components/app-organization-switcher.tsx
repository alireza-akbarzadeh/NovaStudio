"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";
import type { ComponentProps } from "react";

import { clerkAppearance } from "@/features/billing/lib/clerk-appearance";
import { cn } from "@/lib/utils";

type AppOrganizationSwitcherProps = ComponentProps<typeof OrganizationSwitcher> & {
  className?: string;
};

/**
 * Team / personal workspace switcher. Personal accounts stay available
 * (membership optional). New projects inherit the active org from the JWT.
 */
export function AppOrganizationSwitcher({
  className,
  appearance,
  ...props
}: AppOrganizationSwitcherProps) {
  const mergedAppearance = {
    ...clerkAppearance,
    ...appearance,
    elements: {
      ...(clerkAppearance.elements as Record<string, string>),
      ...(appearance?.elements as Record<string, string> | undefined),
      rootBox: cn("flex items-center", className),
      organizationSwitcherTrigger: cn(
        "rounded-xl border border-border/60 bg-card/80 px-2.5 py-1.5",
        "text-sm hover:bg-muted/70 transition-colors",
      ),
      organizationSwitcherPopoverCard: [
        "rounded-2xl border border-white/10 bg-[#0a0b14]/95",
        "shadow-[0_30px_120px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl",
      ].join(" "),
    },
  };

  return (
    <OrganizationSwitcher
      afterCreateOrganizationUrl="/projects"
      afterSelectOrganizationUrl="/projects"
      afterSelectPersonalUrl="/projects"
      afterLeaveOrganizationUrl="/projects"
      appearance={mergedAppearance}
      {...props}
    />
  );
}
