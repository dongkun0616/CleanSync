// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.text(); // 서버에서 보낸 메시지
  const options = {
    body: data,
    icon: '/favicon.svg', // 프로젝트의 로고 경로
    badge: '/favicon.svg'
  };

  event.waitUntil(
    self.registration.showNotification('[Clean-Sync] 알림', options)
  );
});