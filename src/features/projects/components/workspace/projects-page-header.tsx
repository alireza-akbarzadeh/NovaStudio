"use client";

import { PlusIcon, UploadIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { AppUserButton } from "@/features/billing/components/app-user-button";
import { NotificationControls } from "@/features/notifications/components/notification-controls";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type ProjectsPageHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onImport: () => void;
};

export function ProjectsPageHeader({
  search,
  onSearchChange,
  onImport,
}: ProjectsPageHeaderProps) {
  const router = useRouter();

  return (
    <header className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 pl-12 lg:pl-0">
          <h1
            className={cn(
              display.className,
              "text-3xl font-semibold tracking-tight md:text-4xl",
            )}
          >
            Projects
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-[15px]">
            Manage your projects, discover community projects and collaborate
            with developers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="rounded-2xl shadow-lg shadow-primary/20"
            onClick={() => router.push("/projects/new")}
          >
            <PlusIcon className="size-4" />
            New Project
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl bg-card/80"
            onClick={onImport}
          >
            <UploadIcon className="size-4" />
            Import Project
          </Button>
          <NotificationControls />
          <AppUserButton />
        </div>
      </div>

      <div className="relative max-w-2xl">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects, tech, owners..."
          className="h-12 rounded-2xl border-border/70 bg-card/80 pr-16 pl-4 text-sm shadow-[0_12px_36px_-28px_rgba(76,29,149,0.35)] backdrop-blur"
        />
        <Kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
          ⌘K
        </Kbd>
      </div>
    </header>
  );
}
