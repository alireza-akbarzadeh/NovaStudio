/** How deeply NovaStudio supports a language in the Monaco editor. */

export type LanguageSupportLevel =
  | "full"
  /** Syntax coloring only — no language server / IntelliSense. */
  | "syntax"
  /** Openable as plain text; no dedicated language mode. */
  | "basic";

export type LanguageSupportInfo = {
  id: string;
  label: string;
  level: LanguageSupportLevel;
  /** Shown in the editor chrome when support is limited. */
  notice?: string;
};

const FULL: LanguageSupportLevel = "full";
const SYNTAX: LanguageSupportLevel = "syntax";
const BASIC: LanguageSupportLevel = "basic";

/**
 * Languages with first-class IDE features (TS workers, Prettier, JSX, etc.).
 * Everything else still opens — we never crash — but we tell the user clearly.
 */
const BY_ID: Record<string, Omit<LanguageSupportInfo, "id">> = {
  typescript: { label: "TypeScript", level: FULL },
  javascript: { label: "JavaScript", level: FULL },
  json: { label: "JSON", level: FULL },
  css: { label: "CSS", level: FULL },
  scss: { label: "SCSS", level: FULL },
  less: { label: "Less", level: FULL },
  html: { label: "HTML", level: FULL },
  markdown: { label: "Markdown", level: FULL },
  vue: { label: "Vue", level: FULL },
  yaml: { label: "YAML", level: SYNTAX },
  xml: { label: "XML", level: SYNTAX },
  sql: { label: "SQL", level: SYNTAX },
  shell: { label: "Shell", level: SYNTAX },
  ini: { label: "INI / TOML", level: SYNTAX },
  python: {
    label: "Python",
    level: SYNTAX,
    notice:
      "Python opens with syntax highlighting only — a language server is not available yet.",
  },
  rust: {
    label: "Rust",
    level: SYNTAX,
    notice:
      "Rust opens with syntax highlighting only — a language server is not available yet.",
  },
  go: {
    label: "Go",
    level: SYNTAX,
    notice:
      "Go opens with syntax highlighting only — a language server is not available yet.",
  },
  plaintext: { label: "Plain Text", level: BASIC },
};

export function getLanguageSupport(languageId: string): LanguageSupportInfo {
  const known = BY_ID[languageId];
  if (known) {
    return { id: languageId, ...known };
  }
  return {
    id: languageId,
    label: languageId,
    level: SYNTAX,
    notice: `${languageId} has limited editor support — IntelliSense and diagnostics are not available yet.`,
  };
}

export function isLanguageServerSupported(languageId: string): boolean {
  return getLanguageSupport(languageId).level === "full";
}

/** Prefer a registered Monaco language; otherwise fall back to plaintext. */
export function resolveSafeMonacoLanguage(
  monaco: {
    languages: { getLanguages: () => Array<{ id: string }> };
  },
  requested: string,
): string {
  try {
    const registered = new Set(
      monaco.languages.getLanguages().map((language) => language.id),
    );
    if (registered.has(requested)) return requested;
  } catch {
    // Monaco may not be fully ready — keep the requested id.
  }
  return requested === "plaintext" ? "plaintext" : "plaintext";
}
