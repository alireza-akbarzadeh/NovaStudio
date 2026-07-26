import { create } from "zustand";

import {
  clampEditorSettings,
  DEFAULT_EDITOR_SETTINGS,
  type EditorSettings,
} from "@/features/settings/lib/editor-settings";
import {
  defaultSettingsJson,
  mergeEditorIntoSettingsJson,
  type MonacoJsonOverrides,
  parseSettingsJson,
} from "@/features/settings/lib/settings-json";

type EditorSettingsState = EditorSettings & {
  hydrated: boolean;
  /** VS Code–style settings.json text for this user. */
  settingsJson: string;
  /** Extra Monaco options derived from settings.json. */
  monacoOverrides: MonacoJsonOverrides;
  setSettings: (partial: Partial<EditorSettings>) => void;
  resetSettings: () => void;
  setSettingsJsonDraft: (text: string) => void;
  applySettingsJson: (text: string) => void;
  hydrate: (
    prefs:
      | (Partial<EditorSettings> & { settingsJson?: string | null })
      | null
      | undefined,
  ) => void;
  getPersistable: () => EditorSettings;
};

export const useEditorSettingsStore = create<EditorSettingsState>((set, get) => ({
  ...DEFAULT_EDITOR_SETTINGS,
  hydrated: false,
  settingsJson: defaultSettingsJson(),
  monacoOverrides: {},

  setSettings: (partial) =>
    set((s) => {
      const next = clampEditorSettings({ ...s, ...partial });
      return {
        ...next,
        settingsJson: mergeEditorIntoSettingsJson(s.settingsJson, next),
      };
    }),

  resetSettings: () =>
    set({
      ...DEFAULT_EDITOR_SETTINGS,
      settingsJson: defaultSettingsJson(),
      monacoOverrides: {},
    }),

  setSettingsJsonDraft: (text) => set({ settingsJson: text }),

  applySettingsJson: (text) => {
    const parsed = parseSettingsJson(text);
    set({
      ...parsed.editor,
      settingsJson: text.endsWith("\n") ? text : `${text}\n`,
      monacoOverrides: parsed.overrides,
    });
  },

  hydrate: (prefs) => {
    const editor = clampEditorSettings({
      ...DEFAULT_EDITOR_SETTINGS,
      ...prefs,
    });
    let settingsJson = prefs?.settingsJson?.trim()
      ? prefs.settingsJson
      : defaultSettingsJson(editor);
    let monacoOverrides: MonacoJsonOverrides = {};

    try {
      const parsed = parseSettingsJson(settingsJson);
      settingsJson = settingsJson.endsWith("\n")
        ? settingsJson
        : `${settingsJson}\n`;
      monacoOverrides = parsed.overrides;
      set({
        ...parsed.editor,
        settingsJson,
        monacoOverrides,
        hydrated: true,
      });
      return;
    } catch {
      // Fall back to typed prefs if stored JSON is corrupt.
    }

    set({
      ...editor,
      settingsJson: defaultSettingsJson(editor),
      monacoOverrides,
      hydrated: true,
    });
  },

  getPersistable: () => {
    const {
      fontSize,
      tabSize,
      wordWrap,
      lineNumbers,
      highlightActiveLine,
      bracketMatching,
      lineHeight,
      formatOnSave,
      autoSave,
      formatOnSaveAll,
      liveCollaboration,
    } = get();
    return {
      fontSize,
      tabSize,
      wordWrap,
      lineNumbers,
      highlightActiveLine,
      bracketMatching,
      lineHeight,
      formatOnSave,
      autoSave,
      formatOnSaveAll,
      liveCollaboration,
    };
  },
}));
