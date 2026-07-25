/** Curated marketplace IDs — must stay in sync with client catalog. */

export const THEME_EXTENSION_IDS = [
  "theme.github-dark",
  "theme.dracula",
  "theme.nord",
  "theme.solarized-light",
] as const;

export const LANGUAGE_EXTENSION_IDS = ["language.vue"] as const;

export const KNOWN_EXTENSION_IDS = [
  ...THEME_EXTENSION_IDS,
  ...LANGUAGE_EXTENSION_IDS,
] as const;

export type KnownExtensionId = (typeof KNOWN_EXTENSION_IDS)[number];

const KNOWN_SET = new Set<string>(KNOWN_EXTENSION_IDS);
const THEME_SET = new Set<string>(THEME_EXTENSION_IDS);

export function isKnownExtensionId(id: string): id is KnownExtensionId {
  return KNOWN_SET.has(id);
}

export function isThemeExtensionId(id: string): boolean {
  return THEME_SET.has(id);
}
