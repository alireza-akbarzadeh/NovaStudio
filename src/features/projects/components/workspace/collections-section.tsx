"use client";

import { CollectionChip } from "@/features/projects/components/workspace/collection-chip";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { WORKSPACE_COLLECTIONS } from "@/features/projects/lib/projects-workspace-data";

export function CollectionsSection() {
  return (
    <section>
      <SectionHeader
        eyebrow="Organize"
        title="Collections"
        description="Group projects by focus, client, or archive status."
      />
      <div className="flex flex-wrap gap-3">
        {WORKSPACE_COLLECTIONS.map((collection, index) => (
          <CollectionChip
            key={collection.id}
            collection={collection}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
