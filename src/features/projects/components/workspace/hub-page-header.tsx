"use client";

import { Manrope } from "next/font/google";

import { AppOrganizationSwitcher } from "@/features/billing/components/app-organization-switcher";
import { NotificationControls } from "@/features/notifications/components/notification-controls";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type HubPageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function HubPageHeader({
  title,
  description,
  actions,
}: HubPageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 pl-12 lg:pl-0">
        <h1
          className={cn(
            display.className,
            "text-3xl font-semibold tracking-tight md:text-4xl",
          )}
        >
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-[15px]">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <AppOrganizationSwitcher />
        <NotificationControls />
      </div>
    </header>
  );
}
