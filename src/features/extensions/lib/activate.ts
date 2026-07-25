import {
  getMonacoThemeIdForExtension,
  VUE_EXTENSION_ID,
} from "@/features/extensions/lib/catalog";
import {
  DRACULA_THEME,
  GITHUB_DARK_THEME,
  NORD_THEME,
  SOLARIZED_LIGHT_THEME,
} from "@/features/extensions/lib/themes/packs";
import { registerVueLanguage } from "@/features/extensions/lib/vue-language";

type Monaco = typeof import("monaco-editor");

let themesRegistered = false;

export function registerExtensionThemes(monaco: Monaco): void {
  if (themesRegistered) return;
  monaco.editor.defineTheme("ext-github-dark", GITHUB_DARK_THEME);
  monaco.editor.defineTheme("ext-dracula", DRACULA_THEME);
  monaco.editor.defineTheme("ext-nord", NORD_THEME);
  monaco.editor.defineTheme("ext-solarized-light", SOLARIZED_LIGHT_THEME);
  themesRegistered = true;
}

/**
 * Register language/theme packs for currently enabled extension IDs.
 * Safe to call repeatedly when the enabled set changes.
 */
export function activateExtensions(
  monaco: Monaco,
  enabledExtensionIds: ReadonlySet<string> | readonly string[],
): void {
  const enabled =
    enabledExtensionIds instanceof Set
      ? enabledExtensionIds
      : new Set(enabledExtensionIds);

  registerExtensionThemes(monaco);

  if (enabled.has(VUE_EXTENSION_ID)) {
    registerVueLanguage(monaco);
  }
}

/** Resolve Monaco theme id for an active theme extension, if any. */
export function monacoThemeIdForActiveExtension(
  activeThemeExtensionId: string | null,
): string | null {
  if (!activeThemeExtensionId) return null;
  return getMonacoThemeIdForExtension(activeThemeExtensionId) ?? null;
}
