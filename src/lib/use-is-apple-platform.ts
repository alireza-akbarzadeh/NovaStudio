"use client";

import { useSyncExternalStore } from "react";

import { isApplePlatform } from "@/lib/keyboard";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return isApplePlatform();
}

function getServerSnapshot() {
  return false;
}

/** Client-safe Apple vs Windows/Linux detection (SSR defaults to non-Apple). */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
