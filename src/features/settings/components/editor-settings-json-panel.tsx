"use client";

import Editor from "@monaco-editor/react";
import { CheckIcon, FileJsonIcon, Loader2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import {
  SETTINGS_JSON_KEYS,
  parseSettingsJson,
} from "@/features/settings/lib/settings-json";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import {
  POLARIS_THEME_DARK,
  POLARIS_THEME_LIGHT,
  registerNovaStudioThemes,
} from "@/features/workspace/lib/monaco-theme";

/**
 * VS Code–style settings.json editor.
 * Saves to Convex `userPreferences.settingsJson` for the signed-in user.
 */
export function EditorSettingsJsonPanel({
  fillHeight = false,
}: {
  /** Stretch the Monaco editor to fill remaining vertical space. */
  fillHeight?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = !mounted || (resolvedTheme ?? "dark") === "dark";
  const theme = isDark ? POLARIS_THEME_DARK : POLARIS_THEME_LIGHT;

  const settingsJson = useEditorSettingsStore((s) => s.settingsJson);
  const setSettingsJsonDraft = useEditorSettingsStore(
    (s) => s.setSettingsJsonDraft,
  );
  const applySettingsJson = useEditorSettingsStore((s) => s.applySettingsJson);
  const upsertSettingsJson = useMutation(api.userPreferences.upsertSettingsJson);

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = useCallback(async () => {
    setError(null);
    let parsed;
    try {
      parsed = parseSettingsJson(settingsJson);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid settings.json";
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    try {
      const normalized = settingsJson.endsWith("\n")
        ? settingsJson
        : `${settingsJson}\n`;
      applySettingsJson(normalized);
      await upsertSettingsJson({
        settingsJson: normalized,
        editor: parsed.editor,
      });
      setSavedFlash(true);
      toast.success("settings.json saved");
      window.setTimeout(() => setSavedFlash(false), 1600);
    } catch (err) {
      toast.error("Could not save settings", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }, [applySettingsJson, settingsJson, upsertSettingsJson]);

  return (
    <div
      className={
        fillHeight
          ? "flex h-full min-h-0 flex-col gap-3"
          : "space-y-3"
      }
    >
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-ws-text">
            <FileJsonIcon className="size-3.5 shrink-0 text-ws-text-muted" />
            settings.json
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ws-text-muted">
            VS Code–style user settings for this account. Saved to your profile
            and restored on every device when you sign in. Supported keys include{" "}
            <code className="text-[11px]">{SETTINGS_JSON_KEYS.fontSize}</code>,{" "}
            <code className="text-[11px]">{SETTINGS_JSON_KEYS.wordWrap}</code>,{" "}
            <code className="text-[11px]">{SETTINGS_JSON_KEYS.minimap}</code>, and
            more.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void onSave()}
          disabled={saving}
          className="shrink-0 gap-1.5"
        >
          {saving ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : savedFlash ? (
            <CheckIcon className="size-3.5" />
          ) : null}
          {saving ? "Saving…" : savedFlash ? "Saved" : "Save JSON"}
        </Button>
      </div>

      <div
        className={
          fillHeight
            ? "min-h-0 flex-1 overflow-hidden rounded-md border border-ws-border bg-ws-bg"
            : "overflow-hidden rounded-md border border-ws-border bg-ws-bg"
        }
      >
        <div className={fillHeight ? "h-full min-h-90" : "h-70"}>
          <Editor
            height="100%"
            language="json"
            path="file:///user/settings.json"
            theme={theme}
            value={settingsJson}
            onChange={(next) => {
              if (next == null) return;
              setError(null);
              setSettingsJsonDraft(next);
            }}
            beforeMount={(monaco) => {
              registerNovaStudioThemes(monaco);
            }}
            options={{
              minimap: { enabled: fillHeight },
              fontSize: 13,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 12, bottom: 12 },
              folding: true,
              renderLineHighlight: "line",
            }}
          />
        </div>
      </div>

      {error ? (
        <p className="shrink-0 text-[12px] text-destructive">{error}</p>
      ) : (
        <p className="shrink-0 text-[11px] text-ws-text-muted">
          Tip: edit the JSON, click Save JSON, then reopen a file — Monaco picks
          up the new options.
        </p>
      )}
    </div>
  );
}
