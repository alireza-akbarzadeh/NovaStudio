import { Suspense } from "react";

import { WorkspaceCustomizeView } from "@/features/customize/views/workspace-customize-view";

export default async function ProjectCustomizePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <Suspense fallback={null}>
      <WorkspaceCustomizeView projectId={projectId} />
    </Suspense>
  );
}
