"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from "lucide-react"

export function SuccessNotification({
  message,
  isVisible = false,
  onClose = () => {},
  type = "success",
  position = "top-right",
  duration = 5000,
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [isShowing, setIsShowing] = useState(isVisible)

  // Update internal state when isVisible prop changes
  useEffect(() => {
    if (isVisible && !isShowing) {
      setIsShowing(true)
      setIsClosing(false)
    }
  }, [isVisible, isShowing])

  // Set up auto-dismiss timer
  useEffect(() => {
    let timer
    if (isShowing) {
      timer = setTimeout(() => {
        handleClose()
      }, duration)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isShowing, duration])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsShowing(false)
      setIsClosing(false)
      onClose()
    }, 300)
  }

  // Don't render anything if not showing and not in closing animation
  if (!isShowing && !isClosing) return null

  console.log("Rendering notification:", { isVisible, isShowing, isClosing, message })

  // Determine notification type styling
  const getTypeStyles = () => {
    switch (type) {
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          iconColor: "text-red-500",
          hoverColor: "hover:text-red-700",
          icon: <AlertOctagon className="h-5 w-5" />,
        }
      case "warning":
        return {
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-800",
          iconColor: "text-amber-500",
          hoverColor: "hover:text-amber-700",
          icon: <AlertTriangle className="h-5 w-5" />,
        }
      case "info":
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
          iconColor: "text-blue-500",
          hoverColor: "hover:text-blue-700",
          icon: <Info className="h-5 w-5" />,
        }
      case "success":
      default:
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          iconColor: "text-green-500",
          hoverColor: "hover:text-green-700",
          icon: <CheckCircle className="h-5 w-5" />,
        }
    }
  }

  const styles = getTypeStyles()

  // Determine position styling - add spacing for top navigation (64px = h-16)
  // Use top-20 (5rem = 80px) to account for nav bar height + padding
  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return "top-20 left-4 sm:top-24"
      case "top-center":
        return "top-20 left-1/2 -translate-x-1/2 sm:top-24"
      case "bottom-right":
        return "bottom-4 right-4"
      case "bottom-left":
        return "bottom-4 left-4"
      case "bottom-center":
        return "bottom-4 left-1/2 -translate-x-1/2"
      case "top-right":
      default:
        return "top-20 right-4 sm:top-24"
    }
  }

  return (
    <div
      className={`fixed ${getPositionStyles()} z-50 max-w-md transform transition-all duration-500 ease-out ${
        isClosing 
          ? "translate-y-[-20px] opacity-0 scale-95" 
          : "translate-y-0 opacity-100 scale-100"
      }`}
      role="alert"
      aria-live="assertive"
      style={{
        animation: isShowing && !isClosing 
          ? "slideInFromTop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, bounce 0.6s 0.3s ease-out forwards"
          : undefined
      }}
    >
      <style jsx>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
      <div
        className={`rounded-lg shadow-xl p-4 flex items-start space-x-3 ${styles.bgColor} border-2 ${styles.borderColor} backdrop-blur-sm transition-all duration-300 hover:shadow-2xl`}
      >
        <div className={`flex-shrink-0 ${styles.iconColor} animate-pulse`} style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>{styles.icon}</div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${styles.textColor} leading-relaxed`}>{message}</p>
        </div>
        <button
          onClick={handleClose}
          className={`flex-shrink-0 ml-1 ${styles.iconColor} ${styles.hoverColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type === "success" ? "green" : type === "error" ? "red" : type === "warning" ? "amber" : "blue"}-500 rounded transition-transform duration-200 hover:scale-110`}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
