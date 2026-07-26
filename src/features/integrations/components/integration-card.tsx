"use client";

import { ComingSoonIntegrationCard } from "@/features/integrations/components/coming-soon-integration-card";
import { GitHubIntegrationCard } from "@/features/integrations/components/github-integration-card";
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
  return <ComingSoonIntegrationCard integration={integration} />;
}
