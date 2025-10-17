self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const title = data.title || 'Vigilant Monitor';
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: data.badge || '/badge.png',
      tag: data.tag || 'vigilant-notification',
      data: data.data || {}
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data;
  const urlToOpen = data.monitor_id ? `/monitors/${data.monitor_id}` : '/dashboard';
  event.waitUntil(clients.openWindow(urlToOpen));
});
