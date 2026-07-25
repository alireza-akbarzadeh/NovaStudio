"use client";

import { SidebarDeadlinesWidget } from "@/features/projects/components/workspace/sidebar-deadlines-widget";
import { SidebarNotificationsWidget } from "@/features/projects/components/workspace/sidebar-notifications-widget";
import { SidebarRequestsWidget } from "@/features/projects/components/workspace/sidebar-requests-widget";
import { SidebarShortcutsWidget } from "@/features/projects/components/workspace/sidebar-shortcuts-widget";
import { SidebarStorageWidget } from "@/features/projects/components/workspace/sidebar-storage-widget";

export function ProjectsRightSidebar() {
  return (
    <aside className="hidden w-[300px] shrink-0 xl:block">
      <div className="sticky top-6 space-y-4">
        <SidebarDeadlinesWidget />
        <SidebarRequestsWidget />
        <SidebarNotificationsWidget />
        <SidebarStorageWidget />
        <SidebarShortcutsWidget />
      </div>
    </aside>
  );
}
