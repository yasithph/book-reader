/// <reference lib="webworker" />

const CACHE_VERSION = "v1";
const STATIC_CACHE = `book-reader-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `book-reader-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `book-reader-images-${CACHE_VERSION}`;

// Assets to precache
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets: Cache First
  static: [
    /\.(js|css|woff2?|ttf|eot)$/,
    /_next\/static\//,
  ],
  // Images: Stale While Revalidate
  images: [
    /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
    /\/covers\//,
  ],
  // API: Network First with fallback
  api: [
    /\/api\//,
  ],
  // Pages: Network First
  pages: [
    /^\/(books|library|read|settings|welcome|purchase)/,
  ],
};

// Install event - precache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith("book-reader-") &&
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== IMAGE_CACHE
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Determine cache strategy for a request
function getStrategy(url) {
  const pathname = new URL(url).pathname;

  for (const pattern of CACHE_STRATEGIES.static) {
    if (pattern.test(pathname) || pattern.test(url)) {
      return "cacheFirst";
    }
  }

  for (const pattern of CACHE_STRATEGIES.images) {
    if (pattern.test(pathname) || pattern.test(url)) {
      return "staleWhileRevalidate";
    }
  }

  for (const pattern of CACHE_STRATEGIES.api) {
    if (pattern.test(pathname)) {
      return "networkFirst";
    }
  }

  for (const pattern of CACHE_STRATEGIES.pages) {
    if (pattern.test(pathname)) {
      return "networkFirst";
    }
  }

  return "networkFirst";
}

// Cache First strategy
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("Offline", { status: 503 });
  }
}

// Network First strategy
async function networkFirst(request, cacheName = DYNAMIC_CACHE) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/offline");
    }
    return new Response("Offline", { status: 503 });
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName = IMAGE_CACHE) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}

// Fetch event handler
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith("http")) {
    return;
  }

  const strategy = getStrategy(request.url);

  switch (strategy) {
    case "cacheFirst":
      event.respondWith(cacheFirst(request));
      break;
    case "staleWhileRevalidate":
      event.respondWith(staleWhileRevalidate(request));
      break;
    case "networkFirst":
    default:
      event.respondWith(networkFirst(request));
      break;
  }
});

// Background sync for reading progress
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-progress") {
    event.waitUntil(syncReadingProgress());
  }
});

async function syncReadingProgress() {
  // This will be triggered when coming back online
  // The actual sync is handled by the sync-manager in the app
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_PROGRESS" });
  });
}

// Push notification support (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Message handler for manual cache operations
self.addEventListener("message", (event) => {
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CACHE_CHAPTER") {
    const { bookId, chapterNumber, content } = event.data;
    // Store chapter content in cache for offline reading
    const cacheKey = `/api/books/${bookId}/chapters/${chapterNumber}`;
    caches.open(DYNAMIC_CACHE).then((cache) => {
      const response = new Response(JSON.stringify(content), {
        headers: { "Content-Type": "application/json" },
      });
      cache.put(cacheKey, response);
    });
  }

  if (event.data.type === "CLEAR_CACHE") {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith("book-reader-")) {
          caches.delete(name);
        }
      });
    });
  }
});
