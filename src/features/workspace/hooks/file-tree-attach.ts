import { toast } from "sonner";

import type { Doc } from "@/convex/_generated/dataModel";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

import { collectAttachPaths } from "../components/file-tree/tree-utils";

export function attachPathsToChat(
  files: Doc<"projectFiles">[],
  path: string,
  kind: "file" | "folder",
  asNewChat: boolean,
) {
  const paths = collectAttachPaths(files, path, kind);
  if (paths.length === 0) {
    toast.message("No files to attach");
    return;
  }

  const state = useWorkspaceStore.getState();
  if (!state.aiPanelOpen) {
    state.toggleAiPanel();
  }
  if (asNewChat) {
    state.requestNewAiChat();
  }
  state.setPendingChatAttachPaths(paths);
  toast.success(
    paths.length === 1 ? "Added to chat" : `Added ${paths.length} files to chat`,
  );
}
