/* Chat web notifications service worker */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || '/admin/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            try {
              client.navigate(targetUrl);
            } catch (_) {
              /* ignore */
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: 'رسالة جديدة', body: 'وصلك رسالة في الشات', url: '/admin/chat' };
  try {
    if (event.data) {
      const json = event.data.json();
      payload = {
        title: json.title || json.notification?.title || payload.title,
        body: json.body || json.notification?.body || payload.body,
        url: json.url || (json.data && json.data.conversationId ? `/admin/chat?c=${json.data.conversationId}` : payload.url),
      };
    }
  } catch (_) {
    try {
      const text = event.data && event.data.text();
      if (text) payload.body = text;
    } catch (_) {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
      data: { url: payload.url },
      tag: 'tie-chat-push',
      renotify: true,
    })
  );
});
