export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type ScaffoldTemplateId = "nextjs" | "react" | "vite" | "tanstack";

export type ScaffoldOptions = {
  packageManager: PackageManager;
  /** Freeform CLI package version, e.g. latest, 15.2.4, canary, 6.0.0 */
  version: string;
  typescript: boolean;
  /** Next.js only */
  eslint: boolean;
  tailwind: boolean;
  appRouter: boolean;
  srcDir: boolean;
  turbopack: boolean;
};

export const DEFAULT_SCAFFOLD_OPTIONS: ScaffoldOptions = {
  packageManager: "npm",
  version: "latest",
  typescript: true,
  eslint: true,
  tailwind: true,
  appRouter: true,
  srcDir: true,
  turbopack: true,
};

export const VERSION_PRESETS = [
  { id: "latest", label: "Latest" },
  { id: "canary", label: "Canary" },
] as const;

export const NEXT_VERSION_PRESETS = [
  { id: "latest", label: "Latest" },
  { id: "15", label: "15.x" },
  { id: "14", label: "14.x" },
  { id: "canary", label: "Canary" },
] as const;

export const PACKAGE_MANAGER_OPTIONS: {
  id: PackageManager;
  label: string;
}[] = [
  { id: "npm", label: "npm" },
  { id: "pnpm", label: "pnpm" },
  { id: "yarn", label: "yarn" },
  { id: "bun", label: "bun" },
];

export function isScaffoldTemplate(id: string): id is ScaffoldTemplateId {
  return (
    id === "nextjs" || id === "react" || id === "vite" || id === "tanstack"
  );
}

export function scaffoldDialogTitle(id: ScaffoldTemplateId): string {
  switch (id) {
    case "nextjs":
      return "Scaffold Next.js";
    case "react":
      return "Scaffold React";
    case "vite":
      return "Scaffold Vite";
    case "tanstack":
      return "Scaffold TanStack Start";
  }
}

export function scaffoldDialogDescription(id: ScaffoldTemplateId): string {
  switch (id) {
    case "nextjs":
      return "Pick package manager, version, and features. We’ll open the editor and run create-next-app in the terminal.";
    case "react":
      return "Pick package manager and version. We’ll run create-vite with the React template in your workspace terminal.";
    case "vite":
      return "Pick package manager and version. We’ll run create-vite with a vanilla template in your workspace terminal.";
    case "tanstack":
      return "Pick package manager and version. We’ll scaffold TanStack Start in your workspace terminal.";
  }
}

function sanitizeVersion(version: string): string {
  const trimmed = version.trim().replace(/^@/, "");
  if (!trimmed) return "latest";
  // Block shell metacharacters in freeform version input.
  if (!/^[a-zA-Z0-9._+-]+$/.test(trimmed)) {
    return "latest";
  }
  return trimmed;
}

function createViteCommand(
  options: ScaffoldOptions,
  template: string,
): string {
  const version = sanitizeVersion(options.version);
  const pkg = `vite@${version}`;
  const templateFlag = `--template ${template}`;

  switch (options.packageManager) {
    case "pnpm":
      return `pnpm create ${pkg} . -- ${templateFlag}`;
    case "yarn":
      return `yarn create vite@${version} . -- ${templateFlag}`;
    case "bun":
      return `bun create vite@${version} . -- ${templateFlag}`;
    case "npm":
    default:
      return `npm create ${pkg} . -- ${templateFlag}`;
  }
}

function createNextAppCommand(options: ScaffoldOptions): string {
  const version = sanitizeVersion(options.version);
  const pkg = `create-next-app@${version}`;
  const flags = [
    ".",
    options.typescript ? "--ts" : "--js",
    options.eslint ? "--eslint" : "--no-eslint",
    options.tailwind ? "--tailwind" : "--no-tailwind",
    options.appRouter ? "--app" : "--no-app",
    options.srcDir ? "--src-dir" : "--no-src-dir",
    '--import-alias "@/*"',
    `--use-${options.packageManager}`,
  ];
  if (options.turbopack) {
    flags.push("--turbopack");
  }
  flags.push("--yes");
  const flagStr = flags.join(" ");

  switch (options.packageManager) {
    case "pnpm":
      return `pnpm create next-app@${version} ${flagStr}`;
    case "yarn":
      return `yarn create next-app@${version} ${flagStr}`;
    case "bun":
      return `bunx --bun ${pkg} ${flagStr}`;
    case "npm":
    default:
      return `npx --yes ${pkg} ${flagStr}`;
  }
}

function createTanStackCommand(options: ScaffoldOptions): string {
  const version = sanitizeVersion(options.version);
  const pkg = `@tanstack/start@${version}`;

  switch (options.packageManager) {
    case "pnpm":
      return `pnpm create ${pkg} . --package-manager pnpm`;
    case "yarn":
      return `yarn create ${pkg} . --package-manager yarn`;
    case "bun":
      return `bun create ${pkg} . --package-manager bun`;
    case "npm":
    default:
      return `npm create ${pkg} . -- --package-manager npm`;
  }
}

/**
 * Build the non-interactive CLI for the selected scaffold template.
 * Files sync back to Convex after the command finishes in WebContainer.
 */
export function buildScaffoldCommand(
  templateId: ScaffoldTemplateId,
  options: ScaffoldOptions,
): string {
  switch (templateId) {
    case "nextjs":
      return createNextAppCommand(options);
    case "react":
      return createViteCommand(
        options,
        options.typescript ? "react-ts" : "react",
      );
    case "vite":
      return createViteCommand(
        options,
        options.typescript ? "vanilla-ts" : "vanilla",
      );
    case "tanstack":
      return createTanStackCommand(options);
  }
}

/** @deprecated Use buildScaffoldCommand("nextjs", options) */
export function buildCreateNextAppCommand(options: ScaffoldOptions): string {
  return buildScaffoldCommand("nextjs", options);
}

/** @deprecated Use DEFAULT_SCAFFOLD_OPTIONS */
export const DEFAULT_NEXT_SCAFFOLD = DEFAULT_SCAFFOLD_OPTIONS;

/** @deprecated Use NEXT_VERSION_PRESETS */
export const NEXT_VERSION_OPTIONS = NEXT_VERSION_PRESETS;

export type NextScaffoldOptions = ScaffoldOptions;
