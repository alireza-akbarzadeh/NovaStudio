export type ProjectDocSlot = "readme" | "contributing" | "license";

export type ProjectDocSlotDef = {
  slot: ProjectDocSlot;
  label: string;
  paths: readonly string[];
  defaultPath: string;
  isMarkdown: boolean;
  defaultContent: string;
};

export const PROJECT_DOC_SLOTS: readonly ProjectDocSlotDef[] = [
  {
    slot: "readme",
    label: "README",
    paths: ["README.md", "readme.md"],
    defaultPath: "README.md",
    isMarkdown: true,
    defaultContent: `# Project README

Describe what this project does, how to run it locally, and how to deploy.

## Getting started

1. Clone the repository
2. Install dependencies
3. Run the dev server
`,
  },
  {
    slot: "contributing",
    label: "Contributing",
    paths: ["CONTRIBUTING.md", "contributing.md"],
    defaultPath: "CONTRIBUTING.md",
    isMarkdown: true,
    defaultContent: `# Contributing

Thanks for your interest in contributing!

## How to contribute

1. Request access from the project owner in NovaStudio Community
2. Fork or branch from \`main\`
3. Open a pull request with a clear description

## Code style

- Keep changes focused and well-tested
- Follow existing patterns in the codebase
`,
  },
  {
    slot: "license",
    label: "License",
    paths: ["LICENSE", "LICENSE.md", "LICENSE.txt"],
    defaultPath: "LICENSE",
    isMarkdown: false,
    defaultContent: `MIT License

Copyright (c) ${new Date().getFullYear()} Project contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  },
] as const;

export const ALL_PROJECT_DOC_PATHS = PROJECT_DOC_SLOTS.flatMap(
  (slot) => slot.paths,
);

export function slotForPath(path: string): ProjectDocSlotDef | undefined {
  const normalized = path.trim().replace(/^\/+/, "");
  return PROJECT_DOC_SLOTS.find((slot) =>
    slot.paths.some(
      (candidate) => candidate.toLowerCase() === normalized.toLowerCase(),
    ),
  );
}
