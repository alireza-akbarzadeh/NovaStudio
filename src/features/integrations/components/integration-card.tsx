"use client";

import { ComingSoonIntegrationCard } from "@/features/integrations/components/coming-soon-integration-card";
import { GitHubIntegrationCard } from "@/features/integrations/components/github-integration-card";
import type { IntegrationMeta } from "@/features/integrations/lib/integrations-catalog";

type IntegrationCardProps = {
  integration: IntegrationMeta;
};

export function IntegrationCard({ integration }: IntegrationCardProps) {
  if (integration.id === "github") {
    return <GitHubIntegrationCard integration={integration} />;
  }
  return <ComingSoonIntegrationCard integration={integration} />;
}
