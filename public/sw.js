// Fain service worker — cache-first for /_next/static/ only, network for everything else
const CACHE = 'fain-v3'
const SHELL = ['/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // 1. Navigation requests: always let the browser handle them.
  if (request.mode === 'navigate') return

  // 2. Only cache immutable Next.js static chunks (/_next/static/).
  //    Everything else — API routes, page RSC payloads, auth — goes straight to network.
  if (!url.pathname.startsWith('/_next/static/')) return

  // 3. Cache-first for static assets
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok && !res.redirected) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      })
    })
  )
})
