import type { CSSProperties } from "react";
import type { ITheme } from "@xterm/xterm";

import {
  TERMINAL_THEME_DARK,
  TERMINAL_THEME_LIGHT,
} from "@/features/workspace/lib/terminal/themes";

export type TerminalSessionPalette = {
  /** Accent used for tab chrome and cursor. */
  accent: string;
  /** xterm background in dark / light app themes. */
  darkBackground: string;
  lightBackground: string;
  /** Selection tint in dark / light. */
  darkSelection: string;
  lightSelection: string;
};

/** Distinct terminal session accents — cycled for each new tab. */
export const TERMINAL_SESSION_PALETTE: TerminalSessionPalette[] = [
  {
    accent: "#9b87f5",
    darkBackground: "#0e0d14",
    lightBackground: "#faf8ff",
    darkSelection: "#4c1d95",
    lightSelection: "#e9d5ff",
  },
  {
    accent: "#2dd4bf",
    darkBackground: "#0a1214",
    lightBackground: "#f0fdf9",
    darkSelection: "#115e59",
    lightSelection: "#ccfbf1",
  },
  {
    accent: "#fb7185",
    darkBackground: "#140a10",
    lightBackground: "#fff1f2",
    darkSelection: "#881337",
    lightSelection: "#fecdd3",
  },
  {
    accent: "#fbbf24",
    darkBackground: "#12100a",
    lightBackground: "#fffbeb",
    darkSelection: "#78350f",
    lightSelection: "#fde68a",
  },
  {
    accent: "#60a5fa",
    darkBackground: "#0a0e14",
    lightBackground: "#eff6ff",
    darkSelection: "#1e3a8a",
    lightSelection: "#bfdbfe",
  },
  {
    accent: "#4ade80",
    darkBackground: "#0a140e",
    lightBackground: "#f0fdf4",
    darkSelection: "#14532d",
    lightSelection: "#bbf7d0",
  },
  {
    accent: "#fb923c",
    darkBackground: "#140e0a",
    lightBackground: "#fff7ed",
    darkSelection: "#7c2d12",
    lightSelection: "#fed7aa",
  },
  {
    accent: "#e879f9",
    darkBackground: "#140a14",
    lightBackground: "#fdf4ff",
    darkSelection: "#701a75",
    lightSelection: "#f5d0fe",
  },
];

export function getSessionPalette(colorIndex: number): TerminalSessionPalette {
  const palette = TERMINAL_SESSION_PALETTE;
  return palette[((colorIndex % palette.length) + palette.length) % palette.length]!;
}

export function getSessionTerminalTheme(
  colorIndex: number,
  isDark: boolean,
): ITheme {
  const entry = getSessionPalette(colorIndex);
  const base = isDark ? TERMINAL_THEME_DARK : TERMINAL_THEME_LIGHT;
  return {
    ...base,
    background: isDark ? entry.darkBackground : entry.lightBackground,
    cursor: entry.accent,
    cursorAccent: isDark ? entry.darkBackground : entry.lightBackground,
    selectionBackground: isDark ? entry.darkSelection : entry.lightSelection,
    blue: entry.accent,
    brightBlue: entry.accent,
  };
}

export function getSessionTabStyles(
  colorIndex: number,
  active: boolean,
): CSSProperties {
  const entry = getSessionPalette(colorIndex);
  if (active) {
    return {
      backgroundColor: `${entry.accent}22`,
      color: entry.accent,
      boxShadow: `inset 0 0 0 1px ${entry.accent}55`,
    };
  }
  return {
    color: `${entry.accent}cc`,
  };
}

export function getSessionPanelBackground(
  colorIndex: number,
  isDark: boolean,
): string {
  const entry = getSessionPalette(colorIndex);
  return isDark ? entry.darkBackground : entry.lightBackground;
}
