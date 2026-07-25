"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export function usePushSubscription() {
  const vapidPublicKey = useQuery(api.pushSubscriptions.getVapidPublicKey);
  const upsert = useMutation(api.pushSubscriptions.upsertSubscription);
  const remove = useMutation(api.pushSubscriptions.removeSubscription);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  const enablePush = useCallback(async () => {
    if (!vapidPublicKey) {
      throw new Error("Push is not configured (missing VAPID public key)");
    }
    if (!("Notification" in window) || !("PushManager" in window)) {
      throw new Error("Push notifications are not supported in this browser");
    }

    setBusy(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        throw new Error("Notification permission denied");
      }

      const registration = await ensureServiceWorker();
      if (!registration) throw new Error("Service worker unavailable");

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid push subscription");
      }

      await upsert({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      });
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }, [upsert, vapidPublicKey]);

  const disablePush = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await remove({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [remove]);

  return {
    permission,
    subscribed,
    busy,
    configured: Boolean(vapidPublicKey),
    enablePush,
    disablePush,
  };
}
