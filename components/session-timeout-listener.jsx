"use client"

import { useEffect, useRef, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Detect if running as PWA (installed)
function isPWAInstalled() {
  if (typeof window === "undefined") return false
  return (
    (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(display-mode: standalone)").matches === true) ||
    (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches === true) ||
    // iOS Safari
    (typeof navigator !== "undefined" && navigator && navigator["standalone"] === true)
  )
}

const TIMEOUT_MAP = {
  "15": 15 * 60 * 1000,
  "30": 30 * 60 * 1000,
  "60": 60 * 60 * 1000,
  "120": 120 * 60 * 1000,
  "never": Infinity,
}

export default function SessionTimeoutListener({ userId }) {
  const [timeoutMs, setTimeoutMs] = useState(Infinity)
  const timerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())
  const pwaRef = useRef(isPWAInstalled())

  // Load user session timeout setting
  useEffect(() => {
    let mounted = true
    async function loadSetting() {
      if (!userId) return
      try {
        const snap = await getDoc(doc(db, "userSettings", userId))
        if (!mounted) return
        const value = snap.exists() ? snap.data()?.security?.sessionTimeout || "30" : "30"
        setTimeoutMs(TIMEOUT_MAP[value] ?? TIMEOUT_MAP["30"])
      } catch {
        // Default 30 minutes on error
        if (mounted) setTimeoutMs(TIMEOUT_MAP["30"])
      }
    }
    loadSetting()
    return () => {
      mounted = false
    }
  }, [userId])

  // Reset activity timestamp
  const markActivity = () => {
    lastActivityRef.current = Date.now()
  }

  // Set up listeners for user activity
  useEffect(() => {
    if (!userId) return
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart", "visibilitychange"]
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }))
    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity))
    }
  }, [userId])

  // Heartbeat check to auto-logout when not in use
  useEffect(() => {
    if (!userId) return
    if (pwaRef.current) return // PWA stays logged in until user logs out
    if (!isFinite(timeoutMs)) return

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(async () => {
      const now = Date.now()
      const idleFor = now - lastActivityRef.current
      if (idleFor >= timeoutMs) {
        try {
          const { auth } = await import("@/lib/firebase")
          const { signOut } = await import("firebase/auth")
          await signOut(auth)
        } finally {
          // Redirect to landing/login
          window.location.href = "/"
        }
      }
    }, 30 * 1000) // check every 30s

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [userId, timeoutMs])

  return null
}


