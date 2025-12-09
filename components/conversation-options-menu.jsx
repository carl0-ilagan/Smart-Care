"use client"

import { useState, useRef, useEffect } from "react"
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline"
import DeleteConversationModal from "./delete-conversation-modal"

const ConversationOptionsMenu = ({ onMarkAsUnread, onDelete, className = "" }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleMenuItemClick = (action) => {
    setShowMenu(false)
    if (typeof action === "function") {
      action()
    }
  }

  const handleDeleteClick = () => {
    setShowMenu(false)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (typeof onDelete === "function") {
        await onDelete()
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-full hover:bg-gray-100">
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
          <div className="py-1">
            <button
              onClick={() => handleMenuItemClick(onMarkAsUnread)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Mark as unread
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Delete conversation
            </button>
          </div>
        </div>
      )}

      <DeleteConversationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default ConversationOptionsMenu
