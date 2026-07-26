import type { editor, IDisposable, IRange } from "monaco-editor";
import { Range } from "monaco-editor";

import { supportsAiSuggestion } from "@/features/workspace/lib/editor-languages";
import { getActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";
import { fetchQuickEdit } from "@/lib/quick-edit-fetcher";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

export const INLINE_AI_EDIT_ACTION_ID = "polaris.inlineAiEdit";

type Phase = "prompt" | "loading" | "review";

type Session = {
  originalRange: IRange;
  originalText: string;
  previewRange: IRange | null;
  previewText: string | null;
  phase: Phase;
};

type Controller = {
  open: () => boolean;
  close: () => void;
  isOpen: () => boolean;
};

const controllers = new WeakMap<editor.IStandaloneCodeEditor, Controller>();

function fileNameFromPath(filePath: string) {
  const parts = filePath.split("/");
  return parts.at(-1) ?? filePath;
}

function selectionOrLine(
  ed: editor.IStandaloneCodeEditor,
  model: editor.ITextModel,
): { range: Range; text: string } | null {
  const sel = ed.getSelection();
  if (!sel) return null;

  if (!sel.isEmpty()) {
    const range = Range.lift(sel);
    return { range, text: model.getValueInRange(range) };
  }

  const line = sel.startLineNumber;
  const maxCol = model.getLineMaxColumn(line);
  if (maxCol <= 1 && model.getLineContent(line).length === 0) {
    return null;
  }
  const range = new Range(line, 1, line, maxCol);
  return { range, text: model.getValueInRange(range) };
}

function createWidgetDom(): {
  root: HTMLDivElement;
  input: HTMLInputElement;
  status: HTMLSpanElement;
  actions: HTMLDivElement;
  generateBtn: HTMLButtonElement;
  acceptBtn: HTMLButtonElement;
  rejectBtn: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
} {
  const root = document.createElement("div");
  root.className =
    "polaris-inline-ai-edit pointer-events-auto z-50 flex min-w-[min(420px,70vw)] max-w-[560px] flex-col gap-1.5 rounded-md border border-ws-border bg-ws-panel p-2 shadow-lg";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Inline AI edit");

  const row = document.createElement("div");
  row.className = "flex items-center gap-1.5";

  const badge = document.createElement("span");
  badge.className =
    "shrink-0 rounded-sm bg-ws-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-ws-accent";
  badge.textContent = "AI Edit";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Describe the edit…";
  input.className =
    "min-w-0 flex-1 rounded-sm border border-ws-border-subtle bg-ws-bg px-2 py-1 text-[12px] text-ws-text outline-none placeholder:text-ws-text-muted focus:border-ws-accent focus:ring-1 focus:ring-ws-accent/40";
  input.setAttribute("aria-label", "Edit instruction");

  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-1";

  const makeBtn = (label: string, variant: "primary" | "ghost" | "danger") => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    if (variant === "primary") {
      btn.className =
        "h-6 rounded-sm bg-ws-accent px-2 text-[11px] font-medium text-white hover:bg-ws-accent-hover disabled:opacity-50";
    } else if (variant === "danger") {
      btn.className =
        "h-6 rounded-sm px-2 text-[11px] font-medium text-ws-danger-soft hover:bg-ws-hover disabled:opacity-50";
    } else {
      btn.className =
        "h-6 rounded-sm px-2 text-[11px] font-medium text-ws-text-muted hover:bg-ws-hover hover:text-ws-text disabled:opacity-50";
    }
    return btn;
  };

  const generateBtn = makeBtn("Generate", "primary");
  const acceptBtn = makeBtn("Accept", "primary");
  const rejectBtn = makeBtn("Reject", "danger");
  const cancelBtn = makeBtn("Esc", "ghost");

  actions.append(generateBtn, acceptBtn, rejectBtn, cancelBtn);
  row.append(badge, input, actions);

  const status = document.createElement("span");
  status.className = "px-0.5 text-[10px] text-ws-text-muted";
  status.hidden = true;

  root.append(row, status);

  return {
    root,
    input,
    status,
    actions,
    generateBtn,
    acceptBtn,
    rejectBtn,
    cancelBtn,
  };
}

/**
 * Register ⌘K inline AI edit on a Monaco editor.
 * Returns a disposable that tears down the action + widget.
 */
