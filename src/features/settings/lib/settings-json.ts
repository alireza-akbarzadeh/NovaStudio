import {
  clampEditorSettings,
  DEFAULT_EDITOR_SETTINGS,
  type EditorSettings,
} from "@/features/settings/lib/editor-settings";

/** Max stored settings.json size (UTF-8 chars ≈ bytes for ASCII JSON). */
export const SETTINGS_JSON_MAX_CHARS = 32_000;

/** VS Code–style keys we map into NovaStudio editor prefs / Monaco. */
export const SETTINGS_JSON_KEYS = {
  fontSize: "editor.fontSize",
  tabSize: "editor.tabSize",
  wordWrap: "editor.wordWrap",
  lineNumbers: "editor.lineNumbers",
  highlightActiveLine: "editor.renderLineHighlight",
  bracketMatching: "editor.matchBrackets",
  lineHeight: "editor.lineHeight",
  formatOnSave: "editor.formatOnSave",
  autoSave: "files.autoSave",
  formatOnSaveAll: "editor.formatOnSaveAll",
  liveCollaboration: "nova.liveCollaboration",
  minimap: "editor.minimap.enabled",
  fontLigatures: "editor.fontLigatures",
  smoothScrolling: "editor.smoothScrolling",
  cursorBlinking: "editor.cursorBlinking",
} as const;

export type MonacoJsonOverrides = {
  minimapEnabled?: boolean;
  fontLigatures?: boolean;
  smoothScrolling?: boolean;
  cursorBlinking?: "blink" | "smooth" | "phase" | "expand" | "solid";
};

export type ParsedUserSettings = {
  editor: EditorSettings;
  overrides: MonacoJsonOverrides;
  /** Full parsed object (unknown keys preserved for round-trip). */
  raw: Record<string, unknown>;
};

const CURSOR_BLINKING = new Set([
  "blink",
  "smooth",
  "phase",
  "expand",
  "solid",
]);

export function defaultSettingsJson(editor: EditorSettings = DEFAULT_EDITOR_SETTINGS): string {
  return stringifySettingsJson(editorToSettingsRecord(editor));
}

export function editorToSettingsRecord(
  editor: EditorSettings,
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...extras,
    [SETTINGS_JSON_KEYS.fontSize]: editor.fontSize,
    [SETTINGS_JSON_KEYS.tabSize]: editor.tabSize,
    [SETTINGS_JSON_KEYS.wordWrap]: editor.wordWrap ? "on" : "off",
    [SETTINGS_JSON_KEYS.lineNumbers]: editor.lineNumbers ? "on" : "off",
    [SETTINGS_JSON_KEYS.highlightActiveLine]: editor.highlightActiveLine
      ? "line"
      : "none",
    [SETTINGS_JSON_KEYS.bracketMatching]: editor.bracketMatching
      ? "near"
      : "never",
    [SETTINGS_JSON_KEYS.lineHeight]: editor.lineHeight,
    [SETTINGS_JSON_KEYS.formatOnSave]: editor.formatOnSave,
    [SETTINGS_JSON_KEYS.autoSave]: editor.autoSave ? "afterDelay" : "off",
    [SETTINGS_JSON_KEYS.formatOnSaveAll]: editor.formatOnSaveAll,
    [SETTINGS_JSON_KEYS.liveCollaboration]: editor.liveCollaboration,
  };
}

export function stringifySettingsJson(record: Record<string, unknown>): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function parseSettingsJson(text: string): ParsedUserSettings {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      editor: { ...DEFAULT_EDITOR_SETTINGS },
      overrides: {},
      raw: {},
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Invalid JSON — fix the syntax before saving.");
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("settings.json must be a JSON object.");
  }

  const raw = parsed as Record<string, unknown>;
  const editor = clampEditorSettings({
    fontSize: readNumber(raw[SETTINGS_JSON_KEYS.fontSize]),
    tabSize: readNumber(raw[SETTINGS_JSON_KEYS.tabSize]),
    wordWrap: readOnOff(raw[SETTINGS_JSON_KEYS.wordWrap]),
    lineNumbers: readOnOff(raw[SETTINGS_JSON_KEYS.lineNumbers]),
    highlightActiveLine: readLineHighlight(
      raw[SETTINGS_JSON_KEYS.highlightActiveLine],
    ),
    bracketMatching: readMatchBrackets(
      raw[SETTINGS_JSON_KEYS.bracketMatching],
    ),
    lineHeight: readNumber(raw[SETTINGS_JSON_KEYS.lineHeight]),
    formatOnSave: readBoolean(raw[SETTINGS_JSON_KEYS.formatOnSave]),
    autoSave: readAutoSave(raw[SETTINGS_JSON_KEYS.autoSave]),
    formatOnSaveAll: readBoolean(raw[SETTINGS_JSON_KEYS.formatOnSaveAll]),
    liveCollaboration: readBoolean(raw[SETTINGS_JSON_KEYS.liveCollaboration]),
  });

  const overrides: MonacoJsonOverrides = {};
  const minimap = raw[SETTINGS_JSON_KEYS.minimap];
  if (typeof minimap === "boolean") overrides.minimapEnabled = minimap;

  const ligatures = raw[SETTINGS_JSON_KEYS.fontLigatures];
  if (typeof ligatures === "boolean") overrides.fontLigatures = ligatures;

  const smooth = raw[SETTINGS_JSON_KEYS.smoothScrolling];
  if (typeof smooth === "boolean") overrides.smoothScrolling = smooth;

  const blink = raw[SETTINGS_JSON_KEYS.cursorBlinking];
  if (typeof blink === "string" && CURSOR_BLINKING.has(blink)) {
    overrides.cursorBlinking = blink as MonacoJsonOverrides["cursorBlinking"];
  }

  return { editor, overrides, raw };
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function readAutoSave(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "off") return false;
  if (
    value === "afterDelay" ||
    value === "onFocusChange" ||
    value === "onWindowChange"
  ) {
    return true;
  }
  return undefined;
}

function readOnOff(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "on") return true;
  if (value === "off") return false;
  return undefined;
}

function readLineHighlight(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "none") return false;
  if (value === "line" || value === "all" || value === "gutter") return true;
  return undefined;
}

function readMatchBrackets(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "never") return false;
  if (value === "near" || value === "always") return true;
  return undefined;
}

/** Merge typed editor prefs into an existing settings.json document. */
export function mergeEditorIntoSettingsJson(
  currentJson: string | null | undefined,
  editor: EditorSettings,
): string {
  let extras: Record<string, unknown> = {};
  if (currentJson?.trim()) {
    try {
      const parsed = JSON.parse(currentJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        extras = { ...(parsed as Record<string, unknown>) };
      }
    } catch {
      extras = {};
    }
  }
  return stringifySettingsJson(editorToSettingsRecord(editor, extras));
}
