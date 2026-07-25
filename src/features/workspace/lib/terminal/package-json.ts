/**
 * Parse dependencies from package.json for the Dependencies panel.
 */

import {
  resolvePackageJson,
  type PackageScriptFile,
} from "@/features/workspace/lib/terminal/package-scripts";

export type DependencyKind = "dependencies" | "devDependencies";

export type PackageDependency = {
  name: string;
  version: string;
  kind: DependencyKind;
};

function parseDepRecord(
  value: unknown,
  kind: DependencyKind,
): PackageDependency[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => typeof v === "string")
    .map(([name, version]) => ({
      name,
      version: version as string,
      kind,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Parse dependencies + devDependencies from package.json text. */
export function parsePackageDependencies(
  content: string,
): PackageDependency[] {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const pkg = parsed as Record<string, unknown>;
    return [
      ...parseDepRecord(pkg.dependencies, "dependencies"),
      ...parseDepRecord(pkg.devDependencies, "devDependencies"),
    ];
  } catch {
    return [];
  }
}

/** Root (or nearest) package.json dependencies for the project. */
export function getProjectDependencies(
  files: PackageScriptFile[],
  cwd = "/",
): {
  packageJsonPath: string | null;
  dependencies: PackageDependency[];
} {
  const pkg = resolvePackageJson(files, cwd);
  if (!pkg?.content) {
    return { packageJsonPath: null, dependencies: [] };
  }
  return {
    packageJsonPath: pkg.path,
    dependencies: parsePackageDependencies(pkg.content),
  };
}
