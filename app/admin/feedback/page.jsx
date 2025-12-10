"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageSquare, RefreshCw, Send, AlertCircle, Search, ChevronDown, Loader2, Star } from "lucide-react"
import { AdminHeaderBanner } from "@/components/admin/admin-header-banner"
import ProfileImage from "@/components/profile-image"
import { getAllFeedback, respondToFeedback } from "@/lib/feedback-utils"
import { useAuth } from "@/contexts/auth-context"
import { getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { analyzeSentiment, getSentimentStyle } from "@/lib/sentiment-analysis"

export default function AdminFeedbackPage() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selected, setSelected] = useState(null)
  const [responseText, setResponseText] = useState("")
  const [responding, setResponding] = useState(false)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [adminProfiles, setAdminProfiles] = useState({})
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null)
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false)

  const loadFeedback = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      const { feedback: fetched, lastVisible, hasMore: more } = await getAllFeedback(15, reset ? null : lastDoc)
      setLastDoc(lastVisible || null)
      setHasMore(more)
      setFeedback((prev) => (reset ? fetched : [...prev, ...fetched]))
      
      // Fetch admin profiles for responses
      const adminIds = fetched
        .filter((item) => item.status === "responded" && item.respondedBy)
        .map((item) => item.respondedBy)
        .filter((value, index, self) => self.indexOf(value) === index) // Get unique admin IDs

      const adminProfilesData = { ...adminProfiles }
      for (const adminId of adminIds) {
        if (!adminProfilesData[adminId]) {
          try {
            // First try to get from admins collection
            const adminDoc = await getDoc(doc(db, "admins", adminId))

            if (adminDoc.exists()) {
              adminProfilesData[adminId] = adminDoc.data()
            } else {
              // If not found in admins collection, try users collection with admin role
              const userDoc = await getDoc(doc(db, "users", adminId))

              if (userDoc.exists() && userDoc.data().role === "admin") {
                adminProfilesData[adminId] = userDoc.data()
              }
            }
          } catch (error) {
            console.error(`Error fetching admin ${adminId}:`, error)
          }
        }
      }
      // Always keep current admin cached for fallback (store under uid and "admin")
      if (user?.uid) {
        adminProfilesData[user.uid] = {
          displayName: user.displayName || "Admin",
          photoURL: user.photoURL || null,
        }
        adminProfilesData.admin = adminProfilesData[user.uid]
      }

      setAdminProfiles(adminProfilesData)
      
      if (reset) {
        setSelected(null)
        setResponseText("")
      }
    } catch (err) {
      console.error(err)
      setError("Unable to load feedback right now. Please try again.")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadFeedback(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const total = feedback.length
    const responded = feedback.filter((f) => f.status === "responded").length
    const pending = total - responded
    const avgRating =
      feedback.length > 0
        ? (feedback.reduce((sum, f) => sum + (Number(f.rating) || 0), 0) / feedback.length).toFixed(1)
        : "0.0"

    return [
      { label: "Total feedback", value: total },
      { label: "Pending", value: pending },
      { label: "Responded", value: responded },
      { label: "Avg rating", value: avgRating },
    ]
  }, [feedback])

  const filteredFeedback = useMemo(() => {
    const term = search.toLowerCase().trim()
    return feedback.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter
      const matchesType = typeFilter === "all" || item.type === typeFilter
      const matchesSearch =
        !term ||
        item.userName?.toLowerCase().includes(term) ||
        item.message?.toLowerCase().includes(term) ||
        item.type?.toLowerCase().includes(term)
      return matchesStatus && matchesType && matchesSearch
    })
  }, [feedback, search, statusFilter, typeFilter])

  const handleSelect = async (item) => {
    setSelected(item)
    setResponseText(item.response || "")
    setSentimentAnalysis(null)
    
    // Analyze sentiment when feedback is selected
    if (item.message && item.message.trim().length > 0) {
      setAnalyzingSentiment(true)
      try {
        const sentiment = await analyzeSentiment(item.message)
        setSentimentAnalysis(sentiment)
      } catch (error) {
        console.error("Error analyzing sentiment:", error)
      } finally {
        setAnalyzingSentiment(false)
      }
    }
  }

  const handleRespond = async () => {
    if (!selected) return
    if (!responseText.trim()) {
      setError("Please enter a response before sending.")
      return
    }

    try {
      setResponding(true)
      setError("")
      const updated = await respondToFeedback(selected.id, responseText.trim(), user?.uid || null)
      setFeedback((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
      setSelected((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev))
      
      // Update admin profiles if needed (cache current admin under uid and "admin")
      if (user?.uid) {
        setAdminProfiles((prev) => ({
          ...prev,
          [user.uid]: {
            displayName: user.displayName || "Admin",
            photoURL: user.photoURL || null,
          },
          admin: {
            displayName: user.displayName || "Admin",
            photoURL: user.photoURL || null,
          },
        }))
      }
    } catch (err) {
      console.error(err)
      setError("Could not send response. Please try again.")
    } finally {
      setResponding(false)
    }
  }

  // Get admin profile picture
  const getAdminProfilePic = (adminId) => {
    // Prefer cached admin profiles (includes current admin under uid and "admin")
    const profile = adminProfiles[adminId] || (adminId === "admin" && user?.uid ? adminProfiles[user.uid] : null)
    if (profile?.photoURL && typeof profile.photoURL === "string") {
      return profile.photoURL
    }
    if (user?.uid && adminId === user.uid && user.photoURL) {
      return user.photoURL
    }
    return "/admin-interface.png"
  }

  // Get admin name
  const getAdminName = (adminId) => {
    const profile = adminProfiles[adminId] || (adminId === "admin" && user?.uid ? adminProfiles[user.uid] : null)
    if (profile?.displayName) {
      return profile.displayName
    }
    if (adminId === "admin" && user?.displayName) {
      return user.displayName
    }
    if (user?.uid && adminId === user.uid && user.displayName) {
      return user.displayName
    }
    return "Admin"
  }

  const renderFeedbackItem = (item) => (
    <button
      key={item.id}
      onClick={() => handleSelect(item)}
      className={`w-full rounded-lg border p-4 text-left transition hover:border-amber-400 hover:bg-amber-50 ${
        selected?.id === item.id ? "border-amber-500 bg-amber-50" : "border-earth-beige bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-earth-beige">
          <ProfileImage
            src={item.userProfile}
            alt={item.userName || "User"}
            className="h-full w-full"
            role={item.userRole || "patient"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-deep-forest">{item.userName || "Unknown user"}</span>
            <span className="text-xs text-graphite">{item.userRole || "patient"}</span>
          </div>
          <p className="mt-1 text-xs text-drift-gray">{item.date || "—"}</p>
          <p className="mt-2 line-clamp-2 text-sm text-graphite">{item.message || "No message provided."}</p>
          <div className="mt-3 flex items-center space-x-2">
            <span className="rounded-full bg-sandstone px-2 py-1 text-xs capitalize text-deep-forest">
              {item.type || "general"}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                item.status === "responded"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {item.status === "responded" ? "Responded" : "Pending"}
            </span>
            {item.rating ? (
              <span className="flex items-center space-x-1 text-xs text-amber-600">
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <span>{item.rating}</span>
              </span>
            ) : null}
          </div>
        </div>
        <MessageSquare size={18} className="text-earth-clay flex-shrink-0" />
      </div>
    </button>
  )

  return (
    <div className="space-y-6">
      <AdminHeaderBanner
        title="Feedback Center"
        subtitle="Review and respond to patient and doctor feedback"
        stats={stats}
      />

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-earth-beige bg-cream px-3 py-2">
            <Search size={16} className="text-earth-clay" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feedback by name, type, or message..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-drift-gray"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "responded", label: "Responded" },
              ]}
            />
            <FilterPill
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All" },
                { value: "general", label: "General" },
                { value: "doctor", label: "Doctor" },
                { value: "service", label: "Service" },
              ]}
            />
            <button
              onClick={() => loadFeedback(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-earth-beige px-3 py-2 text-sm text-deep-forest transition hover:border-amber-500 hover:text-amber-700"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-drift-gray">
                <Loader2 size={16} className="animate-spin" />
                Loading feedback...
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="rounded-lg border border-earth-beige bg-cream p-4 text-sm text-drift-gray">
                No feedback found with current filters.
              </div>
            ) : (
              <div className="space-y-3">{filteredFeedback.map((item) => renderFeedbackItem(item))}</div>
            )}

            {hasMore && (
              <button
                onClick={() => loadFeedback(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-earth-beige bg-white px-3 py-2 text-sm text-deep-forest transition hover:border-amber-500 hover:text-amber-700 disabled:opacity-60"
                disabled={loadingMore}
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Load more
              </button>
            )}
          </div>

          <div className="rounded-lg border border-earth-beige bg-cream p-4">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-deep-forest">{selected.userName || "Unknown user"}</p>
                    <p className="text-xs text-graphite">
                      {selected.userRole || "patient"} • {selected.date || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-sandstone px-2 py-1 text-xs capitalize text-deep-forest">
                      {selected.type || "general"}
                    </span>
                    {selected.rating ? (
                      <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-amber-700">
                        <Star size={14} className="fill-amber-500 text-amber-500" />
                        {selected.rating}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white p-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-earth-beige">
                    <ProfileImage
                      src={selected.userProfile}
                      alt={selected.userName || "User"}
                      className="h-full w-full"
                      role={selected.userRole}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-deep-forest">Feedback</p>
                    <p className="text-sm text-graphite">{selected.message || "No message provided."}</p>
                  </div>
                </div>

                {/* Sentiment Analysis - Enhanced Right Side Card */}
                {selected.message && selected.message.trim().length > 0 && (
                  <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 border-2 border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <span className="text-amber-700 text-lg">📊</span>
                        </div>
                        <p className="text-sm font-bold text-deep-forest">Sentiment Analysis</p>
                      </div>
                      {analyzingSentiment && (
                        <Loader2 size={16} className="animate-spin text-amber-600" />
                      )}
                    </div>
                    {sentimentAnalysis && !analyzingSentiment ? (
                      <div className="space-y-3">
                        {/* Main Sentiment Display */}
                        <div className="flex items-center justify-between bg-white/80 rounded-lg p-3 border border-amber-200">
                          <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${
                              sentimentAnalysis.sentiment === "positive"
                                ? "bg-green-100"
                                : sentimentAnalysis.sentiment === "negative"
                                ? "bg-red-100"
                                : "bg-gray-100"
                            }`}>
                              {getSentimentStyle(sentimentAnalysis.sentiment).icon}
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${
                                sentimentAnalysis.sentiment === "positive"
                                  ? "text-green-700"
                                  : sentimentAnalysis.sentiment === "negative"
                                  ? "text-red-700"
                                  : "text-gray-700"
                              }`}>
                                {getSentimentStyle(sentimentAnalysis.sentiment).label}
                              </p>
                              <p className="text-xs text-graphite">
                                Score: <span className="font-semibold text-amber-700">{(sentimentAnalysis.score * 100).toFixed(0)}%</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Confidence & Summary */}
                        <div className="space-y-2">
                          {sentimentAnalysis.confidence > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-graphite">Confidence Level:</span>
                              <span className="font-semibold text-amber-700">{(sentimentAnalysis.confidence * 100).toFixed(0)}%</span>
                            </div>
                          )}
                          {sentimentAnalysis.summary && (
                            <div className="bg-white/60 rounded-md p-2 border border-amber-200">
                              <p className="text-xs text-graphite italic leading-relaxed">{sentimentAnalysis.summary}</p>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Sentiment Score Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-graphite">Sentiment Intensity</span>
                            <span className="font-semibold text-amber-700">{Math.abs(sentimentAnalysis.score * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-amber-200/50 rounded-full h-3 overflow-hidden border border-amber-300">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ease-out ${
                                sentimentAnalysis.sentiment === "positive"
                                  ? "bg-gradient-to-r from-green-400 to-green-600"
                                  : sentimentAnalysis.sentiment === "negative"
                                  ? "bg-gradient-to-r from-red-400 to-red-600"
                                  : "bg-gradient-to-r from-gray-400 to-gray-600"
                              }`}
                              style={{
                                width: `${Math.abs(sentimentAnalysis.score) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : !analyzingSentiment ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-drift-gray">Analyzing sentiment...</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {selected.status === "responded" && selected.response && (
                  <div className="rounded-lg bg-white p-3 text-sm text-deep-forest">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-earth-beige">
                        <ProfileImage
                          src={getAdminProfilePic(selected.respondedBy)}
                          alt={getAdminName(selected.respondedBy)}
                          className="h-full w-full"
                          role="admin"
                        />
                      </div>
                      <p className="font-semibold text-soft-amber">
                        Response from {getAdminName(selected.respondedBy)}
                      </p>
                    </div>
                    <p className="mt-1 text-graphite">{selected.response}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-deep-forest">Send a response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write a helpful response to this feedback..."
                    className="h-28 w-full rounded-lg border border-earth-beige bg-white p-3 text-sm outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-drift-gray">
                      Response will be visible to the submitter immediately.
                    </span>
                    <button
                      onClick={handleRespond}
                      disabled={responding}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-70"
                    >
                      {responding ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-drift-gray">
                <MessageSquare size={18} />
                Select a feedback item to view details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterPill({ label, value, onChange, options }) {
  const current = options.find((o) => o.value === value) || options[0]
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-earth-beige bg-white px-3 py-2 text-sm text-deep-forest transition hover:border-amber-500 hover:text-amber-700"
      >
        <span className="font-semibold">{label}:</span>
        <span className="capitalize text-graphite">{current.label}</span>
        <ChevronDown size={14} />
      </button>
      <div
        className={`absolute right-0 z-10 mt-1 w-40 origin-top rounded-lg border border-earth-beige bg-white shadow-md transition-all duration-200 ease-out ${
          open ? "scale-100 opacity-100 translate-y-0 pointer-events-auto" : "scale-95 opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange(option.value)
              setOpen(false)
            }}
            className={`block w-full px-3 py-2 text-left text-sm capitalize transition-colors duration-150 ${
              value === option.value ? "bg-amber-50 text-amber-700" : "hover:bg-cream"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
