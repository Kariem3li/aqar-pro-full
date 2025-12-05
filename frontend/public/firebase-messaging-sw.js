importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// 👇👇👇 تأكد من بياناتك هنا 👇👇👇
firebase.initializeApp({
  apiKey: "AIzaSyC-bmb89-aNAWw44xoqoJe8BeGlu0UiFT8",
  authDomain: "aqarpro-35c90.firebaseapp.com",
  projectId: "aqarpro-35c90",
  storageBucket: "aqarpro-35c90.firebasestorage.app",
  messagingSenderId: "395466215046",
  appId: "1:395466215046:web:635c1d49c7ea03ed18cb07",
  measurementId: "G-MQG2K1QGHZ"
});

const messaging = firebase.messaging();

// 🎨 صور اللوجو (تعمل بدون ملفات)
const LOGO_DATA = `data:image/svg+xml;charset=utf-8,%3Csvg width='512' height='512' viewBox='0 0 512 512' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='512' height='512' rx='100' fill='%230f172a'/%3E%3Cpath d='M256 120L100 240V400H200V320H312V400H412V240L256 120Z' fill='%23d97706' stroke='%23fffbeb' stroke-width='20'/%3E%3Cpath d='M256 90L440 230V260L256 120L72 260V230L256 90Z' fill='%23fffbeb'/%3E%3C/svg%3E`;
const BADGE_DATA = `data:image/svg+xml;charset=utf-8,%3Csvg width='96' height='96' viewBox='0 0 512 512' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M256 120L100 240V400H200V320H312V400H412V240L256 120Z' fill='%23ffffff'/%3E%3Cpath d='M256 90L440 230V260L256 120L72 260V230L256 90Z' fill='%23ffffff'/%3E%3C/svg%3E`;

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] رسالة في الخلفية:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: LOGO_DATA, 
    badge: BADGE_DATA,
    image: payload.notification.image,
    
    // ⚡ إعدادات الظهور القوي (Pop-up)
    tag: 'renotify-tag', 
    renotify: true,
    requireInteraction: false, // يختفي تلقائياً مثل الواتساب
    vibrate: [200, 100, 200, 100, 200],
    
    data: { url: payload.data?.url || '/' },
    actions: [{action: 'open', title: '👀 فتح'}]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});