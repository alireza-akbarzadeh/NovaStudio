"use client";

import {
  ActivityIcon,
  CalendarIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PlugIcon,
  SettingsIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useWorkspaceStorage } from "@/features/projects/hooks/use-workspace";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const navGroups = [
  {
    label: "Workspace",
    items: [
      { icon: LayoutDashboardIcon, label: "Overview", href: "/projects" },
      { icon: SparklesIcon, label: "Collections", href: "/projects/collections" },
      { icon: ActivityIcon, label: "Activity", href: "/projects/activity" },
      { icon: CalendarIcon, label: "Calendar", href: "/projects/calendar" },
    ],
  },
  {
    label: "Discover",
    items: [
      { icon: UsersIcon, label: "Community", href: "/projects/community" },
      { icon: TrendingUpIcon, label: "Trending", href: "/projects/trending" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: UsersIcon, label: "Team", href: "/projects/team" },
      { icon: PlugIcon, label: "Integrations", href: "/projects/integrations" },
      { icon: SettingsIcon, label: "Settings", href: "/projects/settings" },
    ],
  },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/projects") {
    return pathname === "/projects";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProjectsNavSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const storage = useWorkspaceStorage();
  const storagePercent = storage?.percent ?? 0;

  const content = (
    <div className="flex h-full flex-col">
      <Link href="/projects" className="mb-6 flex items-center gap-2.5 px-1">
        <Image src="/logo.svg" alt="" width={32} height={32} className="size-8" />
        <div className="min-w-0">
          <p className={cn(display.className, "text-base font-semibold tracking-tight")}>
            NovaStudio
          </p>
          <p className="text-[11px] text-muted-foreground">Dev workspace</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                return (
                  <li key={`${group.label}-${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition",
                        active
                          ? "bg-primary/12 font-medium text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-3">
        <div className="rounded-[20px] bg-gradient-to-br from-violet-600 to-fuchsia-500 p-4 text-white shadow-lg">
          <p className="text-sm font-semibold">Upgrade to Pro</p>
          <p className="mt-1 text-[11px] text-white/80">
            Unlimited projects, priority AI, and team seats.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3 w-full rounded-xl bg-white text-violet-700 hover:bg-white/90"
            asChild
          >
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </div>
        <div className="px-1">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Storage</span>
            <span>{storage ? `${storagePercent}%` : "—"}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="fixed top-4 left-4 z-40 inline-flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-card/90 shadow-lg backdrop-blur lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <MenuIcon className="size-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-border/60 bg-background/95 p-5 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              className="mb-3 ml-auto inline-flex size-8 items-center justify-center rounded-full hover:bg-muted"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <XIcon className="size-4" />
            </button>
            {content}
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 border-r border-border/50 bg-card/40 p-5 backdrop-blur-xl lg:block">
        {content}
      </aside>
    </>
  );
}
