import type { Monaco } from "@monaco-editor/react";

/**
 * Model URI for Monaco. Must keep a real file extension (.tsx/.jsx/.css)
 * so language services enable JSX parsing and CSS features.
 */
export function monacoModelPath(filePath: string): string {
  const cleaned = filePath.replace(/^\/+/, "").replace(/\\/g, "/");
  return `file:///${cleaned}`;
}

/**
 * Configure Monaco language services for React (JSX/TSX), HTML, and CSS.
 * Monaco 0.56+ uses top-level `monaco.typescript` / `monaco.css` / `monaco.html`.
 */
export function configureMonacoLanguages(monaco: Monaco) {
  try {
    configureTypescriptReact(monaco);
  } catch (error) {
    console.warn("[editor] TypeScript language service setup failed", error);
  }
  try {
    configureHtml(monaco);
  } catch (error) {
    console.warn("[editor] HTML language service setup failed", error);
  }
  try {
    configureCss(monaco);
  } catch (error) {
    console.warn("[editor] CSS language service setup failed", error);
  }
}

function configureTypescriptReact(monaco: Monaco) {
  const ts = monaco.typescript;

  const compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    // Preserve keeps JSX in the AST so checkers + highlighters work well.
    jsx: ts.JsxEmit.Preserve,
    jsxFactory: "React.createElement",
    jsxFragmentFactory: "React.Fragment",
    reactNamespace: "React",
    allowJs: true,
    checkJs: false,
    allowNonTsExtensions: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    isolatedModules: true,
    noEmit: true,
    strict: false,
  };

  ts.typescriptDefaults.setCompilerOptions(compilerOptions);
  ts.javascriptDefaults.setCompilerOptions(compilerOptions);

  const diagnostics = {
    noSemanticValidation: true,
    noSyntaxValidation: false,
    // Don't spam about missing React types in a cloud IDE without node_modules.
    diagnosticCodesToIgnore: [
      2307, // Cannot find module
      2304, // Cannot find name
      2339, // Property does not exist
      2695, // Left side of comma
      2792, // Cannot find module (node resolution)
    ],
  };
  ts.typescriptDefaults.setDiagnosticsOptions(diagnostics);
  ts.javascriptDefaults.setDiagnosticsOptions(diagnostics);

  ts.typescriptDefaults.setEagerModelSync(true);
  ts.javascriptDefaults.setEagerModelSync(true);

  // Ambient React / JSX with explicit HTML tags so IntelliSense lists them
  // when typing `<` (index-signature-only IntrinsicElements gives weak completions).
  const reactShim = `
declare namespace React {
  type ReactNode =
    | string
    | number
    | boolean
    | null
    | undefined
    | ReactElement
    | ReactNode[];
  interface ReactElement<P = any> {
    type: any;
    props: P;
    key: string | number | null;
  }
  type FC<P = {}> = (props: P) => ReactElement | null;
  type FormEvent<T = Element> = any;
  type ChangeEvent<T = Element> = any;
  type MouseEvent<T = Element> = any;
  type KeyboardEvent<T = Element> = any;
  type CSSProperties = { [key: string]: string | number | undefined };
  function createElement(
    type: any,
    props?: any,
    ...children: ReactNode[]
  ): ReactElement;
  function useState<T>(
    initial: T | (() => T),
  ): [T, (value: T | ((prev: T) => T)) => void];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useMemo<T>(factory: () => T, deps: any[]): T;
  function useCallback<T extends (...fns: any[]) => any>(fn: T, deps: any[]): T;
  function useRef<T>(initial: T): { current: T };
  const Fragment: unique symbol;
}

type HtmlAttrs = {
  children?: React.ReactNode;
  className?: string;
  class?: string;
  id?: string;
  style?: React.CSSProperties | string;
  key?: string | number | null;
  role?: string;
  title?: string;
  tabIndex?: number;
  onClick?: (event: any) => void;
  onChange?: (event: any) => void;
  onSubmit?: (event: any) => void;
  onKeyDown?: (event: any) => void;
  [attr: string]: any;
};

declare namespace JSX {
  interface Element extends React.ReactElement {}
  interface ElementClass {
    render(): React.ReactNode;
  }
  interface ElementAttributesProperty {
    props: {};
  }
  interface ElementChildrenAttribute {
    children: {};
  }
  interface IntrinsicAttributes {
    key?: string | number | null;
  }
  interface IntrinsicClassAttributes<T> {
    ref?: any;
  }
  interface IntrinsicElements {
    // Document
    html: HtmlAttrs;
    head: HtmlAttrs;
    body: HtmlAttrs;
    title: HtmlAttrs;
    meta: HtmlAttrs;
    link: HtmlAttrs;
    style: HtmlAttrs;
    script: HtmlAttrs;
    noscript: HtmlAttrs;
    base: HtmlAttrs;
    // Sections
    div: HtmlAttrs;
    span: HtmlAttrs;
    main: HtmlAttrs;
    section: HtmlAttrs;
    article: HtmlAttrs;
    aside: HtmlAttrs;
    header: HtmlAttrs;
    footer: HtmlAttrs;
    nav: HtmlAttrs;
    h1: HtmlAttrs;
    h2: HtmlAttrs;
    h3: HtmlAttrs;
    h4: HtmlAttrs;
    h5: HtmlAttrs;
    h6: HtmlAttrs;
    p: HtmlAttrs;
    pre: HtmlAttrs;
    code: HtmlAttrs;
    blockquote: HtmlAttrs;
    ul: HtmlAttrs;
    ol: HtmlAttrs;
    li: HtmlAttrs;
    dl: HtmlAttrs;
    dt: HtmlAttrs;
    dd: HtmlAttrs;
    // Text / media
    a: HtmlAttrs & { href?: string; target?: string; rel?: string };
    img: HtmlAttrs & { src?: string; alt?: string; width?: number | string; height?: number | string };
    picture: HtmlAttrs;
    source: HtmlAttrs;
    video: HtmlAttrs;
    audio: HtmlAttrs;
    canvas: HtmlAttrs;
    iframe: HtmlAttrs;
    svg: HtmlAttrs;
    path: HtmlAttrs;
    // Forms
    form: HtmlAttrs;
    label: HtmlAttrs & { htmlFor?: string; for?: string };
    input: HtmlAttrs & { type?: string; value?: string | number; placeholder?: string; name?: string; checked?: boolean; disabled?: boolean };
    textarea: HtmlAttrs;
    select: HtmlAttrs;
    option: HtmlAttrs;
    button: HtmlAttrs & { type?: "button" | "submit" | "reset"; disabled?: boolean };
    // Tables
    table: HtmlAttrs;
    thead: HtmlAttrs;
    tbody: HtmlAttrs;
    tfoot: HtmlAttrs;
    tr: HtmlAttrs;
    th: HtmlAttrs;
    td: HtmlAttrs;
    // Misc
    br: HtmlAttrs;
    hr: HtmlAttrs;
    strong: HtmlAttrs;
    em: HtmlAttrs;
    small: HtmlAttrs;
    mark: HtmlAttrs;
    time: HtmlAttrs;
    details: HtmlAttrs;
    summary: HtmlAttrs;
    dialog: HtmlAttrs;
    template: HtmlAttrs;
    slot: HtmlAttrs;
    // Catch-all for custom / unknown tags
    [elemName: string]: HtmlAttrs;
  }
}
`;

  const shimUri = "file:///node_modules/@types/react/index.d.ts";
  ts.typescriptDefaults.addExtraLib(reactShim, shimUri);
  ts.javascriptDefaults.addExtraLib(reactShim, shimUri);
}

