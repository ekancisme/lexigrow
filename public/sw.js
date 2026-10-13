// LexiGrow Service Worker
// Caches assets for offline use and installable PWA

const CACHE_NAME = 'lexigrow-v6'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  '/offline.html',
]

// Install event - cache static assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets with cache:', CACHE_NAME)
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean all old caches and take control of all open clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - network-first for navigation/HTML, stale-while-revalidate for static assets
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

  // Identify HTML/Navigation requests (e.g. /student/learning-session, /, index.html)
  const isHtmlNavigation =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))

  if (isHtmlNavigation) {
    // ALWAYS network-first for HTML pages so user always receives fresh code
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached
            return caches.match('/offline.html')
          })
        })
    )
    return
  }

  // For static hashed assets (Vite /assets/*)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })
          }
          return response
        })
        .catch(() => {
          if (cached) return cached
          if (event.request.destination === 'image') {
            return caches.match('/icons.svg')
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })

      if (cached) {
        event.waitUntil(fetchPromise.catch(() => {}))
        return cached
      }

      return fetchPromise
    })
  )
})
