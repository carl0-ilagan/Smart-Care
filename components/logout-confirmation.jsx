"use client"

import { useState, useRef, useEffect } from "react"
import { X, LogOut, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function LogoutConfirmation({ isOpen, onClose, onConfirm }) {
  const router = useRouter()
  const [startX, setStartX] = useState(null)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef(null)

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Reset offset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0)
    }
  }, [isOpen])

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleMouseDown = (e) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || startX === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    setOffsetX(diff)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || startX === null) return
    const currentX = e.clientX
    const diff = currentX - startX
    setOffsetX(diff)
  }

  const handleTouchEnd = () => {
    if (Math.abs(offsetX) > 100) {
      handleClose()
    } else {
      setOffsetX(0)
    }
    setIsDragging(false)
    setStartX(null)
  }

  const handleMouseUp = () => {
    if (Math.abs(offsetX) > 100) {
      handleClose()
    } else {
      setOffsetX(0)
    }
    setIsDragging(false)
    setStartX(null)
  }

  const handleConfirm = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onConfirm()
    }, 300)
  }

  if (!isOpen) return null

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(-20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes modalOut { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.9) translateY(20px); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-fade-out { animation: fadeOut 0.3s ease-out; }
        .animate-modal-in { animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-modal-out { animation: modalOut 0.3s ease-in; }
      `}</style>

      {/* Backdrop with blur and animation */}
      <div
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
        style={{
          opacity: Math.max(0.5, 0.5 - Math.abs(offsetX) / 500),
        }}
      />

      {/* Modal with enhanced animation */}
      <div
        ref={modalRef}
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className={`w-full max-w-md mx-auto rounded-2xl bg-white shadow-2xl overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
          style={{
            transform: `translateX(${offsetX}px)`,
            opacity: Math.max(0, 1 - Math.abs(offsetX) / 200),
          }}
        >
          {/* Header with gradient background */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 sm:p-8 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-orange-500/10 border-4 border-orange-500/20">
                  <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-graphite text-center mb-2">
                Confirm Logout
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-drift-gray text-center">
                Are you sure you want to logout?
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"></div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="space-y-4">
              <p className="text-center text-xs sm:text-sm md:text-base text-drift-gray">
                You will be logged out and redirected to the home page. You can log back in anytime.
              </p>
              
              <div className="pt-2 sm:pt-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-earth-beige bg-white px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-graphite hover:bg-pale-stone transition-all duration-200 hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-orange-600 transition-all duration-200 hover:shadow-xl"
                  >
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Yes, Logout
                  </button>
                </div>
              </div>
              
              <p className="text-center text-xs text-drift-gray mt-2 sm:mt-4 italic">
                Swipe left or right to dismiss
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
