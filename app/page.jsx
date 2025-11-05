"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Calendar, CheckCircle, Clock, MessageSquare, Stethoscope, Shield, Heart } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TestimonialCard } from "@/components/testimonial-card"
import { HealthTipsCarousel } from "@/components/health-tips-carousel"
import { WelcomeSidebar } from "@/components/welcome-sidebar"
import { getLandingPageContent } from "@/lib/welcome-utils"
import { Logo } from "@/components/logo"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [landingContent, setLandingContent] = useState({
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
          setLandingContent(content)
        }
      } catch (error) {
        console.error("Error loading landing page content:", error)
      }
    }

    loadContent()
  }, [])

  // Map icon names to components
  const getIconComponent = (iconName, className) => {
    const icons = {
      MessageSquare: <MessageSquare className={className} />,
      Calendar: <Calendar className={className} />,
      Clock: <Clock className={className} />,
      CheckCircle: <CheckCircle className={className} />,
      Shield: <Shield className={className} />,
      Heart: <Heart className={className} />,
      Stethoscope: <Stethoscope className={className} />,
    }

    return icons[iconName] || <MessageSquare className={className} />
  }

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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onSidebarOpen={() => setIsSidebarOpen(true)} onSignIn={() => setShowLoginModal(true)} />
      <WelcomeSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} onSignIn={() => setShowLoginModal(true)} />
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
      <section className="bg-pale-stone py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter text-graphite sm:text-5xl xl:text-6xl">
                  {landingContent.hero.title}
                </h1>
                <p className="max-w-[600px] text-drift-gray md:text-xl">{landingContent.hero.description}</p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-soft-amber px-8 text-sm font-medium text-graphite transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-earth-beige bg-white px-8 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2"
                >
                  Sign In
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                src={landingContent.hero.imageUrl || "/placeholder.svg"}
                alt="Smart Care Platform"
                className="aspect-video overflow-hidden rounded-xl object-cover object-center"
                width={600}
                height={400}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-graphite sm:text-5xl">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="max-w-[85%] text-drift-gray md:text-xl">
              Smart Care offers a range of features designed to make healthcare accessible, convenient, and personalized
              for everyone.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2">
            {landingContent.features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-earth-beige bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="rounded-full bg-soft-amber/20 p-4 w-fit">
                  {getIconComponent(feature.icon, "h-10 w-10 text-soft-amber")}
                </div>
                <h3 className="text-xl font-bold text-graphite">{feature.title}</h3>
                <p className="text-drift-gray">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-earth-beige/20 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-graphite sm:text-5xl">
              {landingContent.howItWorks.title}
            </h2>
            <p className="max-w-[85%] text-drift-gray md:text-xl">{landingContent.howItWorks.description}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-amber text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold text-graphite">Create an Account</h3>
              <p className="text-drift-gray">
                Sign up for Smart Care and complete your health profile with relevant medical information.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-amber text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold text-graphite">Book an Appointment</h3>
              <p className="text-drift-gray">
                Browse available healthcare providers and schedule a virtual consultation at your convenience.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft-amber text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold text-graphite">Receive Care</h3>
              <p className="text-drift-gray">
                Connect with your provider via secure video call, get diagnoses, prescriptions, and follow-up care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Health Tips Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-graphite sm:text-5xl">Health Tips & Resources</h2>
            <p className="max-w-[85%] text-drift-gray md:text-xl">
              Stay informed with the latest health tips and resources from our medical professionals.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-6xl">
            <HealthTipsCarousel />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-earth-beige/20 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-graphite sm:text-5xl">
              {landingContent.testimonials.title}
            </h2>
            <p className="max-w-[85%] text-drift-gray md:text-xl">{landingContent.testimonials.description}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-graphite sm:text-5xl">
              {landingContent.cta.title}
            </h2>
            <p className="max-w-[85%] text-drift-gray md:text-xl">{landingContent.cta.description}</p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <button
                onClick={() => setShowSignupModal(true)}
                className="inline-flex h-10 items-center justify-center rounded-md bg-soft-amber px-8 text-sm font-medium text-graphite transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <Link
                href="/information?section=about"
                className="inline-flex h-10 items-center justify-center rounded-md border border-earth-beige bg-white px-8 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section className="bg-earth-beige/20 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex items-center justify-center">
              <img
                src={landingContent.forDoctors.imageUrl || "/placeholder.svg"}
                alt="Doctor using Smart Care"
                className="aspect-video overflow-hidden rounded-xl object-cover object-center"
                width={600}
                height={400}
              />
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter text-graphite sm:text-4xl">
                  {landingContent.forDoctors.title}
                </h2>
                <p className="text-drift-gray md:text-xl">{landingContent.forDoctors.description}</p>
              </div>
              <ul className="grid gap-2">
                {landingContent.forDoctors.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-soft-amber" />
                    <span className="text-graphite">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-soft-amber px-8 text-sm font-medium text-graphite transition-colors hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                >
                  Join as a Provider
                  <Stethoscope className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