export function registerInlineAiEdit(
  monaco: typeof import("monaco-editor"),
  editorInstance: editor.IStandaloneCodeEditor,
  filePath: string,
): IDisposable | null {
  if (editorInstance.getRawOptions().readOnly) return null;
  if (!supportsAiSuggestion(filePath)) return null;

  const fileName = fileNameFromPath(filePath);
  const dom = createWidgetDom();
  let session: Session | null = null;
  let abort: AbortController | null = null;
  let decorationIds: string[] = [];
  let widgetVisible = false;

  const getPosition = (): editor.IContentWidgetPosition | null => {
    if (!session) return null;
    const anchor = session.previewRange ?? session.originalRange;
    return {
      position: {
        lineNumber: anchor.startLineNumber,
        column: anchor.startColumn,
      },
      preference: [
        monaco.editor.ContentWidgetPositionPreference.ABOVE,
        monaco.editor.ContentWidgetPositionPreference.BELOW,
      ],
    };
  };

  const widget: editor.IContentWidget = {
    getId: () => "polaris.inlineAiEdit.widget",
    getDomNode: () => dom.root,
    getPosition,
  };

  const setDecorations = (range: IRange | null) => {
    decorationIds = editorInstance.deltaDecorations(
      decorationIds,
      range
        ? [
            {
              range,
              options: {
                className: "polaris-inline-ai-edit-range",
                isWholeLine: false,
              },
            },
          ]
        : [],
    );
  };

  const setPhase = (phase: Phase, message?: string) => {
    if (!session) return;
    session.phase = phase;

    const prompting = phase === "prompt";
    const loading = phase === "loading";
    const reviewing = phase === "review";

    dom.input.disabled = loading || reviewing;
    dom.generateBtn.hidden = !prompting;
    dom.generateBtn.disabled = loading;
    dom.acceptBtn.hidden = !reviewing;
    dom.rejectBtn.hidden = !reviewing;
    dom.cancelBtn.hidden = reviewing;
    dom.cancelBtn.textContent = loading ? "Cancel" : "Esc";

    if (message) {
      dom.status.hidden = false;
      dom.status.textContent = message;
    } else if (loading) {
      dom.status.hidden = false;
      dom.status.textContent = "Generating edit…";
    } else if (reviewing) {
      dom.status.hidden = false;
      dom.status.textContent = "Review the change · Accept or Reject";
    } else {
      dom.status.hidden = true;
      dom.status.textContent = "";
    }
  };

  const hideWidget = () => {
    if (!widgetVisible) return;
    editorInstance.removeContentWidget(widget);
    widgetVisible = false;
  };

  const showWidget = () => {
    if (widgetVisible) {
      editorInstance.layoutContentWidget(widget);
      return;
    }
    editorInstance.addContentWidget(widget);
    widgetVisible = true;
  };

  const restoreOriginal = () => {
    if (!session) return;
    const model = editorInstance.getModel();
    if (!model) return;

    const target = session.previewRange ?? session.originalRange;
    editorInstance.executeEdits("polaris-inline-ai-reject", [
      { range: target, text: session.originalText },
    ]);
  };

  const close = () => {
    abort?.abort();
    abort = null;
    setDecorations(null);
    hideWidget();
    session = null;
    dom.input.value = "";
    setPhase("prompt");
  };

  const open = (): boolean => {
    if (editorInstance.getRawOptions().readOnly) return false;
    const model = editorInstance.getModel();
    if (!model) return false;

    // Re-open prompt if already reviewing — reject first.
    if (session?.phase === "review") {
      restoreOriginal();
      close();
    } else if (session?.phase === "loading") {
      return true;
    } else if (session?.phase === "prompt") {
      showWidget();
      dom.input.focus();
      dom.input.select();
      return true;
    }

    const picked = selectionOrLine(editorInstance, model);
    if (!picked || !picked.text.trim()) {
      return false;
    }

    session = {
      originalRange: picked.range,
      originalText: picked.text,
      previewRange: null,
      previewText: null,
      phase: "prompt",
    };

    setDecorations(picked.range);
    setPhase("prompt");
    showWidget();
    editorInstance.layoutContentWidget(widget);
    queueMicrotask(() => {
      dom.input.focus();
      dom.input.select();
    });
    return true;
  };

  const applyPreview = (edited: string) => {
    if (!session) return;
    const model = editorInstance.getModel();
    if (!model) return;

    const start = session.originalRange;
    editorInstance.executeEdits("polaris-inline-ai-preview", [
      { range: session.originalRange, text: edited },
    ]);

    const startOffset = model.getOffsetAt({
      lineNumber: start.startLineNumber,
      column: start.startColumn,
    });
    const endPos = model.getPositionAt(startOffset + edited.length);
    const previewRange = new Range(
      start.startLineNumber,
      start.startColumn,
      endPos.lineNumber,
      endPos.column,
    );

    session.previewText = edited;
    session.previewRange = previewRange;
    setDecorations(previewRange);
    editorInstance.setSelection(previewRange);
    setPhase("review");
    editorInstance.layoutContentWidget(widget);
  };

  const generate = async () => {
    if (!session || session.phase !== "prompt") return;
    const instruction = dom.input.value.trim();
    if (!instruction) {
      dom.input.focus();
      return;
    }

    const model = editorInstance.getModel();
    if (!model) return;

    abort?.abort();
    abort = new AbortController();
    setPhase("loading");

    const edited = await fetchQuickEdit(
      {
        selectedCode: session.originalText,
        fullCode: model.getValue(),
        instruction,
        fileName,
      },
      abort.signal,
    );

    if (!session || session.phase !== "loading") return;

    if (edited == null) {
      setPhase("prompt", "Cancelled or failed — try again");
      return;
    }

    if (edited === session.originalText) {
      setPhase("prompt", "No changes suggested — refine your instruction");
      return;
    }

    applyPreview(edited);
  };

  const accept = () => {
    if (!session || session.phase !== "review") return;
    // Preview already applied via executeEdits; just clear chrome.
    close();
    editorInstance.focus();
  };

  const reject = () => {
    if (!session) return;
    if (session.phase === "review") {
      restoreOriginal();
    }
    close();
    editorInstance.focus();
  };

  dom.generateBtn.addEventListener("click", () => {
    void generate();
  });
  dom.acceptBtn.addEventListener("click", accept);
  dom.rejectBtn.addEventListener("click", reject);
  dom.cancelBtn.addEventListener("click", () => {
    if (session?.phase === "loading") {
      abort?.abort();
      abort = null;
      setPhase("prompt", "Cancelled");
      return;
    }
    reject();
  });

  dom.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      void generate();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      reject();
    }
  });

  // Stop Monaco / workspace shortcuts from stealing keys while typing.
  dom.root.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });

  const action = editorInstance.addAction({
    id: INLINE_AI_EDIT_ACTION_ID,
    label: "Inline AI Edit",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
    run: () => {
      if (!open()) {
        // Empty buffer / blank line — fall back is handled by global shortcut.
        return;
      }
    },
  });

  const keydownDisposable = editorInstance.onKeyDown((e) => {
    if (!session) return;
    if (e.keyCode === monaco.KeyCode.Escape) {
      e.preventDefault();
      e.stopPropagation();
      reject();
    }
  });

  const controller: Controller = {
    open,
    close,
    isOpen: () => session != null,
  };
  controllers.set(editorInstance, controller);

  // Initial button visibility for prompt phase.
  setPhase("prompt");
  dom.acceptBtn.hidden = true;
  dom.rejectBtn.hidden = true;

  return {
    dispose: () => {
      close();
      action.dispose();
      keydownDisposable.dispose();
      controllers.delete(editorInstance);
    },
  };
}

/** Open inline AI edit on the active workspace file editor. */
export function requestInlineAiEdit(): boolean {
  const path = useWorkspaceStore.getState().currentFilePath;
  if (!path) return false;
  const ed = getActiveMonacoEditor(path);
  if (!ed) return false;
  return controllers.get(ed)?.open() ?? false;
}

export function isInlineAiEditOpen(): boolean {
  const path = useWorkspaceStore.getState().currentFilePath;
  if (!path) return false;
  const ed = getActiveMonacoEditor(path);
  if (!ed) return false;
  return controllers.get(ed)?.isOpen() ?? false;
}

export function isMonacoEditorTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(".monaco-editor") ||
      target.closest(".polaris-inline-ai-edit"),
  );
}
