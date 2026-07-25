import type { languages } from "monaco-editor";

/**
 * Lightweight Vue SFC highlighting (template / script / style regions).
 * Not a full Volar language service.
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
  tokenPostfix: ".vue",
  ignoreCase: true,
  tokenizer: {
    root: [
      [/<!--/, "comment", "@comment"],
      [/(<)(script)(\s*)(lang)(\s*=\s*)("[^"]*"|'[^']*')/, [
        "delimiter",
        "tag",
        "",
        "attribute.name",
        "delimiter",
        "attribute.value",
      ]],
      [/(<)(script)/, ["delimiter", { token: "tag", next: "@scriptTag" }]],
      [/(<)(style)/, ["delimiter", { token: "tag", next: "@styleTag" }]],
      [/(<)(template)/, ["delimiter", { token: "tag", next: "@templateTag" }]],
      [/(<\/)(script|style|template)(>)/, ["delimiter", "tag", "delimiter"]],
      [/(<)([\w.-]+)/, ["delimiter", { token: "tag", next: "@tag" }]],
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
        /([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
        ["attribute.name", "delimiter", "attribute.value"],
      ],
      [/[\w:-]+/, "attribute.name"],
      [/\/?>/, "delimiter", "@pop"],
    ],

    scriptTag: [
      [/\s+/, ""],
      [
        /([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
        ["attribute.name", "delimiter", "attribute.value"],
      ],
      [/[\w:-]+/, "attribute.name"],
      [/>/, { token: "delimiter", next: "@scriptBody" }],
      [/\/?>/, "delimiter", "@pop"],
    ],

    scriptBody: [
      [/<\/script\s*>/, { token: "tag", next: "@pop" }],
      [/[^<]+/, "source.js"],
      [/</, "source.js"],
    ],

    styleTag: [
      [/\s+/, ""],
      [
        /([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
        ["attribute.name", "delimiter", "attribute.value"],
      ],
      [/[\w:-]+/, "attribute.name"],
      [/>/, { token: "delimiter", next: "@styleBody" }],
      [/\/?>/, "delimiter", "@pop"],
    ],

    styleBody: [
      [/<\/style\s*>/, { token: "tag", next: "@pop" }],
      [/[^<]+/, "source.css"],
      [/</, "source.css"],
    ],

    templateTag: [
      [/\s+/, ""],
      [
        /([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/,
        ["attribute.name", "delimiter", "attribute.value"],
      ],
      [/[\w:-]+/, "attribute.name"],
      [/>/, { token: "delimiter", next: "@templateBody" }],
      [/\/?>/, "delimiter", "@pop"],
    ],

    templateBody: [
      [/<\/template\s*>/, { token: "tag", next: "@pop" }],
      [/<!--/, "comment", "@comment"],
      [/(<\/?)([\w.-]+)/, ["delimiter", { token: "tag", next: "@tag" }]],
      [/[^<]+/, ""],
      [/</, ""],
    ],
  },
};

let vueRegistered = false;

export function registerVueLanguage(
  monaco: typeof import("monaco-editor"),
): void {
  if (vueRegistered) return;
  monaco.languages.register({
    id: "vue",
    extensions: [".vue"],
    aliases: ["Vue", "vue"],
  });
  monaco.languages.setLanguageConfiguration("vue", vueLanguageConfig);
  monaco.languages.setMonarchTokensProvider("vue", vueMonarchTokens);
  vueRegistered = true;
}
