import { getActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { toast } from "sonner";

function runActiveEditorAction(actionId: string): boolean {
  const path = useWorkspaceStore.getState().currentFilePath;
  if (!path) {
    toast.message("No file open", {
      description: "Open a code file and place the cursor on a symbol.",
    });
    return false;
  }

  const editor = getActiveMonacoEditor(path);
  if (!editor) {
    toast.message("Editor not ready", {
      description: "Wait for the editor to finish loading, then retry.",
    });
    return false;
  }

  const action = editor.getAction(actionId);
  if (!action) {
    toast.message("Action unavailable", {
      description: "This file type does not support symbol refactoring.",
    });
    return false;
  }

  void action.run();
  return true;
}

export function runFindReferences(): boolean {
  return runActiveEditorAction("polaris.findReferences");
}

export function runRenameSymbol(): boolean {
  return runActiveEditorAction("polaris.renameSymbol");
}
