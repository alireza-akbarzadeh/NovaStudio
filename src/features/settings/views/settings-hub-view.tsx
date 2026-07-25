"use client";

import { KeyboardIcon, Settings2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { EditorSettingsPanel } from "@/features/settings/components/editor-settings-panel";
import { ShortcutsPanel } from "@/features/settings/components/shortcuts-panel";
import { useEditorSettingsSync } from "@/features/settings/hooks/use-editor-settings-sync";

function HubSettingsTabs() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam === "shortcuts" ? "shortcuts" : "editor";

  return (
    <Tabs defaultValue={defaultTab} key={defaultTab}>
      <TabsList variant="line" className="mb-6 w-full justify-start">
        <TabsTrigger value="editor" className="gap-1.5">
          <Settings2Icon className="size-3.5" />
          Editor
        </TabsTrigger>
        <TabsTrigger value="shortcuts" className="gap-1.5">
          <KeyboardIcon className="size-3.5" />
          Shortcuts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="editor">
        <EditorSettingsPanel />
      </TabsContent>
      <TabsContent value="shortcuts">
        <ShortcutsPanel />
      </TabsContent>
    </Tabs>
  );
}

export function SettingsHubView() {
  useEditorSettingsSync();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <HubPageHeader
        title="Settings"
        description="Editor preferences and keyboard shortcuts for your Polaris workspace."
      />
      <div className="rounded-[22px] border border-border/60 bg-card/70 p-5 shadow-[0_16px_48px_-32px_rgba(76,29,149,0.4)] backdrop-blur-xl md:p-6">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
          <HubSettingsTabs />
        </Suspense>
      </div>
    </div>
  );
}
