"use client"

import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react"
import { PWAInstallPrompt } from "@/app/pwa-install-prompt"

export function Footer({ scrollToSection }) {
  const handleNavClick = (e, sectionId) => {
    e.preventDefault()
    if (scrollToSection) {
      scrollToSection(sectionId)
    }
  }
  return (
    <footer className="bg-white">
      <div className="container px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-soft-amber">SmartCare</span>
            </Link>
            <p className="mt-4 text-drift-gray">
              Connecting patients with healthcare professionals for virtual consultations, prescription management, and
              personalized care.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link
                href="#"
                className="rounded-full bg-pale-stone p-2 text-drift-gray transition-colors hover:bg-soft-amber hover:text-white"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="rounded-full bg-pale-stone p-2 text-drift-gray transition-colors hover:bg-soft-amber hover:text-white"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="#"
                className="rounded-full bg-pale-stone p-2 text-drift-gray transition-colors hover:bg-soft-amber hover:text-white"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-graphite">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={(e) => handleNavClick(e, 'home')}
                  className="text-drift-gray transition-colors hover:text-soft-amber text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick(e, 'features')}
                  className="text-drift-gray transition-colors hover:text-soft-amber text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick(e, 'how-it-works')}
                  className="text-drift-gray transition-colors hover:text-soft-amber text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick(e, 'testimonials')}
                  className="text-drift-gray transition-colors hover:text-soft-amber text-left"
                >
                  Testimonials
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick(e, 'for-doctors')}
                  className="text-drift-gray transition-colors hover:text-soft-amber text-left"
                >
                  For Doctors
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick(e, 'contact')}
                  className="text-drift-gray transition-colors hover:text-soft-amber text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-graphite">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/information?section=services#consultations"
                  className="text-drift-gray transition-colors hover:text-soft-amber"
                >
                  Virtual Consultations
                </Link>
              </li>
              <li>
                <Link
                  href="/information?section=services#prescriptions"
                  className="text-drift-gray transition-colors hover:text-soft-amber"
                >
                  Prescription Management
                </Link>
              </li>
              <li>
                <Link
                  href="/information?section=services#monitoring"
                  className="text-drift-gray transition-colors hover:text-soft-amber"
                >
                  Health Monitoring
                </Link>
              </li>
              <li>
                <Link
                  href="/information?section=services#records"
                  className="text-drift-gray transition-colors hover:text-soft-amber"
                >
                  Medical Records
                </Link>
              </li>
              <li>
                <Link
                  href="/information?section=services#support"
                  className="text-drift-gray transition-colors hover:text-soft-amber"
                >
                  24/7 Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-graphite">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="mr-2 h-5 w-5 text-soft-amber" />
                <span className="text-drift-gray">123 Healthcare Avenue, Medical District, CA 90210</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-5 w-5 text-soft-amber" />
                <span className="text-drift-gray">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-5 w-5 text-soft-amber" />
                <span className="text-drift-gray">contact@smartcare.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-earth-beige pt-6">
          <div className="mb-6 max-w-md mx-auto">
            <PWAInstallPrompt />
          </div>
          <p className="text-center text-drift-gray">&copy; {new Date().getFullYear()} Smart Care. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
