"use client";

import { useLiveNotificationAlerts } from "@/features/notifications/hooks/use-live-notification-alerts";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useLiveNotificationAlerts();
  return <>{children}</>;
}
