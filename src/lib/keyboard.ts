/** Platform-aware modifier key helpers (⌘ on Apple, Ctrl on Windows/Linux). */

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  const platform = navigator.platform ?? "";
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS|iPhone|iPad/i.test(ua);
}

/** True when the primary modifier is held (⌘ on Apple, Ctrl on Windows/Linux). */
export function eventHasModKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

/** Primary chord for Search Everywhere — Ctrl+Shift+F on Windows/Linux. */
export const SEARCH_EVERYWHERE_CHORD = "mod+shift+f";

/** Alternate chords that also open Search Everywhere. */
export const SEARCH_EVERYWHERE_ALIASES = ["mod+shift+p"] as const;

const SEARCH_EVERYWHERE_CHORDS = [
  SEARCH_EVERYWHERE_CHORD,
  ...SEARCH_EVERYWHERE_ALIASES,
] as const;

function keyTokenFromKeyboardEvent(event: KeyboardEvent): string | null {
  const key = event.key;
  if (key === "Escape" || key === "Esc") return "escape";
  if (key === ",") return ",";
  if (key === ".") return ".";
  if (key.length === 1) {
    const lower = key.toLowerCase();
    if (/[a-z0-9]/.test(lower)) return lower;
  }

  // Physical key fallback — more reliable on Windows with some layouts.
  const { code } = event;
  if (code.startsWith("Key") && code.length === 4) {
    return code.slice(3).toLowerCase();
  }
  if (code.startsWith("Digit") && code.length === 6) {
    return code.slice(5);
  }
  if (code === "Comma") return ",";
  if (code === "Period") return ".";
  if (code === "Escape") return "escape";
  return null;
}

/**
 * Normalize a keydown event to a chord like `mod+shift+p`.
 * `mod` means ⌘ on Apple and Ctrl on Windows/Linux.
 */
export function normalizeModChord(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (eventHasModKey(event)) parts.push("mod");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");

  const key = keyTokenFromKeyboardEvent(event);
  if (!key) {
    return parts.join("+");
  }
  if (key === "control" || key === "meta" || key === "alt" || key === "shift") {
    return parts.join("+");
  }
  parts.push(key);
  return parts.join("+");
}

export function isSearchEverywhereShortcut(event: KeyboardEvent): boolean {
  const chord = normalizeModChord(event);
  return (SEARCH_EVERYWHERE_CHORDS as readonly string[]).includes(chord);
}

export function matchesModChord(
  event: KeyboardEvent,
  chord: string,
): boolean {
  return normalizeModChord(event) === chord.toLowerCase();
}

/** Split a formatted shortcut string into keyboard badge parts. */
export function splitShortcutDisplay(
  formatted: string,
  isApple = isApplePlatform(),
): string[] {
  if (!isApple) {
    return formatted.split("+").filter(Boolean);
  }
  const tokens = formatted.match(/⌘|⇧|⌥|⌃|Esc|F\d+|[A-Za-z0-9.,]+/g);
  return tokens?.length ? tokens : [formatted];
}

/** Primary modifier symbol for tooltips and shortcut labels. */
export function modKeyLabel(isApple = isApplePlatform()): string {
  return isApple ? "⌘" : "Ctrl";
}

/**
 * Format a chord like `mod+shift+k` for display.
 * Apple: `⌘⇧K` · Windows/Linux: `Ctrl+Shift+K`
 */
export function formatModShortcut(
  chord: string,
  isApple = isApplePlatform(),
): string {
  const parts = chord
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  const tokens: string[] = [];

  for (const part of parts) {
    if (part === "mod") {
      tokens.push(isApple ? "⌘" : "Ctrl");
      continue;
    }
    if (part === "meta") {
      tokens.push("⌘");
      continue;
    }
    if (part === "ctrl" || part === "control") {
      tokens.push(isApple ? "⌃" : "Ctrl");
      continue;
    }
    if (part === "shift") {
      tokens.push(isApple ? "⇧" : "Shift");
      continue;
    }
    if (part === "alt" || part === "option") {
      tokens.push(isApple ? "⌥" : "Alt");
      continue;
    }
    if (part === "escape" || part === "esc") {
      tokens.push("Esc");
      continue;
    }
    tokens.push(part.length === 1 ? part.toUpperCase() : part);
  }

  return isApple ? tokens.join("") : tokens.join("+");
}

/** Format a chord (`mod+shift+p`) or legacy label (`⌘ ⇧ P`) for keyboard badges. */
export function formatShortcutKeys(
  keys: string,
  isApple = isApplePlatform(),
): string[] {
  if (keys.includes("+") && !keys.includes(" ")) {
    return splitShortcutDisplay(formatModShortcut(keys, isApple), isApple);
  }
  return keys.split(" ").filter(Boolean);
}
