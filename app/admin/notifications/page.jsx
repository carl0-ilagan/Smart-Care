"use client"

import { useState } from "react"
import { Bell, Settings, Check, RefreshCw } from "lucide-react"

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [showSettings, setShowSettings] = useState(false)

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: "New doctor registration",
      message: "Dr. Emily Chen has registered and is awaiting approval",
      time: "10 minutes ago",
      type: "registration",
      read: false,
    },
    {
      id: 2,
      title: "System backup completed",
      message: "Daily system backup has completed successfully",
      time: "2 hours ago",
      type: "system",
      read: false,
    },
    {
      id: 3,
      title: "Patient complaint",
      message: "A new patient complaint has been submitted regarding appointment scheduling",
      time: "3 hours ago",
      type: "support",
      read: false,
    },
    {
      id: 4,
      title: "Security alert",
      message: "Multiple failed login attempts detected from IP 203.0.113.42",
      time: "5 hours ago",
      type: "security",
      read: true,
    },
    {
      id: 5,
      title: "Database maintenance",
      message: "Scheduled database maintenance will occur tonight at 2:00 AM",
      time: "Yesterday",
      type: "system",
      read: true,
    },
    {
      id: 6,
      title: "New feature deployed",
      message: "The appointment reminder system has been updated with new features",
      time: "2 days ago",
      type: "system",
      read: true,
    },
    {
      id: 7,
      title: "Staff meeting reminder",
      message: "Reminder: Monthly staff meeting tomorrow at 9:00 AM in the conference room",
      time: "2 days ago",
      type: "reminder",
      read: true,
    },
    {
      id: 8,
      title: "System update required",
      message: "Critical security update is available for installation",
      time: "3 days ago",
      type: "system",
      read: true,
    },
    {
      id: 9,
      title: "New patient registrations",
      message: "15 new patients registered this week",
      time: "4 days ago",
      type: "registration",
      read: true,
    },
    {
      id: 10,
      title: "Billing system maintenance",
      message: "The billing system will be unavailable for maintenance on Sunday",
      time: "5 days ago",
      type: "system",
      read: true,
    },
  ]

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-graphite">Notifications</h1>
          <p className="text-drift-gray mt-1">System alerts and important messages</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white rounded-md border border-earth-beige hover:bg-pale-stone"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-white rounded-md border border-earth-beige hover:bg-pale-stone">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-soft-amber text-white rounded-md hover:bg-soft-amber/90">
            <Check className="h-4 w-4" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      {showSettings && (
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-soft-amber">
          <h2 className="text-lg font-semibold text-graphite mb-4">Notification Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-graphite mb-2">Email Notifications</h3>
              <div className="space-y-2">
                {["System alerts", "User registrations", "Security alerts", "Maintenance notices"].map(
                  (item, index) => (
                    <div key={index} className="flex items-center">
                      <input type="checkbox" id={`email-${index}`} defaultChecked={index < 2} className="mr-2" />
                      <label htmlFor={`email-${index}`} className="text-sm text-drift-gray">
                        {item}
                      </label>
                    </div>
                  ),
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-graphite mb-2">Dashboard Notifications</h3>
              <div className="space-y-2">
                {[
                  "System alerts",
                  "User registrations",
                  "Security alerts",
                  "Maintenance notices",
                  "Support tickets",
                  "Staff messages",
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <input type="checkbox" id={`dashboard-${index}`} defaultChecked className="mr-2" />
                    <label htmlFor={`dashboard-${index}`} className="text-sm text-drift-gray">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="px-4 py-2 bg-soft-amber text-white text-sm rounded-md hover:bg-soft-amber/90">
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-earth-beige px-4">
          <nav className="flex space-x-4 overflow-x-auto">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: "Unread" },
              { id: "system", label: "System" },
              { id: "security", label: "Security" },
              { id: "registration", label: "Registrations" },
              { id: "support", label: "Support" },
              { id: "reminder", label: "Reminders" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-soft-amber text-soft-amber"
                    : "border-transparent text-drift-gray hover:text-graphite hover:border-earth-beige"
                }`}
              >
                {tab.label}
                {tab.id === "unread" && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-earth-beige">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-pale-stone/50 ${notification.read ? "" : "bg-pale-stone/30"}`}
              >
                <div className="flex items-start">
                  <div
                    className={`p-2 rounded-full mr-3 ${
                      notification.type === "system"
                        ? "bg-blue-100"
                        : notification.type === "security"
                          ? "bg-red-100"
                          : notification.type === "registration"
                            ? "bg-green-100"
                            : notification.type === "support"
                              ? "bg-purple-100"
                              : "bg-amber-100"
                    }`}
                  >
                    <Bell
                      className={`h-5 w-5 ${
                        notification.type === "system"
                          ? "text-blue-600"
                          : notification.type === "security"
                            ? "text-red-600"
                            : notification.type === "registration"
                              ? "text-green-600"
                              : notification.type === "support"
                                ? "text-purple-600"
                                : "text-amber-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className={`font-medium ${notification.read ? "text-graphite" : "text-soft-amber"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-drift-gray">{notification.time}</span>
                    </div>
                    <p className="text-sm text-drift-gray mt-1">{notification.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            notification.type === "system"
                              ? "bg-blue-100 text-blue-800"
                              : notification.type === "security"
                                ? "bg-red-100 text-red-800"
                                : notification.type === "registration"
                                  ? "bg-green-100 text-green-800"
                                  : notification.type === "support"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {notification.type}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {!notification.read && (
                          <button className="text-soft-amber hover:text-soft-amber/80 text-sm">Mark as read</button>
                        )}
                        <button className="text-red-500 hover:text-red-600 text-sm">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-pale-stone flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-drift-gray" />
              </div>
              <h3 className="text-graphite font-medium">No notifications found</h3>
              <p className="text-drift-gray text-sm mt-1">There are no notifications in this category</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredNotifications.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-earth-beige">
            <div>
              <p className="text-sm text-drift-gray">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{filteredNotifications.length}</span> of{" "}
                <span className="font-medium">{filteredNotifications.length}</span> notifications
              </p>
            </div>
            <div className="flex space-x-1">
              <button className="px-3 py-1 border border-earth-beige rounded-md text-sm text-drift-gray hover:bg-pale-stone">
                Previous
              </button>
              <button className="px-3 py-1 border border-earth-beige rounded-md text-sm text-drift-gray hover:bg-pale-stone">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
