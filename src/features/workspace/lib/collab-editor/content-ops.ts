import type { editor } from "monaco-editor";
import * as Y from "yjs";

/** Replace Y.Text contents in one transaction (no-op when unchanged). */
export function replaceYText(ydoc: Y.Doc, ytext: Y.Text, next: string) {
  const current = ytext.toString();
  if (current === next) return;

  ydoc.transact(() => {
    const len = ytext.toString().length;
    if (len > 0) {
      ytext.delete(0, len);
    }
    if (next) {
      ytext.insert(0, next);
    }
  });
}

/** Full-model replace without jumping the caret to EOF (Monaco's default). */
export function replaceMonacoContentPreservingCursor(
  ed: editor.IStandaloneCodeEditor,
  model: editor.ITextModel,
  next: string,
) {
  const selection = ed.getSelection();
  const anchorOffset = selection
    ? model.getOffsetAt({
        lineNumber: selection.selectionStartLineNumber,
        column: selection.selectionStartColumn,
      })
    : 0;
  const headOffset = selection
    ? model.getOffsetAt({
        lineNumber: selection.positionLineNumber,
        column: selection.positionColumn,
      })
    : 0;

  ed.executeEdits("polaris-external", [
    { range: model.getFullModelRange(), text: next },
  ]);

  if (!selection) return;

  // getPositionAt clamps, so a shorter replacement lands at the new EOF.
  const anchor = model.getPositionAt(anchorOffset);
  const head = model.getPositionAt(headOffset);
  ed.setSelection({
    selectionStartLineNumber: anchor.lineNumber,
    selectionStartColumn: anchor.column,
    positionLineNumber: head.lineNumber,
    positionColumn: head.column,
  });
}
