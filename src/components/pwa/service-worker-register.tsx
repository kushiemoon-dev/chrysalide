'use client'

import { useEffect } from 'react'
import {
  startReminderService,
  stopReminderService,
  isNotificationEnabled,
} from '@/lib/notification-scheduler'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope)

          // Start reminder service if notifications are enabled
          if (isNotificationEnabled()) {
            startReminderService()
          }

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('[PWA] New version available')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error)
        })
    }

    // Listen for notification preference changes
    const handleNotificationPrefsChanged = (event: CustomEvent<{ enabled: boolean }>) => {
      if (event.detail.enabled) {
        startReminderService()
      } else {
        stopReminderService()
      }
    }

    window.addEventListener(
      'notificationPrefsChanged',
      handleNotificationPrefsChanged as EventListener
    )

    return () => {
      stopReminderService()
      window.removeEventListener(
        'notificationPrefsChanged',
        handleNotificationPrefsChanged as EventListener
      )
    }
  }, [])

  return null
}
