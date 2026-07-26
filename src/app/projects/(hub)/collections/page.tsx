import { Suspense } from "react";

import { CollectionsHubView } from "@/features/projects/views/collections-hub-view";

export default function ProjectsCollectionsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <CollectionsHubView />
    </Suspense>
  );
}
