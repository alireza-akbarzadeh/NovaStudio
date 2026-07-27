import { isSymbolScannablePath } from "@/features/workspace/lib/workspace-symbol-index";

export type ProjectExport = {
  name: string;
  path: string;
  isDefault: boolean;
  isTypeOnly: boolean;
};

const EXPORT_PATTERNS: Array<{
  re: RegExp;
  isDefault: boolean;
  isTypeOnly: boolean;
  nameGroup: number;
}> = [
  {
    re: /^\s*export\s+default\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
    isDefault: true,
    isTypeOnly: false,
    nameGroup: 1,
  },
  {
    re: /^\s*export\s+default\s+class\s+([A-Za-z_$][\w$]*)/,
    isDefault: true,
    isTypeOnly: false,
    nameGroup: 1,
  },
  {
    re: /^\s*export\s+default\s+([A-Za-z_$][\w$]*)\s*;/,
    isDefault: true,
    isTypeOnly: false,
    nameGroup: 1,
  },
  {
    re: /^\s*export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
    isDefault: false,
    isTypeOnly: false,
    nameGroup: 1,
  },
  {
    re: /^\s*export\s+(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/,
    isDefault: false,
    isTypeOnly: false,
    nameGroup: 1,
  },
  {
    re: /^\s*export\s+(?:default\s+)?const\s+([A-Za-z_$][\w$]*)/,
    isDefault: false,
    isTypeOnly: false,
    nameGroup: 1,
  },
  {
    re: /^\s*export\s+(?:default\s+)?type\s+([A-Za-z_$][\w$]*)/,
    isDefault: false,
    isTypeOnly: true,
    nameGroup: 1,
  },
  {
    re: /^\s*export\s+(?:default\s+)?interface\s+([A-Za-z_$][\w$]*)/,
    isDefault: false,
    isTypeOnly: true,
    nameGroup: 1,
  },
  {
    re: /^\s*export\s+(?:default\s+)?enum\s+([A-Za-z_$][\w$]*)/,
    isDefault: false,
    isTypeOnly: false,
    nameGroup: 1,
  },
];

function defaultNameFromPath(path: string): string {
  const base =
    path
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/\.(tsx?|jsx?|mjs|cjs)$/i, "") ?? "Component";
  return base
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function parseExportList(line: string): ProjectExport[] {
  const match = line.match(/^\s*export\s+\{([\s\S]+?)\}\s*;?\s*$/);
  if (!match?.[1]) return [];

  const exports: ProjectExport[] = [];
  for (const piece of match[1].split(",")) {
    const trimmed = piece.trim();
    if (!trimmed) continue;

    const defaultAs = trimmed.match(/^default\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (defaultAs?.[1]) {
      exports.push({
        name: defaultAs[1],
        path: "",
        isDefault: true,
        isTypeOnly: false,
      });
      continue;
    }

    const asMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (asMatch?.[1] && asMatch[2]) {
      exports.push({
        name: asMatch[2],
        path: "",
        isDefault: false,
        isTypeOnly: false,
      });
      continue;
    }

    const typePrefix = trimmed.replace(/^type\s+/, "").trim();
    if (/^[A-Za-z_$][\w$]*$/.test(typePrefix)) {
      exports.push({
        name: typePrefix,
        path: "",
        isDefault: false,
        isTypeOnly: trimmed.startsWith("type "),
      });
    }
  }

  return exports;
}

export function scanFileExports(path: string, content: string): ProjectExport[] {
  if (!isSymbolScannablePath(path)) return [];
  if (!/\.(tsx?|jsx?)$/i.test(path)) return [];

  const exports: ProjectExport[] = [];
  const seen = new Set<string>();
  const lines = content.split(/\r?\n/);
  let sawDefaultExport = false;

  const push = (entry: Omit<ProjectExport, "path">) => {
    const key = `${entry.name}:${entry.isDefault ? "d" : "n"}`;
    if (seen.has(key)) return;
    seen.add(key);
    exports.push({ ...entry, path });
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;

    if (/^\s*export\s+\{/.test(line)) {
      for (const item of parseExportList(line)) {
        push({
          name: item.name,
          isDefault: item.isDefault,
          isTypeOnly: item.isTypeOnly,
        });
      }
      continue;
    }

    for (const pattern of EXPORT_PATTERNS) {
      const match = pattern.re.exec(line);
      const name = match?.[pattern.nameGroup];
      if (!name) continue;
      if (pattern.isDefault) sawDefaultExport = true;
      push({
        name,
        isDefault: pattern.isDefault,
        isTypeOnly: pattern.isTypeOnly,
      });
      break;
    }

    if (/^\s*export\s+default\s+/.test(line)) {
      sawDefaultExport = true;
    }
  }

  if (sawDefaultExport && !exports.some((e) => e.isDefault)) {
    push({
      name: defaultNameFromPath(path),
      isDefault: true,
      isTypeOnly: false,
    });
    sawDefaultExport = true;
  }

  void sawDefaultExport;
  return exports;
}

export function buildProjectExportIndex(
  files: Array<{ path: string; content?: string }>,
): ProjectExport[] {
  const all: ProjectExport[] = [];
  for (const file of files) {
    if (!file.content?.trim()) continue;
    all.push(...scanFileExports(file.path, file.content));
  }
  return all;
}
