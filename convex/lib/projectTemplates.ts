import { v } from "convex/values";

export const TEMPLATE_IDS = [
  "empty",
  "simple",
  "static",
  "vite",
  "node",
  "react",
  "nextjs",
  "tanstack",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const templateIdValidator = v.union(
  v.literal("empty"),
  v.literal("simple"),
  v.literal("static"),
  v.literal("vite"),
  v.literal("node"),
  v.literal("react"),
  v.literal("nextjs"),
  v.literal("tanstack"),
);

export type TemplateCategory =
  | "blank"
  | "frontend"
  | "backend"
  | "fullstack";

export type SeedNode = {
  name: string;
  path?: string;
  children?: SeedNode[];
};

export type ProjectTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  /** When false, kept for existing projects but hidden from the gallery. */
  listed?: boolean;
  tree: SeedNode[];
  content: Record<string, string>;
};

const EMPTY: ProjectTemplate = {
  id: "empty",
  name: "Empty",
  description: "Blank workspace — start from scratch with no files",
  category: "blank",
  tags: ["Blank"],
  tree: [],
  content: {},
};

/** @deprecated Prefer `node` or `static`. Kept for existing projects. */
const SIMPLE: ProjectTemplate = {
  id: "simple",
  name: "Simple project",
  description: "A minimal starter with a README and entry file",
  category: "blank",
  tags: ["Minimal"],
  listed: false,
  tree: [
    { name: "src", children: [{ name: "index.ts", path: "src/index.ts" }] },
    { name: "package.json", path: "package.json" },
    { name: "README.md", path: "README.md" },
  ],
  content: {
    "src/index.ts": `export function main() {
  console.log("Hello from NovaStudio");
}

main();
`,
    "package.json": `{
  "name": "novastudio-simple",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/index.ts"
  }
}
`,
    "README.md": `# Simple project

A minimal NovaStudio workspace. Open files from the tree to start editing.
`,
  },
};

const STATIC: ProjectTemplate = {
  id: "static",
  name: "Static",
  description: "Plain HTML, CSS, and JavaScript — no build step",
  category: "frontend",
  tags: ["HTML", "CSS", "JS"],
  tree: [
    { name: "index.html", path: "index.html" },
    { name: "styles.css", path: "styles.css" },
    { name: "main.js", path: "main.js" },
    { name: "README.md", path: "README.md" },
  ],
  content: {
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Static site</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main class="page">
      <h1>Static site</h1>
      <p>Edit <code>index.html</code>, <code>styles.css</code>, or <code>main.js</code>.</p>
      <button type="button" id="click-me">Click me</button>
    </main>
    <script type="module" src="./main.js"></script>
  </body>
</html>
`,
    "styles.css": `:root {
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  line-height: 1.5;
  color: #0a0a0a;
  background: #fafafa;
}

body {
  margin: 0;
}

.page {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

button {
  justify-self: center;
  cursor: pointer;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: #fff;
  padding: 0.5rem 1rem;
  font: inherit;
}

button:hover {
  background: #f5f5f5;
}
`,
    "main.js": `const button = document.getElementById("click-me");

button?.addEventListener("click", () => {
  button.textContent = "Clicked!";
});
`,
    "README.md": `# Static site

Plain HTML / CSS / JS created in NovaStudio. Open the Preview pane to view it.
`,
  },
};

const VITE: ProjectTemplate = {
  id: "vite",
  name: "Vite",
  description:
    "Scaffolds with create-vite in your workspace terminal",
  category: "frontend",
  tags: ["Vite", "TypeScript", "CLI"],
  tree: [
    {
      name: "src",
      children: [
        { name: "main.ts", path: "src/main.ts" },
        { name: "style.css", path: "src/style.css" },
      ],
    },
    { name: "index.html", path: "index.html" },
    { name: "package.json", path: "package.json" },
    { name: "vite.config.ts", path: "vite.config.ts" },
    { name: "tsconfig.json", path: "tsconfig.json" },
    { name: "README.md", path: "README.md" },
  ],
  content: {
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
    "src/main.ts": `import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = \`
    <main class="page">
      <h1>Vite</h1>
      <p>Edit <code>src/main.ts</code> to get started.</p>
      <button type="button" id="counter">Count is 0</button>
    </main>
  \`;

  const button = app.querySelector<HTMLButtonElement>("#counter");
  let count = 0;
  button?.addEventListener("click", () => {
    count += 1;
    if (button) button.textContent = \`Count is \${count}\`;
  });
}
`,
    "src/style.css": `:root {
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  line-height: 1.5;
  color: #0a0a0a;
  background: #fafafa;
}

body {
  margin: 0;
}

.page {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

button {
  justify-self: center;
  cursor: pointer;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: #fff;
  padding: 0.5rem 1rem;
  font: inherit;
}

button:hover {
  background: #f5f5f5;
}
`,
    "package.json": `{
  "name": "novastudio-vite",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  }
}
`,
    "vite.config.ts": `import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
  },
});
`,
    "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["src"]
}
`,
    "README.md": `# Vite

Vanilla TypeScript starter created in NovaStudio.

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  },
};

