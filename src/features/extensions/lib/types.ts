export type ExtensionCategory = "theme" | "language";

export type ExtensionCatalogEntry = {
  id: string;
  name: string;
  description: string;
  category: ExtensionCategory;
  version: string;
  author: string;
  /** Monaco theme id when category is theme */
  monacoThemeId?: string;
};

export type UserExtensionInstall = {
  extensionId: string;
  version: string;
  enabled: boolean;
  installedAt: number;
  updatedAt: number;
};
