export type CollaborativeCodeEditorProps = {
  projectId: string;
  filePath: string;
  initialContent: string;
  /** Server `updatedAt` — used to decide whether a local draft wins on refresh. */
  serverUpdatedAt?: number;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
  definitionFiles?: Array<{ path: string; content?: string }>;
  onGoToDefinition?: (target: {
    path: string;
    line: number;
    column: number;
  }) => void;
};

export type CollaborativeEditorViewModel = {
  displayValue: string;
  filePath: string;
  readOnly: boolean;
  collaborative: boolean;
  connecting: boolean;
  reconnecting: boolean;
  definitionFiles?: CollaborativeCodeEditorProps["definitionFiles"];
  onGoToDefinition?: CollaborativeCodeEditorProps["onGoToDefinition"];
  onChange?: (next: string) => void;
  onCreateEditor: (ed: import("monaco-editor").editor.IStandaloneCodeEditor) => void;
};
