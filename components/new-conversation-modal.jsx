"use client"

import { useState, useEffect } from "react"
import { X, Search, Loader2 } from "lucide-react"
import { getAvailableDoctors, createConversation, checkExistingConversation } from "@/lib/message-utils"
import { useAuth } from "@/contexts/auth-context"
import ProfileImage from "./profile-image"

export default function NewConversationModal({ isOpen, onClose, onConversationCreated }) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [message, setMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen) {
      loadDoctors()
    }
  }, [isOpen])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const doctorsList = await getAvailableDoctors()
      setDoctors(doctorsList)
    } catch (error) {
      console.error("Error loading doctors:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor)
  }

  const handleCreateConversation = async () => {
    if (!selectedDoctor || !message.trim() || !user) return

    try {
      setCreating(true)

      // Check if conversation already exists
      const existingConvoId = await checkExistingConversation([user.uid, selectedDoctor.id])

      if (existingConvoId) {
        onConversationCreated(existingConvoId)
        onClose()
        return
      }

      // Create new conversation
      const conversationId = await createConversation([user.uid, selectedDoctor.id], message)

      onConversationCreated(conversationId)
      onClose()
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-graphite">New Conversation</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {selectedDoctor ? (
          // Step 2: Write first message
          <div className="mt-4">
            <div className="flex items-center mb-4">
              <div className="mr-3 h-10 w-10 overflow-hidden rounded-full">
                <ProfileImage
                  src={selectedDoctor.photoURL}
                  alt={selectedDoctor.displayName || "Doctor"}
                  className="h-full w-full"
                  role="doctor"
                />
              </div>
              <div>
                <h3 className="font-medium text-graphite">{selectedDoctor.displayName}</h3>
                <p className="text-xs text-drift-gray">{selectedDoctor.specialty}</p>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="ml-auto text-xs text-soft-amber hover:underline"
              >
                Change
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-drift-gray mb-1">
                First Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                className="w-full rounded-md border border-earth-beige bg-white py-2 px-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber min-h-[100px]"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="rounded-md border border-earth-beige px-4 py-2 text-sm font-medium text-graphite hover:bg-pale-stone"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={!message.trim() || creating}
                className="rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 flex items-center"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Start Conversation"
                )}
              </button>
            </div>
          </div>
        ) : (
          // Step 1: Select a doctor
          <div className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-earth-beige bg-white py-2 pl-10 pr-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-soft-amber" />
                </div>
              ) : filteredDoctors.length > 0 ? (
                <ul className="divide-y divide-pale-stone">
                  {filteredDoctors.map((doctor) => (
                    <li key={doctor.id}>
                      <button
                        onClick={() => handleSelectDoctor(doctor)}
                        className="flex w-full items-start p-3 text-left transition-colors hover:bg-pale-stone/30"
                      >
                        <div className="mr-3 h-10 w-10 overflow-hidden rounded-full">
                          <ProfileImage
                            src={doctor.photoURL}
                            alt={doctor.displayName || "Doctor"}
                            className="h-full w-full"
                            role="doctor"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-graphite">{doctor.displayName}</p>
                          <p className="text-xs text-drift-gray">{doctor.specialty}</p>
                          {doctor.isOnline && (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <span className="mr-1 h-2 w-2 rounded-full bg-green-600"></span>
                              Online
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-drift-gray">
                  {searchTerm ? "No doctors found matching your search" : "No doctors available"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
