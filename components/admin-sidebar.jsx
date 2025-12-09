"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { X, ChevronLeft, ChevronRight, Clock, SettingsIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { LogoutConfirmation } from "@/components/logout-confirmation"
import { Logo } from "@/components/logo"

// Import icons
import {
  LayoutDashboard,
  UsersIcon,
  UserCog,
  CalendarIcon,
  FileText,
  Settings,
  MessageSquare,
  Shield,
  Activity,
  LogOut,
  TrendingUp,
  User,
} from "lucide-react"

export default function AdminSidebar({ isOpen = true, onClose, isMobile = false, collapsed = false, onCollapse }) {
  const pathname = usePathname()
  const { user, userProfile, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)

  // Update the navItems to use smaller icons
  // Replace the navItems definition with this updated version
  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      href: "/admin/dashboard",
    },
    {
      title: "Analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      href: "/admin/analytics",
    },
    {
      title: "Patients",
      icon: <UsersIcon className="h-4 w-4" />,
      href: "/admin/patients",
    },
    {
      title: "Doctors",
      icon: <UserCog className="h-4 w-4" />,
      href: "/admin/doctors",
    },
    {
      title: "Pending Accounts",
      icon: <UserCog className="h-4 w-4" />,
      href: "/admin/pending-accounts",
    },
    {
      title: "Appointments",
      icon: <CalendarIcon className="h-4 w-4" />,
      href: "/admin/appointments",
    },
    {
      title: "Reports",
      icon: <FileText className="h-4 w-4" />,
      href: "/admin/reports",
    },
    {
      title: "Feedback",
      icon: <MessageSquare className="h-4 w-4" />,
      href: "/admin/feedback",
    },
    {
      title: "Logs",
      icon: <Activity className="h-4 w-4" />,
      href: "/admin/logs",
    },
    {
      title: "Roles",
      icon: <Shield className="h-4 w-4" />,
      href: "/admin/roles",
    },
    {
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
      href: "/admin/settings",
    },
  ]

  // Check if the current path matches the nav item
  const isActive = (href) => {
    return pathname === href
  }

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    if (onCollapse) {
      onCollapse(newCollapsedState)
    }
  }

  // Update local state when prop changes
  useEffect(() => {
    setIsCollapsed(collapsed)
  }, [collapsed])

  // Handle logout click
  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  // Confirm logout
  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    if (isMobile) {
      onClose()
    }
  }

  // Handle escape key press to close sidebar on mobile
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMobile && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isMobile, isOpen, onClose])

  // Prevent scrolling when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isMobile, isOpen])

  // Update the sidebar class to be fixed and non-scrollable
  // Replace the sidebarClass with this updated version
  const sidebarClass = `
    fixed inset-y-0 left-0 bg-white shadow-lg z-40
    transition-all duration-300 ease-in-out
    ${isMobile ? "z-50" : "z-30"}
    ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
    ${isCollapsed ? "w-16" : "w-56"}
    flex flex-col
  `

  // Backdrop with enhanced animation
  const backdropClass = `
    fixed inset-0 bg-black z-40
    transition-opacity duration-300 ease-in-out
    ${isMobile && isOpen ? "opacity-50" : "opacity-0 pointer-events-none"}
  `

  // Get user details
  const displayName = userProfile?.displayName || user?.displayName || "Admin User"
  const email = userProfile?.email || user?.email || "admin@smartcare.com"
  const photoURL = userProfile?.photoURL || user?.photoURL || null
  const role = "Administrator"
  const lastLogin = new Date().toLocaleDateString()

  return (
    <>
      {/* Backdrop with smooth fade animation */}
      {isMobile && <div className={backdropClass} onClick={onClose} />}

      <aside className={sidebarClass}>
        {/* Update the sidebar header to be more compact
        // Replace the sidebar header with this updated version */}
        {!isCollapsed && (
          <div className="h-14 flex items-center justify-between px-3 border-b border-earth-beige">
            <Logo href="/admin/dashboard" showBadge={true} badgeText="Admin" className="scale-90" />
            {isMobile && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-pale-stone transition-colors duration-200"
              >
                <X className="h-4 w-4 text-graphite" />
              </button>
            )}
          </div>
        )}

        {/* Update the user info section to be more compact
        // Replace the user info section with this updated version */}
        {!isCollapsed && (
          <div className="p-3 border-b border-earth-beige">
            <div
              className="flex items-center cursor-pointer hover:bg-pale-stone/50 p-1.5 rounded-lg transition-colors duration-200"
              onClick={() => setShowUserDetails(!showUserDetails)}
            >
              <div className="h-8 w-8 rounded-full bg-soft-amber/20 flex items-center justify-center text-soft-amber mr-2 overflow-hidden">
                {photoURL ? (
                  <Image
                    src={photoURL || "/placeholder.svg"}
                    alt="Admin"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-xs text-graphite">{displayName}</p>
                <p className="text-xs text-drift-gray truncate max-w-[120px]">{email}</p>
              </div>
              <div className="text-drift-gray">
                <ChevronRight
                  className={`h-3 w-3 transition-transform duration-200 ${showUserDetails ? "rotate-90" : ""}`}
                />
              </div>
            </div>

            {/* Expanded user details */}
            <div
              className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${
                showUserDetails ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="bg-pale-stone/30 rounded-lg p-2 text-xs space-y-1">
                <div className="flex items-center">
                  <Shield className="h-3 w-3 text-soft-amber mr-1" />
                  <span className="text-drift-gray text-xs">Role: </span>
                  <span className="ml-1 text-graphite font-medium text-xs">{role}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 text-soft-amber mr-1" />
                  <span className="text-drift-gray text-xs">Last login: </span>
                  <span className="ml-1 text-graphite font-medium text-xs">{lastLogin}</span>
                </div>
                <Link href="/admin/profile" className="flex items-center text-soft-amber hover:underline mt-1 text-xs">
                  <SettingsIcon className="h-2.5 w-2.5 mr-1" />
                  <span>Manage profile</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Update the navigation section to be fixed instead of scrollable
        // and make the design more minimalist

        // Replace the Navigation section with this updated version */}
        {/* Navigation */}
        <nav className={`p-2 ${isCollapsed ? "h-auto" : "h-auto"}`}>
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.title} className="relative">
                <Link
                  href={item.href}
                  className={`flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 ${
                    isActive(item.href) ? "bg-soft-amber/10 text-soft-amber" : "text-drift-gray hover:bg-pale-stone"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  onMouseEnter={() => setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-2 text-sm">{item.title}</span>}
                </Link>

                {/* Tooltip for collapsed sidebar */}
                {isCollapsed && hoveredItem === item.title && (
                  <div
                    className="absolute left-full top-0 ml-2 px-2 py-1 bg-white rounded-md shadow-md text-sm text-graphite whitespace-nowrap z-50 border border-earth-beige"
                    style={{
                      animation: "fadeIn 0.2s ease-in-out forwards",
                    }}
                  >
                    {item.title}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse/Expand Button */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute bottom-20 -right-3 bg-white rounded-full p-1 shadow-md border border-earth-beige transition-transform duration-200 hover:scale-110"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-drift-gray" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-drift-gray" />
            )}
          </button>
        )}

        {/* Update the logout button to be more compact
        // Replace the logout button section with this updated version */}
        <div className="mt-auto p-3 border-t border-earth-beige">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-md text-drift-gray hover:bg-pale-stone transition-colors duration-200 ${
              isCollapsed ? "justify-center w-full px-2 py-2" : "w-full px-2 py-1.5"
            }`}
            title={isCollapsed ? "Logout" : ""}
            onMouseEnter={() => setHoveredItem("Logout")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2 text-sm">Logout</span>}

            {/* Tooltip for collapsed sidebar */}
            {isCollapsed && hoveredItem === "Logout" && (
              <div
                className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-white rounded-md shadow-md text-sm text-graphite whitespace-nowrap z-50 border border-earth-beige"
                style={{
                  animation: "fadeIn 0.2s ease-in-out forwards",
                }}
              >
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Add the fadeIn animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  )
}
