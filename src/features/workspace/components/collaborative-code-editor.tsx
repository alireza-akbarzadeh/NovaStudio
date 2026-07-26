"use client";

import { CodeEditor } from "@/features/workspace/components/code-editor";
import { CollaborativeCursorStyles } from "@/features/workspace/components/collaborative-cursor-styles";
import { EditorErrorBoundary } from "@/features/workspace/components/editor-error-boundary";
import { LiveblocksFileRoom } from "@/features/workspace/components/liveblocks-file-room";
import { useCollaborativeEditor } from "@/features/workspace/hooks/use-collaborative-editor";
import { useLocalFileEditor } from "@/features/workspace/hooks/use-local-file-editor";
import type {
  CollaborativeCodeEditorProps,
  CollaborativeEditorViewModel,
} from "@/features/workspace/lib/collab-editor/types";
import { shouldUseLiveblocksCollaboration } from "@/features/workspace/lib/liveblocks-configured";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";

export type { CollaborativeCodeEditorProps } from "@/features/workspace/lib/collab-editor/types";
export { shouldUseLiveblocksCollaboration } from "@/features/workspace/lib/liveblocks-configured";

function EditorShell({
  vm,
  fallbackContent,
  showLiveCursors,
}: {
  vm: CollaborativeEditorViewModel;
  fallbackContent: string;
  showLiveCursors: boolean;
}) {
  return (
    <EditorErrorBoundary
      filePath={vm.filePath}
      fallbackContent={fallbackContent}
    >
      <div className="relative h-full min-h-0">
        {showLiveCursors ? <CollaborativeCursorStyles /> : null}
        <CodeEditor
          value={vm.displayValue}
          filePath={vm.filePath}
          readOnly={vm.readOnly}
          collaborative={vm.collaborative}
          onChange={vm.onChange}
          definitionFiles={vm.definitionFiles}
          onGoToDefinition={vm.onGoToDefinition}
          onCreateEditor={vm.onCreateEditor}
        />
        {vm.connecting && !vm.reconnecting ? (
          <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-ws-panel/90 px-2 py-1 text-[10px] text-ws-text-muted">
            Connecting live collaboration…
          </div>
        ) : null}
        {vm.reconnecting ? (
          <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-ws-panel/90 px-2 py-1 text-[10px] text-ws-text-muted">
            Reconnecting live collaboration…
          </div>
        ) : null}
      </div>
    </EditorErrorBoundary>
  );
}

function LiveblocksCollaborativeEditor(props: CollaborativeCodeEditorProps) {
  const vm = useCollaborativeEditor(props);
  return (
    <EditorShell
      vm={vm}
      fallbackContent={vm.displayValue || props.initialContent}
      showLiveCursors
    />
  );
}

function LocalFileEditor(props: CollaborativeCodeEditorProps) {
  const vm = useLocalFileEditor(props);
  return (
    <EditorShell
      vm={vm}
      fallbackContent={vm.displayValue || props.initialContent}
      showLiveCursors={false}
    />
  );
}

export function CollaborativeCodeEditor(props: CollaborativeCodeEditorProps) {
  const liveCollaboration = useEditorSettingsStore((s) => s.liveCollaboration);
  const useLive = shouldUseLiveblocksCollaboration(liveCollaboration);

  return (
    <EditorErrorBoundary
      filePath={props.filePath}
      fallbackContent={props.initialContent}
    >
      {useLive ? (
        <LiveblocksFileRoom projectId={props.projectId} filePath={props.filePath}>
          <LiveblocksCollaborativeEditor {...props} />
        </LiveblocksFileRoom>
      ) : (
        <LocalFileEditor {...props} />
      )}
    </EditorErrorBoundary>
  );
}
