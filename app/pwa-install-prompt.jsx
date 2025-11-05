"use client"

import { useState, useEffect } from "react"
import { X, Download } from "lucide-react"

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator.standalone === true) ||
      document.referrer.includes('android-app://')
    
    if (isInstalled) {
      return
    }

    // Listen for beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Show prompt after a delay if user hasn't dismissed it
    const timer = setTimeout(() => {
      if (!localStorage.getItem('pwa-install-dismissed')) {
        setShowPrompt(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: show instructions
      setShowPrompt(false)
      alert(
        'To install Smart Care:\n\n' +
        'iOS: Tap the Share button and select "Add to Home Screen"\n\n' +
        'Android: Tap the menu (3 dots) and select "Install App" or "Add to Home Screen"'
      )
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    
    // Show again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed')
    }, 7 * 24 * 60 * 60 * 1000)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slideUp md:bottom-6 md:left-6 md:right-auto">
      <div className="rounded-lg border border-earth-beige bg-white p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soft-amber/10">
                <Download className="h-5 w-5 text-soft-amber" />
              </div>
              <h3 className="font-semibold text-graphite">Install Smart Care</h3>
            </div>
            <p className="text-sm text-drift-gray mb-3">
              Install Smart Care as an app for a better experience. Works offline and loads faster!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
