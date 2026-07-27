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
  onShowReferences?: (
    references: import("@/features/workspace/lib/symbol-refactor").SymbolReference[],
    symbolName: string,
  ) => void;
  onRenameSymbol?: (
    references: import("@/features/workspace/lib/symbol-refactor").SymbolReference[],
    symbolName: string,
  ) => void;
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
  onShowReferences?: CollaborativeCodeEditorProps["onShowReferences"];
  onRenameSymbol?: CollaborativeCodeEditorProps["onRenameSymbol"];
  onChange?: (next: string) => void;
  onCreateEditor: (ed: import("monaco-editor").editor.IStandaloneCodeEditor) => void;
};
