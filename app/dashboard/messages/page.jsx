"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
  MessageSquare,
  Search,
  User,
  X,
  Plus,
  Loader2,
  ArrowUp,
  BellOff,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  unsendMessage,
  deleteConversation,
  getUserDetailsForConversation,
  getUserOnlineStatus,
  updateOnlineStatus,
  deleteMessageForMe,
  deleteMessageForEveryone,
  markConversationAsUnread,
  toggleConversationMute,
  isConversationMuted,
  loadMoreMessages,
  setTypingStatus,
  getTypingStatus,
} from "@/lib/message-utils"
import { isFileSizeValid, compressImage } from "@/lib/file-utils"
import NewConversationModal from "@/components/new-conversation-modal"
import MessageOptionsMenu from "@/components/message-options-menu"
import ConversationOptionsMenu from "@/components/conversation-options-menu"
import MessageDisplay from "@/components/message-display"
import MessageInput from "@/components/message-input"
import DeleteConversationModal from "@/components/delete-conversation-modal"
// Call features removed per requirements
import ProfileImage from "@/components/profile-image"

export default function MessagesPage() {
  const router = useRouter()
  const isMobile = useMobile()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [showMobileConversation, setShowMobileConversation] = useState(false)
  const [showDoctorInfo, setShowDoctorInfo] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [fileError, setFileError] = useState("")
  const [doctorDetails, setDoctorDetails] = useState(null)
  const [doctorOnlineStatus, setDoctorOnlineStatus] = useState({ isOnline: false, lastActive: null })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [selectedConversationData, setSelectedConversationData] = useState(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const messagesContainerRef = useRef(null)
  const conversationsContainerRef = useRef(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [showScrollControls, setShowScrollControls] = useState(false)

  // Filter conversations
  const filteredConversations = conversations
    .filter((conversation) => {
      // We need doctor details for each conversation
      const otherParticipantId = conversation.participants.find((id) => id !== user?.uid)
      const otherParticipant = conversation.participantDetails?.[otherParticipantId]

      // If we don't have details yet, include it anyway
      if (!otherParticipant) return true

      // Filter by search term
      const matchesSearch =
        otherParticipant.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        otherParticipant.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false

      // Filter by status (unread messages)
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "unread" && (conversation.unreadCounts?.[user?.uid] || 0) > 0) ||
        (filterStatus === "read" &&
          (!conversation.unreadCounts ||
            !conversation.unreadCounts[user?.uid] ||
            conversation.unreadCounts[user?.uid] === 0))

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Sort by timestamp (most recent first)
      const timeA = a.updatedAt?.toDate?.() || new Date(0)
      const timeB = b.updatedAt?.toDate?.() || new Date(0)
      return timeB - timeA
    })

  // Set online status when component mounts and cleanup on unmount
  useEffect(() => {
    if (user) {
      updateOnlineStatus(user.uid, true)
    }

    return () => {
      if (user) {
        updateOnlineStatus(user.uid, false)
      }
    }
  }, [user])

  // Load conversations
  useEffect(() => {
    if (!user) return

    const unsubscribe = getUserConversations(user.uid, (data) => {
      setConversations(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !user) {
      setMessages([])
      setHasMoreMessages(true)
      return
    }

    setMessagesLoading(true)

    // Get the other participant's details
    const otherParticipantId = selectedConversation.participants.find((id) => id !== user?.uid)

    if (otherParticipantId) {
      // Get doctor details
      getUserDetailsForConversation(otherParticipantId)
        .then((details) => {
          setDoctorDetails(details)

          // Subscribe to doctor's online status
          const unsubscribeStatus = getUserOnlineStatus(otherParticipantId, (status) => {
            setDoctorOnlineStatus(status)
          })

          // Subscribe to messages - pass the user ID to filter deleted messages
          const unsubscribeMessages = getConversationMessages(selectedConversation.id, user.uid, (data) => {
            setMessages(data)
            setMessagesLoading(false)
            setHasMoreMessages(data.length >= 30) // If we got the maximum number of messages, there might be more

            // Mark messages as read
            markMessagesAsRead(selectedConversation.id, user?.uid)
          })

          return () => {
            unsubscribeStatus()
            unsubscribeMessages()
          }
        })
        .catch((error) => {
          console.error("Error getting doctor details:", error)
          setMessagesLoading(false)
        })
    }
  }, [selectedConversation, user])

  useEffect(() => {
    if (!selectedConversation || !user) return

    const unsubscribe = getTypingStatus(selectedConversation.id, user.uid, (typingData) => {
      setTypingUsers(typingData)
    })

    return () => unsubscribe()
  }, [selectedConversation, user])

  // Auto-scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !loadingMoreMessages) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, loadingMoreMessages])

  // Set first conversation as selected by default (only on desktop)
  useEffect(() => {
    if (!isMobile && filteredConversations.length > 0 && !selectedConversation && !loading) {
      handleSelectConversation(filteredConversations[0])
    }
  }, [filteredConversations, selectedConversation, isMobile, loading])

  // Handle keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile) return

    const handleFocus = () => setIsKeyboardVisible(true)
    const handleBlur = () => setIsKeyboardVisible(false)

    if (inputRef.current) {
      inputRef.current.addEventListener("focus", handleFocus)
      inputRef.current.addEventListener("blur", handleBlur)
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener("focus", handleFocus)
        inputRef.current.removeEventListener("blur", handleBlur)
      }
    }
  }, [isMobile, inputRef])

  // Show scroll controls when hovering over conversations list (desktop only)
  useEffect(() => {
    if (isMobile) return

    const handleMouseEnter = () => setShowScrollControls(true)
    const handleMouseLeave = () => setShowScrollControls(false)

    const container = conversationsContainerRef.current
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter)
      container.addEventListener("mouseleave", handleMouseLeave)

      return () => {
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [isMobile, conversationsContainerRef])

  // Handle scroll to load more messages
  useEffect(() => {
    if (!messagesContainerRef.current || !hasMoreMessages) return

    const handleScroll = () => {
      const { scrollTop } = messagesContainerRef.current

      // If we're near the top of the container and have more messages to load
      if (scrollTop < 50 && hasMoreMessages && !loadingMoreMessages && messages.length > 0) {
        handleLoadMoreMessages()
      }
    }

    const container = messagesContainerRef.current
    container.addEventListener("scroll", handleScroll)

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll)
      }
    }
  }, [messagesContainerRef, hasMoreMessages, loadingMoreMessages, messages])

  // Handle loading more messages
  const handleLoadMoreMessages = async () => {
    if (!selectedConversation || !user || !messages.length || loadingMoreMessages) return

    setLoadingMoreMessages(true)

    try {
      // Get the oldest message timestamp
      const oldestMessage = [...messages].sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0)
        const timeB = b.timestamp?.toDate?.() || new Date(0)
        return timeA - timeB
      })[0]

      if (!oldestMessage || !oldestMessage.timestamp) {
        setHasMoreMessages(false)
        setLoadingMoreMessages(false)
        return
      }

      // Save scroll position
      const container = messagesContainerRef.current
      const scrollHeight = container.scrollHeight

      // Load older messages
      const olderMessages = await loadMoreMessages(selectedConversation.id, user.uid, oldestMessage.timestamp, 20)

      if (olderMessages.length === 0) {
        setHasMoreMessages(false)
      } else {
        // Combine with existing messages, avoiding duplicates
        const existingIds = new Set(messages.map((m) => m.id))
        const uniqueOlderMessages = olderMessages.filter((m) => !existingIds.has(m.id))

        setMessages((prev) => [...uniqueOlderMessages, ...prev])

        // Restore scroll position after new messages are added
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - scrollHeight
          }
        }, 100)
      }
    } catch (error) {
      console.error("Error loading more messages:", error)
    } finally {
      setLoadingMoreMessages(false)
    }
  }

  // Handle scrolling the conversations list
  const handleScrollConversations = (direction) => {
    if (!conversationsContainerRef.current) return

    const container = conversationsContainerRef.current
    const scrollAmount = 300 // Adjust as needed

    if (direction === "up") {
      container.scrollBy({ top: -scrollAmount, behavior: "smooth" })
    } else {
      container.scrollBy({ top: scrollAmount, behavior: "smooth" })
    }
  }

  const handleTyping = () => {
    if (!selectedConversation || !user) return

    // Only update if not already set as typing
    if (!isTyping) {
      setIsTyping(true)
      setTypingStatus(selectedConversation.id, user.uid, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to clear typing status after 5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      setTypingStatus(selectedConversation.id, user.uid, false)
    }, 5000)
  }

  // Handle selecting a conversation on mobile
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    setSelectedConversationData({
      id: conversation.id,
      ...conversation,
    })
    setHasMoreMessages(true)

    if (isMobile) {
      setShowMobileConversation(true)
    }
  }

  // Handle back button on mobile
  const handleBackToList = () => {
    if (isMobile) {
      setShowMobileConversation(false)
    }
  }

  // Handle file selection
  const handleFileSelect = async (e) => {
    setFileError("")

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check file size (1MB limit)
      if (!isFileSizeValid(file, 1)) {
        setFileError("File size exceeds the limit (1MB)")
        return
      }

      try {
        // If it's an image, compress it
        if (file.type && file.type.startsWith("image/")) {
          const compressedFile = await compressImage(file)
          setSelectedFile(compressedFile)
        } else {
          setSelectedFile(file)
        }
      } catch (error) {
        console.error("Error processing file:", error)
        setFileError("Error processing file. Please try again.")
      }
    }
  }

  // Handle file button click
  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Handle removing selected file
  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault()

    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !user) return
    if (fileError) return

    try {
      setSendingMessage(true)

      // Prepare reply data if replying to a message
      const replyData = replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            sender: replyingTo.sender,
            senderName: replyingTo.sender === user.uid ? user.displayName : doctorDetails?.displayName,
          }
        : null

      if (selectedFile) {
        // Determine file type
        let fileType = "file"
        if (selectedFile.type && selectedFile.type.startsWith("image/")) {
          fileType = "image"
        } else if (selectedFile.type && selectedFile.type.startsWith("audio/")) {
          fileType = "audio"
        } else if (selectedFile.type && selectedFile.type.startsWith("video/")) {
          fileType = "video"
        } else if (selectedFile.type && selectedFile.type.startsWith("audio/")) {
          fileType = "audio"
        }

        // Generate a timestamp-based filename if none exists
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const fileName = selectedFile.name || `${fileType}-${timestamp}`

        // Send file message
        await sendMessage(
          selectedConversation.id,
          user.uid,
          newMessage.trim() || fileName,
          fileType,
          selectedFile,
          replyData,
          fileName,
        )

        // Clear file
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        // Send text message
        await sendMessage(selectedConversation.id, user.uid, newMessage.trim(), "text", null, replyData)
      }

      // Clear input and reply state
      setNewMessage("")
      setReplyingTo(null)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle unsending a message
  const handleUnsendMessage = async (message) => {
    if (!user || message.sender !== user.uid) return

    try {
      await unsendMessage(selectedConversation.id, message.id, user.uid)
    } catch (error) {
      console.error("Error unsending message:", error)
    }
  }

  // Handle deleting a message for me
  const handleDeleteMessage = async (message) => {
    if (!user || !selectedConversation) return

    try {
      await deleteMessageForMe(selectedConversation.id, message.id, user.uid)
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  // Handle deleting a message for everyone
  const handleDeleteMessageForEveryone = async (message) => {
    if (!user || message.sender !== user.uid || !selectedConversation) return

    try {
      await deleteMessageForEveryone(selectedConversation.id, message.id, user.uid)
    } catch (error) {
      console.error("Error deleting message for everyone:", error)
    }
  }

  // Handle deleting a conversation
  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user) return

    try {
      await deleteConversation(selectedConversation.id, user.uid)

      // Go back to conversation list on mobile
      if (isMobile) {
        setShowMobileConversation(false)
      }

      // Clear selected conversation
      setSelectedConversation(null)
      setShowDeleteConfirmation(false)
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  // Handle confirming delete conversation
  const handleConfirmDelete = () => {
    setShowDeleteConfirmation(true)
  }

  // Handle canceling delete conversation
  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false)
  }

  // Handle marking a conversation as unread
  const handleMarkAsUnread = async () => {
    if (!selectedConversation || !user) return

    try {
      await markConversationAsUnread(selectedConversation.id, user.uid)

      // Go back to conversation list on mobile
      if (isMobile) {
        setShowMobileConversation(false)
      }
    } catch (error) {
      console.error("Error marking conversation as unread:", error)
    }
  }

  // Handle muting a conversation
  const handleMuteConversation = async () => {
    if (!selectedConversation || !user) return

    try {
      await toggleConversationMute(selectedConversation.id, user.uid, true)
    } catch (error) {
      console.error("Error muting conversation:", error)
    }
  }

  // Handle unmuting a conversation
  const handleUnmuteConversation = async () => {
    if (!selectedConversation || !user) return

    try {
      await toggleConversationMute(selectedConversation.id, user.uid, false)
    } catch (error) {
      console.error("Error unmuting conversation:", error)
    }
  }

  // Handle copying message text
  const handleCopyMessage = (message) => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
    }
  }

  // Handle replying to a message
  const handleReplyToMessage = (message) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      sender: message.sender,
      isSender: message.sender === user?.uid,
    })
    inputRef.current?.focus()
  }

  // Handle canceling a reply
  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return ""

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "long" })
    } else {
      return date.toLocaleDateString()
    }
  }

  // Format last active time
  const formatLastActive = (timestamp) => {
    if (!timestamp) return "Offline"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffMinutes < 1) {
      return "Just now"
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`
    } else {
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
      } else {
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays < 7) {
          return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`
        } else {
          return date.toLocaleDateString()
        }
      }
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size"

    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
  }

  // Call features removed per requirements

  // Handle new conversation created
  const handleConversationCreated = (conversationId) => {
    // Find the new conversation in our list
    const newConvo = conversations.find((c) => c.id === conversationId)
    if (newConvo) {
      handleSelectConversation(newConvo)
    }
  }

  // Check if conversation is muted
  const checkIfMuted = (conversation) => {
    if (!conversation || !user) return false
    return isConversationMuted(conversation, user.uid)
  }

  // Render conversation list
  const renderConversationList = () => (
    <div className="flex h-full flex-col bg-white overflow-hidden relative">
      <div className="border-b border-pale-stone p-3 sticky top-0 z-10 bg-white">
        <div className="flex items-center justify-between mb-3">
          <Link href="/dashboard" className="flex items-center text-drift-gray hover:text-soft-amber">
            <ArrowLeft className="mr-1 h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <button
            onClick={() => setShowNewConversationModal(true)}
            className="rounded-full bg-soft-amber p-2 text-white hover:bg-amber-600"
            title="New Conversation"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-earth-beige bg-white py-2 pl-10 pr-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
          />
        </div>
        <div className="mt-2 flex justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center text-xs font-medium text-drift-gray hover:text-soft-amber"
          >
            <Filter className="mr-1 h-3 w-3" />
            Filters
            {showFilters ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
          </button>
          <button className="text-xs font-medium text-soft-amber hover:underline">Mark all as read</button>
        </div>

        {showFilters && (
          <div className="mt-2">
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-earth-beige bg-white py-1 pl-3 pr-10 text-xs text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        )}
      </div>

      <div ref={conversationsContainerRef} className="flex-1 overflow-y-auto relative h-full">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-soft-amber" />
          </div>
        ) : filteredConversations.length > 0 ? (
          <ul className="divide-y divide-pale-stone">
            {filteredConversations.map((conversation) => {
              // Get the other participant's ID
              const otherParticipantId = conversation.participants.find((id) => id !== user?.uid)

              // Get participant details (may be undefined if still loading)
              const otherParticipant = conversation.participantDetails?.[otherParticipantId] || {}

              // Check if there are unread messages
              const hasUnread = (conversation.unreadCounts?.[user?.uid] || 0) > 0

              // Check if conversation is muted
              const isMuted = checkIfMuted(conversation)

              return (
                <li key={conversation.id}>
                  <button
                    onClick={() => handleSelectConversation(conversation)}
                    className={`flex w-full items-start p-3 text-left transition-colors hover:bg-pale-stone/30 ${
                      selectedConversation?.id === conversation.id && !isMobile ? "bg-pale-stone/50" : ""
                    } ${hasUnread ? "font-medium" : ""}`}
                  >
                    <div className="relative mr-3 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-pale-stone">
                      <ProfileImage
                        src={otherParticipant.photoURL}
                        alt={otherParticipant.displayName || "Doctor"}
                        className="h-full w-full"
                        role="doctor"
                      />
                      {hasUnread && <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-soft-amber"></span>}
                      {otherParticipant.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                      )}
                      {isMuted && (
                        <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center">
                          <BellOff className="h-2 w-2 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="truncate text-sm text-graphite">{otherParticipant.displayName || "Loading..."}</p>
                        <p className="text-xs text-drift-gray">
                          {formatTime(conversation.updatedAt || conversation.createdAt)}
                        </p>
                      </div>
                      <p className="text-xs text-drift-gray">{otherParticipant.specialty || ""}</p>
                      <p className="mt-1 truncate text-xs text-drift-gray">
                        {conversation.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <div className="text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-drift-gray" />
              <p className="mt-2 text-sm text-drift-gray">No conversations found</p>
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="mt-4 rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                Start a new conversation
              </button>
            </div>
          </div>
        )}

        {/* Scroll controls for desktop */}
        {!isMobile && showScrollControls && filteredConversations.length > 5 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-2">
            <button
              onClick={() => handleScrollConversations("up")}
              className="rounded-full bg-white p-1 shadow-md hover:bg-pale-stone text-drift-gray"
              aria-label="Scroll up"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleScrollConversations("down")}
              className="rounded-full bg-white p-1 shadow-md hover:bg-pale-stone text-drift-gray"
              aria-label="Scroll down"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Render conversation view
  const renderConversationView = () => (
    <div className="flex h-full flex-col bg-white overflow-hidden">
      {selectedConversation && doctorDetails ? (
        <>
          {/* Conversation Header */}
          <div className="flex items-center justify-between border-b border-pale-stone p-3 sticky top-0 z-10 bg-white">
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={handleBackToList}
                  className="mr-2 rounded-md p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="relative mr-3 h-10 w-10 overflow-hidden rounded-full bg-pale-stone">
                <ProfileImage
                  src={doctorDetails.photoURL}
                  alt={doctorDetails.displayName || "Doctor"}
                  className="h-full w-full"
                  role="doctor"
                />
                {doctorOnlineStatus.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                )}
              </div>
              <div>
                <h2 className="font-medium text-graphite">{doctorDetails.displayName}</h2>
                <p className="text-xs text-drift-gray flex items-center">
                  {doctorOnlineStatus.isOnline ? (
                    <>
                      <span className="mr-1 h-2 w-2 rounded-full bg-green-500 inline-block"></span>
                      Online
                    </>
                  ) : (
                    <>Last active: {formatLastActive(doctorOnlineStatus.lastActive)}</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDoctorInfo(true)}
                className="rounded-full bg-pale-stone p-2 text-drift-gray hover:bg-soft-amber hover:text-white"
                title="Doctor Information"
              >
                <Info className="h-5 w-5" />
              </button>
              <ConversationOptionsMenu
                onDelete={handleConfirmDelete}
                onMute={handleMuteConversation}
                onUnmute={handleUnmuteConversation}
                onMarkAsUnread={handleMarkAsUnread}
                isMuted={checkIfMuted(selectedConversation)}
              />
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 h-full">
            {messagesLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-soft-amber" />
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {/* Loading more messages indicator */}
                {loadingMoreMessages && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-soft-amber" />
                  </div>
                )}

                {/* Load more button (alternative to scroll) */}
                {hasMoreMessages && !loadingMoreMessages && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleLoadMoreMessages}
                      className="flex items-center rounded-md bg-pale-stone px-3 py-1 text-xs text-drift-gray hover:bg-soft-amber/20"
                    >
                      <ArrowUp className="mr-1 h-3 w-3" />
                      Load older messages
                    </button>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === user?.uid ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender !== user?.uid && (
                      <div className="mr-2 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-pale-stone">
                        <ProfileImage
                          src={doctorDetails.photoURL}
                          alt={doctorDetails.displayName || "Doctor"}
                          className="h-full w-full"
                          role="doctor"
                        />
                      </div>
                    )}

                    <MessageDisplay
                      message={message}
                      isSender={message.sender === user?.uid}
                      formatTime={formatTime}
                      formatFileSize={formatFileSize}
                      senderName={message.sender === user?.uid ? user.displayName : doctorDetails.displayName}
                      currentUserName={user?.displayName}
                      patientDetails={user}
                      doctorDetails={doctorDetails}
                    />

                    {message.status !== "unsent" && (
                      <MessageOptionsMenu
                        message={message}
                        onUnsend={handleUnsendMessage}
                        onDelete={handleDeleteMessage}
                        onDeleteForEveryone={handleDeleteMessageForEveryone}
                        onCopy={handleCopyMessage}
                        onReply={handleReplyToMessage}
                        isSender={message.sender === user?.uid}
                      />
                    )}
                  </div>
                ))}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-pale-stone">
                      {doctorDetails?.photoURL ? (
                        <img
                          src={doctorDetails.photoURL || "/placeholder.svg"}
                          alt={doctorDetails.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-full w-full p-1.5 text-drift-gray" />
                      )}
                    </div>
                    <div className="bg-pale-stone text-graphite rounded-lg p-3 flex items-center">
                      <div className="flex space-x-1">
                        <span
                          className="w-2 h-2 bg-drift-gray rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-drift-gray rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-drift-gray rounded-full animate-bounce"
                          style={{ animationDelay: "600ms" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <MessageSquare className="h-12 w-12 text-drift-gray" />
                <p className="mt-4 text-center text-drift-gray">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>

          {/* Message Input (fixed at bottom; only messages scroll) */}
          <div className="shrink-0 sticky bottom-0 bg-white border-t border-pale-stone p-2">
            <MessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={handleSendMessage}
              onFileSelect={(fileData) => {
                setSelectedFile(fileData.file)
                if (fileData.fileData) {
                  // If fileData is provided (from voice recorder or camera)
                  setSelectedFile({
                    ...fileData.file,
                    fileData: fileData.fileData,
                  })
                }
              }}
              selectedFile={selectedFile}
              onRemoveFile={handleRemoveFile}
              fileError={fileError}
              sendingMessage={sendingMessage}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              onTyping={handleTyping}
              otherUserName={doctorDetails?.displayName}
            />
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center p-4">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-drift-gray" />
            <h3 className="mt-2 text-lg font-medium text-graphite">No conversation selected</h3>
            <p className="mt-1 text-drift-gray">Select a conversation from the list to view messages</p>
          </div>
        </div>
      )}
    </div>
  )

  // Doctor Info Modal
  const renderDoctorInfoModal = () => {
    if (!showDoctorInfo || !doctorDetails) return null

    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/50 transition-opacity" onClick={() => setShowDoctorInfo(false)} />
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-graphite">Doctor Information</h2>
            <button
              onClick={() => setShowDoctorInfo(false)}
              className="rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center">
            <div className="mr-4 h-16 w-16 overflow-hidden rounded-full bg-pale-stone">
              {doctorDetails.photoURL ? (
                <img
                  src={doctorDetails.photoURL || "/placeholder.svg"}
                  alt={doctorDetails.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-full w-full p-3 text-drift-gray" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-graphite">{doctorDetails.displayName}</h3>
              <p className="text-soft-amber">{doctorDetails.specialty}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <h4 className="text-sm font-medium text-drift-gray">About</h4>
              <p className="text-sm text-graphite">{doctorDetails.bio || "No bio available"}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-sm font-medium text-drift-gray">Education</h4>
                <p className="text-sm text-graphite">{doctorDetails.education || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-drift-gray">Experience</h4>
                <p className="text-sm text-graphite">{doctorDetails.experience || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-drift-gray">Languages</h4>
                <p className="text-sm text-graphite">{doctorDetails.languages || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-drift-gray">Contact</h4>
                <p className="text-sm text-graphite">{doctorDetails.phone || "Not available"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowDoctorInfo(false)}
              className="rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              Close
            </button>
          </div>
        </div>
      </>
    )
  }

  // Main render
  return (
    <div className="h-screen w-full">
      {isMobile ? (
        // Mobile layout
        <>
          {showMobileConversation && selectedConversation
            ? // Show conversation on mobile
              renderConversationView()
            : // Show list on mobile
              renderConversationList()}
        </>
      ) : (
        // Desktop layout - full screen with split view
        <div className="grid h-full w-full grid-cols-[350px_1fr] overflow-hidden">
          <div className="h-full overflow-hidden">{renderConversationList()}</div>
          <div className="h-full overflow-hidden">{renderConversationView()}</div>
        </div>
      )}

      {/* Doctor Info Modal */}
      {renderDoctorInfoModal()}

      {/* Delete Confirmation Modal */}
      <DeleteConversationModal
        isOpen={showDeleteConfirmation}
        onClose={handleCancelDelete}
        onDelete={handleDeleteConversation}
      />

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={handleConversationCreated}
      />
      {/* Call Notification removed */}
    </div>
  )
}
