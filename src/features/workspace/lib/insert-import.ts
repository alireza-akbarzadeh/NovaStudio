import { buildImportSpecifier, parsePathAliases } from "@/features/workspace/lib/path-aliases";
import type { ProjectExport } from "@/features/workspace/lib/project-export-index";

export type TextEditRange = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};

const IMPORT_LINE_RE =
  /^\s*import\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/;
const SIDE_EFFECT_IMPORT_RE = /^\s*import\s+['"]([^'"]+)['"]\s*;?\s*$/;

type ParsedFileImport = {
  lineIndex: number;
  module: string;
  clause: string;
  isTypeOnly: boolean;
  fullLine: string;
};

function parseFileImports(source: string): ParsedFileImport[] {
  const lines = source.split(/\r?\n/);
  const results: ParsedFileImport[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i] ?? "";
    let end = i;

    if (/^\s*import\b/.test(line) && !/from\s+['"]/.test(line) && !SIDE_EFFECT_IMPORT_RE.test(line)) {
      while (end + 1 < lines.length && !/from\s+['"]/.test(line)) {
        end += 1;
        line += ` ${lines[end]}`;
      }
    }

    const side = line.match(SIDE_EFFECT_IMPORT_RE);
    if (side?.[1]) {
      results.push({
        lineIndex: end,
        module: side[1],
        clause: "",
        isTypeOnly: false,
        fullLine: line,
      });
      i = end;
      continue;
    }

    const match = line.match(IMPORT_LINE_RE);
    if (match?.[1] && match[2]) {
      results.push({
        lineIndex: end,
        module: match[2],
        clause: match[1].trim(),
        isTypeOnly: /^\s*import\s+type\b/.test(line),
        fullLine: line,
      });
      i = end;
    }
  }

  return results;
}

function findImportInsertIndex(lines: string[]): number {
  let insertAfter = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] ?? "").trim();
    if (i === 0 && trimmed.startsWith("#!")) {
      insertAfter = i;
      continue;
    }
    if (/^['"]use (client|server|strict)['"];?\s*$/.test(trimmed)) {
      insertAfter = i;
      continue;
    }
    if (/^\s*import\b/.test(lines[i] ?? "")) {
      insertAfter = i;
      continue;
    }
    if (trimmed === "" || trimmed.startsWith("//")) {
      insertAfter = Math.max(insertAfter, i);
      continue;
    }
    break;
  }

  return insertAfter + 1;
}

function formatImportLine(args: {
  module: string;
  exportName: string;
  isDefault: boolean;
  isTypeOnly: boolean;
}): string {
  const typePrefix = args.isTypeOnly ? "import type " : "import ";
  if (args.isDefault) {
    return `${typePrefix}${args.exportName} from "${args.module}";\n`;
  }
  return `${typePrefix}{ ${args.exportName} } from "${args.module}";\n`;
}

function mergeImportClause(
  clause: string,
  exportName: string,
  isDefault: boolean,
): string | null {
  const trimmed = clause.trim();
  if (!trimmed) {
    return isDefault ? exportName : `{ ${exportName} }`;
  }

  if (isDefault) {
    if (trimmed.startsWith("{")) {
      return `${exportName}, ${trimmed}`;
    }
    if (trimmed.includes(exportName)) return null;
    return `${exportName}, ${trimmed}`;
  }

  if (trimmed.startsWith("{")) {
    const inner = trimmed.slice(1, -1).trim();
    const names = inner
      ? inner.split(",").map((part) => part.trim().split(/\s+as\s+/).pop()?.trim())
      : [];
    if (names.includes(exportName)) return null;
    const next = inner ? `${inner}, ${exportName}` : exportName;
    return `{ ${next} }`;
  }

  if (trimmed === exportName) return null;
  return `${trimmed}, { ${exportName} }`;
}

/** Build a single edit that adds or merges an import for a project export. */
export function buildAutoImportEdit(args: {
  sourceContent: string;
  fromPath: string;
  exportEntry: ProjectExport;
  tsconfigContent?: string;
}): { range: TextEditRange; text: string } | null {
  const aliases = parsePathAliases(args.tsconfigContent);
  const module = buildImportSpecifier(
    args.fromPath,
    args.exportEntry.path,
    aliases,
  );

  const lines = args.sourceContent.split(/\r?\n/);
  const imports = parseFileImports(args.sourceContent);
  const existing = imports.find((row) => row.module === module);

  if (existing) {
    const merged = mergeImportClause(
      existing.clause,
      args.exportEntry.name,
      args.exportEntry.isDefault,
    );
    if (!merged) return null;

    const typePrefix = existing.isTypeOnly || args.exportEntry.isTypeOnly ? "import type " : "import ";
    const nextLine = `${typePrefix}${merged} from "${module}";`;
    return {
      range: {
        startLineNumber: existing.lineIndex + 1,
        startColumn: 1,
        endLineNumber: existing.lineIndex + 1,
        endColumn: (lines[existing.lineIndex]?.length ?? 0) + 1,
      },
      text: nextLine,
    };
  }

  const insertIndex = findImportInsertIndex(lines);
  const importLine = formatImportLine({
    module,
    exportName: args.exportEntry.name,
    isDefault: args.exportEntry.isDefault,
    isTypeOnly: args.exportEntry.isTypeOnly,
  });

  if (insertIndex >= lines.length) {
    const needsLeadingNewline =
      lines.length > 0 && (lines[lines.length - 1]?.length ?? 0) > 0;
    return {
      range: {
        startLineNumber: lines.length + 1,
        startColumn: 1,
        endLineNumber: lines.length + 1,
        endColumn: 1,
      },
      text: `${needsLeadingNewline ? "\n" : ""}${importLine}`,
    };
  }

  return {
    range: {
      startLineNumber: insertIndex + 1,
      startColumn: 1,
      endLineNumber: insertIndex + 1,
      endColumn: 1,
    },
    text: importLine,
  };
}

/** Names already available in the file (imports + local declarations). */
export function collectInScopeNames(sourceContent: string): Set<string> {
  const names = new Set<string>();

  for (const row of parseFileImports(sourceContent)) {
    if (!row.clause) continue;
    const clause = row.clause.trim();
    if (clause.startsWith("* as ")) {
      names.add(clause.slice(5).trim());
      continue;
    }
    if (clause.startsWith("{")) {
      const inner = clause.slice(1, -1);
      for (const piece of inner.split(",")) {
        const part = piece.trim();
        if (!part) continue;
        const asMatch = part.match(/(?:\w+\s+as\s+)?([A-Za-z_$][\w$]*)$/);
        if (asMatch?.[1]) names.add(asMatch[1]);
      }
      continue;
    }
    const defaultAndNamed = clause.match(/^([A-Za-z_$][\w$]*)(?:\s*,\s*\{([\s\S]*)\})?$/);
    if (defaultAndNamed?.[1]) {
      names.add(defaultAndNamed[1]);
      if (defaultAndNamed[2]) {
        for (const piece of defaultAndNamed[2].split(",")) {
          const part = piece.trim();
          const asMatch = part.match(/(?:\w+\s+as\s+)?([A-Za-z_$][\w$]*)$/);
          if (asMatch?.[1]) names.add(asMatch[1]);
        }
      }
    }
  }

  const declRe =
    /(?:^|\s)(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of sourceContent.matchAll(declRe)) {
    if (match[1]) names.add(match[1]);
  }

  return names;
}
