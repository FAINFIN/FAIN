// Fain service worker — cache-first for shell, network-first for API
const CACHE = 'fain-v2'
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

  // 1. Navigation requests: always go to network so auth redirects work correctly.
  //    Never intercept — the browser handles redirect: 'follow' natively for HTML navigation.
  if (request.mode === 'navigate') {
    return // let the browser handle it
  }

  // 2. API and auth routes: always network-first, no caching
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    e.respondWith(fetch(request).catch(() => new Response('', { status: 503 })))
    return
  }

  // 3. Static assets only (JS, CSS, fonts, images): cache-first
  //    Only cache same-origin GET requests with a clean (non-redirected) response
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        // Never cache redirected or error responses
        if (res.ok && !res.redirected) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      })
    })
  )
})
