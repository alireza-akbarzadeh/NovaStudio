import { FileDiffView } from "@/features/workspace/views/file-diff-view";

export default async function ProjectDiffPage({
  params,
}: {
  params: Promise<{ projectId: string; path?: string[] }>;
}) {
  const { projectId, path } = await params;

  return (
    <FileDiffView
      projectId={projectId}
      filePath={path?.join("/") ?? ""}
    />
  );
}
