/**
 * xterm measures fonts on a canvas — CSS `var(...)` in fontFamily does not
 * resolve there, so we read the real family name from the document.
 *
 * DomRenderer adds `letterSpacing` to the *device* cell width (no DPR multiply),
 * so we convert desired CSS px → device px ourselves.
 */

const FALLBACK_STACK =
  '"JetBrains Mono", ui-monospace, Menlo, Monaco, Consolas, monospace';

/**
 * Resolve the terminal monospace stack from CSS custom properties set by
 * next/font (JetBrains Mono). No local font download needed.
 */
export function resolveTerminalFontFamily(
  root: HTMLElement = document.documentElement,
): string {
  const styles = getComputedStyle(root);
  const jetbrains = styles.getPropertyValue("--font-jetbrains-mono").trim();
  const terminal = styles.getPropertyValue("--font-terminal").trim();

  if (jetbrains) {
    return `${jetbrains}, ${FALLBACK_STACK}`;
  }
  if (terminal && !terminal.includes("var(")) {
    return terminal;
  }
  return FALLBACK_STACK;
}

/**
 * Desired extra gap between glyphs, in CSS pixels.
 * Reference UI is roughly ~½ cell of air between characters.
 */
export const TERMINAL_LETTER_SPACING_CSS_PX = 0

/**
 * xterm DomRenderer expects letterSpacing in device pixels
 * (`device.cell.width = device.char.width + letterSpacing`).
 */
export function resolveTerminalLetterSpacing(
  cssPx: number = TERMINAL_LETTER_SPACING_CSS_PX,
  dpr: number = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
): number {
  return Math.max(0, Math.round(cssPx * dpr));
}
