import type { ConvexReactClient } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  mergeProjectFiles,
  type ProjectFileRow,
} from "@/features/workspace/hooks/use-project-files";

type ContentPageRow = {
  path: string;
  content?: string;
  syncedContent?: string;
};

/** One-shot fetch of all file bodies (export, rare full-project reads). */
export async function fetchAllProjectFilesWithContents(
  convex: ConvexReactClient,
  projectId: string,
): Promise<ProjectFileRow[]> {
  const projectRef = projectId as Id<"projects">;
  const metadata = (await convex.query(api.projectFiles.listByProject, {
    projectId: projectRef,
  })) as ProjectFileRow[] | undefined;

  if (!metadata) {
    throw new Error("Project files are not available yet.");
  }

  const contents: ContentPageRow[] = [];
  let cursor: string | null = null;
  let isDone = false;

  while (!isDone) {
    const page: {
      page: ContentPageRow[];
      continueCursor: string;
      isDone: boolean;
    } = await convex.query(api.projectFiles.listFileContentsPage, {
      projectId: projectRef,
      paginationOpts: { numItems: 200, cursor },
    });
    contents.push(...page.page);
    isDone = page.isDone;
    cursor = page.continueCursor;
  }

  const merged = mergeProjectFiles(metadata, contents, true);
  if (!merged) {
    throw new Error("Could not merge project file contents.");
  }
  return merged;
}
