"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowRight, Calendar, CheckCircle, Clock, MessageSquare, Stethoscope, MapPin, Phone, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TestimonialCard } from "@/components/testimonial-card"
import { getLandingPageContent } from "@/lib/welcome-utils"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"

// Contact Form Component
function ContactForm({ contactEmail = "contact@smartcare.com", brandName = "Smart Care" }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: contactEmail,
          subject: `${brandName} Contact Form: ${formData.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px;">
                New Contact Form Submission - ${brandName}
              </h2>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${formData.name}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Subject:</strong> ${formData.subject}</p>
              </div>
              <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #374151; margin-top: 0;">Message:</h3>
                <p style="color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${formData.message}</p>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                This message was sent from the Smart Care contact form.
              </p>
            </div>
          `,
          text: `
New Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
This message was sent from the ${brandName} contact form.
          `,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitStatus("success")
        setFormData({ name: "", email: "", subject: "", message: "" })
        // Clear status after 5 seconds
        setTimeout(() => setSubmitStatus(null), 5000)
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Error sending contact form:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-graphite mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full rounded-lg border ${
              errors.name ? "border-red-300" : "border-earth-beige"
            } bg-white px-4 py-3 text-graphite placeholder-drift-gray/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all`}
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-graphite mb-2">
            Your Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-lg border ${
              errors.email ? "border-red-300" : "border-earth-beige"
            } bg-white px-4 py-3 text-graphite placeholder-drift-gray/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all`}
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-graphite mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
            className={`w-full rounded-lg border ${
              errors.subject ? "border-red-300" : "border-earth-beige"
            } bg-white px-4 py-3 text-graphite placeholder-drift-gray/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all`}
          placeholder="What is this regarding?"
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-graphite mb-2">
          Your Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={6}
            className={`w-full rounded-lg border ${
              errors.message ? "border-red-300" : "border-earth-beige"
            } bg-white px-4 py-3 text-graphite placeholder-drift-gray/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none transition-all`}
          placeholder="Tell us how we can help you..."
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit Status Messages */}
      {submitStatus === "success" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Message sent successfully!</p>
            <p className="text-xs text-green-600">We'll get back to you within 24 hours.</p>
          </div>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to send message</p>
            <p className="text-xs text-red-600">Please try again or contact us directly.</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Sending...
          </>
        ) : (
          <>
            Send Message
            <Send className="ml-2 h-5 w-5" />
          </>
        )}
      </button>
    </form>
  )
}

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const defaultBranding = {
    name: "Smart Care",
    tagline: "Your Health, One Click Away",
    description:
      "Connecting patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
    logoUrl: "",
    faviconUrl: "/SmartCare.png?v=2",
    contact: {
      address: "123 Healthcare Avenue, Medical District, CA 90210",
      phone: "+1 (555) 123-4567",
      email: "contact@smartcare.com",
    },
    footer: {
      description:
        "Smart Care connects patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
      note: "All rights reserved.",
      socials: {
        facebook: "",
        twitter: "",
        instagram: "",
      },
    },
  }
  const [landingContent, setLandingContent] = useState({
    branding: defaultBranding,
    hero: {
      title: "Your Health, One Click Away",
      description:
        "Smart Care connects you with healthcare professionals for virtual consultations, prescription management, and personalized care from the comfort of your home.",
      imageUrl: "/placeholder.svg?height=400&width=600",
    },
    features: [
      {
        icon: "MessageSquare",
        title: "Virtual Consultations",
        description: "Connect with healthcare professionals from the comfort of your home via secure video calls.",
      },
      {
        icon: "Calendar",
        title: "Easy Scheduling",
        description: "Book appointments with just a few clicks and receive instant confirmations.",
      },
      {
        icon: "Clock",
        title: "24/7 Support",
        description: "Access medical advice anytime with our round-the-clock healthcare support.",
      },
      {
        icon: "CheckCircle",
        title: "Secure & Private",
        description: "Your health information is protected with industry-leading security measures.",
      },
    ],
    howItWorks: {
      title: "How It Works",
      description:
        "Getting started with Smart Care is simple. Follow these steps to access quality healthcare from anywhere.",
    },
    testimonials: {
      title: "What Our Users Say",
      description: "Hear from patients and healthcare providers who have experienced the benefits of Smart Care.",
    },
    cta: {
      title: "Ready to Transform Your Healthcare Experience?",
      description: "Join thousands of satisfied users who have made Smart Care their go-to healthcare solution.",
    },
    forDoctors: {
      title: "For Healthcare Providers",
      description:
        "Smart Care offers a streamlined platform for healthcare providers to connect with patients, manage appointments, and provide virtual care.",
      imageUrl: "/placeholder.svg?height=400&width=600",
      benefits: [
        "Expand your practice beyond geographical limitations",
        "Reduce administrative burden with our intuitive platform",
        "Access patient records securely from anywhere",
        "Flexible scheduling to fit your availability",
      ],
    },
  })

  // Load landing page content
  useEffect(() => {
    const loadContent = async () => {
      try {
        const content = await getLandingPageContent()
        if (content) {
          setLandingContent({
            ...content,
            branding: {
              ...defaultBranding,
              ...(content.branding || {}),
              contact: {
                ...defaultBranding.contact,
                ...(content.branding?.contact || {}),
              },
              footer: {
                ...defaultBranding.footer,
                ...(content.branding?.footer || {}),
                socials: {
                  ...defaultBranding.footer.socials,
                  ...(content.branding?.footer?.socials || {}),
                },
              },
            },
          })
        }
      } catch (error) {
        console.error("Error loading landing page content:", error)
      }
    }

    loadContent()
    setMounted(true)
  }, [])

  // Apply scrollbar hiding to body and html
  useEffect(() => {
    if (mounted) {
      document.body.classList.add('scrollbar-hide')
      document.documentElement.classList.add('scrollbar-hide')
      return () => {
        document.body.classList.remove('scrollbar-hide')
        document.documentElement.classList.remove('scrollbar-hide')
      }
    }
  }, [mounted])

  // Update page title and favicon based on branding
  useEffect(() => {
    const brandName = landingContent.branding?.name || "Smart Care"
    const heroTitle = landingContent.hero?.title || "Your Health, One Click Away"
    document.title = `${brandName} - ${heroTitle}`

    const applyFavicon = (rel, href) => {
      if (!href) return
      let link = document.querySelector(`link[rel='${rel}']`)
      if (!link) {
        link = document.createElement("link")
        link.setAttribute("rel", rel)
        document.head.appendChild(link)
      }
      link.setAttribute("href", href)
      link.setAttribute("type", "image/png")
    }

    const favicon = landingContent.branding?.faviconUrl
    applyFavicon("icon", favicon)
    applyFavicon("shortcut icon", favicon)
    applyFavicon("apple-touch-icon", favicon)
  }, [landingContent.branding, landingContent.hero?.title])

  // Map icon names to components
  const getIconComponent = (iconName, className) => {
    const icons = {
      MessageSquare: <MessageSquare className={className} />,
      Calendar: <Calendar className={className} />,
      Clock: <Clock className={className} />,
      CheckCircle: <CheckCircle className={className} />,
      Stethoscope: <Stethoscope className={className} />,
    }

    return icons[iconName] || <MessageSquare className={className} />
  }

  const brandName = landingContent.branding?.name || "Smart Care"
  const brandTagline = landingContent.branding?.tagline || "Your Health, One Click Away"
  const brandContact = landingContent.branding?.contact || {}
  const contactEmail = brandContact.email || "contact@smartcare.com"
  const contactPhone = brandContact.phone || "+1 (555) 123-4567"
  const contactAddress = brandContact.address || "123 Healthcare Avenue, Medical District, CA 90210"
  const phoneHref = contactPhone ? contactPhone.replace(/[^+\d]/g, "") : ""

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Patient",
      testimonial:
        "Smart Care has transformed how I manage my healthcare. The virtual consultations are so convenient, and the doctors are incredibly attentive.",
      avatarSrc: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Dr. Michael Chen",
      role: "Cardiologist",
      testimonial:
        "As a healthcare provider, Smart Care has allowed me to connect with patients more efficiently and provide care to those who might otherwise struggle to access it.",
      avatarSrc: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Emily Rodriguez",
      role: "Patient",
      testimonial:
        "The ease of scheduling appointments and getting prescriptions refilled has made managing my chronic condition so much easier. Highly recommend!",
      avatarSrc: "/placeholder.svg?height=100&width=100",
    },
  ]

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 70 // Account for fixed navbar (64px header + 6px spacing)
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col scrollbar-hide overflow-x-hidden">
      <Navbar 
        onSidebarOpen={() => {}} 
        onSignIn={() => setShowLoginModal(true)}
        scrollToSection={scrollToSection}
      />
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
      />
      <SignupModal 
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToSignin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
      />

      {/* Hero Section */}
      <section id="home" className="relative flex items-center bg-gradient-to-br from-pale-stone via-white to-amber-50/30 pt-20 pb-8 md:pt-24 md:pb-12 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container px-4 sm:px-6 md:px-6 mx-auto relative z-10">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-3 animate-fadeInUp">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-1">
                <span className="text-xs sm:text-sm font-semibold text-amber-600">✨ {brandTagline}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight text-graphite leading-tight">
                {landingContent.hero.title}
              </h1>
              <p className="max-w-[600px] text-base sm:text-lg md:text-xl text-drift-gray leading-relaxed mt-1">
                {landingContent.hero.description}
              </p>
              <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row pt-1">
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="group inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-full sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className="inline-flex h-11 sm:h-12 items-center justify-center rounded-lg border border-earth-beige bg-white px-4 sm:px-5 py-2.5 text-sm font-medium text-graphite hover:bg-pale-stone transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2 w-full sm:w-auto"
                >
                  Learn More
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center animate-fadeInRight">
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-amber-400/20 rounded-3xl blur-3xl animate-pulse"></div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-amber-400/20 rounded-3xl blur-xl animate-pulse delay-500"></div>
              <img
                src={landingContent.hero.imageUrl || "/placeholder.svg"}
                alt={`${brandName} Platform`}
                    className="relative aspect-video overflow-hidden rounded-2xl object-cover object-center shadow-2xl transform hover:scale-105 transition-transform duration-500"
                width={600}
                height={400}
              />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white to-pale-stone/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,166,35,0.05),transparent_50%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-6">
              <span className="text-sm font-semibold text-amber-600">Features</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-graphite mb-3 sm:mb-4">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-drift-gray">
              Smart Care offers a range of features designed to make healthcare accessible, convenient, and personalized for everyone.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
            {landingContent.features.map((feature, index) => (
              <div
                key={index}
                className="group flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-earth-beige/50 bg-white/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-sm transition-all duration-500 hover:shadow-2xl hover:border-amber-500/50 hover:-translate-y-2 hover:bg-white"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-50 p-3 sm:p-4 w-fit group-hover:from-amber-500/20 group-hover:to-amber-100 transition-all duration-300 group-hover:scale-110">
                  {getIconComponent(feature.icon, "h-6 w-6 sm:h-8 sm:w-8 text-amber-600")}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-graphite group-hover:text-amber-600 transition-colors">{feature.title}</h3>
                <p className="text-sm sm:text-base text-drift-gray leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-earth-beige/10 via-pale-stone/50 to-amber-50/20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,166,35,0.05)_0%,transparent_50%,rgba(245,166,35,0.05)_100%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-6">
              <span className="text-sm font-semibold text-amber-600">Simple Process</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl mb-4">
              {landingContent.howItWorks.title}
            </h2>
            <p className="text-lg text-drift-gray md:text-xl">
              {landingContent.howItWorks.description}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                number: 1,
                title: "Create an Account",
                description: "Sign up for Smart Care and complete your health profile with relevant medical information."
              },
              {
                number: 2,
                title: "Book an Appointment",
                description: "Browse available healthcare providers and schedule a virtual consultation at your convenience."
              },
              {
                number: 3,
                title: "Receive Care",
                description: "Connect with your provider via secure video call, get diagnoses, prescriptions, and follow-up care."
              }
            ].map((step, index) => (
              <div key={index} className="group flex flex-col items-center gap-4 text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-earth-beige/30 hover:bg-white hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-400 text-3xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.number}
              </div>
            </div>
                <h3 className="text-xl font-bold text-graphite group-hover:text-amber-600 transition-colors">{step.title}</h3>
                <p className="text-drift-gray leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white via-pale-stone/20 to-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,166,35,0.03),transparent_70%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-6">
              <span className="text-sm font-semibold text-amber-600">Testimonials</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl mb-4">
              {landingContent.testimonials.title}
            </h2>
            <p className="text-lg text-drift-gray md:text-xl">
              {landingContent.testimonials.description}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="transform transition-all duration-300 hover:scale-105">
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section id="for-doctors" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-earth-beige/10 via-pale-stone/50 to-amber-50/20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(245,166,35,0.03)_0%,transparent_50%,rgba(245,166,35,0.03)_100%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex items-center justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-amber-400/20 rounded-3xl blur-3xl animate-pulse"></div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-amber-400/20 rounded-3xl blur-xl"></div>
              <img
                src={landingContent.forDoctors.imageUrl || "/placeholder.svg"}
                alt="Doctor using Smart Care"
                    className="relative aspect-video overflow-hidden rounded-2xl object-cover object-center shadow-2xl transform hover:scale-105 transition-transform duration-500"
                width={600}
                height={400}
              />
            </div>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-4">
                <span className="text-sm font-semibold text-amber-600">For Healthcare Providers</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl">
                  {landingContent.forDoctors.title}
                </h2>
                <p className="text-lg text-drift-gray md:text-xl leading-relaxed">
                  {landingContent.forDoctors.description}
                </p>
              </div>
              <ul className="grid gap-4">
                {landingContent.forDoctors.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors group">
                    <div className="rounded-full bg-amber-500/10 p-1.5 group-hover:bg-amber-500/20 transition-colors">
                      <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    </div>
                    <span className="text-graphite text-lg group-hover:text-amber-600 transition-colors">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="group inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-8 text-base font-semibold text-white transition-all hover:from-amber-600 hover:to-amber-500 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transform duration-300"
                >
                  Join as a Provider
                  <Stethoscope className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-amber-500/10 via-amber-50/30 to-pale-stone overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(245,158,11,0.05),transparent_50%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl flex flex-col items-center justify-center gap-8 text-center p-12 rounded-3xl bg-white/60 backdrop-blur-sm border border-amber-500/20 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-50 border border-amber-500/30 w-fit mb-4">
              <span className="text-sm font-semibold text-amber-600">Ready to Start?</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl">
              {landingContent.cta.title}
            </h2>
            <p className="text-lg text-drift-gray md:text-xl leading-relaxed">
              {landingContent.cta.description}
            </p>
            <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row pt-4 w-full sm:w-auto">
              <button
                onClick={() => setShowSignupModal(true)}
                className="group inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-full sm:w-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex h-11 sm:h-12 items-center justify-center rounded-lg border border-earth-beige bg-white px-4 sm:px-5 py-2.5 text-sm font-medium text-graphite hover:bg-pale-stone transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2 w-full sm:w-auto"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-white via-pale-stone/30 to-amber-50/20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(245,166,35,0.05),transparent_70%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-6">
              <span className="text-sm font-semibold text-amber-600">Contact Us</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-drift-gray md:text-xl">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
          
          <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-3">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="group rounded-2xl border border-earth-beige/50 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-2xl hover:border-amber-500/50 hover:-translate-y-2 hover:bg-white">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-50 p-4 group-hover:from-amber-500/30 group-hover:to-amber-100 group-hover:scale-110 transition-all duration-300">
                    <MapPin className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-graphite mb-2 group-hover:text-amber-600 transition-colors">Our Location</h3>
                    <p className="text-drift-gray leading-relaxed break-words">{contactAddress}</p>
                  </div>
                </div>
              </div>

              <div className="group rounded-2xl border border-earth-beige/50 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-2xl hover:border-amber-500/50 hover:-translate-y-2 hover:bg-white">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-50 p-4 group-hover:from-amber-500/30 group-hover:to-amber-100 group-hover:scale-110 transition-all duration-300">
                    <Phone className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-graphite mb-2 group-hover:text-amber-600 transition-colors">Phone Number</h3>
                    <a href={phoneHref ? `tel:${phoneHref}` : "#"} className="text-drift-gray hover:text-amber-600 transition-colors font-medium">
                      {contactPhone}
                    </a>
                    <p className="text-sm text-drift-gray mt-1">Mon-Fri: 9AM - 6PM EST</p>
                  </div>
                </div>
              </div>

              <div className="group rounded-2xl border border-earth-beige/50 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-2xl hover:border-amber-500/50 hover:-translate-y-2 hover:bg-white">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-50 p-4 group-hover:from-amber-500/30 group-hover:to-amber-100 group-hover:scale-110 transition-all duration-300">
                    <Mail className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-graphite mb-2 group-hover:text-amber-600 transition-colors">Email Address</h3>
                    <a href={`mailto:${contactEmail}`} className="text-drift-gray hover:text-amber-600 transition-colors break-all font-medium">
                      {contactEmail}
                    </a>
                    <p className="text-sm text-drift-gray mt-1">We respond within 24 hours</p>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="rounded-2xl border border-earth-beige/50 bg-gradient-to-br from-amber-500/5 to-amber-50/30 p-6 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-graphite mb-4">Office Hours</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-white/50 transition-colors">
                    <span className="text-drift-gray">Monday - Friday</span>
                    <span className="font-semibold text-graphite">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-white/50 transition-colors">
                    <span className="text-drift-gray">Saturday</span>
                    <span className="font-semibold text-graphite">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-white/50 transition-colors">
                    <span className="text-drift-gray">Sunday</span>
                    <span className="font-semibold text-graphite">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-earth-beige/50 bg-white/80 backdrop-blur-sm p-8 md:p-10 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-graphite mb-2">Send us a message</h3>
                  <p className="text-drift-gray">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>
                </div>
                <ContactForm contactEmail={contactEmail} brandName={brandName} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer scrollToSection={scrollToSection} brand={landingContent.branding} />
    </div>
  )
}
