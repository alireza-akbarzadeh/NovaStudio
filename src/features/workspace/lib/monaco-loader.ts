/**
 * Point @monaco-editor/react at same-origin AMD assets.
 *
 * Default CDN loads fail under Cross-Origin-Embedder-Policy on /projects/*
 * (needed for WebContainers), which leaves Monaco stuck on "Loading editor…".
 */
"use client";

import { loader } from "@monaco-editor/react";

let configured = false;

export function configureMonacoLoader() {
  if (configured || typeof window === "undefined") return;
  configured = true;

  loader.config({
    paths: {
      vs: `${window.location.origin}/monaco/vs`,
    },
  });
}
