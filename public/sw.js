/**
 * Service Worker for Chrysalide
 * Offline support + Asset caching + Push Notifications
 *
 * @version 2.0.0
 */

const CACHE_NAME = 'chrysalide-v2'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/medications',
  '/bloodtests',
  '/progress',
  '/settings',
  '/appointments',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Installation - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activation - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    })
  )
  // Take control immediately
  self.clients.claim()
})

// Strategy: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip Next.js internal requests
  if (event.request.url.includes('/_next/')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone()

        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }

        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      })
  )
})

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }

  // Handle scheduled notification request
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, tag, scheduledTime, data } = event.data.payload
    scheduleNotification(title, body, tag, scheduledTime, data)
  }

  // Handle immediate notification request
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data } = event.data.payload
    showNotificationFromSW(title, body, tag, data)
  }
})

/**
 * Show a notification from the Service Worker
 */
async function showNotificationFromSW(title, body, tag, data = {}) {
  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag,
    requireInteraction: true,
    data,
    actions: [
      { action: 'taken', title: '✓ Taken' },
      { action: 'snooze', title: '⏰ Snooze 10min' },
    ],
  }

  try {
    await self.registration.showNotification(title, options)
    console.log('[SW] Notification shown:', title)
  } catch (error) {
    console.error('[SW] Error showing notification:', error)
  }
}

/**
 * Schedule a notification for a specific time
 * Note: This uses setTimeout which only works while SW is active
 * For reliable scheduling, the app checks on open if reminders were missed
 */
function scheduleNotification(title, body, tag, scheduledTime, data = {}) {
  const now = Date.now()
  const delay = scheduledTime - now

  if (delay <= 0) {
    // Time already passed, show immediately
    showNotificationFromSW(title, body, tag, data)
    return
  }

  // Schedule for future (note: may not fire if SW goes idle)
  setTimeout(() => {
    showNotificationFromSW(title, body, tag, data)
  }, delay)

  console.log(`[SW] Notification scheduled in ${Math.round(delay / 1000)}s:`, title)
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  notification.close()

  if (action === 'taken') {
    // User marked as taken - send message to app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'MEDICATION_TAKEN',
            payload: data,
          })
        })

        // Open app if no clients
        if (clients.length === 0) {
          self.clients.openWindow('/medications')
        }
      })
    )
  } else if (action === 'snooze') {
    // Snooze for 10 minutes
    const snoozeTime = Date.now() + 10 * 60 * 1000
    scheduleNotification(
      notification.title,
      notification.body,
      notification.tag + '-snoozed',
      snoozeTime,
      data
    )
  } else {
    // Default click - open app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Focus existing window or open new one
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        return self.clients.openWindow('/medications')
      })
    )
  }
})

// Handle notification close (dismissed without action)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag)
})
