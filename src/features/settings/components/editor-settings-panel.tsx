"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_MIN,
  TAB_SIZE_OPTIONS,
} from "@/features/settings/lib/editor-settings";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import { LIVEBLOCKS_COLLAB_ENABLED } from "@/features/workspace/lib/liveblocks-configured";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
  );
}

export function EditorSettingsPanel() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = !mounted || (resolvedTheme ?? "dark") === "dark";

  const fontSize = useEditorSettingsStore((s) => s.fontSize);
  const tabSize = useEditorSettingsStore((s) => s.tabSize);
  const wordWrap = useEditorSettingsStore((s) => s.wordWrap);
  const lineNumbers = useEditorSettingsStore((s) => s.lineNumbers);
  const highlightActiveLine = useEditorSettingsStore((s) => s.highlightActiveLine);
  const bracketMatching = useEditorSettingsStore((s) => s.bracketMatching);
  const lineHeight = useEditorSettingsStore((s) => s.lineHeight);
  const formatOnSave = useEditorSettingsStore((s) => s.formatOnSave);
  const autoSave = useEditorSettingsStore((s) => s.autoSave);
  const formatOnSaveAll = useEditorSettingsStore((s) => s.formatOnSaveAll);
  const setSettings = useEditorSettingsStore((s) => s.setSettings);
  const resetSettings = useEditorSettingsStore((s) => s.resetSettings);

  return (
    <div className="space-y-1">
      <SettingRow
        label="Appearance"
        description="App and editor color theme"
      >
        <Select
          value={isDark ? "dark" : "light"}
          onValueChange={(value) => {
            if (value) setTheme(value);
          }}
        >
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="light">Light</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <Separator />

      <SettingRow
        label="Font size"
        description={`${fontSize}px — applies to the code editor`}
      >
        <div className="flex w-[200px] items-center gap-3">
          <Slider
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            step={1}
            value={[fontSize]}
            onValueChange={([value]) => setSettings({ fontSize: value })}
            aria-label="Font size"
          />
          <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
            {fontSize}
          </span>
        </div>
      </SettingRow>

      <Separator />

      <SettingRow
        label="Line height"
        description={`${lineHeight.toFixed(1)} — spacing between editor lines`}
      >
        <div className="flex w-[200px] items-center gap-3">
          <Slider
            min={LINE_HEIGHT_MIN}
            max={LINE_HEIGHT_MAX}
            step={0.1}
            value={[lineHeight]}
            onValueChange={([value]) => setSettings({ lineHeight: value })}
            aria-label="Line height"
          />
          <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
            {lineHeight.toFixed(1)}
          </span>
        </div>
      </SettingRow>

      <Separator />

      <SettingRow
        label="Tab size"
        description="Spaces inserted when pressing Tab"
      >
        <Select
          value={String(tabSize)}
          onValueChange={(value) => {
            if (value) setSettings({ tabSize: Number(value) });
          }}
        >
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAB_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} spaces
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <Separator />

      <SettingRow
        label="Word wrap"
        description="Wrap long lines instead of horizontal scrolling"
      >
        <Switch
          checked={wordWrap}
          onCheckedChange={(checked) => setSettings({ wordWrap: checked })}
          aria-label="Word wrap"
        />
      </SettingRow>

      <Separator />

      <SettingRow
        label="Line numbers"
        description="Show gutter line numbers"
      >
        <Switch
          checked={lineNumbers}
          onCheckedChange={(checked) => setSettings({ lineNumbers: checked })}
          aria-label="Line numbers"
        />
      </SettingRow>

      <Separator />

      <SettingRow
        label="Highlight active line"
        description="Emphasize the line under the cursor"
      >
        <Switch
          checked={highlightActiveLine}
          onCheckedChange={(checked) =>
            setSettings({ highlightActiveLine: checked })
          }
          aria-label="Highlight active line"
        />
      </SettingRow>

      <Separator />

      <SettingRow
        label="Bracket matching"
        description="Highlight matching brackets near the cursor"
      >
        <Switch
          checked={bracketMatching}
          onCheckedChange={(checked) =>
            setSettings({ bracketMatching: checked })
          }
          aria-label="Bracket matching"
        />
      </SettingRow>

      <Separator />

      <SettingRow
        label="Format on Save"
        description="Run Prettier before ⌘S / Ctrl+S writes the file to Convex"
      >
        <Switch
          checked={formatOnSave}
          onCheckedChange={(checked) => setSettings({ formatOnSave: checked })}
          aria-label="Format on Save"
        />
      </SettingRow>

      <Separator />

      <SettingRow
        label="Auto Save"
        description="Debounce-save edits to Convex while typing. Turn off to save only with ⌘S / Save All."
      >
        <Switch
          checked={autoSave}
          onCheckedChange={(checked) => setSettings({ autoSave: checked })}
          aria-label="Auto Save"
        />
      </SettingRow>

      <Separator />

      <SettingRow
        label="Live collaboration"
        description={
          LIVEBLOCKS_COLLAB_ENABLED
            ? "Connect Liveblocks for shared editing and named live cursors."
            : "Disabled — projects sync through Convex autosave across browsers and devices. Simultaneous typing in the same file is not supported."
        }
      >
        <Switch
          checked={false}
          disabled
          aria-label="Live collaboration"
        />
      </SettingRow>

      <Separator />

      <SettingRow
        label="Format on Save All"
        description="When using ⌘⇧S / Ctrl+⇧S, format each open file before saving"
      >
        <Switch
          checked={formatOnSaveAll}
          onCheckedChange={(checked) =>
            setSettings({ formatOnSaveAll: checked })
          }
          aria-label="Format on Save All"
        />
      </SettingRow>

      <Separator />

      <SettingRow
        label="Formatter"
        description="Prettier formats JS/TS, JSON, CSS, HTML, and Markdown. Use the Prettier button in the editor toolbar, or ⇧⌥F / ⌘⇧I."
      >
        <span className="text-[12px] text-muted-foreground">Prettier</span>
      </SettingRow>

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetSettings}
          className="gap-1.5"
        >
          <RotateCcwIcon className="size-3.5" />
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