const NODE: ProjectTemplate = {
  id: "node",
  name: "Node",
  description: "TypeScript Node.js script with npm start",
  category: "backend",
  tags: ["Node", "TypeScript"],
  tree: [
    {
      name: "src",
      children: [{ name: "index.ts", path: "src/index.ts" }],
    },
    { name: "package.json", path: "package.json" },
    { name: "tsconfig.json", path: "tsconfig.json" },
    { name: "README.md", path: "README.md" },
  ],
  content: {
    "src/index.ts": `export function main() {
  console.log("Hello from Node");
}

main();
`,
    "package.json": `{
  "name": "novastudio-node",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node --experimental-strip-types src/index.ts",
    "dev": "node --watch --experimental-strip-types src/index.ts"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
`,
    "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src"]
}
`,
    "README.md": `# Node

TypeScript Node starter created in NovaStudio.

Use the Terminal to run scripts — this template has no browser preview.

\`\`\`bash
npm install
npm start
\`\`\`
`,
  },
};

const NEXTJS: ProjectTemplate = {
  id: "nextjs",
  name: "Next.js",
  description:
    "Scaffolds a real Next.js app with create-next-app in your workspace terminal",
  category: "fullstack",
  tags: ["Next.js", "React", "TypeScript", "CLI"],
  tree: [],
  content: {},
};

const REACT: ProjectTemplate = {
  id: "react",
  name: "React",
  description:
    "Scaffolds React with create-vite in your workspace terminal",
  category: "frontend",
  tags: ["React", "Vite", "TypeScript", "CLI"],
  tree: [
    {
      name: "src",
      children: [
        { name: "main.tsx", path: "src/main.tsx" },
        { name: "App.tsx", path: "src/App.tsx" },
        { name: "index.css", path: "src/index.css" },
      ],
    },
    { name: "index.html", path: "index.html" },
    { name: "package.json", path: "package.json" },
    { name: "vite.config.ts", path: "vite.config.ts" },
    { name: "tsconfig.json", path: "tsconfig.json" },
    { name: "README.md", path: "README.md" },
  ],
  content: {
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "src/main.tsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    "src/App.tsx": `export default function App() {
  return (
    <main className="app">
      <h1>React</h1>
      <p>Edit <code>src/App.tsx</code> to get started.</p>
    </main>
  );
}
`,
    "src/index.css": `:root {
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  line-height: 1.5;
  color: #0a0a0a;
  background: #fafafa;
}

body {
  margin: 0;
}

.app {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 0.75rem;
  padding: 2rem;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
`,
    "package.json": `{
  "name": "novastudio-react",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  }
}
`,
    "vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
});
`,
    "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
`,
    "README.md": `# React

React + Vite starter created in NovaStudio.

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  },
};

const TANSTACK: ProjectTemplate = {
  id: "tanstack",
  name: "TanStack Start",
  description:
    "Scaffolds TanStack Start with create in your workspace terminal",
  category: "fullstack",
  tags: ["TanStack", "React", "CLI"],
  tree: [
    {
      name: "src",
      children: [
        {
          name: "routes",
          children: [
            { name: "__root.tsx", path: "src/routes/__root.tsx" },
            { name: "index.tsx", path: "src/routes/index.tsx" },
          ],
        },
        { name: "router.tsx", path: "src/router.tsx" },
        { name: "styles.css", path: "src/styles.css" },
      ],
    },
    { name: "package.json", path: "package.json" },
    { name: "tsconfig.json", path: "tsconfig.json" },
    { name: "vite.config.ts", path: "vite.config.ts" },
    { name: "README.md", path: "README.md" },
  ],
  content: {
    "src/routes/__root.tsx": `import { Outlet, createRootRoute } from "@tanstack/react-router";
import "../styles.css";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <html lang="en">
      <body>
        <Outlet />
      </body>
    </html>
  );
}
`,
    "src/routes/index.tsx": `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="page">
      <h1>TanStack Start</h1>
      <p>
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
    </main>
  );
}
`,
    "src/router.tsx": `import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
`,
    "src/styles.css": `:root {
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  line-height: 1.5;
  color: #111;
  background: #fff;
}

body {
  margin: 0;
}

.page {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 0.75rem;
  padding: 2rem;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
`,
    "package.json": `{
  "name": "novastudio-tanstack",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-router": "^1.120.0",
    "@tanstack/react-start": "^1.120.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "vite-tsconfig-paths": "^5.0.0"
  }
}
`,
    "tsconfig.json": `{
  "compilerOptions": {
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "target": "ES2022",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true
  }
}
`,
    "vite.config.ts": `import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    host: true,
    port: 3000,
  },
  plugins: [tsConfigPaths(), tanstackStart(), viteReact()],
});
`,
    "README.md": `# TanStack Start

File-based routing starter created in NovaStudio.

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  },
};

/** Gallery display order (listed templates only). */
const GALLERY_ORDER: TemplateId[] = [
  "react",
  "vite",
  "nextjs",
  "node",
  "static",
  "tanstack",
  "empty",
];

export const PROJECT_TEMPLATES: Record<TemplateId, ProjectTemplate> = {
  empty: EMPTY,
  simple: SIMPLE,
  static: STATIC,
  vite: VITE,
  node: NODE,
  react: REACT,
  nextjs: NEXTJS,
  tanstack: TANSTACK,
};

export const DEFAULT_TEMPLATE_ID: TemplateId = "react";

export function getTemplate(templateId: TemplateId): ProjectTemplate {
  return PROJECT_TEMPLATES[templateId];
}

export function listTemplateMeta() {
  return GALLERY_ORDER.map((id) => {
    const template = PROJECT_TEMPLATES[id];
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
    };
  });
}

export function isTemplateId(value: string): value is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(value);
}
