/**
 * Singleton WebContainer boot / teardown.
 * Only one instance may exist per browser tab.
 */

import { WebContainer } from "@webcontainer/api";

let bootPromise: Promise<WebContainer> | null = null;
let instance: WebContainer | null = null;

export type WebContainerBootError =
  | "not-isolated"
  | "boot-failed"
  | "ssr";

export function getCrossOriginIsolationError(): string | null {
  if (typeof window === "undefined") return "WebContainer is browser-only";
  if (!window.crossOriginIsolated) {
    return "Page is not cross-origin isolated (need COOP/COEP). Reload after deploy, or check /projects headers.";
  }
  return null;
}

/** Returns the booted instance, or null if not ready yet. */
export function getWebContainer(): WebContainer | null {
  return instance;
}

/**
 * Boot WebContainer once. Safe to call repeatedly — shares the same promise.
 * Requires `crossOriginIsolated` (COEP credentialless + COOP same-origin).
 */
export async function bootWebContainer(): Promise<WebContainer> {
  if (typeof window === "undefined") {
    throw new Error("WebContainer cannot boot on the server");
  }

  const isolationError = getCrossOriginIsolationError();
  if (isolationError) {
    throw new Error(isolationError);
  }

  if (instance) return instance;

  if (!bootPromise) {
    bootPromise = WebContainer.boot({
      coep: "credentialless",
      // Forward preview console.error / uncaught errors to `preview-message`
      forwardPreviewErrors: true,
    })
      .then((wc) => {
        instance = wc;
        return wc;
      })
      .catch((error) => {
        bootPromise = null;
        throw error;
      });
  }

  return bootPromise;
}

/** Destroy the singleton so a new boot can run (e.g. after project switch). */
export async function teardownWebContainer(): Promise<void> {
  const wc = instance;
  instance = null;
  bootPromise = null;
  if (wc) {
    wc.teardown();
  }
}
