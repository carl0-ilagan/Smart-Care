"use client"

import { useEffect } from "react"

export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration.scope)
          
          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available, show update notification
                  console.log("New service worker available")
                }
              })
            }
          })
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error)
        })

      // Listen for service worker updates
      let refreshing = false
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    } else {
      // Fallback: register service worker manually
      if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator
      ) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered:", registration.scope)
          })
          .catch((error) => {
            console.log("Service Worker registration failed:", error)
          })
      }
    }
  }, [])

  return null
}

