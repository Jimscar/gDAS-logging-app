/* public/service-worker.js */
self.addEventListener("install", (event) => {
  console.log("📦 Service worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🔄 Service worker activating...");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          // Fallback to index.html for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});
