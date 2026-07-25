"use client";

import {
  BookOpenIcon,
  FolderPlusIcon,
  GitBranchIcon,
  UserPlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

const shortcuts = [
  { icon: FolderPlusIcon, label: "Create Project", href: "/projects/new" },
  { icon: GitBranchIcon, label: "Import Repository", href: "/projects/new" },
  { icon: UserPlusIcon, label: "Invite Team Members", href: "/projects/team" },
  { icon: BookOpenIcon, label: "View Documentation", href: "/" },
] as const;

export function SidebarShortcutsWidget() {
  const router = useRouter();

  return (
    <section className="rounded-[20px] border border-border/60 bg-card/80 p-4 shadow-[0_12px_36px_-28px_rgba(76,29,149,0.4)] backdrop-blur-xl">
      <h3 className="text-sm font-semibold tracking-tight">Quick Shortcuts</h3>
      <ul className="mt-3 space-y-1">
        {shortcuts.map(({ icon: Icon, label, href }) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => router.push(href)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-xs font-medium text-muted-foreground transition hover:bg-primary/8 hover:text-foreground"
            >
              <Icon className="size-3.5 text-primary" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
