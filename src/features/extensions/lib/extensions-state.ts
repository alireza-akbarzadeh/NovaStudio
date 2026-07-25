/**
 * Module-level cache of enabled extension IDs so non-React code
 * (e.g. monacoLanguageForPath) can read install state.
 */

type Listener = () => void;

type ExtensionsStateSnapshot = {
  enabledIds: ReadonlySet<string>;
  activeThemeId: string | null;
};

let enabledIds = new Set<string>();
let activeThemeId: string | null = null;
let snapshot: ExtensionsStateSnapshot = {
  enabledIds,
  activeThemeId,
};
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function getEnabledExtensionIds(): ReadonlySet<string> {
  return enabledIds;
}

export function isExtensionEnabled(extensionId: string): boolean {
  return enabledIds.has(extensionId);
}

export function getActiveThemeExtensionId(): string | null {
  return activeThemeId;
}

export function setExtensionsState(next: {
  enabledIds: Iterable<string>;
  activeThemeId: string | null;
}) {
  enabledIds = new Set(next.enabledIds);
  activeThemeId = next.activeThemeId;
  snapshot = {
    enabledIds,
    activeThemeId,
  };
  emit();
}

export function subscribeExtensionsState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getExtensionsStateSnapshot(): ExtensionsStateSnapshot {
  return snapshot;
}
