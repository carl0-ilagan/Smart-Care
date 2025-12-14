// Service Worker for Smart Care PWA
const CACHE_NAME = 'smart-care-v3'
const STATIC_CACHE = 'smart-care-static-v3'
const DYNAMIC_CACHE = 'smart-care-dynamic-v3'
const API_CACHE = 'smart-care-api-v3'

// Static assets to cache on install (for all roles: patient, doctor, admin)
const urlsToCache = [
  // Landing page and public pages
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/information',
  '/privacy',
  '/terms',
  
  // Patient (Dashboard) pages - ALL routes
  '/dashboard',
  '/dashboard/appointments',
  '/dashboard/messages',
  '/dashboard/prescriptions',
  '/dashboard/records',
  '/dashboard/notifications',
  '/dashboard/settings',
  '/dashboard/profile',
  '/dashboard/doctors',
  '/dashboard/feedback',
  '/dashboard/calls',
  
  // Doctor pages - ALL routes
  '/doctor/dashboard',
  '/doctor/appointments',
  '/doctor/appointments/new',
  '/doctor/chat',
  '/doctor/patients',
  '/doctor/prescriptions',
  '/doctor/prescriptions/new',
  '/doctor/records',
  '/doctor/notifications',
  '/doctor/settings',
  '/doctor/profile',
  '/doctor/calls',
  '/doctor/feedback',
  // Note: Dynamic routes like /doctor/patients/[id] will be cached automatically when visited
  
  // Admin pages - ALL routes
  '/admin/dashboard',
  '/admin/patients',
  '/admin/doctors',
  '/admin/appointments',
  '/admin/settings',
  '/admin/profile',
  '/admin/analytics',
  '/admin/feedback',
  '/admin/information-pages',
  '/admin/logs',
  '/admin/pending-accounts',
  '/admin/reports',
  '/admin/roles',
  '/admin/welcome-editor',
  
  // Assets
  '/SmartCare.png',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  '/placeholder-user.jpg',
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
    caches.open(STATIC_CACHE).then((cache) => {
      // Use individual cache.add() calls instead of addAll() to handle failures gracefully
      // This way, if one URL fails, others can still be cached
      const cachePromises = urlsToCache.map((url) => {
        return cache.add(url).catch((err) => {
          // Log but don't fail - some routes might not exist in development
          console.log(`[SW] Failed to cache ${url}:`, err.message)
          return null // Return null so Promise.all doesn't fail
        })
      })
      
      return Promise.all(cachePromises).then(() => {
        console.log('[SW] Static cache populated (some resources may have failed in development)')
      })
    })
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

  // HTML pages - stale while revalidate for offline support
  // This includes all pages: landing, dashboard, doctor, admin, profile, etc.
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
    // If offline and no cache, try route-specific fallbacks for navigation
    if (request.mode === 'navigate') {
      const url = new URL(request.url)
      const pathname = url.pathname
      
      // For dashboard routes, try smart fallback hierarchy
      if (pathname.startsWith('/dashboard')) {
        // Try exact parent route first (e.g., /dashboard/doctors for /dashboard/doctors/123)
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common dashboard routes in order of preference
        const fallbackRoutes = [
          '/dashboard',
          '/dashboard/appointments',
          '/dashboard/messages',
          '/dashboard/prescriptions',
          '/dashboard/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      } else if (pathname.startsWith('/doctor')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common doctor routes in order of preference
        const fallbackRoutes = [
          '/doctor/dashboard',
          '/doctor/appointments',
          '/doctor/patients',
          '/doctor/prescriptions',
          '/doctor/chat',
          '/doctor/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      } else if (pathname.startsWith('/admin')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        const adminPage = await cache.match('/admin/dashboard')
        if (adminPage) return adminPage
      }
      
      // Final fallback: landing page
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
      // Cache all successful responses (including dynamic routes)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Try exact cache match first
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    
    // For navigation requests, try route-specific fallbacks
    if (request.mode === 'navigate') {
      const url = new URL(request.url)
      const pathname = url.pathname
      
      // For dashboard routes, try smart fallback hierarchy
      if (pathname.startsWith('/dashboard')) {
        // Try exact parent route first (e.g., /dashboard/doctors for /dashboard/doctors/123)
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common dashboard routes in order of preference
        const fallbackRoutes = [
          '/dashboard',
          '/dashboard/appointments',
          '/dashboard/messages',
          '/dashboard/prescriptions',
          '/dashboard/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      } else if (pathname.startsWith('/doctor')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common doctor routes in order of preference
        const fallbackRoutes = [
          '/doctor/dashboard',
          '/doctor/appointments',
          '/doctor/patients',
          '/doctor/prescriptions',
          '/doctor/chat',
          '/doctor/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      } else if (pathname.startsWith('/admin')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        const adminPage = await cache.match('/admin/dashboard')
        if (adminPage) return adminPage
      }
      
      // Final fallback: landing page
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
    // If offline and navigation, try to find any cached page with smart fallback
    if (request.mode === 'navigate') {
      const url = new URL(request.url)
      const pathname = url.pathname
      
      // For dashboard routes, try smart fallback hierarchy
      if (pathname.startsWith('/dashboard')) {
        // Try exact parent route first (e.g., /dashboard/doctors for /dashboard/doctors/123)
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          // Remove last part (dynamic ID) and try parent route
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common dashboard routes in order of preference
        const fallbackRoutes = [
          '/dashboard',
          '/dashboard/appointments',
          '/dashboard/messages',
          '/dashboard/prescriptions',
          '/dashboard/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      }
      
      // For doctor routes, try smart fallback hierarchy
      if (pathname.startsWith('/doctor')) {
        // Try exact parent route first (e.g., /doctor/patients for /doctor/patients/123)
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common doctor routes in order of preference
        const fallbackRoutes = [
          '/doctor/dashboard',
          '/doctor/appointments',
          '/doctor/patients',
          '/doctor/prescriptions',
          '/doctor/chat',
          '/doctor/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      }
      
      // For admin routes
      if (pathname.startsWith('/admin')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        const adminPage = await cache.match('/admin/dashboard')
        if (adminPage) return adminPage
      }
      
      // Final fallback: landing page
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
        // For navigation requests, try to return cached page with smart fallback
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(STATIC_CACHE)
          const dynamicCache = await caches.open(DYNAMIC_CACHE)
          const url = new URL(event.request.url)
          const pathname = url.pathname
          
          // Try exact match in both caches
          let offlinePage = await cache.match(event.request) || await dynamicCache.match(event.request)
          if (offlinePage) return offlinePage
          
          // For dashboard routes, try smart fallback hierarchy
          if (pathname.startsWith('/dashboard')) {
            // Try exact parent route first (e.g., /dashboard/doctors for /dashboard/doctors/123)
            const pathParts = pathname.split('/').filter(Boolean)
            if (pathParts.length > 2) {
              const parentPath = '/' + pathParts.slice(0, -1).join('/')
              offlinePage = await cache.match(parentPath) || await dynamicCache.match(parentPath)
              if (offlinePage) return offlinePage
            }
            
            // Try common dashboard routes in order of preference
            const fallbackRoutes = [
              '/dashboard',
              '/dashboard/appointments',
              '/dashboard/messages',
              '/dashboard/prescriptions',
              '/dashboard/records',
            ]
            
            for (const route of fallbackRoutes) {
              offlinePage = await cache.match(route) || await dynamicCache.match(route)
              if (offlinePage) return offlinePage
            }
          } else if (pathname.startsWith('/doctor')) {
            const pathParts = pathname.split('/').filter(Boolean)
            if (pathParts.length > 2) {
              const parentPath = '/' + pathParts.slice(0, -1).join('/')
              offlinePage = await cache.match(parentPath) || await dynamicCache.match(parentPath)
              if (offlinePage) return offlinePage
            }
            
            // Try common doctor routes in order of preference
            const fallbackRoutes = [
              '/doctor/dashboard',
              '/doctor/appointments',
              '/doctor/patients',
              '/doctor/prescriptions',
              '/doctor/chat',
              '/doctor/records',
            ]
            
            for (const route of fallbackRoutes) {
              offlinePage = await cache.match(route) || await dynamicCache.match(route)
              if (offlinePage) return offlinePage
            }
          } else if (pathname.startsWith('/admin')) {
            const pathParts = pathname.split('/').filter(Boolean)
            if (pathParts.length > 2) {
              const parentPath = '/' + pathParts.slice(0, -1).join('/')
              offlinePage = await cache.match(parentPath) || await dynamicCache.match(parentPath)
              if (offlinePage) return offlinePage
            }
            offlinePage = await cache.match('/admin/dashboard') || await dynamicCache.match('/admin/dashboard')
            if (offlinePage) return offlinePage
          }
          
          // Final fallback: landing page
          offlinePage = await cache.match('/') || await dynamicCache.match('/')
          if (offlinePage) return offlinePage
        }
        // Return offline message as last resort
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

// Handle messages from the app (for triggering push notifications and pre-caching)
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
  
  // Handle pre-cache requests for specific pages
  if (event.data && event.data.type === 'PRE_CACHE') {
    const { urls } = event.data
    if (urls && Array.isArray(urls)) {
      event.waitUntil(
        caches.open(DYNAMIC_CACHE).then((cache) => {
          return Promise.all(
            urls.map((url) => {
              return fetch(url)
                .then((response) => {
                  if (response.ok) {
                    return cache.put(url, response)
                  }
                })
                .catch((error) => {
                  console.log('[SW] Failed to pre-cache:', url, error)
                })
            })
          )
        })
      )
    }
  }
  
  // Handle skip waiting (for service worker updates)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})

