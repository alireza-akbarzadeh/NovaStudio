/**
 * Monaco enum values safe for SSR — importing `monaco-editor` at module scope
 * throws `ReferenceError: window is not defined` during Next.js server rendering.
 */
export const MONACO_MARKER_SEVERITY = {
  Hint: 1,
  Info: 2,
  Warning: 4,
  Error: 8,
} as const;
