/* Polaris push service worker */
self.addEventListener("push", (event) => {
  let payload = {
    title: "Polaris",
    body: "You have a new notification",
    href: "/",
    soundKind: "notify",
  };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    // keep defaults
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      data: { href: payload.href, soundKind: payload.soundKind },
      tag: payload.notificationId ?? payload.title,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href =
    (event.notification.data && event.notification.data.href) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(href);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(href);
        }
      }),
  );
});
