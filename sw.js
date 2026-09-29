// 오토핸즈 CRM 서비스워커
// 항상 인터넷에서 최신 화면을 먼저 가져옵니다 (옛날 화면이 남는 문제 방지).
// 인터넷이 끊겼을 때만 마지막으로 열었던 화면을 보여줍니다.
// Supabase 등 다른 사이트로 가는 데이터 요청은 건드리지 않습니다.

const CACHE = 'autohands-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
  );
});
