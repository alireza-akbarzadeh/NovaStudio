import type { editor, IDisposable } from "monaco-editor";

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Opening tag just finished with `>` — capture tag name. */
const OPEN_TAG_RE = /<([A-Za-z][\w:.-]*)(?:\s[^<>]*?)?\s*>$/;

export function supportsAutoCloseTags(filePath: string): boolean {
  return /\.(tsx|jsx|html?|htm)$/i.test(filePath);
}

/**
 * Auto-insert `</tag>` after typing `>` on an opening JSX/HTML tag
 * (Monaco only does this for the `html` language, not TSX/JSX).
 */
export function registerJsxAutoCloseTags(
  editorInstance: editor.IStandaloneCodeEditor,
  filePath: string,
): IDisposable | null {
  if (!supportsAutoCloseTags(filePath)) return null;

  let applying = false;

  return editorInstance.onDidChangeModelContent((event) => {
    if (applying || event.isUndoing || event.isRedoing) return;

    const change = event.changes[0];
    if (!change || change.text !== ">") return;

    const model = editorInstance.getModel();
    if (!model) return;

    const position = editorInstance.getPosition();
    if (!position) return;

    // Only react when `>` was typed at the cursor.
    if (
      change.range.startLineNumber !== position.lineNumber ||
      change.range.startColumn !== position.column - 1
    ) {
      return;
    }

    const linePrefix = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    // Skip closing tags (`</div>`) and self-closing (`<img />`).
    if (/<\/[^>]*$/.test(linePrefix) || /\/\s*>$/.test(linePrefix)) {
      return;
    }

    const match = linePrefix.match(OPEN_TAG_RE);
    if (!match?.[1]) return;

    // Skip TypeScript generics: `Array<string>` / `Foo<Bar>` (letter/digit before `<`).
    const ltIndex = linePrefix.lastIndexOf("<");
    const charBefore = ltIndex > 0 ? linePrefix[ltIndex - 1] : " ";
    if (charBefore && /[\w.$]/.test(charBefore)) return;

    const tag = match[1];
    if (VOID_TAGS.has(tag.toLowerCase())) return;

    const close = `</${tag}>`;
    applying = true;
    try {
      editorInstance.executeEdits("jsx-autoclose", [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: close,
          forceMoveMarkers: true,
        },
      ]);
      editorInstance.setPosition(position);
    } finally {
      applying = false;
    }
  });
}
