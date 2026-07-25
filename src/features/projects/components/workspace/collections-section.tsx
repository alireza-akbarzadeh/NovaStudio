"use client";

import { CollectionChip } from "@/features/projects/components/workspace/collection-chip";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { useWorkspaceCollections } from "@/features/projects/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export function CollectionsSection() {
  const collections = useWorkspaceCollections();

  return (
    <section>
      <SectionHeader
        eyebrow="Organize"
        title="Collections"
        description="Group projects by focus, client, or archive status."
      />
      <div className="flex flex-wrap gap-3">
        {collections === undefined ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-40 rounded-full" />
          ))
        ) : collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Collections will appear here once seeded for your account.
          </p>
        ) : (
          collections.map((collection, index) => (
            <CollectionChip
              key={collection.id}
              collection={collection}
              index={index}
            />
          ))
        )}
      </div>
    </section>
  );
}
