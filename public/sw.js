// Service Worker for Smart Care PWA
const CACHE_NAME = 'smart-care-v2'
const STATIC_CACHE = 'smart-care-static-v2'
const DYNAMIC_CACHE = 'smart-care-dynamic-v2'
const API_CACHE = 'smart-care-api-v2'

// Static assets to cache on install (for all roles: patient, doctor, admin)
const urlsToCache = [
  '/',
  // Patient pages
  '/dashboard',
  '/dashboard/appointments',
  '/dashboard/messages',
  '/dashboard/prescriptions',
  '/dashboard/records',
  '/dashboard/notifications',
  '/dashboard/settings',
  '/dashboard/profile',
  // Doctor pages
  '/doctor/dashboard',
  '/doctor/appointments',
  '/doctor/chat',
  '/doctor/patients',
  '/doctor/settings',
  // Admin pages
  '/admin/dashboard',
  '/admin/patients',
  '/admin/doctors',
  '/admin/appointments',
  '/admin/settings',
  // Assets
  '/SmartCare.png',
  '/manifest.json',
]

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
          console.log('[SW] Failed to cache some static resources:', err)
        })
      }),
      // Cache common static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll([
          '/favicon.ico',
          '/logo.svg',
          '/placeholder-user.jpg',
        ]).catch((err) => {
          console.log('[SW] Failed to cache additional static resources:', err)
      })
      }),
    ])
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => 
            cacheName !== CACHE_NAME && 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE && 
            cacheName !== API_CACHE
          )
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  return self.clients.claim()
})

// Helper function to determine cache strategy based on request type
function getCacheStrategy(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Static assets - cache first
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i) ||
    pathname.startsWith('/_next/static/')
  ) {
    return CACHE_STRATEGIES.CACHE_FIRST
  }

  // API calls - network first with cache fallback
  if (pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST
  }

  // HTML pages - stale while revalidate
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE
  }

  // Default: network first
  return CACHE_STRATEGIES.NETWORK_FIRST
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // If offline and no cache, return offline page for navigation
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/')
      if (offlinePage) return offlinePage
    }
    throw error
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/')
      if (offlinePage) return offlinePage
    }
    throw error
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // Fetch fresh content in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {
    // Ignore network errors for background fetch
  })

  // Return cached version immediately if available
  if (cached) {
    return cached
  }

  // If no cache, wait for network
  try {
    return await fetchPromise
  } catch (error) {
    // If offline and navigation, return offline page
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/')
      if (offlinePage) return offlinePage
    }
    throw error
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip cross-origin requests (except for same origin)
  if (!url.origin || url.origin !== self.location.origin) return

  // Skip ALL Next.js internal routes - CRITICAL: Don't intercept these at all
  const pathname = url.pathname
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__nextjs') ||
    pathname.includes('/_next/') ||
    pathname.includes('/__nextjs/') ||
    pathname.includes('/node_modules/') ||
    url.searchParams.has('_next') ||
    event.request.headers.get('x-nextjs-data') !== null ||
    event.request.headers.get('next-router-prefetch') !== null ||
    event.request.headers.get('next-router-state-tree') !== null
  ) {
    return // CRITICAL: Let Next.js handle its own routes - no service worker interference
  }

  // Determine cache strategy
  const strategy = getCacheStrategy(event.request)
  let cacheName = DYNAMIC_CACHE

  // Choose appropriate cache based on request type
  if (strategy === CACHE_STRATEGIES.CACHE_FIRST) {
    cacheName = STATIC_CACHE
  } else if (pathname.startsWith('/api/')) {
    cacheName = API_CACHE
  }

  event.respondWith(
    (async () => {
      try {
        switch (strategy) {
          case CACHE_STRATEGIES.CACHE_FIRST:
            return await cacheFirst(event.request, cacheName)
          case CACHE_STRATEGIES.NETWORK_FIRST:
            return await networkFirst(event.request, cacheName)
          case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return await staleWhileRevalidate(event.request, cacheName)
          default:
            return await networkFirst(event.request, cacheName)
        }
      } catch (error) {
        console.error('[SW] Fetch error:', error)
        // For navigation requests, try to return offline page
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(STATIC_CACHE)
          const offlinePage = await cache.match('/')
          if (offlinePage) {
            return offlinePage
          }
        }
        // Return offline message
        return new Response('Offline - Please check your connection', { 
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      }
    })()
  )
})

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Smart Care'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/SmartCare.png',
    badge: '/SmartCare.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle messages from the app (for triggering push notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
    const { payload } = event.data
    
    // Request notification permission if needed
    self.registration.showNotification(payload.title || 'Smart Care', {
      body: payload.body || 'You have a new notification',
      icon: payload.icon || '/SmartCare.png',
      badge: payload.badge || '/SmartCare.png',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      tag: payload.tag || 'appointment-notification',
      requireInteraction: false,
      silent: false,
    }).catch((error) => {
      console.error('Error showing notification:', error)
    })
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})

