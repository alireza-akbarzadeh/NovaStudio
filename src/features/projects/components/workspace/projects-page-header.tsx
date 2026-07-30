"use client";

import { useOrganization } from "@clerk/nextjs";
import { PlusIcon, SearchIcon, UploadIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { AppOrganizationSwitcher } from "@/features/billing/components/app-organization-switcher";
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
  const { organization } = useOrganization();

  return (
    <header className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-[0_24px_70px_-40px_rgba(76,29,149,0.45)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between md:p-6">
        <div className="min-w-0 pl-12 lg:pl-0">
          <h1
            className={cn(
              display.className,
              "text-2xl font-semibold tracking-tight sm:text-3xl md:text-[2rem]",
            )}
          >
            {organization ? `${organization.name} projects` : "Your projects"}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {organization
              ? "Team projects in this organization. Switch to Personal Account for solo workspaces."
              : "Personal workspaces. Create a team from the organization switcher to collaborate."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 pl-12 sm:pl-0">
          <NotificationControls />
          <AppOrganizationSwitcher />
          <AppUserButton settingsHref="/projects/settings" />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/50 bg-muted/15 px-5 py-4 sm:flex-row sm:items-center md:px-6">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects, tech, owners..."
            className="h-10 rounded-xl border-border/60 bg-background/60 pl-10 pr-14 text-sm backdrop-blur-sm"
          />
          <Kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 sm:inline-flex">
            ⌘K
          </Kbd>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="h-10 flex-1 rounded-xl px-4 shadow-md shadow-primary/20 sm:flex-none"
            onClick={() => router.push("/projects/new")}
          >
            <PlusIcon className="size-4" />
            New Project
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 flex-1 rounded-xl bg-background/60 sm:flex-none"
            onClick={onImport}
          >
            <UploadIcon className="size-4" />
            Import Project
          </Button>
        </div>
      </div>
    </header>
  );
}
