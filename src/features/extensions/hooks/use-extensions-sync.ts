"use client";

import { loader } from "@monaco-editor/react";
import { useEffect, useMemo } from "react";

import { useUserExtensions } from "@/features/extensions/hooks/use-user-extensions";
import {
  activateExtensions,
  monacoThemeIdForActiveExtension,
} from "@/features/extensions/lib/activate";
import {
  POLARIS_THEME_DARK,
  POLARIS_THEME_LIGHT,
} from "@/features/workspace/lib/monaco-theme";
import { useTheme } from "next-themes";

/**
 * Hydrates install state from Convex and registers Monaco packs
 * when enabled extensions change.
 */
export function useExtensionsSync() {
  const { ready, enabledIds, activeThemeId } = useUserExtensions();
  const { resolvedTheme } = useTheme();
  const enabledKey = useMemo(
    () => [...enabledIds].sort().join("\0"),
    [enabledIds],
  );

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    void loader.init().then((monaco) => {
      if (cancelled) return;
      activateExtensions(monaco, enabledIds);
      const themeId = monacoThemeIdForActiveExtension(activeThemeId);
      if (themeId) {
        monaco.editor.setTheme(themeId);
      } else {
        const isDark = (resolvedTheme ?? "dark") === "dark";
        monaco.editor.setTheme(
          isDark ? POLARIS_THEME_DARK : POLARIS_THEME_LIGHT,
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ready, enabledKey, enabledIds, activeThemeId, resolvedTheme]);
}
