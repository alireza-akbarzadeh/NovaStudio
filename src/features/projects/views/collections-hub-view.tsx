"use client";

import { FolderPlusIcon, PlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { CollectionChip } from "@/features/projects/components/workspace/collection-chip";
import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import {
  useAddProjectToCollection,
  useCollectionProjects,
  useCreateCollection,
  useEnsureWorkspaceDefaults,
  useRemoveProjectFromCollection,
  useWorkspaceCollections,
  useWorkspaceProjects,
} from "@/features/projects/hooks/use-workspace";

export function CollectionsHubView() {
  useEnsureWorkspaceDefaults();
  const collections = useWorkspaceCollections();
  const projects = useWorkspaceProjects();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramId = searchParams.get("c");

  const selectedId =
    paramId ??
    (collections && collections.length > 0 ? collections[0]!.id : null);

  const [projectToAdd, setProjectToAdd] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const collectionProjects = useCollectionProjects(selectedId);
  const addProject = useAddProjectToCollection();
  const removeProject = useRemoveProjectFromCollection();
  const createCollection = useCreateCollection();

  const selected = collections?.find((c) => c.id === selectedId) ?? null;
  const inCollection = new Set((collectionProjects ?? []).map((p) => p.id));
  const availableProjects = (projects ?? []).filter((p) => !inCollection.has(p.id));

  function selectCollection(id: string) {
    router.replace(`/projects/collections?c=${encodeURIComponent(id)}`);
  }

  async function handleAdd() {
    if (!selectedId || !projectToAdd) return;
    try {
      await addProject({
        collectionId: selectedId as Id<"collections">,
        projectId: projectToAdd as Id<"projects">,
      });
      setProjectToAdd("");
      toast.success("Added to collection");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not add project"));
    }
  }

  async function handleRemove(projectId: string) {
    if (!selectedId) return;
    try {
      await removeProject({
        collectionId: selectedId as Id<"collections">,
        projectId: projectId as Id<"projects">,
      });
      toast.success("Removed from collection");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not remove project"));
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      const id = await createCollection({
        name,
        color: "#7c3aed",
        icon: "sparkles",
      });
      setNewName("");
      setCreating(false);
      selectCollection(id);
      toast.success("Collection created");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not create collection"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <HubPageHeader
        title="Collections"
        description="Organize projects by focus, client, or archive status."
        actions={
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => setCreating((v) => !v)}
          >
            <FolderPlusIcon className="size-4" />
            New collection
          </Button>
        }
      />

      {creating ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-[18px] border border-border/60 bg-card/80 p-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            className="h-9 min-w-[200px] flex-1 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate();
            }}
          />
          <Button size="sm" className="rounded-xl" onClick={() => void handleCreate()}>
            Create
          </Button>
        </div>
      ) : null}

      <div className="mb-8 flex flex-wrap gap-3">
        {collections === undefined ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-40 rounded-full" />
          ))
        ) : (
          collections.map((collection, index) => (
            <CollectionChip
              key={collection.id}
              collection={collection}
              index={index}
              selected={collection.id === selectedId}
              onSelect={selectCollection}
            />
          ))
        )}
      </div>

      {selected ? (
        <section className="rounded-[22px] border border-border/60 bg-card/80 p-5 backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {selected.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selected.count} project{selected.count === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={projectToAdd || undefined} onValueChange={setProjectToAdd}>
                <SelectTrigger className="h-9 w-[220px] rounded-xl">
                  <SelectValue placeholder="Add a project…" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No projects left to add
                    </SelectItem>
                  ) : (
                    availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="rounded-xl"
                disabled={!projectToAdd}
                onClick={() => void handleAdd()}
              >
                <PlusIcon className="size-4" />
                Add
              </Button>
            </div>
          </div>

          {collectionProjects === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : collectionProjects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No projects in this collection yet. Add one above.
            </p>
          ) : (
            <ul className="space-y-2">
              {collectionProjects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className="truncate text-sm font-medium hover:text-primary"
                    >
                      {project.name}
                    </Link>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {project.lastUpdated}
                    </p>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-lg"
                    onClick={() => void handleRemove(project.id)}
                    aria-label={`Remove ${project.name}`}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
