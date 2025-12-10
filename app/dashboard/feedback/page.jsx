"use client"

import { useState, useEffect } from "react"
import { Star, Send, AlertCircle, Trash2 } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { addFeedback, getUserFeedback, deleteFeedback, getAllDoctors } from "@/lib/feedback-utils"
import { SuccessNotification } from "@/components/success-notification"
import { X, Check, Loader2 } from "lucide-react"
import { getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ProfileImage from "@/components/profile-image"
import { DashboardHeaderBanner } from "@/components/dashboard-header-banner"
import { analyzeSentiment, getSentimentStyle } from "@/lib/sentiment-analysis"

export default function PatientFeedbackPage() {
  const isMobile = useMobile()
  const { user } = useAuth()
  const [feedbackType, setFeedbackType] = useState("general")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState("")
  const [loading, setLoading] = useState(true)
  const [pastFeedback, setPastFeedback] = useState([])
  const [notification, setNotification] = useState({ message: "", isVisible: false })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [adminProfiles, setAdminProfiles] = useState({})
  const [sentimentAnalyses, setSentimentAnalyses] = useState({})
  const [analyzingSentiments, setAnalyzingSentiments] = useState({})

  // Load user feedback
  useEffect(() => {
    if (!user) return

    const loadFeedback = async () => {
      try {
        setLoading(true)
        const feedback = await getUserFeedback(user.uid)
        setPastFeedback(feedback)

        // Update the admin profile fetching logic in the useEffect

        // Replace the existing admin profile fetching code with this improved version:
        // Fetch admin profiles for responses
        const adminIds = feedback
          .filter((item) => item.status === "responded" && item.respondedBy)
          .map((item) => item.respondedBy)
          .filter((value, index, self) => self.indexOf(value) === index) // Get unique admin IDs

        const adminProfilesData = {}
        for (const adminId of adminIds) {
          try {
            // First try to get from admins collection
            const adminDoc = await getDoc(doc(db, "admins", adminId))

            if (adminDoc.exists()) {
              console.log(`Admin profile found for ${adminId}:`, adminDoc.data())
              adminProfilesData[adminId] = adminDoc.data()
            } else {
              // If not found in admins collection, try users collection with admin role
              console.log(`Admin not found in admins collection, trying users collection for ${adminId}`)
              const userDoc = await getDoc(doc(db, "users", adminId))

              if (userDoc.exists() && userDoc.data().role === "admin") {
                console.log(`Admin found in users collection for ${adminId}:`, userDoc.data())
                adminProfilesData[adminId] = userDoc.data()
              } else {
                console.log(`No admin profile found for ${adminId} in either collection`)
              }
            }
          } catch (error) {
            console.error(`Error fetching admin ${adminId}:`, error)
          }
        }

        console.log("Fetched admin profiles:", adminProfilesData)
        setAdminProfiles(adminProfilesData)
      } catch (error) {
        console.error("Error loading feedback:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFeedback()
  }, [user])

  // Load doctors for dropdown
  useEffect(() => {
    if (feedbackType === "doctor") {
      const loadDoctors = async () => {
        try {
          setLoadingDoctors(true)
          const doctorsList = await getAllDoctors()
          setDoctors(doctorsList || []) // Ensure we always have an array
        } catch (error) {
          console.error("Error loading doctors:", error)
          // Show error notification
          setNotification({
            message: "Failed to load doctors. Please try again.",
            isVisible: true,
          })
        } finally {
          setLoadingDoctors(false)
        }
      }

      loadDoctors()
    }
  }, [feedbackType])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      setNotification({
        message: "Please select a rating",
        isVisible: true,
      })
      return
    }

    if (!feedbackText.trim()) {
      setNotification({
        message: "Please provide feedback details",
        isVisible: true,
      })
      return
    }

    if (feedbackType === "doctor" && !selectedDoctor) {
      setNotification({
        message: "Please select a doctor",
        isVisible: true,
      })
      return
    }

    try {
      const newFeedback = {
        userId: user.uid,
        userName: user.displayName || "Anonymous User",
        userEmail: user.email,
        userRole: "patient",
        type: feedbackType,
        rating,
        message: feedbackText,
        userProfile: user.photoURL || null,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }

      // Add doctor info if doctor feedback
      if (feedbackType === "doctor" && selectedDoctor) {
        const selectedDoctorObj = doctors.find((doc) => doc.id === selectedDoctor)
        newFeedback.doctorId = selectedDoctor
        newFeedback.doctorName = selectedDoctorObj?.displayName || "Unknown Doctor"
      }

      // Add to Firebase
      const addedFeedback = await addFeedback(newFeedback)

      // Update local state
      setPastFeedback([addedFeedback, ...pastFeedback])

      // Reset form
      setRating(0)
      setFeedbackText("")
      setSelectedDoctor("")

      // Show success notification
      setNotification({
        message: "Thank you for your feedback! We appreciate your input.",
        isVisible: true,
      })
    } catch (error) {
      console.error("Error submitting feedback:", error)
      setNotification({
        message: "There was an error submitting your feedback. Please try again.",
        isVisible: true,
      })
    }
  }

  const handleDeleteFeedback = async (id) => {
    try {
      setDeleteLoading(true)
      await deleteFeedback(id)
      setPastFeedback(pastFeedback.filter((feedback) => feedback.id !== id))
      setNotification({
        message: "Feedback deleted successfully",
        isVisible: true,
      })
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting feedback:", error)
      setNotification({
        message: "There was an error deleting your feedback. Please try again.",
        isVisible: true,
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Render stars for rating
  const renderStars = (rating) => {
    if (rating === null || rating === undefined) return <span className="text-xs text-drift-gray">No rating</span>

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-drift-gray"}`}
          />
        ))}
      </div>
    )
  }

  // Update the getAdminProfilePic function to better validate URLs
  const getAdminProfilePic = (adminId) => {
    if (!adminId || !adminProfiles[adminId]) {
      return "/admin-interface.png" // Default admin image if no adminId or profile
    }

    // Check if photoURL exists and is a valid URL
    const photoURL = adminProfiles[adminId]?.photoURL
    if (!photoURL || typeof photoURL !== "string") {
      return "/admin-interface.png"
    }

    // Ensure URL starts with http:// or https://
    if (!photoURL.startsWith("http://") && !photoURL.startsWith("https://")) {
      console.log(`Invalid admin photo URL format: ${photoURL}`)
      return "/admin-interface.png"
    }

    return photoURL
  }

  // Get admin name
  const getAdminName = (adminId) => {
    if (adminProfiles[adminId]?.displayName) {
      return adminProfiles[adminId].displayName
    }
    return "Admin"
  }

  // Analyze sentiment for a feedback item
  const handleAnalyzeSentiment = async (feedbackId, message) => {
    if (!message || message.trim().length === 0) return
    
    if (sentimentAnalyses[feedbackId]) {
      // Already analyzed, toggle visibility or skip
      return
    }

    setAnalyzingSentiments((prev) => ({ ...prev, [feedbackId]: true }))
    try {
      const sentiment = await analyzeSentiment(message)
      setSentimentAnalyses((prev) => ({ ...prev, [feedbackId]: sentiment }))
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
    } finally {
      setAnalyzingSentiments((prev) => {
        const updated = { ...prev }
        delete updated[feedbackId]
        return updated
      })
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dashboard Header Banner with page-specific content */}
      <DashboardHeaderBanner
        userRole="patient"
        title="Feedback & Support"
        subtitle="Share your experience or report issues to help us improve our services"
        showMetrics={false}
        actionButton={
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
            <span className="font-medium">Your voice matters</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feedback Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-earth-beige p-6">
            <h2 className="text-xl font-semibold text-graphite mb-4">Submit Feedback</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-graphite mb-2">Feedback Type</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm ${
                      feedbackType === "general"
                        ? "bg-soft-amber text-white"
                        : "bg-pale-stone text-drift-gray hover:bg-earth-beige"
                    }`}
                    onClick={() => setFeedbackType("general")}
                  >
                    General Feedback
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm ${
                      feedbackType === "doctor"
                        ? "bg-soft-amber text-white"
                        : "bg-pale-stone text-drift-gray hover:bg-earth-beige"
                    }`}
                    onClick={() => setFeedbackType("doctor")}
                  >
                    Doctor Feedback
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm ${
                      feedbackType === "technical"
                        ? "bg-soft-amber text-white"
                        : "bg-pale-stone text-drift-gray hover:bg-earth-beige"
                    }`}
                    onClick={() => setFeedbackType("technical")}
                  >
                    Technical Issue
                  </button>
                </div>
              </div>

              {feedbackType === "doctor" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-graphite mb-2">Select Doctor</label>
                  {loadingDoctors ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-soft-amber"></div>
                      <span className="text-drift-gray">Loading doctors...</span>
                    </div>
                  ) : (
                    <select
                      className="w-full p-2 border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber"
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                    >
                      <option value="">Select a doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.displayName || doctor.name || `Dr. ${doctor.lastName || "Unknown"}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-graphite mb-2">Rating</label>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="feedback" className="block text-sm font-medium text-graphite mb-2">
                  Your Feedback
                </label>
                <textarea
                  id="feedback"
                  rows="4"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    feedbackType === "technical"
                      ? "Please describe the issue you're experiencing in detail..."
                      : "Share your thoughts and suggestions..."
                  }
                  className="w-full p-3 border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Support & Past Feedback */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-earth-beige p-6 mb-6">
            <h2 className="text-xl font-semibold text-graphite mb-4">Feedback Guidelines</h2>
            <p className="text-drift-gray mb-4">
              Your feedback helps us improve our services. Please consider the following:
            </p>
            <ul className="space-y-2 text-drift-gray">
              <li className="flex items-start">
                <div className="bg-soft-amber/20 p-1 rounded-full mr-2 mt-0.5">
                  <Star className="h-3 w-3 text-soft-amber" />
                </div>
                <span>Be specific about your experience</span>
              </li>
              <li className="flex items-start">
                <div className="bg-soft-amber/20 p-1 rounded-full mr-2 mt-0.5">
                  <Star className="h-3 w-3 text-soft-amber" />
                </div>
                <span>Include details about what worked well or needs improvement</span>
              </li>
              <li className="flex items-start">
                <div className="bg-soft-amber/20 p-1 rounded-full mr-2 mt-0.5">
                  <Star className="h-3 w-3 text-soft-amber" />
                </div>
                <span>Your feedback is reviewed by our team within 48 hours</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-earth-beige p-6">
            <h2 className="text-xl font-semibold text-graphite mb-4">Your Past Feedback</h2>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soft-amber"></div>
              </div>
            ) : pastFeedback.length > 0 ? (
              <div className="space-y-4">
                {pastFeedback.map((feedback) => (
                  <div key={feedback.id} className="border-b border-earth-beige pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 bg-earth-beige flex-shrink-0">
                          <ProfileImage
                            src={user?.photoURL}
                            alt={user?.displayName || "Patient"}
                            className="h-full w-full"
                            role="patient"
                          />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-graphite">
                            {feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)} Feedback
                            {feedback.doctorName && ` - ${feedback.doctorName}`}
                          </span>
                          <div className="flex mt-1">{renderStars(feedback.rating)}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-drift-gray mr-2">{feedback.date}</span>
                        {deleteConfirm === feedback.id ? (
                          <div className="flex items-center bg-red-50 p-1 rounded-md">
                            <span className="text-xs text-red-600 mr-2">Delete?</span>
                            <button
                              onClick={() => handleDeleteFeedback(feedback.id)}
                              className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 mr-1"
                              aria-label="Confirm delete"
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full"></div>
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-white bg-gray-400 hover:bg-gray-500 rounded-full p-1"
                              aria-label="Cancel delete"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(feedback.id)}
                            className="text-drift-gray hover:text-red-500"
                            aria-label="Delete feedback"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-graphite mb-2">{feedback.message}</p>

                    {/* Sentiment Analysis */}
                    {feedback.message && feedback.message.trim().length > 0 && (
                      <div className="mb-2">
                        {sentimentAnalyses[feedback.id] ? (
                          <div className="bg-gray-50 rounded-lg p-2 border border-earth-beige">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{getSentimentStyle(sentimentAnalyses[feedback.id].sentiment).icon}</span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSentimentStyle(sentimentAnalyses[feedback.id].sentiment).bgColor} ${getSentimentStyle(sentimentAnalyses[feedback.id].sentiment).color}`}>
                                {getSentimentStyle(sentimentAnalyses[feedback.id].sentiment).label}
                              </span>
                              <span className="text-xs text-graphite">
                                Score: {(sentimentAnalyses[feedback.id].score * 100).toFixed(0)}%
                              </span>
                            </div>
                            {sentimentAnalyses[feedback.id].summary && (
                              <p className="text-xs text-graphite italic">{sentimentAnalyses[feedback.id].summary}</p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAnalyzeSentiment(feedback.id, feedback.message)}
                            disabled={analyzingSentiments[feedback.id]}
                            className="text-xs text-soft-amber hover:text-amber-600 flex items-center gap-1"
                          >
                            {analyzingSentiments[feedback.id] ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              "Analyze Sentiment"
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {feedback.status === "responded" && feedback.response && (
                      <div className="mt-2 pl-3 border-l-2 border-soft-amber">
                        <div className="flex items-center mb-2">
                          <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2 bg-earth-beige flex-shrink-0">
                            <ProfileImage
                              src={getAdminProfilePic(feedback.respondedBy)}
                              alt={getAdminName(feedback.respondedBy)}
                              className="h-full w-full"
                              role="admin"
                            />
                          </div>
                          <p className="text-xs font-medium text-soft-amber">
                            Response from {getAdminName(feedback.respondedBy)}:
                          </p>
                        </div>
                        <p className="text-sm text-drift-gray">{feedback.response}</p>
                      </div>
                    )}

                    <div className="mt-2 flex items-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          feedback.status === "responded"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {feedback.status === "responded" ? "Responded" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 text-drift-gray mx-auto mb-2" />
                <p className="text-drift-gray">You haven't submitted any feedback yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      <SuccessNotification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
        isValidation={
          notification.message === "Please select a rating" ||
          notification.message === "Please provide feedback details" ||
          notification.message === "Please select a doctor" ||
          notification.message === "There was an error deleting your feedback. Please try again."
        }
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
