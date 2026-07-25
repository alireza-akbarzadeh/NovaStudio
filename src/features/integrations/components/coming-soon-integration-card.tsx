"use client";

import { PlugIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IntegrationMeta } from "@/features/integrations/lib/integrations-catalog";
import { cn } from "@/lib/utils";

type ComingSoonIntegrationCardProps = {
  integration: IntegrationMeta;
};

export function ComingSoonIntegrationCard({
  integration,
}: ComingSoonIntegrationCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/80 shadow-[0_16px_48px_-32px_rgba(76,29,149,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(76,29,149,0.55)]">
      <div
        className={cn("relative h-28 bg-gradient-to-br", integration.accent)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="absolute right-4 bottom-4 inline-flex size-12 items-center justify-center rounded-2xl bg-black/30 backdrop-blur">
          <PlugIcon className="size-5 text-white" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">
              {integration.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {integration.category}
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            Coming soon
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {integration.description}
        </p>
        <div className="mt-auto pt-2">
          <Button variant="outline" className="w-full rounded-xl" disabled>
            Coming soon
          </Button>
        </div>
      </div>
    </article>
  );
}