function configureHtml(monaco: Monaco) {
  // Monaco 0.56+: language services live on top-level namespaces.
  const html = (monaco as Monaco & {
    html?: {
      htmlDefaults?: {
        setOptions: (options: {
          format?: Record<string, unknown>;
          suggest?: Record<string, boolean>;
        }) => void;
        setModeConfiguration?: (config: Record<string, boolean>) => void;
      };
    };
  }).html;
  if (!html?.htmlDefaults) return;

  html.htmlDefaults.setModeConfiguration?.({
    completionItems: true,
    hovers: true,
    documentSymbols: true,
    links: true,
    documentHighlights: true,
    rename: true,
    colors: true,
    foldingRanges: true,
    diagnostics: true,
    selectionRanges: true,
    documentFormattingEdits: true,
    documentRangeFormattingEdits: true,
  });

  html.htmlDefaults.setOptions({
    format: {
      tabSize: 2,
      insertSpaces: true,
      wrapLineLength: 120,
      unformatted: 'default,"wbr"',
      contentUnformatted: "pre,code,textarea",
      indentInnerHtml: false,
      preserveNewLines: true,
      maxPreserveNewLines: undefined,
      indentHandlebars: false,
      endWithNewline: false,
      extraLiners: "head, body, /html",
      wrapAttributes: "auto",
    },
    suggest: {
      html5: true,
      angular1: false,
      ionic: false,
    },
  });
}

function configureCss(monaco: Monaco) {
  const css = monaco.css;

  const modeConfiguration = {
    completionItems: true,
    hovers: true,
    documentSymbols: true,
    definitions: true,
    references: true,
    documentHighlights: true,
    rename: true,
    colors: true,
    foldingRanges: true,
    diagnostics: true,
    selectionRanges: true,
    documentFormattingEdits: true,
    documentRangeFormattingEdits: true,
  };

  css.cssDefaults.setModeConfiguration(modeConfiguration);
  css.scssDefaults.setModeConfiguration(modeConfiguration);
  css.lessDefaults.setModeConfiguration(modeConfiguration);

  css.cssDefaults.setOptions({
    validate: true,
    lint: {
      compatibleVendorPrefixes: "ignore",
      vendorPrefix: "warning",
      duplicateProperties: "warning",
      emptyRules: "warning",
      importStatement: "ignore",
      boxModel: "ignore",
      universalSelector: "ignore",
      zeroUnits: "ignore",
      fontFaceProperties: "warning",
      hexColorLength: "error",
      argumentsInColorFunction: "error",
      unknownProperties: "warning",
      ieHack: "ignore",
      unknownVendorSpecificProperties: "ignore",
      propertyIgnoredDueToDisplay: "warning",
      important: "ignore",
      float: "ignore",
      idSelector: "ignore",
    },
  });

  css.scssDefaults.setOptions({ validate: true });
  css.lessDefaults.setOptions({ validate: true });
}
