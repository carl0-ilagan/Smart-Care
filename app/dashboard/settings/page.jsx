"use client"

import { useState, useEffect } from "react"
import { Lock, Shield, Calendar, Clock, Monitor, Smartphone, Globe, LogOut, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SuccessNotification } from "@/components/success-notification"
import { SettingsBanner } from "@/components/settings-banner"
import { getUserSessions, revokeSession, revokeAllOtherSessions, formatSessionTime } from "@/lib/session-management"
import { SuspiciousLoginHistory } from "@/components/suspicious-login-history"

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: "30",
    },
  })
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [twoFactorQrCode, setTwoFactorQrCode] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationError, setVerificationError] = useState("")
  // Auto-save; no manual save modal/button
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" })
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [confirmRevokeId, setConfirmRevokeId] = useState(null)
  const [confirmRevokeAllOpen, setConfirmRevokeAllOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Fetch user settings from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return

      try {
        setLoading(true)
        const settingsDoc = await getDoc(doc(db, "userSettings", user.uid))
        if (settingsDoc.exists()) {
          // Merge with default settings to ensure all properties exist
          const fetchedSettings = settingsDoc.data()
          setSettings((prevSettings) => ({
            notifications: { ...prevSettings.notifications, ...(fetchedSettings.notifications || {}) },
            security: { ...prevSettings.security, ...(fetchedSettings.security || {}) },
          }))
        } else {
          // Create default settings if none exist
          await setDoc(doc(db, "userSettings", user.uid), {
            ...settings,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        setNotification({
          show: true,
          message: "Failed to load settings. Please try again.",
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [user])

  // Fetch user sessions from Firestore
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return

      try {
        setSessionsLoading(true)
        const sessions = await getUserSessions(user.uid)
        setSessions(sessions)
      } catch (error) {
        console.error("Error fetching sessions:", error)
        setNotification({
          show: true,
          message: "Failed to load sessions. Please try again.",
          type: "error",
        })
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchSessions()
  }, [user])

  // Hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleNotificationChange = (key) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    })
  }

  // privacy section removed

  const handleSecurityChange = (key, value) => {
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [key]: typeof value === "boolean" ? value : value,
      },
    })
  }

  // 2FA helpers (frontend demo)
  const generateTwoFactorSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    let secret = ""
    for (let i = 0; i < 16; i++) secret += chars.charAt(Math.floor(Math.random() * chars.length))
    const email = encodeURIComponent(user?.email || "patient@smartcare.com")
    const appName = encodeURIComponent("SmartCare")
    const issuer = encodeURIComponent("SmartCare")
    const uri = `otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}&margin=10&format=svg`
    setTwoFactorQrCode(qr)
  }

  // Fetch active sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return

      try {
        setSessionsLoading(true)
        const activeSessions = await getUserSessions(user.uid)
        setSessions(activeSessions)
      } catch (error) {
        console.error("Error fetching sessions:", error)
        setNotification({
          show: true,
          message: "Failed to load active sessions",
          type: "error",
        })
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchSessions()
  }, [user])

  // Handle revoking a session
  const handleRevokeSession = async (sessionId) => {
    try {
      setSessionsLoading(true)
      await revokeSession(sessionId)

      // Update the sessions list
      setSessions((prev) => prev.filter((session) => session.id !== sessionId))

      setNotification({
        show: true,
        message: "Session revoked successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error revoking session:", error)
      setNotification({
        show: true,
        message: "Failed to revoke session",
        type: "error",
      })
    } finally {
      setSessionsLoading(false)
    }
  }

  // Handle revoking all other sessions
  const handleRevokeAllOtherSessions = async () => {
    try {
      setSessionsLoading(true)
      await revokeAllOtherSessions(user.uid)

      // Refresh the sessions list
      const activeSessions = await getUserSessions(user.uid)
      setSessions(activeSessions)

      setNotification({
        show: true,
        message: "All other sessions revoked successfully",
        type: "success",
      })
    } catch (error) {
      console.error("Error revoking other sessions:", error)
      setNotification({
        show: true,
        message: "Failed to revoke other sessions",
        type: "error",
      })
    } finally {
      setSessionsLoading(false)
    }
  }

  // Auto-save settings with debounce, after initial load
  useEffect(() => {
    if (!user) return
    if (loading) return
    const timer = setTimeout(async () => {
      try {
        setSaveLoading(true)
        await setDoc(
          doc(db, "userSettings", user.uid),
          { ...settings, updatedAt: serverTimestamp() },
          { merge: true },
        )
        setNotification({ show: true, message: "Settings updated", type: "success" })
      } catch (e) {
        console.error("Auto-save settings error:", e)
        setNotification({ show: true, message: "Failed to update settings", type: "error" })
      } finally {
        setSaveLoading(false)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [settings, user, loading])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <SettingsBanner userRole="patient" />

      {notification.show && (
        <SuccessNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      {/* Notifications section removed per request */}

      {/* Privacy removed */}
      {false && (
      <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold text-graphite">Privacy</h2>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="privacy-records" className="text-sm font-medium text-graphite">
                Allow Admin to View Medical Records
              </label>
              <p className="text-xs text-drift-gray">
                Administrators can access your medical records for support purposes
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="privacy-records"
                className="peer sr-only"
                checked={settings.privacy.allowAdminViewRecords}
                onChange={() => handlePrivacyChange("allowAdminViewRecords")}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-amber-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="privacy-appointments" className="text-sm font-medium text-graphite">
                Allow Admin to View Appointment History
              </label>
              <p className="text-xs text-drift-gray">
                Administrators can access your appointment history for support purposes
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="privacy-appointments"
                className="peer sr-only"
                checked={settings.privacy.allowAdminViewAppointments}
                onChange={() => handlePrivacyChange("allowAdminViewAppointments")}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-amber-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="privacy-prescriptions" className="text-sm font-medium text-graphite">
                Allow Admin to View Prescriptions
              </label>
              <p className="text-xs text-drift-gray">
                Administrators can access your prescription history for support purposes
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="privacy-prescriptions"
                className="peer sr-only"
                checked={settings.privacy.allowAdminViewPrescriptions}
                onChange={() => handlePrivacyChange("allowAdminViewPrescriptions")}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-amber-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="privacy-analytics" className="text-sm font-medium text-graphite">
                Allow Analytics
              </label>
              <p className="text-xs text-drift-gray">Help us improve by allowing anonymous usage data collection</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="privacy-analytics"
                className="peer sr-only"
                checked={settings.privacy.allowAnalytics}
                onChange={() => handlePrivacyChange("allowAnalytics")}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-amber-500"></div>
            </label>
          </div>
        </div>
      </div>
      )}

      {/* Security */}
      <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
        <div className="flex items-center">
          <Lock className="mr-2 h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold text-graphite">Security</h2>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="security-2fa" className="text-sm font-medium text-graphite">
                Two-Factor Authentication
              </label>
              <p className="text-xs text-drift-gray">Add an extra layer of security to your account</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="security-2fa"
                className="peer sr-only"
                checked={settings.security.twoFactor}
                onChange={() => handleSecurityChange("twoFactor", !settings.security.twoFactor)}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-amber-500"></div>
            </label>
          </div>

          {/* Two-Factor Authentication Status */}
          <div className="pt-2 pb-4">
            <p className="text-sm text-graphite">
              Status:{" "}
              <span className={`font-medium ${settings.security.twoFactor ? "text-green-600" : "text-red-600"}`}>
                {settings.security.twoFactor ? "Enabled" : "Disabled"}
              </span>
            </p>
            {!settings.security.twoFactor && (
              <p className="text-xs text-drift-gray mt-1">
                Enable two-factor authentication for additional account security
              </p>
            )}
          </div>

          <div>
            <label htmlFor="session-timeout" className="mb-1 block text-sm font-medium text-graphite">
              Session Timeout
            </label>
            <p className="text-xs text-drift-gray mb-2">
              Automatically log out when the website is not in use for the selected period
            </p>
            <select
              id="session-timeout"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleSecurityChange("sessionTimeout", e.target.value)}
              className="w-full max-w-xs rounded-md border border-earth-beige bg-white py-2 pl-3 pr-10 text-graphite focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all duration-200 hover:shadow-sm"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="never">Never</option>
            </select>
          </div>

          {/* Login Sessions */}
          <div className="pt-4 border-t border-earth-beige">
            <h3 className="font-medium text-graphite mb-3">Login Sessions</h3>
            <p className="text-sm text-drift-gray mb-2">Currently active sessions on your account:</p>

            <div className="mb-4">
              <button
              onClick={() => setConfirmRevokeAllOpen(true)}
                disabled={sessionsLoading || sessions.filter((s) => !s.isCurrentSession).length === 0}
                className={`px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 ${
                  sessionsLoading || sessions.filter((s) => !s.isCurrentSession).length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                Revoke All Other Sessions
              </button>
            </div>

            {sessionsLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
            <div className="space-y-2">
              {sessions
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-md flex justify-between items-center ${
                      session.isCurrentSession ? "bg-pale-stone" : "bg-white border border-earth-beige"
                    }`}
                  >
                    <div>
                      <div className="flex items-center">
                        {session.deviceType === "mobile" ? (
                          <Smartphone className="h-4 w-4 text-drift-gray mr-2" />
                        ) : (
                          <Monitor className="h-4 w-4 text-drift-gray mr-2" />
                        )}
                        <p className="text-sm font-medium text-graphite">
                          {session.deviceName}
                          {session.isCurrentSession && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-drift-gray">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Last active: {formatSessionTime(session.lastActive)}</span>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-drift-gray">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Created: {formatSessionTime(session.createdAt)}</span>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-drift-gray">
                        <Globe className="h-3 w-3 mr-1" />
                        <span>IP: {session.ipAddress || "Unknown"}</span>
                      </div>
                    </div>
                    {!session.isCurrentSession && (
                      <button
                      onClick={() => setConfirmRevokeId(session.id)}
                        className="flex items-center text-red-500 hover:text-red-600 text-sm"
                        disabled={sessionsLoading}
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Revoke
                      </button>
                    )}
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center py-4 text-drift-gray">No active sessions found</div>
                )}

              {/* Pagination */}
              {sessions.length > pageSize && (
                <div className="flex justify-end items-center gap-2 pt-2">
                  <button
                    className="px-2 py-1 text-sm rounded border border-earth-beige disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-drift-gray">
                    Page {currentPage} of {Math.ceil(sessions.length / pageSize)}
                  </span>
                  <button
                    className="px-2 py-1 text-sm rounded border border-earth-beige disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(sessions.length / pageSize), p + 1))}
                    disabled={currentPage >= Math.ceil(sessions.length / pageSize)}
                  >
                    Next
                  </button>
                </div>
              )}
              </div>
            )}
          </div>

          {/* Suspicious Login Activity */}
          <div className="pt-4 border-t border-earth-beige">
            <h3 className="font-medium text-graphite mb-3">Suspicious Login Activity</h3>
            <SuspiciousLoginHistory userId={user?.uid} />
          </div>
        </div>
      </div>

      {/* Auto-save active; save button removed */}

      {/* Confirm revoke single - match AppointmentModal styling */}
      {confirmRevokeId && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xl animate-fade-in`}>
          <div className={`w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-gradient-to-br from-soft-amber/10 to-yellow-50 animate-modal-in`}>
            <div className="p-3 border-b border-amber-200/40">
              <h4 className="text-base font-bold text-graphite text-center">Revoke Session</h4>
            </div>
            <div className="p-4 bg-white">
              <p className="text-sm text-drift-gray">This action cannot be undone. Do you want to revoke this session?</p>
            </div>
            <div className="p-3 border-t border-amber-200/30 bg-white">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-4 py-2 text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                  onClick={() => setConfirmRevokeId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-soft-amber to-amber-500 shadow-lg hover:from-amber-500 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70"
                  disabled={sessionsLoading}
                  onClick={async () => {
                    const id = confirmRevokeId
                    setConfirmRevokeId(null)
                    await handleRevokeSession(id)
                  }}
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm revoke all - match AppointmentModal styling */}
      {confirmRevokeAllOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xl animate-fade-in`}>
          <div className={`w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-gradient-to-br from-soft-amber/10 to-yellow-50 animate-modal-in`}>
            <div className="p-3 border-b border-amber-200/40">
              <h4 className="text-base font-bold text-graphite text-center">Revoke All Other Sessions</h4>
            </div>
            <div className="p-4 bg-white">
              <p className="text-sm text-drift-gray">This action cannot be undone. Do you want to revoke all other sessions?</p>
            </div>
            <div className="p-3 border-t border-amber-200/30 bg-white">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-4 py-2 text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                  onClick={() => setConfirmRevokeAllOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-soft-amber to-amber-500 shadow-lg hover:from-amber-500 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70"
                  disabled={sessionsLoading || sessions.filter((s) => !s.isCurrentSession).length === 0}
                  onClick={async () => {
                    setConfirmRevokeAllOpen(false)
                    await handleRevokeAllOtherSessions()
                  }}
                >
                  Revoke All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
