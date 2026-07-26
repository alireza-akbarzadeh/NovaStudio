import type { ExtensionCatalogEntry } from "@/features/extensions/lib/types";

export const VUE_EXTENSION_ID = "language.vue";

export const EXTENSION_CATALOG: ExtensionCatalogEntry[] = [
  {
    id: "theme.github-dark",
    name: "GitHub Dark",
    description: "GitHub’s dark editor palette for Monaco.",
    category: "theme",
    version: "1.0.0",
    author: "NovaStudio",
    monacoThemeId: "ext-github-dark",
  },
  {
    id: "theme.dracula",
    name: "Dracula",
    description: "Popular purple-accent dark theme for the editor.",
    category: "theme",
    version: "1.0.0",
    author: "NovaStudio",
    monacoThemeId: "ext-dracula",
  },
  {
    id: "theme.nord",
    name: "Nord",
    description: "Arctic, north-bluish clean dark theme.",
    category: "theme",
    version: "1.0.0",
    author: "NovaStudio",
    monacoThemeId: "ext-nord",
  },
  {
    id: "theme.solarized-light",
    name: "Solarized Light",
    description: "Warm light Solarized palette for the editor.",
    category: "theme",
    version: "1.0.0",
    author: "NovaStudio",
    monacoThemeId: "ext-solarized-light",
  },
  {
    id: VUE_EXTENSION_ID,
    name: "Vue",
    description:
      "Syntax highlighting for Vue Single File Components (.vue).",
    category: "language",
    version: "1.0.0",
    author: "NovaStudio",
  },
];

export function getCatalogEntry(
  extensionId: string,
): ExtensionCatalogEntry | undefined {
  return EXTENSION_CATALOG.find((e) => e.id === extensionId);
}

export function getMonacoThemeIdForExtension(
  extensionId: string,
): string | undefined {
  return getCatalogEntry(extensionId)?.monacoThemeId;
}
