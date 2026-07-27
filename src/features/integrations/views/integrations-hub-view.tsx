"use client";

import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { IntegrationCard } from "@/features/integrations/components/integration-card";
import { HUB_INTEGRATIONS } from "@/features/integrations/lib/integrations-catalog";

export function IntegrationsHubView() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <HubPageHeader
        title="Integrations"
        description="Connect GitHub, Slack, and other tools. We’ll expand this catalog as NovaStudio grows."
      />

      <div className="mb-6 rounded-[22px] border border-border/60 bg-card/60 px-5 py-4 text-sm text-muted-foreground backdrop-blur-xl">
        Connected apps stay available across your projects. GitHub, Vercel,
        Netlify, Slack, Discord, Linear, and Notion are live today.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {HUB_INTEGRATIONS.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}
