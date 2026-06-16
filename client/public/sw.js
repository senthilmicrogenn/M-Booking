const CACHE_NAME = 'roomnest-v1';
const STATIC_CACHE = 'roomnest-static-v1';
const DYNAMIC_CACHE = 'roomnest-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/admin',
  '/guest-app',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API routes to cache
const API_CACHE_PATTERNS = [
  /\/api\/properties$/,
  /\/api\/property-categories$/,
  /\/api\/property-amenities$/,
  /\/api\/room-types$/,
  /\/api\/currencies$/
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const { url, method } = request;

  // Skip non-GET requests
  if (method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.startsWith('http')) return;

  event.respondWith(
    handleFetch(request)
  );
});

async function handleFetch(request) {
  const { url } = request;
  
  try {
    // Strategy 1: Static assets - Cache First
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Strategy 2: API calls - Network First with fallback
    if (isAPICall(url)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // Strategy 3: Navigation requests - Network First
    if (request.mode === 'navigate') {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // Strategy 4: Everything else - Network First
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Fallback for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE);
      return await cache.match('/') || new Response('App offline', {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] Fetching and caching:', request.url);
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Helper functions
function isStaticAsset(url) {
  return url.includes('/icons/') || 
         url.includes('/screenshots/') ||
         url.includes('/manifest.json') ||
         url.includes('.css') ||
         url.includes('.js') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.svg');
}

function isAPICall(url) {
  return url.includes('/api/') || 
         API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'booking-sync') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Handle offline booking synchronization
  console.log('[SW] Syncing offline bookings...');
  
  try {
    // Get offline bookings from IndexedDB
    const offlineBookings = await getOfflineBookings();
    
    for (const booking of offlineBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          await removeOfflineBooking(booking.id);
          console.log('[SW] Synced booking:', booking.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync booking:', booking.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Placeholder functions for offline booking management
async function getOfflineBookings() {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflineBooking(id) {
  // Implementation would remove from IndexedDB
  console.log('[SW] Removing offline booking:', id);
}