import type { FileUIPart } from "ai";

import type { MentionFileOption } from "@/features/workspace/components/workspace-chat/types";
import { useProjectFiles } from "@/features/workspace/hooks/use-project-files";

export function filterMentionFiles(
  files: ReturnType<typeof useProjectFiles>,
  query: string,
): MentionFileOption[] {
  const all = (files ?? [])
    .filter((file) => file.kind === "file")
    .map((file) => ({
      path: file.path,
      name: file.name,
      value: `${file.path} ${file.name}`,
    }));
  const q = query.trim().toLowerCase();
  if (!q) return all.slice(0, 40);
  return all
    .filter(
      (file) =>
        file.path.toLowerCase().includes(q) ||
        file.name.toLowerCase().includes(q),
    )
    .slice(0, 40);
}

export async function filePartToBlob(file: FileUIPart): Promise<Blob> {
  if (!file.url) {
    throw new Error("Missing file data");
  }
  const response = await fetch(file.url);
  if (!response.ok) {
    throw new Error("Could not read attachment");
  }
  return response.blob();
}
