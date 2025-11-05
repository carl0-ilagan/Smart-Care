// Service Worker for Smart Care PWA
const CACHE_NAME = 'smart-care-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/appointments',
  '/dashboard/messages',
  '/dashboard/prescriptions',
  '/SmartCare.png',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log('Failed to cache some resources:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip cross-origin requests
  if (!url.origin || url.origin !== self.location.origin) return

  // Skip ALL Next.js internal routes - CRITICAL: Don't intercept these at all
  const pathname = url.pathname
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__nextjs') ||
    pathname.includes('/_next/') ||
    pathname.includes('/__nextjs/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('/node_modules/') ||
    url.searchParams.has('_next') ||
    event.request.headers.get('x-nextjs-data') !== null ||
    event.request.headers.get('next-router-prefetch') !== null ||
    event.request.headers.get('next-router-state-tree') !== null
  ) {
    return // CRITICAL: Let Next.js handle its own routes - no service worker interference
  }

  // Only intercept navigation requests (page loads) for PWA offline functionality
  const isNavigationRequest = event.request.mode === 'navigate'
  
  // Only intercept HTML navigation requests
  if (!isNavigationRequest) {
    return // Don't intercept API calls, chunks, or other non-navigation requests
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available (for offline support)
      if (cachedResponse) {
        return cachedResponse
      }

      // Fetch from network for navigation requests
      return fetch(event.request)
        .then((response) => {
          // Only cache successful HTML page responses for offline support
          if (response && response.status === 200 && response.type === 'basic') {
            // Clone the response for caching
            const responseToCache = response.clone()

            // Cache the response asynchronously (don't block)
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch((err) => {
                console.error('Failed to cache page:', err)
              })
            }).catch((err) => {
              console.error('Cache open failed:', err)
            })
          }

          return response
        })
        .catch((error) => {
          console.error('Fetch failed for navigation:', error)
          
          // If offline and request is for a page, return cached fallback
          return caches.match('/').then((fallback) => {
            return fallback || new Response('Offline - Please check your connection', { 
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
          }).catch(() => {
            return new Response('Offline - Please check your connection', { 
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
          })
        })
    }).catch((error) => {
      // If cache match fails, just fetch normally
      console.error('Cache match failed:', error)
      return fetch(event.request).catch(() => {
        return new Response('Offline - Please check your connection', { 
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      })
    })
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

