"use client";

import { Manrope } from "next/font/google";

import { EditorSettingsJsonPanel } from "@/features/settings/components/editor-settings-json-panel";
import { useWorkspaceBreadcrumb } from "@/features/workspace/hooks/use-workspace-breadcrumb";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const USER_JSON_BREADCRUMB = [{ label: "User JSON" }] as const;

/** Per-user VS Code–style settings.json as a workspace editor tab. */
export function WorkspaceUserJsonView() {
  useWorkspaceBreadcrumb([...USER_JSON_BREADCRUMB]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 md:px-8">
      <header className="mb-6">
        <h1
          className={cn(
            display.className,
            "text-lg font-semibold tracking-tight text-ws-text",
          )}
        >
          User JSON
        </h1>
        <p className="mt-1 text-[12px] text-ws-text-muted">
          Your account settings.json — saved to your profile and restored on
          sign-in. Shortcut: ⌘ ⇧ J
        </p>
      </header>
      <EditorSettingsJsonPanel />
    </div>
  );
}
