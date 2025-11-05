"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { Logo } from "@/components/logo"
import { useRouter } from "next/navigation"
import { SignupModal } from "@/components/signup-modal"

export function Navbar({ onSidebarOpen, onSignIn }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const isMobile = useMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()
  const currentPathname = router.pathname || ''

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled ? "bg-white/80 shadow-sm backdrop-blur-sm" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between relative">
            {/* Logo left */}
            <div className="flex items-center flex-shrink-0">
              <Logo href="/" />
            </div>

            {/* Desktop Center Nav */}
            {!isMobile && (
              <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-8">
                <Link
                  href="/"
                  className={`text-sm font-medium transition-colors ${(currentPathname || '') === '/' ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:text-soft-amber'}`}
                >
                  Home
                </Link>
                <Link
                  href="/information?section=about"
                  className={`text-sm font-medium transition-colors ${(currentPathname || '').startsWith('/information') && (router.asPath || '').includes('section=about') ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:text-soft-amber'}`}
                >
                  About
                </Link>
                <Link
                  href="/information?section=services"
                  className={`text-sm font-medium transition-colors ${(currentPathname || '').startsWith('/information') && (router.asPath || '').includes('section=services') ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:text-soft-amber'}`}
                >
                  Services
                </Link>
                <Link
                  href="/information?section=doctors"
                  className={`text-sm font-medium transition-colors ${(currentPathname || '').startsWith('/information') && (router.asPath || '').includes('section=doctors') ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:text-soft-amber'}`}
                >
                  Doctors
                </Link>
                <Link
                  href="/information?section=contact"
                  className={`text-sm font-medium transition-colors ${(currentPathname || '').startsWith('/information') && (router.asPath || '').includes('section=contact') ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:text-soft-amber'}`}
                >
                  Contact
                </Link>
              </nav>
            )}

            {/* Desktop Auth Buttons Right */}
            {!isMobile && (
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  onClick={onSignIn}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-earth-beige bg-white px-4 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-soft-amber px-4 text-sm font-medium text-graphite transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Right */}
            {isMobile && (
              <div className="ml-auto flex items-center">
                <button
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md p-2 text-drift-gray hover:bg-pale-stone hover:text-soft-amber focus:outline-none"
                  aria-label="Open menu"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                {/* Dropdown */}
                <div
                  ref={dropdownRef}
                  className={`fixed inset-x-0 top-16 bg-white shadow-lg transition-all duration-300 z-50 overflow-y-auto ${
                    mobileMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
                  }`}
                >
                  <nav className="flex flex-col py-2">
                    <Link
                      href="/"
                      className={`px-6 py-3 text-base font-medium transition-colors ${(currentPathname || '') === '/' ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:bg-pale-stone hover:text-soft-amber'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      href="/information?section=about"
                      className={`px-6 py-3 text-base font-medium transition-colors ${(currentPathname || '').startsWith('/information') && (router.asPath || '').includes('section=about') ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:bg-pale-stone hover:text-soft-amber'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About
                    </Link>
                    <Link
                      href="/information?section=services"
                      className={`px-6 py-3 text-base font-medium transition-colors ${(currentPathname || '').startsWith('/information') && (router.asPath || '').includes('section=services') ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:bg-pale-stone hover:text-soft-amber'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Services
                    </Link>
                    <Link
                      href="/information?section=doctors"
                      className={`px-6 py-3 text-base font-medium transition-colors ${(currentPathname || '').startsWith('/information') && (router.asPath || '').includes('section=doctors') ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:bg-pale-stone hover:text-soft-amber'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Doctors
                    </Link>
                    <Link
                      href="/information?section=contact"
                      className={`px-6 py-3 text-base font-medium transition-colors ${(currentPathname || '').startsWith('/information') && (router.asPath || '').includes('section=contact') ? 'text-soft-amber font-semibold' : 'text-drift-gray hover:bg-pale-stone hover:text-soft-amber'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Contact
                    </Link>
                    <div className="border-t border-earth-beige my-2" />
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        onSignIn()
                      }}
                      className="mx-4 mb-2 mt-1 flex h-10 items-center justify-center rounded-md border border-earth-beige bg-white px-6 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setShowSignupModal(true)
                      }}
                      className="mx-4 mb-3 flex h-10 items-center justify-center rounded-md bg-soft-amber px-6 text-sm font-medium text-white transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                    >
                      Sign Up
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <SignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} />
      {/* Animation for dropdown */}
      <style jsx>{`
        .dropdown-enter {
          opacity: 0;
          transform: scale(0.95);
        }
        .dropdown-enter-active {
          opacity: 1;
          transform: scale(1);
          transition: opacity 0.3s, transform 0.3s;
        }
        .dropdown-exit {
          opacity: 1;
          transform: scale(1);
        }
        .dropdown-exit-active {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.3s, transform 0.3s;
        }
      `}</style>
    </>
  )
}
