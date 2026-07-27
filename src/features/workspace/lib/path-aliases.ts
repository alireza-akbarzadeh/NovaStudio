import { normalizeRelativePath, toPosixPath } from "@/lib/posix-path";

/** Parse tsconfig/jsconfig `paths` into alias prefixes (e.g. `@/` → `src/`). */
export function parsePathAliases(
  tsconfigRaw: string | undefined,
): Record<string, string> {
  if (!tsconfigRaw?.trim()) {
    return { "@/": "src/" };
  }

  try {
    const parsed = JSON.parse(tsconfigRaw) as {
      compilerOptions?: { paths?: Record<string, string[]> };
    };
    const paths = parsed.compilerOptions?.paths ?? {};
    const aliases: Record<string, string> = {};

    for (const [key, values] of Object.entries(paths)) {
      const target = values[0];
      if (!target) continue;
      const aliasKey = key.replace(/\*$/, "");
      const aliasTarget = normalizeRelativePath(target.replace(/\*$/, ""));
      aliases[aliasKey] = aliasTarget.endsWith("/")
        ? aliasTarget
        : `${aliasTarget}/`;
    }

    if (!aliases["@/"]) {
      aliases["@/"] = "src/";
    }

    return aliases;
  } catch {
    return { "@/": "src/" };
  }
}

const STRIP_EXT = /\.(tsx?|jsx?|mjs|cjs|json)$/i;

function stripExtension(path: string): string {
  return toPosixPath(path).replace(STRIP_EXT, "");
}

/** Build the module specifier to import `toPath` from `fromPath`. */
export function buildImportSpecifier(
  fromPath: string,
  toPath: string,
  aliases: Record<string, string> = { "@/": "src/" },
): string {
  const from = normalizeRelativePath(fromPath);
  const toClean = stripExtension(normalizeRelativePath(toPath));

  for (const [alias, target] of Object.entries(aliases)) {
    const normalizedTarget = target.endsWith("/") ? target : `${target}/`;
    if (toClean === target.replace(/\/$/, "")) {
      return alias.replace(/\/$/, "");
    }
    if (toClean.startsWith(normalizedTarget)) {
      const rest = toClean.slice(normalizedTarget.length);
      return `${alias}${rest}`;
    }
  }

  const fromDir = from.includes("/")
    ? from.slice(0, from.lastIndexOf("/"))
    : "";
  const fromParts = fromDir ? fromDir.split("/").filter(Boolean) : [];
  const toParts = toClean.split("/").filter(Boolean);

  let common = 0;
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common += 1;
  }

  const ups = fromParts.length - common;
  const down = toParts.slice(common);
  const segments = [...Array.from({ length: ups }, () => ".."), ...down];

  if (segments.length === 0) {
    return `./${toParts[toParts.length - 1] ?? "index"}`;
  }
  const relative = segments.join("/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}
