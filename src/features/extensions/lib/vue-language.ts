import type { languages } from "monaco-editor";

/**
 * Vue SFC highlighting. Grammar mirrors Monaco’s HTML/JS Monarch style
 * (no lookaheads, no /i flags, no RegExp rule objects).
 */
const vueLanguageConfig: languages.LanguageConfiguration = {
  comments: {
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
    ["<", ">"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: "`", close: "`" },
    { open: "<!--", close: "-->" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: "`", close: "`" },
    { open: "<", close: ">" },
  ],
};

const vueMonarchTokens: languages.IMonarchLanguage = {
  defaultToken: "",
  tokenizer: {
    root: [
      [/<!--/, "comment", "@comment"],
      [/(<)(script)/, ["delimiter.html", { token: "tag", next: "@script" }]],
      [/(<)(style)/, ["delimiter.html", { token: "tag", next: "@style" }]],
      [/(<)(template)/, ["delimiter.html", { token: "tag", next: "@template" }]],
      [/(<\/)(script|style|template)(>)/, ["delimiter.html", "tag", "delimiter.html"]],
      [/(<)([\w.-]+)/, ["delimiter.html", { token: "tag", next: "@tag" }]],
      [/(<\/)([\w.-]+)(>)/, ["delimiter.html", "tag", "delimiter.html"]],
      [/[^<]+/, ""],
    ],

    comment: [
      [/-->/, "comment", "@pop"],
      [/[^-]+/, "comment"],
      [/./, "comment"],
    ],

    tag: [
      [/\s+/, ""],
      [
        /([\w:@#-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
        ["attribute.name", "delimiter", "attribute.value"],
      ],
      [/[\w:@#-]+/, "attribute.name"],
      [/\/?>/, "delimiter.html", "@pop"],
    ],

    script: [
      [/\s+/, ""],
      [
        /([\w:@#-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
        ["attribute.name", "delimiter", "attribute.value"],
      ],
      [/[\w:@#-]+/, "attribute.name"],
      [/>/, { token: "delimiter.html", switchTo: "@scriptBody" }],
      [/\/?>/, "delimiter.html", "@pop"],
    ],

    scriptBody: [
      [/<\/script\s*>/, { token: "tag", next: "@pop" }],
      [/\/\/.*$/, "comment"],
      [/\/\*/, "comment", "@jsComment"],
      [/"([^"\\]|\\.)*"/, "string"],
      [/'([^'\\]|\\.)*'/, "string"],
      [/`/, "string", "@jsTemplate"],
      [
        /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|return|set|static|super|switch|this|throw|true|try|typeof|undefined|var|void|while|with|yield|type|keyof|readonly|any|string|number|boolean|object)\b/,
        "keyword",
      ],
      [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, "number"],
      [/[{}()\[\]]/, "delimiter"],
      [/[;,.]/, "delimiter"],
      [/[+\-*%=<>!&|?~^]+/, "operator"],
      [/\//, "operator"],
      [/[a-zA-Z_$][\w$]*/, "variable"],
      [/\s+/, ""],
      [/./, ""],
    ],

    jsComment: [
      [/\*\//, "comment", "@pop"],
      [/[^*]+/, "comment"],
      [/./, "comment"],
    ],

    jsTemplate: [
      [/\$\{/, { token: "delimiter", next: "@jsTemplateExpr" }],
      [/`/, "string", "@pop"],
      [/\\./, "string.escape"],
      [/[^`\\$]+/, "string"],
      [/\$/, "string"],
    ],

    jsTemplateExpr: [
      [/\}/, "delimiter", "@pop"],
      [
        /\b(const|let|var|function|return|true|false|null|undefined|typeof|new|this|async|await)\b/,
        "keyword",
      ],
      [/"([^"\\]|\\.)*"/, "string"],
      [/'([^'\\]|\\.)*'/, "string"],
      [/\b\d+(\.\d+)?\b/, "number"],
      [/[a-zA-Z_$][\w$]*/, "variable"],
      [/./, ""],
    ],

    style: [
      [/\s+/, ""],
      [
        /([\w:@#-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
        ["attribute.name", "delimiter", "attribute.value"],
      ],
      [/[\w:@#-]+/, "attribute.name"],
      [/>/, { token: "delimiter.html", switchTo: "@styleBody" }],
      [/\/?>/, "delimiter.html", "@pop"],
    ],

    styleBody: [
      [/<\/style\s*>/, { token: "tag", next: "@pop" }],
      [/\/\*/, "comment", "@cssComment"],
      [/"([^"\\]|\\.)*"/, "string"],
      [/'([^'\\]|\\.)*'/, "string"],
      [/#([0-9a-fA-F]{3,8})\b/, "number"],
      [/\d+(\.\d+)?(px|em|rem|vh|vw|deg|s|ms|%)?/, "number"],
      [
        /\b(color|background|border|margin|padding|display|flex|grid|width|height|font|position|opacity|overflow|gap|cursor|content)\b/,
        "attribute.name",
      ],
      [/[.#a-zA-Z_-][\w-]*/, "tag"],
      [/[{}();:,]/, "delimiter"],
      [/\s+/, ""],
      [/./, ""],
    ],

    cssComment: [
      [/\*\//, "comment", "@pop"],
      [/[^*]+/, "comment"],
      [/./, "comment"],
    ],

    template: [
      [/\s+/, ""],
      [
        /([\w:@#-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
        ["attribute.name", "delimiter", "attribute.value"],
      ],
      [/[\w:@#-]+/, "attribute.name"],
      [/>/, { token: "delimiter.html", switchTo: "@templateBody" }],
      [/\/?>/, "delimiter.html", "@pop"],
    ],

    templateBody: [
      [/<\/template\s*>/, { token: "tag", next: "@pop" }],
      [/<!--/, "comment", "@comment"],
      [/\{\{/, "delimiter", "@mustache"],
      [/(<\/?)([\w.-]+)/, ["delimiter.html", { token: "tag", next: "@tag" }]],
      [/[^<{]+/, ""],
      [/./, ""],
    ],

    mustache: [
      [/\}\}/, "delimiter", "@pop"],
      [
        /\b(const|let|var|function|return|true|false|null|undefined|typeof|new|this)\b/,
        "keyword",
      ],
      [/"([^"\\]|\\.)*"/, "string"],
      [/'([^'\\]|\\.)*'/, "string"],
      [/\b\d+(\.\d+)?\b/, "number"],
      [/[a-zA-Z_$][\w$]*/, "variable"],
      [/./, ""],
    ],
  },
};

let vueRegistered = false;

function monarchErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return "Monarch compile failed";
    }
  }
  return "Monarch compile failed";
}

export function registerVueLanguage(
  monaco: typeof import("monaco-editor"),
): void {
  try {
    if (!vueRegistered) {
      monaco.languages.register({
        id: "vue",
        extensions: [".vue"],
        aliases: ["Vue", "vue"],
        mimetypes: ["text/x-vue"],
      });
      vueRegistered = true;
    }
    monaco.languages.setLanguageConfiguration("vue", vueLanguageConfig);
    monaco.languages.setMonarchTokensProvider("vue", vueMonarchTokens);
  } catch (error) {
    console.error("[vue-language]", monarchErrorMessage(error), error);
  }
}

/** Point every open .vue model at the vue language id (or plaintext when off). */
export function syncVueModelsLanguage(
  monaco: typeof import("monaco-editor"),
  enabled: boolean,
): void {
  const next = enabled ? "vue" : "plaintext";
  for (const model of monaco.editor.getModels()) {
    const path = model.uri.path.toLowerCase();
    if (!path.endsWith(".vue")) continue;
    if (model.getLanguageId() !== next) {
      try {
        monaco.editor.setModelLanguage(model, next);
      } catch (error) {
        console.error("[vue-language] setModelLanguage", error);
      }
    }
  }
}
