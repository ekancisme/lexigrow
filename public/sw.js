// LexiGrow Service Worker
// Caches assets for offline use and installable PWA

const CACHE_NAME = 'lexigrow-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return
  }

  // Skip API requests
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Skip socket.io requests
  if (url.pathname.startsWith('/socket.io/')) {
    return
  }

  // For HTML pages, always try network first, fallback to cache
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response for offline fallback
          const clonedResponse = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cached) => {
              if (cached) return cached
              // Fallback to offline page
              return caches.match('/offline.html')
            })
        })
    )
    return
  }

  // For static assets (js, css, images, etc.)
  // Stale-while-revalidate: serve from cache, update in background
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          // Cache successful response for future
          if (response && response.status === 200) {
            const clonedResponse = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return response
        })
        .catch(() => {
          // If fetch fails, return cached if available
          if (cached) return cached
          // For images, return a placeholder
          if (event.request.destination === 'image') {
            return caches.match('/icons.svg')
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })

      // If we have a cached version, return it first
      if (cached) {
        // Also revalidate in background
        event.waitUntil(fetchPromise.catch(() => {}))
        return cached
      }

      return fetchPromise
    })
  )
})