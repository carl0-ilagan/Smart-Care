"use client"

import { X } from "lucide-react"

export default function DeleteConversationModal({ isOpen, onClose, onDelete }) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-graphite">Delete Conversation</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center">
          <p className="text-drift-gray mb-6">
            Are you sure you want to delete this conversation? This action cannot be undone.
          </p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
