"use client";

import { useWorkspaceStorage } from "@/features/projects/hooks/use-workspace";

export function SidebarStorageWidget() {
  const storage = useWorkspaceStorage();
  const percent = storage?.percent ?? 0;

  return (
    <section className="rounded-[20px] border border-border/60 bg-card/80 p-4 shadow-[0_12px_36px_-28px_rgba(76,29,149,0.4)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Storage Usage</h3>
        <span className="text-[11px] font-medium text-primary">{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {storage
          ? `${storage.usedLabel} of ${storage.limitLabel} used`
          : "Calculating…"}
      </p>
    </section>
  );
}
