import { WorkspaceCustomizePluginView } from "@/features/customize/views/workspace-customize-plugin-view";

export default async function ProjectCustomizePluginPage({
  params,
}: {
  params: Promise<{ projectId: string; pluginId: string }>;
}) {
  const { projectId, pluginId } = await params;
  return (
    <WorkspaceCustomizePluginView projectId={projectId} pluginId={pluginId} />
  );
}
