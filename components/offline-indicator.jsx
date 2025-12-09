"use client"

import { useState, useEffect } from "react"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      // Hide message after 5 seconds
      setTimeout(() => {
        setShowOfflineMessage(false)
      }, 5000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 md:px-6">
      <div className={`mx-auto max-w-7xl transition-all duration-300 ${showOfflineMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
              <WifiOff className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900">You're offline</p>
              <p className="text-xs text-orange-700">
                Showing cached data. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

