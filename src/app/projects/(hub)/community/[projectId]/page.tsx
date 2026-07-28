import { Suspense } from "react";

import { CommunityProjectDetailsClient } from "@/features/projects/views/community-project-details-client";

export default async function CommunityProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading project…</div>}>
      <CommunityProjectDetailsClient projectId={projectId} />
    </Suspense>
  );
}
