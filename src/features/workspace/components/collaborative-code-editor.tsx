"use client";

import { CodeEditor } from "@/features/workspace/components/code-editor";
import { LiveblocksFileRoom } from "@/features/workspace/components/liveblocks-file-room";
import { useCollaborativeEditor } from "@/features/workspace/hooks/use-collaborative-editor";
import type { CollaborativeCodeEditorProps } from "@/features/workspace/lib/collab-editor/types";

export type { CollaborativeCodeEditorProps } from "@/features/workspace/lib/collab-editor/types";

function LiveblocksCollaborativeEditor(props: CollaborativeCodeEditorProps) {
  const {
    displayValue,
    filePath,
    readOnly,
    collaborative,
    connecting,
    reconnecting,
    definitionFiles,
    onGoToDefinition,
    onChange,
    onCreateEditor,
  } = useCollaborativeEditor(props);

  return (
    <div className="relative h-full min-h-0">
      <CodeEditor
        value={displayValue}
        filePath={filePath}
        readOnly={readOnly}
        collaborative={collaborative}
        onChange={onChange}
        definitionFiles={definitionFiles}
        onGoToDefinition={onGoToDefinition}
        onCreateEditor={onCreateEditor}
      />
      {connecting && !reconnecting ? (
        <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-ws-panel/90 px-2 py-1 text-[10px] text-ws-text-muted">
          Connecting live collaboration…
        </div>
      ) : null}
      {reconnecting ? (
        <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-ws-panel/90 px-2 py-1 text-[10px] text-ws-text-muted">
          Reconnecting live collaboration…
        </div>
      ) : null}
    </div>
  );
}

export function CollaborativeCodeEditor(props: CollaborativeCodeEditorProps) {
  return (
    <LiveblocksFileRoom projectId={props.projectId} filePath={props.filePath}>
      <LiveblocksCollaborativeEditor {...props} />
    </LiveblocksFileRoom>
  );
}
