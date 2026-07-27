"use client";

import { ComingSoonIntegrationCard } from "@/features/integrations/components/coming-soon-integration-card";
import { GitHubIntegrationCard } from "@/features/integrations/components/github-integration-card";
import { GoogleCalendarIntegrationCard } from "@/features/integrations/components/google-calendar-integration-card";
import { LinearIntegrationCard } from "@/features/integrations/components/linear-integration-card";
import { NotionIntegrationCard } from "@/features/integrations/components/notion-integration-card";
import { WebhookIntegrationCard } from "@/features/integrations/components/webhook-integration-card";
import { DeployIntegrationCard } from "@/features/deploy/components/deploy-integration-card";
import type { IntegrationMeta } from "@/features/integrations/lib/integrations-catalog";

type IntegrationCardProps = {
  integration: IntegrationMeta;
};

export function IntegrationCard({ integration }: IntegrationCardProps) {
  if (integration.id === "github") {
    return <GitHubIntegrationCard integration={integration} />;
  }
  if (integration.id === "vercel") {
    return (
      <DeployIntegrationCard
        integration={integration}
        provider="vercel"
        logoSrc="/vercel.svg"
        logoClassName="dark:invert"
      />
    );
  }
  if (integration.id === "netlify") {
    return (
      <DeployIntegrationCard
        integration={integration}
        provider="netlify"
        logoSrc="/netlify.svg"
      />
    );
  }
  if (integration.id === "slack" || integration.id === "discord") {
    return (
      <WebhookIntegrationCard
        integration={integration}
        provider={integration.id}
      />
    );
  }
  if (integration.id === "linear") {
    return <LinearIntegrationCard integration={integration} />;
  }
  if (integration.id === "notion") {
    return <NotionIntegrationCard integration={integration} />;
  }
  if (integration.id === "google-calendar") {
    return <GoogleCalendarIntegrationCard integration={integration} />;
  }
  return <ComingSoonIntegrationCard integration={integration} />;
}
