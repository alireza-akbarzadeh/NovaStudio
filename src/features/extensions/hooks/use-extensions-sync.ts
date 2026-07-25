"use client";

import { loader } from "@monaco-editor/react";
import { useEffect } from "react";

import { useUserExtensions } from "@/features/extensions/hooks/use-user-extensions";
import {
  activateExtensions,
  monacoThemeIdForActiveExtension,
} from "@/features/extensions/lib/activate";

/**
 * Hydrates install state from Convex and registers Monaco packs
 * when enabled extensions change.
 */
export function useExtensionsSync() {
  const { ready, enabledIds, activeThemeId } = useUserExtensions();

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    void loader.init().then((monaco) => {
      if (cancelled) return;
      activateExtensions(monaco, enabledIds);
      const themeId = monacoThemeIdForActiveExtension(activeThemeId);
      if (themeId) {
        monaco.editor.setTheme(themeId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ready, enabledIds, activeThemeId]);
}
