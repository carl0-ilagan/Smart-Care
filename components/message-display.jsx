"use client"

import { useState, useRef, useEffect } from "react"
import { File, Download, Eye, Play, Pause, Volume2 } from "lucide-react"
import { createDataURL, downloadFile } from "@/lib/file-utils"
import FilePreviewModal from "./file-preview-modal"

const MessageDisplay = ({
  message,
  isSender,
  formatTime,
  formatFileSize,
  senderName,
  currentUserName,
  patientDetails,
  doctorDetails,
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioProgress, setAudioProgress] = useState(0)
  const audioRef = useRef(null)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    // Clean up interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Load audio metadata when audio element is loaded
  const handleAudioMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
    }
  }

  const handleDownload = (fileData, fileName) => {
    if (!fileData || !fileData.base64 || !fileData.type) return

    const dataUrl = createDataURL(fileData.base64, fileData.type)
    downloadFile(dataUrl, fileName || "download")
  }

  const openPreviewModal = () => {
    setShowPreviewModal(true)
  }

  const closePreviewModal = () => {
    setShowPreviewModal(false)
  }

  // Toggle audio playback
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      } else {
        audioRef.current.play()
        // Update progress every 100ms
        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime)
          }
        }, 100)
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Format time for audio player
  const formatAudioTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Format reply header based on who is replying to whom
  const formatReplyHeader = (replyTo) => {
    if (!replyTo) return null

    // If the sender is replying to themselves
    if (replyTo.sender === message.sender) {
      return isSender ? "You replied to yourself" : `${senderName || "User"} replied to themselves`
    }

    // If the sender is replying to the current user
    if (replyTo.sender !== message.sender && !isSender) {
      return `${senderName || "User"} replied to you`
    }

    // If the current user is replying to the sender
    if (replyTo.sender !== message.sender && isSender) {
      return `You replied to ${replyTo.senderName || patientDetails?.displayName || doctorDetails?.displayName || "User"}`
    }

    return "Reply"
  }

  // If it's a system message (like call status)
  if (message.type === "system") {
    return (
      <div className="w-full flex justify-center my-2">
        <div className="bg-pale-stone/50 text-drift-gray text-xs px-3 py-1 rounded-full">{message.content}</div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`max-w-[75%] rounded-lg p-3 ${
          isSender ? "bg-soft-amber text-white" : "bg-pale-stone text-graphite"
        } ${message.status === "unsent" ? "opacity-50" : ""}`}
      >
        {/* Reply content */}
        {message.replyTo && (
          <div
            className={`mb-2 rounded-md p-2 text-xs ${
              isSender ? "bg-amber-600/50 text-white/90" : "bg-gray-200 text-gray-700"
            }`}
          >
            <p className="font-medium">{formatReplyHeader(message.replyTo)}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Image message */}
        {message.type === "image" && message.fileData && message.fileData.base64 && message.status !== "unsent" && (
          <div className="mb-2 overflow-hidden rounded-md">
            <img
              src={createDataURL(message.fileData.base64, message.fileData.type) || "/placeholder.svg"}
              alt="Image"
              className="max-h-[200px] w-auto object-contain cursor-pointer"
              onClick={openPreviewModal}
              loading="lazy"
            />
            <div className="mt-1 text-xs opacity-80 flex justify-between">
              <span className="truncate max-w-[150px]">{message.fileName || message.fileData.name || "Image"}</span>
              {message.fileSize && <span>{formatFileSize(message.fileSize)}</span>}
            </div>
          </div>
        )}

        {/* Audio message */}
        {message.type === "audio" && message.fileData && message.status !== "unsent" && (
          <div className="mb-2">
            <div className="flex flex-col rounded-md bg-white/10 p-2">
              <div className="flex items-center mb-1">
                <button
                  onClick={toggleAudio}
                  className="p-1 rounded-full hover:bg-white/20 mr-2"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="flex-1 text-xs">
                  <Volume2 className="h-3 w-3 inline mr-1" />
                  <span>Voice message</span>
                </div>
                <button
                  onClick={() =>
                    handleDownload(message.fileData, message.fileName || message.fileData.name || "voice-message.webm")
                  }
                  className="p-1 rounded-full hover:bg-white/20"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center w-full">
                <div className="flex-1 min-w-0">
                  <div
                    className="h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      if (audioRef.current && audioDuration > 0) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const position = (e.clientX - rect.left) / rect.width
                        audioRef.current.currentTime = position * audioDuration
                        setAudioProgress(audioRef.current.currentTime)
                      }
                    }}
                  >
                    <div
                      className="h-full bg-white/40 rounded-full"
                      style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs ml-2 min-w-[40px] text-right">
                  {audioDuration > 0 ? formatAudioTime(isPlaying ? audioProgress : audioDuration) : "0:00"}
                </span>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={createDataURL(message.fileData.base64, message.fileData.type)}
              onEnded={() => {
                setIsPlaying(false)
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current)
                }
                setAudioProgress(0)
              }}
              onLoadedMetadata={handleAudioMetadata}
              className="hidden"
            />
          </div>
        )}

        {/* Video message */}
        {message.type === "video" && message.fileData && message.status !== "unsent" && (
          <div className="mb-2 overflow-hidden rounded-md">
            <div className="relative cursor-pointer" onClick={openPreviewModal}>
              <video
                src={createDataURL(message.fileData.base64, message.fileData.type)}
                className="max-h-[200px] w-full object-contain"
                poster="/placeholder.svg"
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-10 w-10 text-white" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1 rounded">
                {message.fileData.duration
                  ? `${Math.floor(message.fileData.duration / 60)}:${String(message.fileData.duration % 60).padStart(2, "0")}`
                  : "Video"}
              </div>
            </div>
            <div className="mt-1 text-xs opacity-80 flex justify-between">
              <span className="truncate max-w-[150px]">{message.fileName || message.fileData.name || "Video"}</span>
              {message.fileSize && <span>{formatFileSize(message.fileSize)}</span>}
            </div>
          </div>
        )}

        {/* File message */}
        {message.type === "file" && message.fileData && message.status !== "unsent" && (
          <div className="mb-2">
            <div className="flex items-center rounded-md bg-white/10 p-2">
              <File className="mr-2 h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm block truncate">
                  {message.fileName || message.fileData.name || message.content || "File"}
                </div>
                {message.fileSize && <span className="text-xs opacity-80">{formatFileSize(message.fileSize)}</span>}
              </div>
              <div className="flex ml-2 space-x-1">
                <button onClick={openPreviewModal} className="p-1 rounded-full hover:bg-white/20" title="Preview">
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDownload(message.fileData, message.fileName || message.fileData.name)}
                  className="p-1 rounded-full hover:bg-white/20"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Text message */}
        {(message.type === "text" || message.status === "unsent") && <p className="text-sm">{message.content}</p>}

        {/* Timestamp and status */}
        <div className="mt-1 flex items-center justify-end space-x-1">
          {isSender && message.status !== "unsent" && (
            <span className="text-white/70">
              {message.status === "read" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-400"
                >
                  <path d="M18 6L7 17L2 12" />
                  <path d="M22 10L13 19L11 17" />
                </svg>
              ) : message.status === "delivered" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L7 17L2 12" />
                  <path d="M22 10L13 19L11 17" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12L10 17L20 7" />
                </svg>
              )}
            </span>
          )}
          <span className={`text-right text-xs ${isSender ? "text-white/70" : "text-drift-gray"}`}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>

      {/* File Preview Modal */}
      {message.fileData && (
        <FilePreviewModal
          isOpen={showPreviewModal}
          onClose={closePreviewModal}
          file={message.fileData}
          fileName={message.fileName || message.fileData.name}
        />
      )}
    </>
  )
}

export default MessageDisplay
