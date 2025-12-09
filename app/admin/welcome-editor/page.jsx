"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Upload,
  Save,
  Eye,
  CheckCircle,
  Edit,
  ImageIcon,
  Layout,
  MessageSquare,
  AlertCircle,
} from "lucide-react"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SuccessNotification } from "@/components/success-notification"
import {
  getWelcomeContent,
  updateWelcomeContent,
  uploadWelcomeImage,
  deleteWelcomeImage,
  getLandingPageContent,
  updateLandingPageContent,
  uploadLandingPageImage,
  getLogoContent,
  updateLogoContent,
  uploadLogoImage,
  deleteLogoImage,
} from "@/lib/welcome-utils"
import { useAuth } from "@/contexts/auth-context"

export default function WelcomeEditorPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("landing")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [welcomeContent, setWelcomeContent] = useState({
    patient: {
      title: "Welcome to Smart Care",
      description: "Your health is our priority. Access your medical records, appointments, and more.",
      showOnLogin: true,
      imageUrl: "",
    },
    doctor: {
      title: "Welcome, Doctor",
      description: "Manage your patients, appointments, and prescriptions efficiently.",
      showOnLogin: true,
      imageUrl: "",
    },
    admin: {
      title: "Welcome, Admin",
      description: "Manage the Smart Care platform and its users.",
      showOnLogin: true,
      imageUrl: "",
    },
  })

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

  const [uploadingImage, setUploadingImage] = useState({
    section: "",
    isUploading: false,
  })

  const [logoContent, setLogoContent] = useState({
    text: "SmartCare",
    color: "#F2B95E", // soft-amber color
    fontSize: "text-xl",
    fontWeight: "font-bold",
    imageUrl: "",
  })

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      showNotification("You must be logged in to access this page", true)
    }
  }, [user])

  // Load welcome content on mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        const welcomeData = await getWelcomeContent()
        if (welcomeData) {
          setWelcomeContent(welcomeData)
          if (welcomeData.lastUpdated) {
            setLastUpdated(welcomeData.lastUpdated)
          }
        }

        const landingData = await getLandingPageContent()
        if (landingData) {
          setLandingContent(landingData)
          if (landingData.lastUpdated && (!lastUpdated || landingData.lastUpdated > lastUpdated)) {
            setLastUpdated(landingData.lastUpdated)
          }
        }

        const logoData = await getLogoContent()
        if (logoData) {
          setLogoContent(logoData)
        }
      } catch (error) {
        console.error("Error loading content:", error)
        showNotification("Failed to load content: " + (error.message || "Unknown error"), true)
      }
    }

    loadContent()
  }, [])

  // Handle welcome content changes
  const handleWelcomeChange = (userType, field, value) => {
    setWelcomeContent((prev) => ({
      ...prev,
      [userType]: {
        ...prev[userType],
        [field]: value,
      },
    }))
  }

  // Handle landing page content changes
  const handleLandingChange = (section, field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  // Handle feature changes
  const handleFeatureChange = (index, field, value) => {
    setLandingContent((prev) => {
      const updatedFeatures = [...prev.features]
      updatedFeatures[index] = {
        ...updatedFeatures[index],
        [field]: value,
      }
      return {
        ...prev,
        features: updatedFeatures,
      }
    })
  }

  // Handle doctor benefit changes
  const handleBenefitChange = (index, value) => {
    setLandingContent((prev) => {
      const updatedBenefits = [...prev.forDoctors.benefits]
      updatedBenefits[index] = value
      return {
        ...prev,
        forDoctors: {
          ...prev.forDoctors,
          benefits: updatedBenefits,
        },
      }
    })
  }

  // Handle logo content changes
  const handleLogoChange = (field, value) => {
    setLogoContent((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Show notification
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    isError: false,
  })

  const showNotification = (message, isError = false) => {
    setNotification({
      show: true,
      message,
      isError,
    })

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }))
    }, 5000)
  }

  // Handle image upload
  const handleImageUpload = async (e, section, isLanding = false) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size
    if (file.size > 1024 * 1024) {
      showNotification("Image size exceeds 1MB limit. Please choose a smaller image.", true)
      return
    }

    setUploadingImage({
      section,
      isUploading: true,
    })

    try {
      let imageUrl

      if (isLanding) {
        imageUrl = await uploadLandingPageImage(file, section)
        setLandingContent((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            imageUrl,
          },
        }))
      } else {
        imageUrl = await uploadWelcomeImage(file, section)
        setWelcomeContent((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            imageUrl,
          },
        }))
      }

      showNotification("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      showNotification("Failed to upload image: " + (error.message || "Unknown error"), true)
    } finally {
      setUploadingImage({
        section: "",
        isUploading: false,
      })
    }
  }

  // Handle image delete
  const handleImageDelete = async (userType) => {
    if (!welcomeContent[userType].imageUrl) return

    if (confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteWelcomeImage(welcomeContent[userType].imageUrl)
        setWelcomeContent((prev) => ({
          ...prev,
          [userType]: {
            ...prev[userType],
            imageUrl: "",
          },
        }))
        showNotification("Image deleted successfully")
      } catch (error) {
        console.error("Error deleting image:", error)
        showNotification("Failed to delete image: " + (error.message || "Unknown error"), true)
      }
    }
  }

  // Add a function to handle logo image upload
  const handleLogoImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size
    if (file.size > 500 * 1024) {
      showNotification("Image size exceeds 500KB limit. Please choose a smaller image.", true)
      return
    }

    setUploadingImage({
      section: "logo",
      isUploading: true,
    })

    try {
      const imageUrl = await uploadLogoImage(file)
      setLogoContent((prev) => ({
        ...prev,
        imageUrl,
      }))
      showNotification("Logo image uploaded successfully")
    } catch (error) {
      console.error("Error uploading logo image:", error)
      showNotification("Failed to upload logo image: " + (error.message || "Unknown error"), true)
    } finally {
      setUploadingImage({
        section: "",
        isUploading: false,
      })
    }
  }

  // Add a function to handle logo image deletion
  const handleLogoImageDelete = async () => {
    if (!logoContent.imageUrl) return

    if (confirm("Are you sure you want to delete the logo image?")) {
      try {
        await deleteLogoImage()
        setLogoContent((prev) => ({
          ...prev,
          imageUrl: "",
        }))
        showNotification("Logo image deleted successfully")
      } catch (error) {
        console.error("Error deleting logo image:", error)
        showNotification("Failed to delete logo image: " + (error.message || "Unknown error"), true)
      }
    }
  }

  // Save all content
  const handleSave = async () => {
    setIsSaving(true)

    try {
      let result

      if (activeTab === "landing") {
        result = await updateLandingPageContent(landingContent)
      } else {
        result = await updateWelcomeContent(welcomeContent)
      }

      if (activeTab === "logo") {
        result = await updateLogoContent(logoContent)
      }

      if (result.success) {
        setLastUpdated(new Date())
        setSaveSuccess(true)
        showNotification(result.message || "Content saved successfully")
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        showNotification(result.message || "Failed to save content", true)
      }
    } catch (error) {
      console.error("Error saving content:", error)
      showNotification("Failed to save content: " + (error.message || "Unknown error"), true)
    } finally {
      setIsSaving(false)
    }
  }

  // Preview landing page
  const handlePreview = () => {
    window.open("/", "_blank")
  }

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "Never"

    try {
      // Handle Firebase Timestamp objects
      const date = timestamp?.toDate
        ? timestamp.toDate()
        : // Handle serialized timestamp objects
          timestamp?.seconds
          ? new Date(timestamp.seconds * 1000)
          : // Handle regular dates or timestamps
            new Date(timestamp)

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Unknown"
    }
  }

  // Stats for the banner
  const stats = [
    {
      label: "Last Updated",
      value: formatDate(lastUpdated),
      icon: <Edit className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Landing Sections",
      value: "7",
      icon: <Layout className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Welcome Modals",
      value: "3",
      icon: <MessageSquare className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Features",
      value: landingContent.features.length,
      icon: <CheckCircle className="h-4 w-4 text-white/70" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Banner */}
      <AdminHeaderBanner
        title="Content Management"
        subtitle="Edit and manage website content and welcome messages"
        stats={stats}
      />

      {/* Success notification */}
      <SuccessNotification
        message={notification.message}
        isVisible={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        isValidation={notification.isError}
      />

      {/* Authentication warning */}
      {!user && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
          <div>
            <h3 className="font-medium text-amber-800">Authentication Required</h3>
            <p className="text-amber-700 text-sm">
              You are not logged in. Changes may not be saved. Please log in as an admin to manage content.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={isSaving}
          className="bg-white border-earth-beige text-graphite hover:bg-pale-stone"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-soft-amber hover:bg-soft-amber/90 text-white">
          {isSaving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Content Editor</CardTitle>
            <CardDescription>Edit website content and welcome messages for different user types</CardDescription>
          </CardHeader>
          <CardContent>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="landing" className="data-[state=active]:bg-soft-amber data-[state=active]:text-white">
                <Layout className="w-4 h-4 mr-2" />
                Landing Page
              </TabsTrigger>
              <TabsTrigger value="welcome" className="data-[state=active]:bg-soft-amber data-[state=active]:text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Welcome Modals
              </TabsTrigger>
              <TabsTrigger value="logo" className="data-[state=active]:bg-soft-amber data-[state=active]:text-white">
                <Edit className="w-4 h-4 mr-2" />
                Logo Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="landing" className="space-y-6 mt-0">
              {/* Hero Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-soft-amber" />
                    Hero Section
                  </CardTitle>
                  <CardDescription>The main banner section at the top of the landing page</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="hero-title" className="block text-sm font-medium text-graphite mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="hero-title"
                          value={landingContent.hero.title}
                          onChange={(e) => handleLandingChange("hero", "title", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label htmlFor="hero-description" className="block text-sm font-medium text-graphite mb-1">
                          Description
                        </label>
                        <textarea
                          id="hero-description"
                          value={landingContent.hero.description}
                          onChange={(e) => handleLandingChange("hero", "description", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-graphite mb-1">Hero Image</label>
                      <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                        <div className="aspect-video bg-pale-stone rounded-md overflow-hidden mb-4">
                          {landingContent.hero.imageUrl ? (
                            <img
                              src={landingContent.hero.imageUrl || "/placeholder.svg"}
                              alt="Hero"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-drift-gray">
                              <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                              No image selected
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, "hero", true)}
                              disabled={uploadingImage.isUploading}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-drift-gray mt-2">
                          Max file size: 1MB. Recommended dimensions: 1200x600px.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-soft-amber" />
                    Features
                  </CardTitle>
                  <CardDescription>Key features highlighted on the landing page</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {landingContent.features.map((feature, index) => (
                      <div key={index} className="p-4 border border-earth-beige rounded-md bg-pale-stone/10">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-graphite flex items-center">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-soft-amber text-white text-sm mr-2">
                              {index + 1}
                            </span>
                            Feature {index + 1}
                          </h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Icon</label>
                            <select
                              value={feature.icon}
                              onChange={(e) => handleFeatureChange(index, "icon", e.target.value)}
                              className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            >
                              <option value="MessageSquare">Message Square</option>
                              <option value="Calendar">Calendar</option>
                              <option value="Clock">Clock</option>
                              <option value="CheckCircle">Check Circle</option>
                              <option value="Shield">Shield</option>
                              <option value="Heart">Heart</option>
                              <option value="Stethoscope">Stethoscope</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                            <input
                              type="text"
                              value={feature.title}
                              onChange={(e) => handleFeatureChange(index, "title", e.target.value)}
                              className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Description</label>
                            <textarea
                              value={feature.description}
                              onChange={(e) => handleFeatureChange(index, "description", e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* How It Works Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-soft-amber" />
                    How It Works
                  </CardTitle>
                  <CardDescription>Section explaining how the platform works</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="how-it-works-title" className="block text-sm font-medium text-graphite mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="how-it-works-title"
                        value={landingContent.howItWorks.title}
                        onChange={(e) => handleLandingChange("howItWorks", "title", e.target.value)}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="how-it-works-description"
                        className="block text-sm font-medium text-graphite mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="how-it-works-description"
                        value={landingContent.howItWorks.description}
                        onChange={(e) => handleLandingChange("howItWorks", "description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonials Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-soft-amber" />
                    Testimonials
                  </CardTitle>
                  <CardDescription>User testimonials section</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="testimonials-title" className="block text-sm font-medium text-graphite mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="testimonials-title"
                        value={landingContent.testimonials.title}
                        onChange={(e) => handleLandingChange("testimonials", "title", e.target.value)}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="testimonials-description"
                        className="block text-sm font-medium text-graphite mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="testimonials-description"
                        value={landingContent.testimonials.description}
                        onChange={(e) => handleLandingChange("testimonials", "description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-soft-amber" />
                    Call to Action
                  </CardTitle>
                  <CardDescription>Call-to-action section to encourage sign-ups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="cta-title" className="block text-sm font-medium text-graphite mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="cta-title"
                        value={landingContent.cta.title}
                        onChange={(e) => handleLandingChange("cta", "title", e.target.value)}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                    <div>
                      <label htmlFor="cta-description" className="block text-sm font-medium text-graphite mb-1">
                        Description
                      </label>
                      <textarea
                        id="cta-description"
                        value={landingContent.cta.description}
                        onChange={(e) => handleLandingChange("cta", "description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* For Doctors Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-soft-amber" />
                    For Doctors
                  </CardTitle>
                  <CardDescription>Section targeting healthcare providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="for-doctors-title" className="block text-sm font-medium text-graphite mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="for-doctors-title"
                          value={landingContent.forDoctors.title}
                          onChange={(e) => handleLandingChange("forDoctors", "title", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="for-doctors-description"
                          className="block text-sm font-medium text-graphite mb-1"
                        >
                          Description
                        </label>
                        <textarea
                          id="for-doctors-description"
                          value={landingContent.forDoctors.description}
                          onChange={(e) => handleLandingChange("forDoctors", "description", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">Benefits</label>
                        <div className="space-y-2">
                          {landingContent.forDoctors.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-soft-amber/20 text-soft-amber text-sm mr-2">
                                {index + 1}
                              </span>
                              <input
                                type="text"
                                value={benefit}
                                onChange={(e) => handleBenefitChange(index, e.target.value)}
                                className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-graphite mb-1">Doctor Image</label>
                      <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                        <div className="aspect-video bg-pale-stone rounded-md overflow-hidden mb-4">
                          {landingContent.forDoctors.imageUrl ? (
                            <img
                              src={landingContent.forDoctors.imageUrl || "/placeholder.svg"}
                              alt="For Doctors"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-drift-gray">
                              <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                              No image selected
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, "forDoctors", true)}
                              disabled={uploadingImage.isUploading}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-drift-gray mt-2">
                          Max file size: 1MB. Recommended dimensions: 1200x600px.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="welcome" className="space-y-6 mt-0">
              {/* Patient Welcome */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-soft-amber" />
                    Patient Welcome
                  </CardTitle>
                  <CardDescription>Welcome modal shown to patients after login</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="patient-title" className="block text-sm font-medium text-graphite mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="patient-title"
                          value={welcomeContent.patient.title}
                          onChange={(e) => handleWelcomeChange("patient", "title", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label htmlFor="patient-description" className="block text-sm font-medium text-graphite mb-1">
                          Description
                        </label>
                        <textarea
                          id="patient-description"
                          value={welcomeContent.patient.description}
                          onChange={(e) => handleWelcomeChange("patient", "description", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="patient-show"
                          checked={welcomeContent.patient.showOnLogin}
                          onChange={(e) => handleWelcomeChange("patient", "showOnLogin", e.target.checked)}
                          className="h-4 w-4 text-soft-amber border-earth-beige rounded focus:ring-soft-amber"
                        />
                        <label htmlFor="patient-show" className="ml-2 block text-sm text-graphite">
                          Show welcome message on login
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-graphite mb-1">Welcome Image</label>
                      <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                        <div className="aspect-video bg-pale-stone rounded-md overflow-hidden mb-4">
                          {welcomeContent.patient.imageUrl ? (
                            <img
                              src={welcomeContent.patient.imageUrl || "/placeholder.svg"}
                              alt="Patient Welcome"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-drift-gray">
                              <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                              No image selected
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, "patient")}
                              disabled={uploadingImage.isUploading}
                            />
                          </label>
                          {welcomeContent.patient.imageUrl && (
                            <button
                              onClick={() => handleImageDelete("patient")}
                              className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-red-500 hover:bg-pale-stone"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-drift-gray mt-2">
                          Max file size: 1MB. Recommended dimensions: 600x400px.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Welcome */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-soft-amber" />
                    Doctor Welcome
                  </CardTitle>
                  <CardDescription>Welcome modal shown to doctors after login</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="doctor-title" className="block text-sm font-medium text-graphite mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="doctor-title"
                          value={welcomeContent.doctor.title}
                          onChange={(e) => handleWelcomeChange("doctor", "title", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label htmlFor="doctor-description" className="block text-sm font-medium text-graphite mb-1">
                          Description
                        </label>
                        <textarea
                          id="doctor-description"
                          value={welcomeContent.doctor.description}
                          onChange={(e) => handleWelcomeChange("doctor", "description", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="doctor-show"
                          checked={welcomeContent.doctor.showOnLogin}
                          onChange={(e) => handleWelcomeChange("doctor", "showOnLogin", e.target.checked)}
                          className="h-4 w-4 text-soft-amber border-earth-beige rounded focus:ring-soft-amber"
                        />
                        <label htmlFor="doctor-show" className="ml-2 block text-sm text-graphite">
                          Show welcome message on login
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-graphite mb-1">Welcome Image</label>
                      <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                        <div className="aspect-video bg-pale-stone rounded-md overflow-hidden mb-4">
                          {welcomeContent.doctor.imageUrl ? (
                            <img
                              src={welcomeContent.doctor.imageUrl || "/placeholder.svg"}
                              alt="Doctor Welcome"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-drift-gray">
                              <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                              No image selected
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, "doctor")}
                              disabled={uploadingImage.isUploading}
                            />
                          </label>
                          {welcomeContent.doctor.imageUrl && (
                            <button
                              onClick={() => handleImageDelete("doctor")}
                              className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-red-500 hover:bg-pale-stone"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-drift-gray mt-2">
                          Max file size: 1MB. Recommended dimensions: 600x400px.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Welcome */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-soft-amber" />
                    Admin Welcome
                  </CardTitle>
                  <CardDescription>Welcome modal shown to administrators after login</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="admin-title" className="block text-sm font-medium text-graphite mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="admin-title"
                          value={welcomeContent.admin.title}
                          onChange={(e) => handleWelcomeChange("admin", "title", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-description" className="block text-sm font-medium text-graphite mb-1">
                          Description
                        </label>
                        <textarea
                          id="admin-description"
                          value={welcomeContent.admin.description}
                          onChange={(e) => handleWelcomeChange("admin", "description", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="admin-show"
                          checked={welcomeContent.admin.showOnLogin}
                          onChange={(e) => handleWelcomeChange("admin", "showOnLogin", e.target.checked)}
                          className="h-4 w-4 text-soft-amber border-earth-beige rounded focus:ring-soft-amber"
                        />
                        <label htmlFor="admin-show" className="ml-2 block text-sm text-graphite">
                          Show welcome message on login
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-graphite mb-1">Welcome Image</label>
                      <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                        <div className="aspect-video bg-pale-stone rounded-md overflow-hidden mb-4">
                          {welcomeContent.admin.imageUrl ? (
                            <img
                              src={welcomeContent.admin.imageUrl || "/placeholder.svg"}
                              alt="Admin Welcome"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-drift-gray">
                              <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                              No image selected
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, "admin")}
                              disabled={uploadingImage.isUploading}
                            />
                          </label>
                          {welcomeContent.admin.imageUrl && (
                            <button
                              onClick={() => handleImageDelete("admin")}
                              className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-red-500 hover:bg-pale-stone"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-drift-gray mt-2">
                          Max file size: 1MB. Recommended dimensions: 600x400px.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-soft-amber" />
                    Preview
                  </CardTitle>
                  <CardDescription>Preview how welcome modals will appear to users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/10">
                      <h3 className="font-medium text-graphite mb-2 flex items-center">
                        <span className="w-2 h-2 bg-soft-amber rounded-full mr-2"></span>
                        Patient Welcome
                      </h3>
                      <div className="bg-white rounded-md p-4 shadow-sm">
                        <h4 className="text-lg font-semibold text-graphite">{welcomeContent.patient.title}</h4>
                        <p className="text-drift-gray mt-2">{welcomeContent.patient.description}</p>
                      </div>
                    </div>

                    <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/10">
                      <h3 className="font-medium text-graphite mb-2 flex items-center">
                        <span className="w-2 h-2 bg-soft-amber rounded-full mr-2"></span>
                        Doctor Welcome
                      </h3>
                      <div className="bg-white rounded-md p-4 shadow-sm">
                        <h4 className="text-lg font-semibold text-graphite">{welcomeContent.doctor.title}</h4>
                        <p className="text-drift-gray mt-2">{welcomeContent.doctor.description}</p>
                      </div>
                    </div>

                    <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/10">
                      <h3 className="font-medium text-graphite mb-2 flex items-center">
                        <span className="w-2 h-2 bg-soft-amber rounded-full mr-2"></span>
                        Admin Welcome
                      </h3>
                      <div className="bg-white rounded-md p-4 shadow-sm">
                        <h4 className="text-lg font-semibold text-graphite">{welcomeContent.admin.title}</h4>
                        <p className="text-drift-gray mt-2">{welcomeContent.admin.description}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logo" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Edit className="h-5 w-5 mr-2 text-soft-amber" />
                    Logo Settings
                  </CardTitle>
                  <CardDescription>Customize the application logo that appears in navigation bars</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="logo-text" className="block text-sm font-medium text-graphite mb-1">
                            Logo Text (used when no image is uploaded)
                          </label>
                          <input
                            type="text"
                            id="logo-text"
                            value={logoContent.text}
                            onChange={(e) => handleLogoChange("text", e.target.value)}
                            className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                          />
                        </div>
                        <div>
                          <label htmlFor="logo-color" className="block text-sm font-medium text-graphite mb-1">
                            Logo Text Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              id="logo-color"
                              value={logoContent.color}
                              onChange={(e) => handleLogoChange("color", e.target.value)}
                              className="w-10 h-10 border border-earth-beige rounded-md"
                            />
                            <input
                              type="text"
                              value={logoContent.color}
                              onChange={(e) => handleLogoChange("color", e.target.value)}
                              className="flex-1 px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="logo-font-size" className="block text-sm font-medium text-graphite mb-1">
                            Font Size
                          </label>
                          <select
                            id="logo-font-size"
                            value={logoContent.fontSize}
                            onChange={(e) => handleLogoChange("fontSize", e.target.value)}
                            className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                          >
                            <option value="text-sm">Small</option>
                            <option value="text-base">Medium</option>
                            <option value="text-lg">Large</option>
                            <option value="text-xl">Extra Large</option>
                            <option value="text-2xl">2XL</option>
                            <option value="text-3xl">3XL</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="logo-font-weight" className="block text-sm font-medium text-graphite mb-1">
                            Font Weight
                          </label>
                          <select
                            id="logo-font-weight"
                            value={logoContent.fontWeight}
                            onChange={(e) => handleLogoChange("fontWeight", e.target.value)}
                            className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                          >
                            <option value="font-normal">Normal</option>
                            <option value="font-medium">Medium</option>
                            <option value="font-semibold">Semibold</option>
                            <option value="font-bold">Bold</option>
                            <option value="font-extrabold">Extra Bold</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Logo Image Upload Section */}
                    <div className="mt-6 border border-earth-beige rounded-md p-4">
                      <h3 className="font-medium text-graphite mb-4">Logo Image</h3>
                      <div className="space-y-4">
                        <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                          <div className="h-16 bg-white rounded-md overflow-hidden mb-4 flex items-center justify-center">
                            {logoContent.imageUrl ? (
                              <img
                                src={logoContent.imageUrl || "/placeholder.svg"}
                                alt="Logo"
                                className="h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-drift-gray">
                                <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                                No logo image uploaded
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Logo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoImageUpload}
                                disabled={uploadingImage.isUploading}
                              />
                            </label>
                            {logoContent.imageUrl && (
                              <button
                                onClick={handleLogoImageDelete}
                                className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-red-500 hover:bg-pale-stone"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Logo
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-drift-gray mt-2">
                            Max file size: 500KB. Recommended dimensions: 180x60px. Transparent PNG recommended.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 border border-earth-beige rounded-md">
                      <h3 className="font-medium text-graphite mb-4">Logo Preview</h3>
                      <div className="flex flex-col space-y-4">
                        <div className="p-4 bg-white border border-earth-beige rounded-md">
                          {logoContent.imageUrl ? (
                            <div className="flex items-center">
                              <img
                                src={logoContent.imageUrl || "/placeholder.svg"}
                                alt="Logo"
                                className="h-9 object-contain"
                              />
                              <span className="ml-2 rounded-md bg-soft-amber px-2 py-1 text-xs font-medium text-white">
                                Preview
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span
                                className={`${logoContent.fontSize} ${logoContent.fontWeight}`}
                                style={{ color: logoContent.color }}
                              >
                                {logoContent.text}
                              </span>
                              <span className="ml-2 rounded-md bg-soft-amber px-2 py-1 text-xs font-medium text-white">
                                Preview
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
