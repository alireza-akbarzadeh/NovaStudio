/** Runtime bridge between the preview iframe and the parent chrome. */

export const PREVIEW_BRIDGE_SOURCE = "polaris-preview";

export type PreviewConsoleLevel = "log" | "info" | "warn" | "error";

export type PreviewConsoleMessage = {
  source: typeof PREVIEW_BRIDGE_SOURCE;
  type: "console";
  level: PreviewConsoleLevel;
  message: string;
  timestamp: number;
};

export type PreviewRuntimeErrorMessage = {
  source: typeof PREVIEW_BRIDGE_SOURCE;
  type: "runtime-error";
  message: string;
  stack?: string;
  timestamp: number;
};

export type PreviewBridgeMessage =
  | PreviewConsoleMessage
  | PreviewRuntimeErrorMessage;

export function isPreviewBridgeMessage(
  data: unknown,
): data is PreviewBridgeMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  if (msg.source !== PREVIEW_BRIDGE_SOURCE) return false;
  if (msg.type === "console") {
    return (
      typeof msg.level === "string" &&
      typeof msg.message === "string" &&
      typeof msg.timestamp === "number"
    );
  }
  if (msg.type === "runtime-error") {
    return (
      typeof msg.message === "string" && typeof msg.timestamp === "number"
    );
  }
  return false;
}

/**
 * Injected into every preview document (classic script, runs before modules).
 * Safe to embed as a string in the HTML shell.
 */
export const PREVIEW_RUNTIME_BRIDGE_SCRIPT = `(function () {
  if (window.__polarisPreviewBridge) return;
  window.__polarisPreviewBridge = true;

  function serialize(value) {
    try {
      if (typeof value === "string") return value;
      if (value instanceof Error) {
        return value.stack || value.message || String(value);
      }
      return JSON.stringify(value, null, 0);
    } catch (_) {
      return String(value);
    }
  }

  function send(payload) {
    try {
      parent.postMessage(Object.assign({ source: "${PREVIEW_BRIDGE_SOURCE}" }, payload), "*");
    } catch (_) {}
  }

  ["log", "info", "warn", "error"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      send({
        type: "console",
        level: level,
        message: args.map(serialize).join(" "),
        timestamp: Date.now(),
      });
      if (typeof original === "function") {
        return original.apply(console, args);
      }
    };
  });

  window.addEventListener("error", function (event) {
    send({
      type: "runtime-error",
      message: event.message || "Runtime error",
      stack: event.error && event.error.stack ? event.error.stack : undefined,
      timestamp: Date.now(),
    });
  });

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    send({
      type: "runtime-error",
      message: reason instanceof Error
        ? reason.message
        : serialize(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: Date.now(),
    });
  });
})();`;
